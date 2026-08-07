import * as fs from "fs/promises";
import * as path from "path";
import { AUTO_GOVERNANCE, formatKanbanGateStatusLine, midTaskAgentNextCall } from "./RoadmapAutoGovernance.js";
import { getRoadmapConfig } from "./RoadmapConfig.js";
import { formatExplainGateReport, gateExplainParamsFromStatus, recommendNextAction, wrapClarityEnvelope, } from "./RoadmapOperator.js";
import { progressJsonlPath, readLastError } from "./RoadmapProgress.js";
import { bundledSkillPath, isBundledSkillAvailable } from "./RoadmapSkillInstall.js";
export async function runDoctorChecks(roadmapService, workspace) {
    const cfg = getRoadmapConfig();
    const checks = [];
    const recommendations = [];
    const addCheck = (name, ok, detail = "") => {
        checks.push({ name, ok, detail });
    };
    addCheck("roadmap.enabled", cfg.enabled, cfg.enabled ? "enabled" : "disabled");
    addCheck("auto_install_skills", true, cfg.auto_install_skills ? "enabled" : "disabled — install skill manually");
    try {
        const available = await isBundledSkillAvailable();
        const skillPath = available ? await bundledSkillPath() : "";
        addCheck("bundled_skill_available", available, available ? skillPath : "bundled SKILL.md missing from extension");
        if (!available && cfg.auto_install_skills) {
            recommendations.push("Ensure SKILL.md is bundled with the extension (optional-skills/dietcode/auto-rolling-roadmap/SKILL.md)");
        }
    }
    catch {
        addCheck("bundled_skill_available", false, "bundled SKILL.md missing from extension");
        if (cfg.auto_install_skills) {
            recommendations.push("Ensure SKILL.md is bundled with the extension (optional-skills/dietcode/auto-rolling-roadmap/SKILL.md)");
        }
    }
    const roadmapPath = path.join(workspace, "ROADMAP.md");
    let roadmapExists = false;
    try {
        await fs.access(roadmapPath);
        roadmapExists = true;
        addCheck("roadmap_present", true, roadmapPath);
        addCheck("roadmap_readable", true, roadmapPath);
    }
    catch {
        addCheck("roadmap_present", false, "ROADMAP.md not found — bootstrap required");
        recommendations.push("roadmap(action='checkpoint') to bootstrap ROADMAP.md");
    }
    const status = await roadmapService.getOperationalStatus(workspace, "", "standard");
    const gate = (status.roadmap_gate || {});
    if (roadmapExists) {
        addCheck("schema_valid", status.schema_valid !== false, status.schema_valid ? "valid" : "invalid");
        addCheck("checkpoint_fresh", !gate.checkpoint_stale, String(gate.stale_summary || "fresh"));
        if (gate.checkpoint_stale) {
            recommendations.push("Update Recent Checkpoint (section 11) in ROADMAP.md");
        }
        if (status.validation_pending) {
            addCheck("validation_current", false, AUTO_GOVERNANCE.validationAtCompletion);
            recommendations.push(AUTO_GOVERNANCE.continueTaskMidPass);
        }
        else {
            addCheck("validation_current", true, "validated after last edit");
        }
    }
    addCheck("progress_log_available", true, progressJsonlPath());
    const statePath = roadmapService.getStatePath(workspace);
    try {
        await fs.access(statePath);
        addCheck("workspace_state_available", true, statePath);
    }
    catch {
        addCheck("workspace_state_available", !roadmapExists, "state file created at attempt_completion validation");
    }
    const lastError = await readLastError();
    if (lastError) {
        addCheck("last_error_clear", false, String(lastError.message || lastError.error));
        recommendations.push(String(lastError.retry_command || "roadmap(action='guide')"));
    }
    else {
        addCheck("last_error_clear", true, "no recorded errors");
    }
    if (status.bootstrap_complete === false) {
        recommendations.push(AUTO_GOVERNANCE.bootstrapAtCompletion);
    }
    const okCount = checks.filter((c) => c.ok).length;
    const nextRec = recommendNextAction({
        phase: String(status.phase || ""),
        roadmap_exists: roadmapExists,
        schema_valid: status.schema_valid,
        stale: !!gate.checkpoint_stale,
        validation_pending: !!status.validation_pending,
        bootstrap_incomplete: status.bootstrap_complete === false,
        last_error: lastError,
    });
    const report = formatDoctorReport(checks, recommendations, nextRec, status);
    return wrapClarityEnvelope({
        action: "doctor",
        success: okCount === checks.length,
        ok: okCount === checks.length,
        workspace,
        checks,
        checks_passed: okCount,
        checks_total: checks.length,
        recommendations,
        recommended_next_action: nextRec,
        operator_summary: report.split("\n")[0] || "Roadmap doctor complete",
        report,
        roadmap_gate: gate,
        project_steering_digest: status.project_steering_digest,
        project_identity_line: status.project_identity_line,
        steering_brief: status.steering_brief,
        phase: status.phase,
        agent_next_call: midTaskAgentNextCall({
            validationPending: !!status.validation_pending,
            bootstrapIncomplete: status.bootstrap_complete === false,
            roadmapMissing: !roadmapExists,
            fallback: nextRec.command,
        }),
    });
}
export function formatDoctorReport(checks, recommendations, nextRec, status) {
    const lines = ["🩺 Roadmap doctor", ""];
    for (const check of checks) {
        lines.push(`${check.ok ? "✅" : "❌"} ${check.name}${check.detail ? ` — ${check.detail}` : ""}`);
    }
    lines.push("");
    if (recommendations.length > 0) {
        lines.push("Recommendations:");
        for (const rec of recommendations.slice(0, 6)) {
            lines.push(`  → ${rec}`);
        }
    }
    if (status.bootstrap_complete === false) {
        lines.push("", `Bootstrap: ${status.bootstrap_placeholder_count ?? "?"} template phrase(s) remain`);
    }
    const gate = (status.roadmap_gate || {});
    const blocking = gate.blocking_gates || [];
    const gateLine = formatKanbanGateStatusLine({
        kanbanCompleteAllowed: gate.kanban_complete_allowed,
        validationPending: !!status.validation_pending,
        schemaValid: status.schema_valid,
        blockingGates: blocking,
    });
    if (gateLine) {
        lines.push("", gateLine);
    }
    else if (gate.kanban_complete_allowed === false) {
        lines.push("", formatExplainGateReport(gateExplainParamsFromStatus(String(status.workspace || ""), gate, status)));
    }
    lines.push("", `→ ${midTaskAgentNextCall({
        validationPending: !!status.validation_pending,
        bootstrapIncomplete: status.bootstrap_complete === false,
        roadmapMissing: !status.roadmap_exists,
        fallback: nextRec.command,
    })}`);
    return lines.join("\n");
}
//# sourceMappingURL=RoadmapDoctor.js.map