import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import { writeCoalescer } from "@/core/storage/WriteCoalescer";
import { Logger } from "@/shared/services/Logger";
import { formatWatchSteeringLine } from "./RoadmapAgentSteering.js";
import { AUTO_GOVERNANCE, formatKanbanGateStatusLine, isAutoClearableGovernanceOnly, mergeGovernanceFields, } from "./RoadmapAutoGovernance.js";
import { getRoadmapConfig } from "./RoadmapConfig.js";
import { recommendNextAction } from "./RoadmapOperator.js";
const MAX_LOG_BYTES = 1024 * 1024;
const MAX_LOG_LINES = 2000;
const PROGRESS_RETRY_COOLDOWN_MS = 60_000;
let progressRetryAfter = 0;
function sessionDir() {
    const raw = process.env.DIETCODE_SESSION_DIR?.trim();
    return raw ? path.resolve(raw) : path.join(os.homedir(), ".dietcode", "session");
}
export function progressJsonlPath() {
    return path.join(sessionDir(), "roadmap-progress.jsonl");
}
export function progressCurrentPath() {
    return path.join(sessionDir(), "roadmap-progress-current.json");
}
export function lastErrorPath() {
    return path.join(sessionDir(), "roadmap-last-error.json");
}
async function trimJsonl(filePath) {
    try {
        const stat = await fs.stat(filePath);
        if (stat.size <= MAX_LOG_BYTES)
            return;
        const text = await fs.readFile(filePath, "utf8");
        const lines = text.split(/\r?\n/).filter(Boolean);
        if (lines.length <= MAX_LOG_LINES)
            return;
        await fs.writeFile(filePath, `${lines.slice(-MAX_LOG_LINES).join("\n")}\n`, "utf8");
    }
    catch {
        // non-fatal
    }
}
export async function emitProgress(phase, params) {
    const cfg = getRoadmapConfig();
    if (!cfg.progress_enabled) {
        return {};
    }
    const event = {
        event_id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        ts_iso: new Date().toISOString(),
        phase,
        action: params.action || null,
        workspace: params.workspace || null,
        success: params.success ?? true,
        payload: params.payload || {},
    };
    const line = JSON.stringify(event);
    const jsonl = progressJsonlPath();
    const current = progressCurrentPath();
    if (Date.now() < progressRetryAfter) {
        return event;
    }
    try {
        await fs.mkdir(path.dirname(jsonl), { recursive: true });
        await fs.appendFile(jsonl, `${line}\n`, "utf8");
        await trimJsonl(jsonl);
        const getPayload = () => JSON.stringify(event);
        writeCoalescer.coalesceWriteWithPayload(current, getPayload, async (payload) => {
            await fs.writeFile(current, payload, "utf8");
        }, 500);
    }
    catch (error) {
        // Progress telemetry is advisory. A read-only home directory must not
        // prevent roadmap admission, completion, or finalization.
        progressRetryAfter = Date.now() + PROGRESS_RETRY_COOLDOWN_MS;
        Logger.warn("[RoadmapProgress] Progress journal unavailable; continuing:", error);
    }
    return event;
}
export async function readCurrentProgress() {
    try {
        const text = await fs.readFile(progressCurrentPath(), "utf8");
        return JSON.parse(text);
    }
    catch {
        return null;
    }
}
export async function readProgressTail(limit = 20) {
    try {
        const text = await fs.readFile(progressJsonlPath(), "utf8");
        const lines = text.split(/\r?\n/).filter(Boolean);
        return lines.slice(-limit).map((line) => JSON.parse(line));
    }
    catch {
        return [];
    }
}
export async function recordLastError(error) {
    try {
        await fs.mkdir(sessionDir(), { recursive: true });
        await fs.writeFile(lastErrorPath(), JSON.stringify({ ...error, recorded_at: new Date().toISOString() }, null, 2), "utf8");
    }
    catch {
        // non-fatal
    }
}
export async function readLastError() {
    try {
        const text = await fs.readFile(lastErrorPath(), "utf8");
        return JSON.parse(text);
    }
    catch {
        return scanProgressTailForLastError();
    }
}
const ERROR_RECOVERY = {
    "validate.failed": {
        operator_action: "Repair ROADMAP.md schema — validation runs automatically at attempt_completion",
        retry_command: "roadmap(action='explain_gate')",
        diagnostic_command: "/roadmap explain-gate",
        suggested_slash_command: "/roadmap explain-gate",
    },
    "roadmap.file_mutated": {
        operator_action: AUTO_GOVERNANCE.writeMutationFollowup,
        retry_command: AUTO_GOVERNANCE.continueTaskMidPass,
        diagnostic_command: "/roadmap guide",
        suggested_slash_command: "/roadmap guide",
    },
    "tool.error": {
        operator_action: "roadmap(action='guide') — continue the task unless completion is blocked",
        retry_command: "roadmap(action='guide')",
        diagnostic_command: "/roadmap guide",
        suggested_slash_command: "/roadmap guide",
    },
};
function enrichProgressError(event, code) {
    const recovery = ERROR_RECOVERY[code] || ERROR_RECOVERY["tool.error"];
    const payload = (event.payload || {});
    return {
        phase: event.phase,
        action: event.action,
        workspace: event.workspace,
        payload,
        ts_iso: event.ts_iso,
        string_code: code,
        safe_to_retry: true,
        ...recovery,
        validation: payload.validation,
        error: payload.error,
        message: payload.error || recovery.operator_action,
    };
}
export async function scanProgressTailForLastError() {
    const events = await readProgressTail(100);
    for (let i = events.length - 1; i >= 0; i--) {
        const event = events[i];
        const validation = (event.payload || {}).validation;
        if (validation?.valid === false) {
            return enrichProgressError(event, "validate.failed");
        }
        if (event.phase === "roadmap.file_mutated") {
            return enrichProgressError(event, "roadmap.file_mutated");
        }
        if (event.success === false) {
            const payload = (event.payload || {});
            const code = payload.error ? String(payload.error) : "tool.error";
            return enrichProgressError(event, code in ERROR_RECOVERY ? code : "tool.error");
        }
    }
    return null;
}
export function summarizeRecentEvents(events, last = 5) {
    return events.slice(-last).map((event) => ({
        ts_iso: event.ts_iso,
        phase: event.phase,
        action: event.action,
        success: event.success,
        workspace: event.workspace,
    }));
}
export async function formatProgressReport(params) {
    const last = params.last ?? 5;
    if (params.currentSnapshot && params.snapshot) {
        return JSON.stringify(params.snapshot, null, 2);
    }
    if (params.tail) {
        return JSON.stringify(await readProgressTail(last), null, 2);
    }
    const current = await readCurrentProgress();
    const snap = params.snapshot || {};
    if (!current) {
        const nextRec = (snap.recommended_next_action || {});
        const brief = snap.steering_brief || snap.steering_identity || snap.project_identity_line;
        const lines = ["🗺️ Roadmap progress: idle (no roadmap tool activity this session)"];
        if (brief)
            lines.push(`Project: ${brief}`);
        if (nextRec.command)
            lines.push(`Next: ${nextRec.command}`);
        const digest = (snap.project_steering_digest || {});
        const remaining = digest.bootstrap_remaining;
        if (remaining && Number(remaining) > 0) {
            lines.push(`Bootstrap fill: ${remaining} phrase(s) — ${AUTO_GOVERNANCE.bootstrapAtCompletion}`);
        }
        lines.push("");
        lines.push(`Live: /roadmap guide | watch | progress --current | explain-gate`);
        return lines.join("\n");
    }
    const phase = current.phase || "idle";
    const action = current.action || "—";
    const mark = current.success === false ? "✕" : "✓";
    const lines = [`🗺️ Roadmap progress ${mark}`, `Phase: ${phase} | action: ${action}`];
    if (current.workspace)
        lines.push(`Workspace: ${current.workspace}`);
    const payload = (current.payload || {});
    if (payload.phase)
        lines.push(`Roadmap phase: ${payload.phase}`);
    if (payload.stale != null)
        lines.push(`Checkpoint stale: ${payload.stale}`);
    if (payload.valid === false)
        lines.push("Schema: invalid — /roadmap explain-gate");
    const nextRec = (snap.recommended_next_action || {});
    if (nextRec.command)
        lines.push(`Next: ${nextRec.command}`);
    const digest = (snap.project_steering_digest || {});
    if (digest.identity_line)
        lines.push(`Project: ${digest.identity_line}`);
    const remaining = digest.bootstrap_remaining;
    if (remaining && Number(remaining) > 0) {
        lines.push(`Bootstrap fill: ${remaining} phrase(s) — ${AUTO_GOVERNANCE.bootstrapAtCompletion}`);
    }
    if (snap.kanban_complete_allowed === false) {
        const gate = (snap.roadmap_gate || {});
        const gateLine = formatKanbanGateStatusLine({
            kanbanCompleteAllowed: false,
            validationPending: !!snap.validation_pending,
            schemaValid: snap.schema_valid,
            blockingGates: (gate.blocking_gates || []),
        }) || AUTO_GOVERNANCE.midTaskGovernanceNote;
        lines.push(gateLine);
    }
    if (params.timeline) {
        lines.push("", "Timeline:");
        for (const event of summarizeRecentEvents(await readProgressTail(Math.max(last, 10)), last)) {
            lines.push(`  • ${event.ts_iso} ${event.phase} action=${event.action} success=${event.success}`);
        }
    }
    lines.push("");
    lines.push(`Live: /roadmap guide | watch | progress --current | explain-gate`);
    return lines.join("\n");
}
export async function buildProgressSnapshot(workspace) {
    const { buildSteeringContext } = await import("./RoadmapSteeringContext.js");
    const { isBootstrapIncomplete } = await import("./RoadmapOperator.js");
    const { RoadmapService } = await import("./RoadmapService.js");
    const steering = await buildSteeringContext(workspace);
    const current = await readCurrentProgress();
    const status = await RoadmapService.getInstance().getOperationalStatus(workspace, "", "light");
    const gate = (status.roadmap_gate || {});
    const wsState = (status.workspace_state || {});
    const lastErr = (await readLastError()) || null;
    const bootstrapInc = isBootstrapIncomplete({
        roadmap_exists: !!status.roadmap_exists,
        bootstrap_complete: status.bootstrap_complete,
        bootstrap_placeholder_count: status.bootstrap_placeholder_count,
        workspace_state: wsState,
    });
    const nextRec = status.recommended_next_action ||
        recommendNextAction({
            phase: String(wsState.phase || status.phase || ""),
            roadmap_exists: !!status.roadmap_exists,
            schema_valid: status.schema_valid,
            stale: !!gate.checkpoint_stale,
            validation_pending: !!status.validation_pending,
            bootstrap_incomplete: bootstrapInc,
            last_error: lastErr,
        });
    return mergeGovernanceFields({
        success: true,
        ok: true,
        workspace,
        roadmap_path: steering.roadmap_path || path.join(workspace, "ROADMAP.md"),
        bootstrap_complete: steering.bootstrap_complete ?? status.bootstrap_complete,
        bootstrap_placeholder_count: steering.bootstrap_placeholder_count ?? status.bootstrap_placeholder_count,
        current: current || null,
        current_path: progressCurrentPath(),
        jsonl_path: progressJsonlPath(),
        current_exists: current != null,
        workspace_state: wsState || null,
        roadmap_gate: gate,
        kanban_complete_allowed: status.kanban_complete_allowed,
        validation_pending: status.validation_pending,
        schema_valid: status.schema_valid,
        auto_clearable_governance_only: isAutoClearableGovernanceOnly({
            kanbanCompleteAllowed: status.kanban_complete_allowed,
            validationPending: !!status.validation_pending,
            schemaValid: status.schema_valid,
            blockingGates: (gate.blocking_gates || []),
        }),
        recommended_next_action: nextRec,
        steering_identity: steering.steering_identity,
        steering_brief: steering.steering_brief || status.steering_brief,
        project_archetype: steering.project_archetype || status.project_archetype,
        stack_summary: steering.stack_summary || status.stack_summary,
        project_identity_line: status.project_identity_line,
        project_steering_digest: status.project_steering_digest,
        last_error: lastErr,
        recent_events: summarizeRecentEvents(await readProgressTail(5)),
        phase: status.phase,
    }, {
        auto_clearable_governance_only: !!status.auto_clearable_governance_only,
        validation_pending: !!status.validation_pending,
    });
}
export async function clearLastError() {
    try {
        await fs.unlink(lastErrorPath());
    }
    catch {
        // non-fatal
    }
}
export function formatWatchReport(current, lastError, brief) {
    if (lastError) {
        return `Roadmap last error: ${lastError.message || lastError.error} → ${lastError.retry_command || "roadmap(action='guide')"}`;
    }
    if (brief) {
        return formatWatchSteeringLine(brief);
    }
    if (!current) {
        return "Roadmap: no recent activity — roadmap(action='guide')";
    }
    const action = current.action || "unknown";
    const phase = current.phase || "unknown";
    const ws = current.workspace || "(workspace)";
    const payload = (current.payload || {});
    const identity = payload.project_identity_line ? ` · ${payload.project_identity_line}` : "";
    return `Roadmap watch: ${action} @ ${phase} (${ws})${identity} — ${current.success === false ? "failed" : "ok"}`;
}
//# sourceMappingURL=RoadmapProgress.js.map