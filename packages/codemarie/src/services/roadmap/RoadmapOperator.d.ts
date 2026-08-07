export declare const OPERATOR_PLAYBOOK: string;
export declare const AGENT_PLAYBOOK: string;
export interface GateSnapshot {
    workspace?: string;
    roadmap_present?: boolean;
    schema_valid?: boolean | null;
    kanban_complete_allowed?: boolean;
    validation_pending?: boolean;
    checkpoint_stale?: boolean;
    bootstrap_complete?: boolean;
    bootstrap_placeholder_count?: number;
    blocking_gates?: Array<{
        id?: string;
        label?: string;
        why?: string;
        fix?: string;
        blocks_kanban_complete?: boolean;
    }>;
    workspace_state?: Record<string, unknown>;
    roadmap_path?: string;
}
export declare function isBootstrapIncomplete(params: {
    roadmap_exists?: boolean;
    bootstrap_complete?: boolean | null;
    bootstrap_placeholder_count?: number | null;
    workspace_state?: Record<string, unknown>;
}): boolean;
export declare function determinePhase(params: {
    roadmap_exists: boolean;
    sections_missing: string[];
    health_status: string | null;
    validation_valid: boolean | undefined;
    bootstrap_incomplete: boolean;
}): {
    phase: string;
    operator_summary: string;
    agent_next_call: string;
    agent_blocked: boolean;
};
export declare function roadmapToolCommandToSlash(command?: string): string;
export declare function recommendNextAction(params: {
    phase?: string;
    roadmap_exists?: boolean;
    schema_valid?: boolean | null;
    stale?: boolean;
    validation_pending?: boolean;
    bootstrap_incomplete?: boolean;
    last_error?: Record<string, unknown> | null;
}): {
    action: string;
    command: string;
    detail: string;
};
export declare function gateExplainParamsFromStatus(workspace: string, gate: Record<string, unknown>, status?: Record<string, unknown>): {
    workspace: string;
    closed_gates: Array<Record<string, unknown>>;
    open_gates: string[];
    blocking_gates: Array<Record<string, unknown>>;
    kanban_complete_allowed?: boolean;
    validation_pending?: boolean;
    schema_valid?: boolean | null;
};
export declare function formatExplainGateReport(params: {
    workspace?: string;
    closed_gates?: Array<Record<string, unknown>>;
    open_gates?: string[];
    blocking_gates?: Array<Record<string, unknown>>;
    kanban_complete_allowed?: boolean;
    validation?: Record<string, unknown>;
    freshness?: Record<string, unknown>;
    validation_pending?: boolean;
    schema_valid?: boolean | null;
}): string;
export declare function buildAgentOperatorHints(params: {
    action?: string;
    gate?: GateSnapshot | null;
    workspace?: string;
    last_error?: Record<string, unknown> | null;
    operator_summary?: string;
    agent_next_call?: string;
    recommended_next_action?: {
        command?: string;
        detail?: string;
    };
    project_steering_digest?: Record<string, unknown>;
    bootstrap_fill_hint?: string;
}): Record<string, unknown>;
export declare function wrapClarityEnvelope(payload: Record<string, unknown>, phaseInfo?: Record<string, unknown>): Record<string, unknown>;
//# sourceMappingURL=RoadmapOperator.d.ts.map