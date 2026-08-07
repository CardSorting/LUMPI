export const DEFAULT_ROADMAP_CONFIG = {
    enabled: true,
    auto_bootstrap: true,
    auto_bootstrap_fill: true,
    auto_install_skills: true,
    progress_enabled: true,
    nudge_on_roadmap_write: true,
    block_writes_outside_workspace: true,
    stale_checkpoint_days: 7,
    git_timeout_seconds: 5,
    evidence_cache_ttl_seconds: 15,
    session_brief_cache_ttl_seconds: 10,
    block_kanban_on_invalid_schema: true,
    block_kanban_on_validation_pending: true,
    block_kanban_on_bootstrap_incomplete: true,
    warn_on_stale_before_complete: true,
    fail_closed_completion_gates: true,
};
const CONFIG_TTL_MS = 30_000;
let configCache = null;
let configCacheAt = 0;
let configOverride = null;
function envBool(key) {
    const raw = process.env[key];
    if (raw === undefined || raw === "")
        return undefined;
    const normalized = raw.trim().toLowerCase();
    if (["1", "true", "yes", "on"].includes(normalized))
        return true;
    if (["0", "false", "no", "off"].includes(normalized))
        return false;
    return undefined;
}
function envInt(key, min) {
    const raw = process.env[key];
    if (raw === undefined || raw === "")
        return undefined;
    const parsed = Number.parseInt(raw, 10);
    if (Number.isNaN(parsed))
        return undefined;
    return Math.max(min, parsed);
}
function loadFromEnv() {
    const patch = {};
    const boolKeys = [
        ["enabled", "MIRA_ROADMAP_ENABLED"],
        ["enabled", "DIETCODE_ROADMAP_ENABLED"],
        ["auto_bootstrap", "MIRA_ROADMAP_AUTO_BOOTSTRAP"],
        ["auto_bootstrap_fill", "MIRA_ROADMAP_AUTO_BOOTSTRAP_FILL"],
        ["auto_install_skills", "MIRA_ROADMAP_AUTO_INSTALL_SKILLS"],
        ["progress_enabled", "MIRA_ROADMAP_PROGRESS_ENABLED"],
        ["nudge_on_roadmap_write", "MIRA_ROADMAP_NUDGE_ON_WRITE"],
        ["block_writes_outside_workspace", "MIRA_ROADMAP_BLOCK_WRITES_OUTSIDE_WORKSPACE"],
        ["block_kanban_on_invalid_schema", "MIRA_ROADMAP_BLOCK_KANBAN_ON_INVALID_SCHEMA"],
        ["block_kanban_on_validation_pending", "MIRA_ROADMAP_BLOCK_KANBAN_ON_VALIDATION_PENDING"],
        ["block_kanban_on_bootstrap_incomplete", "MIRA_ROADMAP_BLOCK_KANBAN_ON_BOOTSTRAP_INCOMPLETE"],
        ["warn_on_stale_before_complete", "MIRA_ROADMAP_WARN_ON_STALE_BEFORE_COMPLETE"],
        ["fail_closed_completion_gates", "MIRA_ROADMAP_FAIL_CLOSED_COMPLETION_GATES"],
    ];
    for (const [field, envKey] of boolKeys) {
        const value = envBool(envKey);
        if (value !== undefined) {
            patch[field] = value;
        }
    }
    const staleDays = envInt("MIRA_ROADMAP_STALE_CHECKPOINT_DAYS", 1);
    if (staleDays !== undefined)
        patch.stale_checkpoint_days = staleDays;
    const gitTimeout = envInt("MIRA_ROADMAP_GIT_TIMEOUT_SECONDS", 1);
    if (gitTimeout !== undefined)
        patch.git_timeout_seconds = gitTimeout;
    const evidenceTtl = envInt("MIRA_ROADMAP_EVIDENCE_CACHE_TTL_SECONDS", 0);
    if (evidenceTtl !== undefined)
        patch.evidence_cache_ttl_seconds = evidenceTtl;
    const briefTtl = envInt("MIRA_ROADMAP_SESSION_BRIEF_CACHE_TTL_SECONDS", 0);
    if (briefTtl !== undefined)
        patch.session_brief_cache_ttl_seconds = briefTtl;
    return patch;
}
function loadFromVSCodeSettings() {
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const vscode = require("vscode");
        const cfg = vscode.workspace.getConfiguration("lumi.roadmap");
        const patch = {};
        const mapping = [
            ["enabled", "enabled"],
            ["auto_bootstrap", "autoBootstrap"],
            ["auto_bootstrap_fill", "autoBootstrapFill"],
            ["auto_install_skills", "autoInstallSkills"],
            ["progress_enabled", "progressEnabled"],
            ["nudge_on_roadmap_write", "nudgeOnRoadmapWrite"],
            ["block_writes_outside_workspace", "blockWritesOutsideWorkspace"],
            ["block_kanban_on_invalid_schema", "blockKanbanOnInvalidSchema"],
            ["block_kanban_on_validation_pending", "blockKanbanOnValidationPending"],
            ["block_kanban_on_bootstrap_incomplete", "blockKanbanOnBootstrapIncomplete"],
            ["warn_on_stale_before_complete", "warnOnStaleBeforeComplete"],
            ["fail_closed_completion_gates", "failClosedCompletionGates"],
        ];
        for (const [field, vscodeKey] of mapping) {
            if (cfg.has(vscodeKey)) {
                patch[field] = cfg.get(vscodeKey);
            }
        }
        if (cfg.has("staleCheckpointDays")) {
            patch.stale_checkpoint_days = Math.max(1, cfg.get("staleCheckpointDays") ?? 7);
        }
        if (cfg.has("gitTimeoutSeconds")) {
            patch.git_timeout_seconds = Math.max(1, cfg.get("gitTimeoutSeconds") ?? 5);
        }
        if (cfg.has("evidenceCacheTtlSeconds")) {
            patch.evidence_cache_ttl_seconds = Math.max(0, cfg.get("evidenceCacheTtlSeconds") ?? 15);
        }
        return patch;
    }
    catch {
        return {};
    }
}
/** Test-only or runtime override hook (cleared on invalidateRoadmapConfigCache). */
export function setRoadmapConfigOverride(patch) {
    configOverride = patch;
    invalidateRoadmapConfigCache();
}
export function invalidateRoadmapConfigCache() {
    configCache = null;
    configCacheAt = 0;
}
export function getRoadmapConfig() {
    const now = Date.now();
    if (configCache && now - configCacheAt < CONFIG_TTL_MS) {
        return { ...configCache };
    }
    configCache = {
        ...DEFAULT_ROADMAP_CONFIG,
        ...loadFromVSCodeSettings(),
        ...loadFromEnv(),
        ...(configOverride || {}),
    };
    configCacheAt = now;
    return { ...configCache };
}
//# sourceMappingURL=RoadmapConfig.js.map