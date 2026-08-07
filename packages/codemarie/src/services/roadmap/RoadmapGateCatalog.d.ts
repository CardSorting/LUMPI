import type { RoadmapConfig } from "./RoadmapConfig.js";
import type { RoadmapValidation } from "./RoadmapSchema.js";
export interface GateClosedEntry {
    id: string;
    label: string;
    why: string;
    fix: string;
    safe_to_apply: boolean;
    blocks_kanban_complete: boolean;
}
export interface GateInputs {
    config: RoadmapConfig;
    workspace: string;
    roadmap_path: string;
    roadmap_present: boolean;
    validation: RoadmapValidation | null;
    freshness: Record<string, unknown>;
    workspace_state: Record<string, unknown>;
    bootstrap_complete: boolean | null;
    bootstrap_placeholder_count: number | null;
    project_fingerprint: Record<string, unknown>;
    evidence_roadmap: Record<string, unknown>;
}
export interface GateState {
    enabled: boolean;
    workspace: string;
    roadmap_present: boolean;
    schema_valid: boolean;
    schema_complete: boolean;
    checkpoint_fresh: boolean;
    checkpoint_stale: boolean;
    stale_reason: string;
    stale_summary: string;
    kanban_complete_allowed: boolean;
    closed_gates: GateClosedEntry[];
    open_gates: string[];
    closed_gate_count: number;
    blocking_gate_count: number;
    blocking_gates: GateClosedEntry[];
    checkpoint_allowed: boolean;
    preferred_command: string;
    validation_pending: boolean;
    bootstrap_complete: boolean;
    bootstrap_placeholder_count: number;
    workspace_state: Record<string, unknown>;
    temporal_validity?: Record<string, any>;
}
export declare function isQuarantinedWorkspace(workspace: string): boolean;
export declare function evaluateGateChecks(inputs: GateInputs): {
    closed: GateClosedEntry[];
    open: string[];
};
export declare function blockingClosedGates(closed: GateClosedEntry[], cfg: RoadmapConfig): GateClosedEntry[];
export declare function preferredGateCommand(inputs: GateInputs, isValid: boolean): string;
export declare function buildGateStateFromInputs(inputs: GateInputs): Promise<GateState>;
export declare function collectGateInputs(params: {
    workspace: string;
    evidence: Record<string, unknown>;
    validation: RoadmapValidation | null;
    freshness: Record<string, unknown>;
    workspaceState: Record<string, unknown>;
    roadmapPresent: boolean;
}): Promise<GateInputs>;
//# sourceMappingURL=RoadmapGateCatalog.d.ts.map