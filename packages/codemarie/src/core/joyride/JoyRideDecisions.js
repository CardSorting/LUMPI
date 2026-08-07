/**
 * [LAYER: CORE]
 * Typed JoyRide cache decisions — discriminated unions, no silent ambiguity.
 */
let decisionCounter = 0;
export function nextJoyRideAuditEventId() {
    decisionCounter += 1;
    return `joyride-decision-${Date.now()}-${decisionCounter}`;
}
export function isJoyRideHitDecision(decision) {
    return decision.type === "hit" && decision.canReuse;
}
function baseContext(reasonCode, reasonMessage, fallbackBehavior, diagnosticOnly, degraded, extra) {
    return {
        reasonCode,
        reasonMessage,
        diagnosticOnly,
        fallbackBehavior,
        degraded,
        auditEventId: extra?.auditEventId ?? nextJoyRideAuditEventId(),
        operationType: extra?.operationType,
        cacheKind: extra?.cacheKind,
        keySummary: extra?.keySummary,
        scope: extra?.scope,
        ownerTaskId: extra?.ownerTaskId,
        workspaceGeneration: extra?.workspaceGeneration,
        approvalBoundaryId: extra?.approvalBoundaryId,
        proofSummary: extra?.proofSummary,
        reuseBlockReason: extra?.reuseBlockReason,
        entryAgeMs: extra?.entryAgeMs,
        ttlRemainingMs: extra?.ttlRemainingMs,
        configExplanation: extra?.configExplanation,
    };
}
export function hitDecision(reasonCode, reasonMessage, value, extra) {
    return {
        type: "hit",
        canReuse: true,
        value,
        ...baseContext(reasonCode, reasonMessage, "reuseCachedValue", false, extra?.degraded ?? false, extra),
    };
}
export function missDecision(reasonCode, reasonMessage, extra) {
    return {
        type: "miss",
        canReuse: false,
        ...baseContext(reasonCode, reasonMessage, "executeNormally", false, extra?.degraded ?? false, extra),
    };
}
export function staleDecision(reasonCode, reasonMessage, extra) {
    return {
        type: "stale",
        canReuse: false,
        value: extra?.value,
        ...baseContext(reasonCode, reasonMessage, "markStaleAndExecute", false, extra?.degraded ?? false, extra),
    };
}
export function rejectedDecision(reasonCode, reasonMessage, extra) {
    return {
        type: "rejected",
        canReuse: false,
        ...baseContext(reasonCode, reasonMessage, "rejectArtifact", false, extra?.degraded ?? false, extra),
    };
}
export function disabledDecision(reasonCode, reasonMessage, extra) {
    return {
        type: "disabled",
        canReuse: false,
        ...baseContext(reasonCode, reasonMessage, "doNotStore", false, extra?.degraded ?? false, extra),
    };
}
export function diagnosticOnlyDecision(reasonCode, reasonMessage, extra) {
    return {
        ...baseContext(reasonCode, reasonMessage, "executeAndStoreDiagnosticOnly", true, extra?.degraded ?? false, extra),
        type: "diagnosticOnly",
        canReuse: false,
        diagnosticOnly: true,
    };
}
export function degradedDecision(reasonCode, reasonMessage, extra) {
    return {
        ...baseContext(reasonCode, reasonMessage, "executeNormally", false, true, extra),
        type: "degraded",
        canReuse: false,
        degraded: true,
    };
}
export function explainDecision(decision) {
    const parts = [
        `type=${decision.type}`,
        `canReuse=${decision.canReuse}`,
        `reason=${decision.reasonCode}`,
        `fallback=${decision.fallbackBehavior}`,
        decision.keySummary ? `key=${decision.keySummary}` : undefined,
        decision.proofSummary ? `proof=${decision.proofSummary}` : undefined,
        decision.reuseBlockReason ? `block=${decision.reuseBlockReason}` : undefined,
        decision.degraded ? "degraded=true" : undefined,
        decision.entryAgeMs !== undefined ? `ageMs=${decision.entryAgeMs}` : undefined,
    ].filter(Boolean);
    return parts.join(" ");
}
//# sourceMappingURL=JoyRideDecisions.js.map