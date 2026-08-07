/**
 * [LAYER: CORE]
 * Lightweight audit trail for JoyRide cache hits — answers "why did LUMI not rerun this?"
 */
import type { JoyRideCacheKind } from "./types";
export interface JoyRideCacheHitAudit {
    timestamp: number;
    key: string;
    cacheKind: JoyRideCacheKind;
    operationType: string;
    ownerTaskId: string;
    validationFingerprintSummary: string;
    reuseReason: string;
    entryAgeMs: number;
    hitSource: "command" | "verification" | "grep" | "other";
    fallbackOnValidationFailure: "force_miss";
}
export declare function recordJoyRideCacheHit(audit: Omit<JoyRideCacheHitAudit, "timestamp" | "fallbackOnValidationFailure">): void;
export declare function getJoyRideCacheHitAuditTrail(limit?: number): readonly JoyRideCacheHitAudit[];
export declare function clearJoyRideCacheHitAuditTrail(): void;
export declare function getJoyRideCacheHitAuditCount(): number;
//# sourceMappingURL=JoyRideAudit.d.ts.map