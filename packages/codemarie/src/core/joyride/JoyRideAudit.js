/**
 * [LAYER: CORE]
 * Lightweight audit trail for JoyRide cache hits — answers "why did LUMI not rerun this?"
 */
import { Logger } from "@shared/services/Logger";
const MAX_AUDIT_ENTRIES = 128;
const auditTrail = [];
export function recordJoyRideCacheHit(audit) {
    const entry = {
        ...audit,
        timestamp: Date.now(),
        fallbackOnValidationFailure: "force_miss",
    };
    auditTrail.push(entry);
    if (auditTrail.length > MAX_AUDIT_ENTRIES) {
        auditTrail.splice(0, auditTrail.length - MAX_AUDIT_ENTRIES);
    }
    Logger.info(`[JoyRide] cache_hit key=${audit.key.slice(0, 48)} kind=${audit.cacheKind} op=${audit.operationType} task=${audit.ownerTaskId} ageMs=${audit.entryAgeMs} reason=${audit.reuseReason}`);
}
export function getJoyRideCacheHitAuditTrail(limit = 32) {
    return auditTrail.slice(-limit);
}
export function clearJoyRideCacheHitAuditTrail() {
    auditTrail.length = 0;
}
export function getJoyRideCacheHitAuditCount() {
    return auditTrail.length;
}
//# sourceMappingURL=JoyRideAudit.js.map