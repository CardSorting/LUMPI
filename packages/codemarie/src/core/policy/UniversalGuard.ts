/**
 * [LAYER: CORE]
 */

import { PlanModeEnforcer } from "./PlanModeEnforcer.js";
import type { ToolUse } from "../assistant-message/index.js";
import type { StateManager } from "../storage/StateManager.js";
import { FluidPolicyEngine, type PolicyResult } from "./FluidPolicyEngine.js";
import type { StabilityForensics } from "./StabilityForensics.js";
import type { WriteOp } from "../../infrastructure/db/BufferedDbPool.js";

/**
 * UniversalGuard: A unified, singleton authority for all architectural,
 * concurrency, and stability enforcement. Use this instead of direct
 * FluidPolicyEngine calls.
 */
export class UniversalGuard {
	public readonly engine: FluidPolicyEngine;
	private readonly planModeEnforcer: PlanModeEnforcer;
	private currentMode: "plan" | "act" = "act";

	constructor(cwd: string, taskId: string, stateManager: StateManager) {
		this.engine = new FluidPolicyEngine(cwd, taskId, stateManager);
		this.planModeEnforcer = new PlanModeEnforcer(cwd);
	}

	/**
	 * Sets the current execution mode ("plan" or "act").
	 */
	public setMode(mode: "plan" | "act"): void {
		this.currentMode = mode;
	}

	/**
	 * Returns the current execution mode.
	 */
	public getMode(): "plan" | "act" {
		return this.currentMode;
	}

	/**
	 * Validates a tool invocation BEFORE execution.
	 * Returns a PolicyResult indicating whether the action is ALLOWED or DENIED.
	 */
	public async guardPreExecution(block: ToolUse): Promise<PolicyResult> {
		return this.engine.validatePreExecution(block);
	}

	/**
	 * Validates a tool invocation AFTER execution.
	 * Returns a PolicyResult indicating whether post-execution invariants passed.
	 */
	public async guardPostExecution(block: ToolUse, toolOutput: unknown, prevHash?: string): Promise<PolicyResult> {
		return this.engine.validatePostExecution(block, toolOutput, prevHash);
	}

	public getForensics(): StabilityForensics {
		return this.engine.getForensics();
	}

	/**
	 * Performs STRATEGIC REVIEW workflow check before Plan Mode responses.
	 * Blocks plan_mode_respond calls if strategic review is missing or incomplete.
	 */
	public async enforceStrategicReviewInPlanMode(): Promise<{ allowed: boolean; reason?: string }> {
		return this.planModeEnforcer.enforceStrategicReview();
	}

	/**
	 * Returns the localized layer context for the AI prompt.
	 */
	public getLayerContext(filePath: string): string {
		return this.engine.getFileLayerContext(filePath);
	}

	/**
	 * Performs read-time AST auditing.
	 */
	public async onRead(
		filePath: string,
		content: string,
		totalReadCount = 0,
		perFileReadCount = 0,
		globalFileReadCount = 0,
	): Promise<string> {
		return this.engine.onRead(filePath, content, totalReadCount, perFileReadCount, globalFileReadCount);
	}

	/** Lightweight read path for I/O authority — substrate tracking without advisory header injection. */
	public onReadIoAuthority(filePath: string, content: string): string {
		return this.engine.onReadIoAuthority(filePath, content);
	}

	/**
	 * Performs the final architectural audit before a database commit.
	 */
	public async validateCommit(
		files: Set<string>,
		ops: WriteOp[],
	): Promise<{ success: boolean; errors: string[] }> {
		return this.engine.validateCommit(files, ops);
	}

	/**
	 * Generates an executive integrity report for the current workspace state.
	 */
	public getExecutiveSummary(): string {
		return this.engine.getSessionImpactSummary();
	}
}
