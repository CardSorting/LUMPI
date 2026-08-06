/**
 * Bash command execution with streaming support and cancellation.
 *
 * This module provides a unified bash execution implementation used by:
 * - AgentSession.executeBash() for interactive and RPC modes
 * - Direct calls from modes that need bash execution
 */

import { randomBytes } from "node:crypto";
import { createWriteStream, type WriteStream } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { stripAnsi } from "../utils/ansi.ts";
import { sanitizeBinaryOutput } from "../utils/shell.ts";
import type { CodemarieBridge } from "./codemarie-bridge.ts";
import type { BashOperations } from "./tools/bash.ts";
import { DEFAULT_MAX_BYTES, truncateTail } from "./tools/truncate.ts";

// ============================================================================
// Types
// ============================================================================

export interface BashExecutorOptions {
	/** Callback for streaming output chunks (already sanitized) */
	onChunk?: (chunk: string) => void;
	/** AbortSignal for cancellation */
	signal?: AbortSignal;
	/** Optional CodemarieBridge for JoyRide execution caching */
	codemarieBridge?: CodemarieBridge;
	/** Optional task identifier for task-scoped caching */
	taskId?: string;
}

export interface BashResult {
	/** Combined stdout + stderr output (sanitized, possibly truncated) */
	output: string;
	/** Process exit code (undefined if killed/cancelled) */
	exitCode: number | undefined;
	/** Whether the command was cancelled via signal */
	cancelled: boolean;
	/** Whether the output was truncated */
	truncated: boolean;
	/** Path to temp file containing full output (if output exceeded truncation threshold) */
	fullOutputPath?: string;
}

// ============================================================================
// Implementation
// ============================================================================

/**
 * Execute a bash command using custom BashOperations.
 * Used for remote execution (SSH, containers, etc.).
 */
export async function executeBashWithOperations(
	command: string,
	cwd: string,
	operations: BashOperations,
	options?: BashExecutorOptions,
): Promise<BashResult> {
	const bridge = options?.codemarieBridge;
	const taskId = options?.taskId || "task-pi";
	let joyRideScope: ReturnType<CodemarieBridge["createJoyRideTaskScope"]> | undefined;

	if (bridge) {
		try {
			joyRideScope = bridge.createJoyRideTaskScope(taskId, cwd);
			bridge.registerTaskLifecycle(taskId, joyRideScope.generation);

			const decision = await bridge.lookupSafeCommandResult(command, joyRideScope);
			if (bridge.isJoyRideHitDecision(decision)) {
				let cachedOutput = "";
				let cachedExitCode = 0;
				const hitValue = (decision as { value?: unknown }).value;
				if (Array.isArray(hitValue)) {
					cachedOutput = String(hitValue[1] ?? "");
				} else if (typeof hitValue === "string") {
					cachedOutput = hitValue;
				} else if (typeof hitValue === "object" && hitValue !== null) {
					const valObj = hitValue as { output?: string; exitCode?: number };
					cachedOutput = valObj.output ?? "";
					cachedExitCode = valObj.exitCode ?? 0;
				}

				if (options?.onChunk && cachedOutput) {
					options.onChunk(cachedOutput);
				}
				return {
					output: cachedOutput,
					exitCode: cachedExitCode,
					cancelled: false,
					truncated: false,
				};
			}
		} catch {
			// Fail-open to normal execution on JoyRide error
		}
	}

	const outputChunks: string[] = [];
	let outputBytes = 0;
	const maxOutputBytes = DEFAULT_MAX_BYTES * 2;

	let tempFilePath: string | undefined;
	let tempFileStream: WriteStream | undefined;
	let totalBytes = 0;

	const ensureTempFile = () => {
		if (tempFilePath) {
			return;
		}
		const id = randomBytes(8).toString("hex");
		tempFilePath = join(tmpdir(), `pi-bash-${id}.log`);
		tempFileStream = createWriteStream(tempFilePath);
		for (const chunk of outputChunks) {
			tempFileStream.write(chunk);
		}
	};

	const decoder = new TextDecoder();

	const onData = (data: Buffer) => {
		totalBytes += data.length;

		// Sanitize: strip ANSI, replace binary garbage, normalize newlines
		const text = sanitizeBinaryOutput(stripAnsi(decoder.decode(data, { stream: true }))).replace(/\r/g, "");

		// Start writing to temp file if exceeds threshold
		if (totalBytes > DEFAULT_MAX_BYTES) {
			ensureTempFile();
		}

		if (tempFileStream) {
			tempFileStream.write(text);
		}

		// Keep rolling buffer
		outputChunks.push(text);
		outputBytes += text.length;
		while (outputBytes > maxOutputBytes && outputChunks.length > 1) {
			const removed = outputChunks.shift()!;
			outputBytes -= removed.length;
		}

		// Stream to callback
		if (options?.onChunk) {
			options.onChunk(text);
		}
	};

	try {
		const result = await operations.exec(command, cwd, {
			onData,
			signal: options?.signal,
		});

		const fullOutput = outputChunks.join("");
		const truncationResult = truncateTail(fullOutput);
		if (truncationResult.truncated) {
			ensureTempFile();
		}
		if (tempFileStream) {
			tempFileStream.end();
		}
		const cancelled = options?.signal?.aborted ?? false;
		const exitCode = cancelled ? undefined : (result.exitCode ?? undefined);
		const finalOutput = truncationResult.truncated ? truncationResult.content : fullOutput;

		if (bridge && joyRideScope && !cancelled) {
			try {
				if (exitCode === 0) {
					await bridge.storeReusableCommandResult(command, { output: finalOutput, exitCode: 0 }, joyRideScope);
				} else if (exitCode !== undefined) {
					await bridge.storeCommandDiagnostic(command, { output: finalOutput, exitCode }, joyRideScope);
				}

				if (bridge.isEnvAlteringCommand(command)) {
					const snapshot = await bridge.buildJoyRideWorkspaceSnapshot(cwd);
					bridge.flushWorkspace(snapshot.workspaceFingerprint, "command_environment_changed");
				}
			} catch {
				// Non-fatal caching attempt
			}
		}

		return {
			output: finalOutput,
			exitCode,
			cancelled,
			truncated: truncationResult.truncated,
			fullOutputPath: tempFilePath,
		};
	} catch (err) {
		// Check if it was an abort
		if (options?.signal?.aborted) {
			const fullOutput = outputChunks.join("");
			const truncationResult = truncateTail(fullOutput);
			if (truncationResult.truncated) {
				ensureTempFile();
			}
			if (tempFileStream) {
				tempFileStream.end();
			}
			return {
				output: truncationResult.truncated ? truncationResult.content : fullOutput,
				exitCode: undefined,
				cancelled: true,
				truncated: truncationResult.truncated,
				fullOutputPath: tempFilePath,
			};
		}

		if (tempFileStream) {
			tempFileStream.end();
		}

		throw err;
	}
}
