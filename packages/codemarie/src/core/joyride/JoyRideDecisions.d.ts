/**
 * [LAYER: CORE]
 * Typed JoyRide cache decisions — discriminated unions, no silent ambiguity.
 */
import type { DietCodeToolResponseContent } from "@shared/messages/content";
import type { JoyRideReasonCode } from "./JoyRideReasonCodes";
import type { JoyRideCacheKind } from "./types";
export type JoyRideDecisionType = "hit" | "miss" | "stale" | "rejected" | "disabled" | "diagnosticOnly" | "degraded";
export type JoyRideFallbackBehavior = "reuseCachedValue" | "executeNormally" | "executeAndStoreDiagnosticOnly" | "executeAndStoreReusableIfSafe" | "rejectArtifact" | "markStaleAndExecute" | "flushAndExecute" | "doNotStore" | "disableActiveReuse" | "shutdownCleanup";
/** @deprecated Use JoyRideDecisionType */
export type JoyRideDecisionKind = JoyRideDecisionType;
export interface JoyRideDecisionContext {
    reasonCode: JoyRideReasonCode;
    reasonMessage: string;
    operationType?: string;
    cacheKind?: JoyRideCacheKind;
    keySummary?: string;
    scope?: string;
    ownerTaskId?: string;
    workspaceGeneration?: number;
    approvalBoundaryId?: string;
    diagnosticOnly: boolean;
    proofSummary?: string;
    reuseBlockReason?: string;
    fallbackBehavior: JoyRideFallbackBehavior;
    auditEventId: string;
    entryAgeMs?: number;
    ttlRemainingMs?: number;
    degraded: boolean;
    configExplanation?: string;
}
export interface JoyRideHitDecision<T> extends JoyRideDecisionContext {
    type: "hit";
    canReuse: true;
    value: T;
}
export interface JoyRideMissDecision extends JoyRideDecisionContext {
    type: "miss";
    canReuse: false;
}
export interface JoyRideStaleDecision<T> extends JoyRideDecisionContext {
    type: "stale";
    canReuse: false;
    value?: T;
}
export interface JoyRideRejectedDecision extends JoyRideDecisionContext {
    type: "rejected";
    canReuse: false;
}
export interface JoyRideDisabledDecision extends JoyRideDecisionContext {
    type: "disabled";
    canReuse: false;
}
export interface JoyRideDiagnosticOnlyDecision extends JoyRideDecisionContext {
    type: "diagnosticOnly";
    canReuse: false;
    diagnosticOnly: true;
}
export interface JoyRideDegradedDecision extends JoyRideDecisionContext {
    type: "degraded";
    canReuse: false;
    degraded: true;
}
export type JoyRideCacheDecision<T = unknown> = JoyRideHitDecision<T> | JoyRideMissDecision | JoyRideStaleDecision<T> | JoyRideRejectedDecision | JoyRideDisabledDecision | JoyRideDiagnosticOnlyDecision | JoyRideDegradedDecision;
export type JoyRideCommandLookupDecision = JoyRideCacheDecision<[boolean, DietCodeToolResponseContent]>;
export type JoyRideSearchLookupDecision = JoyRideCacheDecision<string>;
export declare function nextJoyRideAuditEventId(): string;
export declare function isJoyRideHitDecision<T>(decision: JoyRideCacheDecision<T>): decision is JoyRideHitDecision<T>;
type DecisionExtra<T> = Partial<Omit<JoyRideDecisionContext, "reasonCode" | "reasonMessage" | "diagnosticOnly" | "fallbackBehavior">> & {
    value?: T;
};
export declare function hitDecision<T>(reasonCode: JoyRideReasonCode, reasonMessage: string, value: T, extra?: DecisionExtra<T>): JoyRideHitDecision<T>;
export declare function missDecision<T>(reasonCode: JoyRideReasonCode, reasonMessage: string, extra?: DecisionExtra<T>): JoyRideMissDecision;
export declare function staleDecision<T>(reasonCode: JoyRideReasonCode, reasonMessage: string, extra?: DecisionExtra<T>): JoyRideStaleDecision<T>;
export declare function rejectedDecision(reasonCode: JoyRideReasonCode, reasonMessage: string, extra?: DecisionExtra<unknown>): JoyRideRejectedDecision;
export declare function disabledDecision(reasonCode: JoyRideReasonCode, reasonMessage: string, extra?: DecisionExtra<unknown>): JoyRideDisabledDecision;
export declare function diagnosticOnlyDecision(reasonCode: JoyRideReasonCode, reasonMessage: string, extra?: DecisionExtra<unknown>): JoyRideDiagnosticOnlyDecision;
export declare function degradedDecision(reasonCode: JoyRideReasonCode, reasonMessage: string, extra?: DecisionExtra<unknown>): JoyRideDegradedDecision;
export declare function explainDecision(decision: JoyRideCacheDecision): string;
export {};
//# sourceMappingURL=JoyRideDecisions.d.ts.map