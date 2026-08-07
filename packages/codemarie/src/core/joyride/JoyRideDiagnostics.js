/**
 * [LAYER: CORE]
 * Structured JoyRide diagnostic reports for maintainers and deactivate flows.
 */
import { Logger } from "@shared/services/Logger";
import { getJoyRideCacheHitAuditCount, getJoyRideCacheHitAuditTrail } from "./JoyRideAudit";
import { explainJoyRideConfig, getJoyRideConfig, getJoyRideDegradedReason, isJoyRideDegraded, } from "./JoyRideConfig";
import { getJoyRideDecisionLog, getLastJoyRideDecision } from "./JoyRideDecisionLog";
export function buildJoyRideDiagnosticReport(cache) {
    const config = getJoyRideConfig();
    const stats = cache.getStats();
    const recentAuditTrail = getJoyRideCacheHitAuditTrail(16);
    const recentDecisions = getJoyRideDecisionLog(16);
    const decisionLogSize = getJoyRideDecisionLog(128).length;
    return {
        generatedAt: Date.now(),
        config,
        configExplanation: explainJoyRideConfig(),
        degraded: isJoyRideDegraded(),
        degradedReason: getJoyRideDegradedReason(),
        stats,
        decisionLogSize,
        recentAuditTrail,
        recentDecisions,
        lastDecision: getLastJoyRideDecision(),
        summary: {
            isEnabled: config.mode === "enabled",
            isHelping: stats.isHelping,
            activeReuseCount: stats.hitCount,
            auditTrailCount: getJoyRideCacheHitAuditCount(),
            unsafeRejections: stats.rejectedUnsafeEntryCount,
            lateWriteRejections: stats.lateWriteRejectionCount,
            cleanupFailures: stats.cleanupFailureCount,
            staleDiagnostics: stats.staleDiagnosticCount,
            verificationReuseCount: stats.verificationCacheReuseCount,
            pressureTrimEvents: stats.pressureTrimEvents,
            emergencyTrimEvents: stats.emergencyTrimEvents,
            decisionLogSize,
            lastFlushDurationMs: stats.lastFlushDurationMs,
            lastShutdownDurationMs: stats.lastShutdownDurationMs,
        },
    };
}
export function formatJoyRideDiagnosticReport(report) {
    const { stats, summary, recentAuditTrail, recentDecisions, configExplanation, degraded, degradedReason } = report;
    const lines = [
        "=== JoyRide Diagnostic Report ===",
        configExplanation,
        `helping=${summary.isHelping} hits=${stats.hitCount} misses=${stats.missCount} hitRate=${stats.hitRate.toFixed(3)}`,
        `degraded=${degraded}${degradedReason ? ` reason=${degradedReason}` : ""}`,
        `entries=${stats.entryCount} memoryBytes=${stats.memoryUsageEstimate} staleDiagnostics=${summary.staleDiagnostics}`,
        `rejected=${stats.rejectedAdmissionCount} unsafe=${summary.unsafeRejections} lateWrites=${summary.lateWriteRejections} cleanupFailures=${summary.cleanupFailures}`,
        `verificationReuse=${summary.verificationReuseCount} auditTrail=${summary.auditTrailCount}`,
        `lastFlushMs=${summary.lastFlushDurationMs} lastShutdownMs=${summary.lastShutdownDurationMs}`,
    ];
    if (recentDecisions.length > 0) {
        lines.push("recent_decisions:");
        for (const d of recentDecisions.slice(-5)) {
            lines.push(`  - ${d.type} canReuse=${d.canReuse} reason=${d.reasonCode} fallback=${d.fallbackBehavior}`);
        }
    }
    if (recentAuditTrail.length > 0) {
        lines.push("recent_skips:");
        for (const hit of recentAuditTrail.slice(-5)) {
            lines.push(`  - ${hit.hitSource} task=${hit.ownerTaskId} ageMs=${hit.entryAgeMs} reason=${hit.reuseReason} key=${hit.key.slice(0, 48)}`);
        }
    }
    return lines.join("\n");
}
export function dumpJoyRideDiagnostics(cache) {
    const report = buildJoyRideDiagnosticReport(cache);
    Logger.info(formatJoyRideDiagnosticReport(report));
    return report;
}
export function summarizeJoyRideHealth(cache) {
    const report = buildJoyRideDiagnosticReport(cache);
    return [
        `helping=${report.summary.isHelping}`,
        `hits=${report.stats.hitCount}`,
        `entries=${report.stats.entryCount}`,
        `degraded=${report.degraded}`,
        `decisions=${report.recentDecisions.length}`,
    ].join(" ");
}
export function createJoyRideBugReportSnapshot(cache) {
    return JSON.stringify(buildJoyRideDiagnosticReport(cache), null, 2);
}
export function getJoyRideStats(cache) {
    return cache.getStats();
}
export function logJoyRideDiagnostics(cache) {
    Logger.info(formatJoyRideDiagnosticReport(buildJoyRideDiagnosticReport(cache)));
}
//# sourceMappingURL=JoyRideDiagnostics.js.map