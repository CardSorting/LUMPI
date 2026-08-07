/**
 * [LAYER: CORE]
 *
 * PlanModeEnforcer: Enforces INTEGRITY DRAFTING workflow during Plan Mode.
 * Ensures scratchpad.md is created before presenting architectural plans.
 */
export interface PlanModeRequirements {
    draftRequirements: boolean;
    drilldownNecessary: boolean;
    triadAuditRequired: boolean;
    fileReadLimit: number;
}
/**
 * PlanModeEnforcer: Integrity Drafting Workflow Enforcement
 *
 * INTEGRITY DRAFTING WORKFLOW:
 * 1. Create/Update scratchpad.md with INTEGRITY DRAFTING template
 * 2. Perform Double Down Passes on requirement analysis
 * 3. Execute TRIAD AUDIT (The Architect, The Critic, The SRE)
 * 4. Only then can plan_mode_respond be called
 *
 * TRIAD AUDIT COMPONENTS:
 * - The Architect: Architecture soundness, JoyZoning layer discipline
 * - The Critic: Edge cases, failure modes, scaling concerns
 * - The SRE: System reliability, observability, deployment
 */
export declare class PlanModeEnforcer {
    private scratchpadPath;
    private currentResponseCount;
    constructor(cwd: string);
    /**
     * Pre-plan-respond enforcement check.
     * V290: Advisory Architectural Drafting (Non-blocking).
     */
    enforceStrategicReview(): Promise<{
        allowed: boolean;
        reason?: string;
    }>;
    /**
     * V300: Drift Prophecy.
     * Analyzes the proposed plan in scratchpad.md and predicts if it will trigger
     * TASK DRIFT or MISSION DRIFT alerts during implementation.
     */
    predictDrift(content: string, monitor: any): {
        drift: number;
        predictedWarning?: string;
    };
    /**
     * Provides feedback on the STRATEGIC REVIEW compliance status.
     */
    getStrategicReviewStatus(monitor?: any): Promise<{
        hasScratchpad: boolean;
        Requirements: boolean;
        Architect: boolean;
        Critic: boolean;
        SRE: boolean;
        TRIADAudit: boolean;
        prophecy?: string;
    }>;
    /**
     * Updates the scratchpad.md file with feedback on compliance status.
     */
    updateScratchpadWithFeasibility(feedback: string): Promise<void>;
    /**
     * Checks if the user has performed sufficient architectural exploration.
     */
    checkExplorationDepth(fileReadCount: number): "shallow" | "adequate" | "overdetailed";
    /**
     * Generates STRATEGIC REVIEW completion prompts.
     */
    generateStrategicReviewPrompts(): Promise<string>;
    /**
     * Acts as The Architect in TRIAD AUDIT.
     */
    performArchitectAudit(planSummary: string): string[];
    /**
     * Acts as The Critic in TRIAD AUDIT.
     */
    performCriticAudit(planSummary: string): string[];
    /**
     * Acts as The SRE in TRIAD AUDIT.
     */
    performSREAudit(planSummary: string): string[];
    /**
     * Runs the complete TRIAD AUDIT.
     */
    performTriadAudit(planSummary: string): {
        architect: string[];
        critic: string[];
        sre: string[];
        summary: string;
    };
    /**
     * Gets layer discipline violations in a plan.
     */
    private checkLayerDiscipline;
    private readScratchpad;
}
//# sourceMappingURL=PlanModeEnforcer.d.ts.map