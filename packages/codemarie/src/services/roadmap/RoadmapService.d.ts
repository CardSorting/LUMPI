import { type RoadmapConfig } from "./RoadmapConfig.js";
import { type RoadmapValidation } from "./RoadmapSchema.js";
import { type EvidenceTier } from "./RoadmapSnapshot.js";
export interface TaskItem {
    id: string;
    title: string;
    body: string;
}
export interface TaskList {
    intro: string;
    items: TaskItem[];
}
export interface RoadmapRuntimeState {
    version: number;
    project_identity: {
        core_purpose: string;
        anti_goals: string;
        raw_body: string;
    };
    health: {
        status: string;
        summary: string;
        raw_body: string;
    };
    strategic_narrative: string;
    tasks: {
        now: TaskList;
        next: TaskList;
        later: TaskList;
    };
    discovery: string;
    maintenance_gravity: string;
    code_soup_audit: {
        risk_level: string;
        raw_body: string;
    };
    decision_log: string;
    checkpoint: {
        date: string;
        summary: string;
        raw_body: string;
    };
    archive: string;
    active_window?: {
        current_focus_ids: string[];
        locality_scope: string[];
    };
    memory?: {
        continuation_anchors: Record<string, string>;
        last_completed_step?: string;
    };
    locks?: Record<string, {
        owner_agent: string;
        leased_at: string;
        expires_at: string;
    }>;
    scheduler_state?: {
        pressure_score?: number;
        queue_size?: number;
        last_cooldown_timestamp?: string;
    };
    version_vectors?: Record<string, number>;
}
export declare function hydrateRuntimeState(content: string): RoadmapRuntimeState;
export declare function projectRuntimeStateToMarkdown(state: RoadmapRuntimeState): string;
export declare function computeDependencyManifestsHash(workspace: string): Promise<string>;
export declare function slimEvidence(evidence: any): any;
export declare function buildProjectFingerprint(workspace: string): Promise<any>;
export declare class RoadmapService {
    private static instance;
    private lastValidationResult;
    static getInstance(): RoadmapService;
    isEnabled(): boolean;
    getConfig(): RoadmapConfig;
    wrapClarityEnvelope(payload: Record<string, unknown>, phaseInfo?: Record<string, unknown>): Record<string, unknown>;
    runDoctor(workspace: string): Promise<Record<string, unknown>>;
    buildCockpit(workspace: string): Promise<Record<string, unknown>>;
    getProgressSnapshot(workspace: string, context?: string): Promise<Record<string, unknown>>;
    getWatchReport(workspace: string): Promise<Record<string, unknown>>;
    getLastErrorBrief(workspace: string): Promise<Record<string, unknown>>;
    explainGate(workspace: string): Promise<Record<string, unknown>>;
    explainStale(workspace: string): Promise<Record<string, unknown>>;
    autoBootstrapIfNeeded(workspace: string): Promise<Record<string, unknown> | null>;
    getStatePath(workspace: string): string;
    recordMutationLineage(workspace: string, entry: any): Promise<void>;
    getOrHydrateRuntimeState(workspace: string, text?: string): Promise<RoadmapRuntimeState>;
    recordContinuationAnchor(workspace: string, key: string, value: string): Promise<void>;
    getContinuationAnchors(workspace: string): Promise<Record<string, string>>;
    acquireOrchestrationLease(workspace: string, agentId: string, taskId: string, durationSeconds?: number): Promise<{
        success: boolean;
        expires_at?: string;
    }>;
    releaseOrchestrationLease(workspace: string, agentId: string, taskId: string): Promise<void>;
    verifyAnchorFreshness(workspace: string, key: string, expectedVersion: number): Promise<{
        fresh: boolean;
        current_version: number;
    }>;
    getVersionVector(workspace: string, key: string): Promise<number>;
    scheduleAdmission(workspace: string, agentId: string, operation: string): Promise<{
        admitted: boolean;
        backoff_ms: number;
        pressure_score?: number;
    }>;
    readState(workspace: string): Promise<any>;
    writeState(workspace: string, patch: any): Promise<any>;
    recordFileMutation(workspace: string, tool: string, filePath: string): Promise<any>;
    recordValidation(workspace: string, valid: boolean, health_status: string | null, recent_checkpoint_date: string | null, phase: string, issue_count: number, bootstrap_placeholder_count: number): Promise<any>;
    gatherEvidence(workspace: string, roadmapText: string | null, tier: "light" | "standard" | "full"): Promise<any>;
    assessFreshness(recentCheckpointDate: string | null, gitCommits: string[], schemaValid: boolean | null, staleDays: number | undefined, gitCommitsSinceCheckpoint: string[], driftDetected?: boolean): any;
    buildRoadmapGateState(workspace: string, evidence: any, validation: RoadmapValidation | null): Promise<any>;
    buildBootstrapFillPlan(roadmapText: string, evidence: any): any;
    applyBootstrapFillDraft(roadmapText: string, evidence: any): any;
    writeBootstrapAutofill(workspace: string, dryRun: boolean): Promise<any>;
    private resolveWorkspaceContext;
    private buildOperationalPayload;
    getOperationalStatus(workspace: string, contextHint?: string, tier?: EvidenceTier, options?: {
        validatePendingOnRead?: boolean;
    }): Promise<any>;
    checkpointBrief(workspace: string, context?: string, userRequest?: string): Promise<any>;
    /**
     * Mechanical checkpoint date repair — stamps **Date:** in section 11 when missing or unparsable.
     * Used by completion-gate auto-remediation only; does not rewrite checkpoint narrative.
     */
    touchRecentCheckpointDate(workspace: string): Promise<{
        written: boolean;
        reason?: string;
    }>;
    validateRoadmap(workspace: string): Promise<any>;
    getTemplateBrief(workspace: string): Promise<any>;
    applyBootstrapFillBrief(workspace: string, context?: string): Promise<any>;
}
export declare function formatNowSection(items: any[]): string;
//# sourceMappingURL=RoadmapService.d.ts.map