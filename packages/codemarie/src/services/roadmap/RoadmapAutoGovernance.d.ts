/** Shared copy and helpers for internal roadmap governance at attempt_completion. */
export declare const AUTO_GOVERNANCE: {
    readonly validationAtCompletion: "Schema validation runs automatically at attempt_completion.";
    readonly bootstrapAtCompletion: "Bootstrap autofill runs automatically at attempt_completion.";
    readonly checkpointTouchAtCompletion: "Missing Recent Checkpoint dates are auto-stamped at attempt_completion.";
    readonly writeMutationFollowup: "ROADMAP.md was mutated — validation runs automatically before task completion.";
    readonly editRoadmapResolve: "Edit ROADMAP.md directly to resolve remaining gates, then retry attempt_completion.";
    readonly continueTaskMidPass: "Continue the task — roadmap governance (validate, bootstrap autofill, checkpoint date stamp) runs automatically at attempt_completion.";
    readonly autoValidateFailed: "Task completion blocked: ROADMAP.md could not be auto-validated after internal remediation.";
    readonly gatesBlockedPrefix: "Task completion blocked by Roadmap Governance Gates:";
    readonly gateEvaluationFailed: "Task completion blocked: roadmap gate evaluation failed internally. Verify ROADMAP.md exists and is readable, then retry attempt_completion.";
    readonly noManualValidate: "Do not call roadmap(action='validate') or MCP tools for governance — remediation is internal at attempt_completion.";
    readonly previewBootstrapAutofill: "roadmap(action='apply_bootstrap_fill') — preview only; autofill writes run at attempt_completion.";
    readonly midTaskGovernanceNote: "Governance (validate, bootstrap autofill, checkpoint date) runs automatically at attempt_completion — continue the task.";
    /** Machine-readable policy string for all roadmap payloads and preflight XML. */
    readonly governancePolicy: "Do not call roadmap(action='validate') or MCP tools for governance — remediation is internal at attempt_completion.";
    readonly roadmapGateRecoveryHint: "Edit ROADMAP.md to resolve governance gates — bootstrap fill, validation, and checkpoint date stamp run automatically at attempt_completion.";
    readonly validateDiagnosticOnly: "Diagnostic only — governance runs automatically at attempt_completion; continue the task unless ROADMAP.md schema errors need repair.";
};
/** Slash commands for optional diagnostics — guide first; never required for governance. */
export declare const ROADMAP_DIAGNOSTIC_SLASH_COMMANDS: readonly ["/roadmap guide", "/roadmap explain-gate", "/roadmap explain-stale", "/roadmap progress --current", "/roadmap cockpit"];
/** Stable governance fields for session brief, write hints, and tool envelopes. */
export declare function governanceFieldsFromStatus(status: {
    auto_clearable_governance_only?: boolean;
    validation_pending?: boolean;
    governance_mid_task?: string;
}): {
    governance_policy: string;
    auto_clearable_governance_only: boolean;
    governance_mid_task?: string;
};
/** Merge governance fields onto any roadmap payload (progress, watch, steering context). */
export declare function mergeGovernanceFields<T extends Record<string, unknown>>(payload: T, source: {
    auto_clearable_governance_only?: boolean;
    validation_pending?: boolean;
    governance_mid_task?: string;
}): T & ReturnType<typeof governanceFieldsFromStatus>;
/** Brief-level auto-clearable detection for steering surfaces. */
export declare function isAutoClearableBrief(brief: Record<string, unknown>): boolean;
export declare const STALE_AUTO_TOUCH_REASONS: Set<string>;
/** Per-gate ROADMAP.md edit instructions for agent recovery (RFC 7807-style extensions). */
export declare const GATE_EDIT_INSTRUCTIONS: Record<string, string>;
export declare function gateEditInstruction(gateId?: string, fallbackFix?: string): string;
export declare function formatRemediationNote(steps: string[]): string;
export declare function formatBlockingGatesList(gates: Array<{
    label: string;
    why: string;
    fix?: string;
    id?: string;
}>): string;
export declare function formatAutoRemediationSummary(steps: string[]): string;
/** True when completion is blocked only by gates cleared at attempt_completion (not schema/content). */
export declare function isAutoClearableGovernanceOnly(params: {
    kanbanCompleteAllowed?: boolean;
    validationPending?: boolean;
    schemaValid?: boolean | null;
    blockingGates?: Array<{
        id?: string;
    }>;
}): boolean;
/** Human-readable kanban gate line — info for auto-clearable, hard block otherwise. */
export declare function formatKanbanGateStatusLine(params: {
    kanbanCompleteAllowed?: boolean;
    validationPending?: boolean;
    schemaValid?: boolean | null;
    blockingGates?: Array<{
        id?: string;
    }>;
}): string | null;
export declare function journalFollowupForMutation(bootstrapIncomplete?: boolean): string;
export interface RoadmapGateStructuredInput {
    remediationSteps?: string[];
    blockingGates?: Array<{
        id?: string;
        label: string;
        why: string;
        fix?: string;
    }>;
    autoClearableOnly?: boolean;
}
/** Machine-parseable recovery envelope — mirrors Stripe/GitHub Actions error extensions. */
export declare function buildRoadmapGateStructuredEnvelope(input: RoadmapGateStructuredInput): string;
/** Mid-task agent_next_call when governance is pending — avoids validate tool loops. */
export declare function midTaskAgentNextCall(params: {
    validationPending?: boolean;
    bootstrapIncomplete?: boolean;
    roadmapMissing?: boolean;
    fallback?: string;
}): string;
//# sourceMappingURL=RoadmapAutoGovernance.d.ts.map