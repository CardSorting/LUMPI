/** Live agent steering — compact entity-card lines for prompts and environment_details (Backstage-style). */
import { AUTO_GOVERNANCE, formatKanbanGateStatusLine, isAutoClearableBrief } from "./RoadmapAutoGovernance.js";
function truncate(text, limit = 120) {
    const stripped = text.split(/\s+/).filter(Boolean).join(" ");
    if (stripped.length <= limit)
        return stripped;
    return `${stripped.slice(0, limit - 1)}…`;
}
function gateBlockingList(brief) {
    const gate = (brief.roadmap_gate || {});
    return (gate.blocking_gates || []) || [];
}
export function buildProjectContextLines(brief) {
    const lines = [];
    const digest = (brief.project_steering_digest || {});
    const fp = (brief.project_fingerprint || digest || {});
    const identity = brief.project_identity_line || brief.steering_line || brief.steering_brief || fp.steering_brief;
    if (identity)
        lines.push(`Project: ${identity}`);
    const tv = (brief.temporal_validity || brief.checkpoint_freshness?.temporal_validity);
    if (brief.execution_confidence_score !== undefined) {
        lines.push(`Confidence: ${brief.execution_confidence_score}`);
    }
    if (tv) {
        lines.push(`Freshness score: ${tv.freshness_score}/100`);
        if (tv.dependency_drift_detected) {
            lines.push(`⚠️ Dependency drift detected`);
        }
    }
    const stack = brief.stack_summary || fp.stack_summary;
    const archetype = brief.project_archetype || fp.project_archetype;
    if (stack && !String(identity || "").includes(String(stack))) {
        const stackLine = archetype && archetype !== "project"
            ? `Stack: ${stack} (${String(archetype).replace(/-/g, " ")})`
            : `Stack: ${stack}`;
        lines.push(stackLine);
    }
    else if (archetype && archetype !== "project") {
        lines.push(`Archetype: ${String(archetype).replace(/-/g, " ")}`);
    }
    const tagline = fp.readme_tagline || fp.purpose_hint || fp.package_description;
    if (tagline && !String(identity || "").includes(String(tagline))) {
        lines.push(`Purpose: ${truncate(String(tagline), 140)}`);
    }
    const agentRules = fp.agent_rules_files || digest.agent_rules_files || [];
    if (agentRules.length > 0)
        lines.push(`Agent rules: ${agentRules.slice(0, 3).join(", ")}`);
    const makeTargets = fp.makefile_targets || digest.makefile_targets || [];
    if (makeTargets.length > 0)
        lines.push(`Makefile: ${makeTargets.slice(0, 4).join(", ")}`);
    const verify = fp.verification_commands || digest.verification_commands || [];
    if (verify.length > 0)
        lines.push(`Verify: ${verify.slice(0, 3).join(", ")}`);
    const governance = fp.governance_files || digest.governance_files || [];
    if (governance.length > 0)
        lines.push(`Governance: ${governance.slice(0, 3).join(", ")}`);
    const ci = fp.ci_systems || digest.ci_systems || [];
    if (ci.length > 0)
        lines.push(`CI: ${ci.slice(0, 2).join(", ")}`);
    const quality = fp.quality_tools || digest.quality_tools || [];
    if (quality.length > 0)
        lines.push(`Quality: ${quality.slice(0, 3).join(", ")}`);
    if (fp.has_backstage_catalog || digest.has_backstage_catalog) {
        lines.push("Backstage: catalog-info.yaml present");
    }
    const statusBits = [];
    if (brief.health_status)
        statusBits.push(`health=${brief.health_status}`);
    if (brief.now_item_count != null)
        statusBits.push(`Now=${brief.now_item_count}`);
    if (brief.code_soup_risk)
        statusBits.push(`soup=${brief.code_soup_risk}`);
    if (statusBits.length > 0)
        lines.push(`Roadmap: ${statusBits.join(", ")}`);
    if (brief.recent_checkpoint_date) {
        lines.push(`Last checkpoint: ${brief.recent_checkpoint_date}`);
    }
    else if (brief.roadmap_exists) {
        lines.push("Last checkpoint: unparsed — auto-stamped at attempt_completion if section 11 exists");
    }
    return lines;
}
export function formatRoadmapSteeringBlock(brief, options) {
    const verbose = options?.verbose || process.argv.includes("--verbose");
    const agentId = options?.agentId;
    const lines = ["# Roadmap Steering", ...buildProjectContextLines(brief)];
    const autoClearable = isAutoClearableBrief(brief);
    if (brief.phase)
        lines.push(`Phase: ${brief.phase}`);
    if (brief.orchestration_pressure_score !== undefined) {
        lines.push(`Pressure score: ${brief.orchestration_pressure_score}`);
    }
    const gateLine = formatKanbanGateStatusLine({
        kanbanCompleteAllowed: brief.kanban_complete_allowed,
        validationPending: !!brief.validation_pending,
        schemaValid: brief.schema_valid,
        blockingGates: gateBlockingList(brief),
    });
    if (gateLine)
        lines.push(gateLine);
    if (!autoClearable) {
        if (brief.validation_pending) {
            lines.push(`⚠️ ROADMAP.md pending validation — ${AUTO_GOVERNANCE.validationAtCompletion}`);
        }
        if (brief.bootstrap_complete === false) {
            lines.push(`⚠️ Bootstrap incomplete (${brief.bootstrap_placeholder_count ?? "?"} template phrase(s)) — ${AUTO_GOVERNANCE.bootstrapAtCompletion}`);
        }
    }
    if (brief.governance_policy)
        lines.push(`Policy: ${brief.governance_policy}`);
    if (brief.operator_summary)
        lines.push(`Summary: ${brief.operator_summary}`);
    if (brief.agent_next_call)
        lines.push(`Next: ${brief.agent_next_call}`);
    const hints = brief._roadmap_operator_hints;
    const verifyCmds = hints?.verification_commands || [];
    if (verifyCmds.length > 0)
        lines.push(`Verify: ${verifyCmds[0]}`);
    const runtimeState = (brief.runtime_state ||
        brief.workspace_state?.runtime_state);
    if (runtimeState) {
        lines.push("", "## Focus-Scoped Execution (Now):");
        let nowItems = runtimeState.tasks?.now?.items || [];
        if (agentId && !verbose) {
            const locks = runtimeState.locks || {};
            nowItems = nowItems.filter((item) => {
                const lock = locks[item.id];
                if (lock) {
                    const isExpired = new Date(lock.expires_at).getTime() <= Date.now();
                    if (!isExpired && lock.owner_agent !== agentId) {
                        return false;
                    }
                }
                return true;
            });
        }
        if (nowItems.length > 0) {
            nowItems.forEach((item, idx) => {
                lines.push(`  [${idx + 1}] ${item.title} (id: ${item.id})`);
            });
        }
        else {
            lines.push("  • (No active tasks in Now)");
        }
        const locks = runtimeState.locks || {};
        const activeAlerts = [];
        const nowMs = Date.now();
        for (const [taskId, lock] of Object.entries(locks)) {
            const expiresAt = new Date(lock.expires_at).getTime();
            if (expiresAt > nowMs) {
                activeAlerts.push(`Task ${taskId} is leased by ${lock.owner_agent} (expires: ${lock.expires_at})`);
            }
        }
        if (activeAlerts.length > 0) {
            lines.push("", "## Active Lock Alerts:");
            activeAlerts.forEach((alert) => lines.push(`  ⚠️ ${alert}`));
        }
        const anchors = runtimeState.memory?.continuation_anchors || {};
        const anchorKeys = Object.keys(anchors);
        if (anchorKeys.length > 0) {
            lines.push("", "## Orchestration Continuation Anchors:");
            anchorKeys.forEach((k) => {
                lines.push(`  • ${k}: ${anchors[k]}`);
            });
        }
    }
    lines.push("Prime directive: Did the latest work strengthen or weaken the project's center of gravity?");
    return lines.join("\n");
}
export function formatWatchSteeringLine(brief) {
    const identity = brief.project_identity_line || brief.steering_brief || "project";
    const phase = brief.phase || "unknown";
    const next = brief.agent_next_call || "roadmap(action='guide')";
    const autoClearableOnly = isAutoClearableBrief(brief);
    const gate = brief.kanban_complete_allowed === false && !autoClearableOnly ? " ⛔gates" : "";
    const pending = brief.validation_pending && !autoClearableOnly ? " ⚠️pending" : autoClearableOnly ? " ℹ️gov" : "";
    const scoreStr = brief.execution_confidence_score !== undefined ? ` conf=${brief.execution_confidence_score}` : "";
    return `[roadmap] ${identity} · phase=${phase}${gate}${pending}${scoreStr} → ${next}`;
}
//# sourceMappingURL=RoadmapAgentSteering.js.map