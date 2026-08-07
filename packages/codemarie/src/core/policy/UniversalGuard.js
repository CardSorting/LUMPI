/**
 * [LAYER: CORE]
 */
import { PlanModeEnforcer } from "./PlanModeEnforcer.js";
import { FluidPolicyEngine } from "./FluidPolicyEngine.js";
/**
 * UniversalGuard: A unified, singleton authority for all architectural,
 * concurrency, and stability enforcement. Use this instead of direct
 * FluidPolicyEngine calls.
 */
export class UniversalGuard {
    engine;
    planModeEnforcer;
    currentMode = "act";
    constructor(cwd, taskId, stateManager) {
        this.engine = new FluidPolicyEngine(cwd, taskId, stateManager);
        this.planModeEnforcer = new PlanModeEnforcer(cwd);
    }
    /**
     * Sets the current execution mode ("plan" or "act").
     */
    setMode(mode) {
        this.currentMode = mode;
    }
    /**
     * Returns the current execution mode.
     */
    getMode() {
        return this.currentMode;
    }
    /**
     * Validates a tool invocation BEFORE execution.
     * Returns a PolicyResult indicating whether the action is ALLOWED or DENIED.
     */
    async guardPreExecution(block) {
        return this.engine.validatePreExecution(block);
    }
    /**
     * Validates a tool invocation AFTER execution.
     * Returns a PolicyResult indicating whether post-execution invariants passed.
     */
    async guardPostExecution(block, toolOutput, prevHash) {
        return this.engine.validatePostExecution(block, toolOutput, prevHash);
    }
    getForensics() {
        return this.engine.getForensics();
    }
    /**
     * Performs STRATEGIC REVIEW workflow check before Plan Mode responses.
     * Blocks plan_mode_respond calls if strategic review is missing or incomplete.
     */
    async enforceStrategicReviewInPlanMode() {
        return this.planModeEnforcer.enforceStrategicReview();
    }
    /**
     * Returns the localized layer context for the AI prompt.
     */
    getLayerContext(filePath) {
        return this.engine.getFileLayerContext(filePath);
    }
    /**
     * Performs read-time AST auditing.
     */
    async onRead(filePath, content, totalReadCount = 0, perFileReadCount = 0, globalFileReadCount = 0) {
        return this.engine.onRead(filePath, content, totalReadCount, perFileReadCount, globalFileReadCount);
    }
    /** Lightweight read path for I/O authority — substrate tracking without advisory header injection. */
    onReadIoAuthority(filePath, content) {
        return this.engine.onReadIoAuthority(filePath, content);
    }
    /**
     * Performs the final architectural audit before a database commit.
     */
    async validateCommit(files, ops) {
        return this.engine.validateCommit(files, ops);
    }
    /**
     * Generates an executive integrity report for the current workspace state.
     */
    getExecutiveSummary() {
        return this.engine.getSessionImpactSummary();
    }
}
//# sourceMappingURL=UniversalGuard.js.map