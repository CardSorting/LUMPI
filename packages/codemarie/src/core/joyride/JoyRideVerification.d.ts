/**
 * [LAYER: CORE]
 * Verification proof helpers — strict reuse semantics.
 */
import type { JoyRideCache } from "./JoyRideCache.js";
import { type JoyRideTaskScope } from "./JoyRideContext.js";
import { type JoyRideCacheDecision } from "./JoyRideDecisions.js";
import type { JoyRideValidationFingerprint } from "./types.js";
export interface VerificationProofInput {
    command: string;
    cwd: string;
    relevantFileHashes: Record<string, string>;
    approvalBoundaryId: string;
    gitHead?: string;
    dependencyFingerprint?: string;
    lockfileFingerprint?: string;
    environmentFingerprint?: string;
    runtimeVersion?: string;
    toolVersion?: string;
}
export declare function buildVerificationFingerprint(input: VerificationProofInput): {
    key: string;
    fingerprint: string;
};
export declare function validateVerificationProof(proof: JoyRideValidationFingerprint): {
    valid: boolean;
    missing: string[];
};
export declare function explainVerificationMiss(proof: JoyRideValidationFingerprint): JoyRideCacheDecision;
export declare function lookupVerificationProofWithExplain(cache: JoyRideCache, command: string, scope: JoyRideTaskScope, relevantFileHashes: Record<string, string>): Promise<import("./JoyRideDecisions.js").JoyRideDegradedDecision | import("./JoyRideDecisions.js").JoyRideDiagnosticOnlyDecision | import("./JoyRideDecisions.js").JoyRideDisabledDecision | import("./JoyRideDecisions.js").JoyRideHitDecision<unknown> | import("./JoyRideDecisions.js").JoyRideMissDecision | import("./JoyRideDecisions.js").JoyRideRejectedDecision | import("./JoyRideDecisions.js").JoyRideStaleDecision<unknown>>;
//# sourceMappingURL=JoyRideVerification.d.ts.map