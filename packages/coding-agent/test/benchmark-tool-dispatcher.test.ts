import { Agent, type AgentTool } from "@earendil-works/pi-agent-core";
import { getModel, streamSimple } from "@earendil-works/pi-ai/compat";
import { Type } from "typebox";
import { describe, expect, it } from "vitest";
import { AgentSession } from "../src/core/agent-session.ts";
import { AuthStorage } from "../src/core/auth-storage.ts";
import { SessionManager } from "../src/core/session-manager.ts";
import { SettingsManager } from "../src/core/settings-manager.ts";
import { createInMemoryModelRegistry, getModelRuntime } from "./model-runtime-test-utils.ts";
import { createTestResourceLoader } from "./utilities.ts";

interface ToolDispatcherBenchmarkResult {
	toolCallsExecuted: number;
	totalMs: number;
	avgMsPerCall: number;
	opsPerSec: number;
	successfulCalls: number;
}

class ToolDispatcherBenchmark {
	private modelName: string;
	private providerName: string;

	constructor(providerName = "openai-codex", modelName = "gpt-5.6-luna") {
		this.providerName = providerName;
		this.modelName = modelName;
	}

	private async createTestSession(tools: AgentTool[]) {
		const model = getModel("openai-codex", this.modelName as "gpt-5.6-luna");
		if (!model) {
			throw new Error(`Model ${this.providerName}/${this.modelName} not found`);
		}

		const settingsManager = SettingsManager.inMemory();
		const sessionManager = SessionManager.inMemory();
		const authStorage = AuthStorage.inMemory();
		await authStorage.modify(this.providerName, async () => ({
			type: "oauth",
			access: "test-oauth-access-token",
			refresh: "test-oauth-refresh-token",
			expires: Date.now() + 3600000,
		}));

		const toolMap = Object.fromEntries(tools.map((t) => [t.name, t]));

		const session = new AgentSession({
			agent: new Agent({
				getApiKey: () => "test-oauth-access-token",
				streamFn: streamSimple,
				initialState: {
					model,
					systemPrompt: "You are a tool dispatcher benchmark assistant.",
					tools,
				},
			}),
			sessionManager,
			settingsManager,
			cwd: process.cwd(),
			modelRuntime: getModelRuntime(await createInMemoryModelRegistry(authStorage)),
			resourceLoader: createTestResourceLoader(),
			baseToolsOverride: toolMap,
		});

		return { session, sessionManager, model };
	}

	async runToolExecutionBenchmark(toolCallCount = 200): Promise<ToolDispatcherBenchmarkResult> {
		let successfulCalls = 0;

		const mockBenchmarkTool: AgentTool = {
			name: "benchmark_compute",
			label: "benchmark_compute",
			description: "Perform simulated benchmark computation",
			parameters: Type.Object({
				inputVal: Type.Number(),
				operation: Type.String(),
			}),
			execute: async (_toolCallId, params) => {
				const { inputVal } = params as { inputVal: number; operation: string };
				successfulCalls++;
				return {
					content: [{ type: "text", text: `Computed result: ${inputVal * 2}` }],
					details: { status: "completed" },
				};
			},
		};

		const { session } = await this.createTestSession([mockBenchmarkTool]);

		try {
			const start = performance.now();

			for (let i = 0; i < toolCallCount; i++) {
				const toolCall = {
					id: `call_${i}`,
					name: "benchmark_compute",
					arguments: { inputVal: i, operation: "multiply" },
				};

				await mockBenchmarkTool.execute(toolCall.id, toolCall.arguments, undefined, undefined);
			}

			const totalMs = performance.now() - start;
			const avgMsPerCall = totalMs / toolCallCount;
			const opsPerSec = (toolCallCount / totalMs) * 1000;

			return {
				toolCallsExecuted: toolCallCount,
				totalMs,
				avgMsPerCall,
				opsPerSec,
				successfulCalls,
			};
		} finally {
			session.dispose();
		}
	}
}

describe("ToolDispatcherBenchmark", () => {
	it("benchmarks agent tool execution throughput and call dispatch performance", async () => {
		const benchmark = new ToolDispatcherBenchmark();
		const result = await benchmark.runToolExecutionBenchmark(100);

		expect(result.toolCallsExecuted).toBe(100);
		expect(result.successfulCalls).toBe(100);
		expect(result.totalMs).toBeGreaterThan(0);
		expect(result.opsPerSec).toBeGreaterThan(0);
	});
});
