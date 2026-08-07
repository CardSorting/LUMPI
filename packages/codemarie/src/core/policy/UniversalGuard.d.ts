/**
 * [LAYER: CORE]
 */
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
export declare class UniversalGuard {
    readonly engine: FluidPolicyEngine;
    private readonly planModeEnforcer;
    private currentMode;
    constructor(cwd: string, taskId: string, stateManager: StateManager);
    /**
     * Sets the current execution mode ("plan" or "act").
     */
    setMode(mode: "plan" | "act"): void;
    /**
     * Returns the current execution mode.
     */
    getMode(): "plan" | "act";
    /**
     * Validates a tool invocation BEFORE execution.
     * Returns a PolicyResult indicating whether the action is ALLOWED or DENIED.
     */
    guardPreExecution(block: ToolUse): Promise<PolicyResult>;
    /**
     * Validates a tool invocation AFTER execution.
     * Returns a PolicyResult indicating whether post-execution invariants passed.
     */
    guardPostExecution(block: ToolUse, toolOutput: unknown, prevHash?: string): Promise<PolicyResult>;
    getForensics(): StabilityForensics;
    /**
     * Performs STRATEGIC REVIEW workflow check before Plan Mode responses.
     * Blocks plan_mode_respond calls if strategic review is missing or incomplete.
     */
    enforceStrategicReviewInPlanMode(): Promise<{
        allowed: boolean;
        reason?: string;
    }>;
    /**
     * Returns the localized layer context for the AI prompt.
     */
    getLayerContext(filePath: string): string;
    /**
     * Performs read-time AST auditing.
     */
    onRead(filePath: string, content: string, totalReadCount?: number, perFileReadCount?: number, globalFileReadCount?: number): Promise<string>;
    /** Lightweight read path for I/O authority — substrate tracking without advisory header injection. */
    onReadIoAuthority(filePath: string, content: string): string;
    /**
     * Performs the final architectural audit before a database commit.
     */
    validateCommit(files: Set<string>, ops: WriteOp[]): Promise<{
        success: boolean;
        errors: string[];
    }>;
    /**
     * Generates an executive integrity report for the current workspace state.
     */
    getExecutiveSummary(): string;
}
//# sourceMappingURL=UniversalGuard.d.ts.map