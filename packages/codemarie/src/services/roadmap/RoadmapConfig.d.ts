export interface RoadmapConfig {
    enabled: boolean;
    auto_bootstrap: boolean;
    auto_bootstrap_fill: boolean;
    auto_install_skills: boolean;
    progress_enabled: boolean;
    nudge_on_roadmap_write: boolean;
    block_writes_outside_workspace: boolean;
    stale_checkpoint_days: number;
    git_timeout_seconds: number;
    evidence_cache_ttl_seconds: number;
    session_brief_cache_ttl_seconds: number;
    block_kanban_on_invalid_schema: boolean;
    block_kanban_on_validation_pending: boolean;
    block_kanban_on_bootstrap_incomplete: boolean;
    warn_on_stale_before_complete: boolean;
    fail_closed_completion_gates: boolean;
}
export declare const DEFAULT_ROADMAP_CONFIG: RoadmapConfig;
/** Test-only or runtime override hook (cleared on invalidateRoadmapConfigCache). */
export declare function setRoadmapConfigOverride(patch: Partial<RoadmapConfig> | null): void;
export declare function invalidateRoadmapConfigCache(): void;
export declare function getRoadmapConfig(): RoadmapConfig;
//# sourceMappingURL=RoadmapConfig.d.ts.map