/**
 * [LAYER: CORE]
 * Verification proof helpers — strict reuse semantics.
 */
import { buildJoyRideWorkspaceSnapshot } from "./JoyRideContext.js";
import { missDecision } from "./JoyRideDecisions.js";
import { lookupVerificationProof } from "./JoyRideHotPath.js";
import { JOYRIDE_REASON } from "./JoyRideReasonCodes.js";
import { createVerificationCacheKey } from "./keys.js";
export function buildVerificationFingerprint(input) {
    return createVerificationCacheKey({
        command: input.command,
        cwd: input.cwd,
        relevantFileHashes: input.relevantFileHashes,
        approvalBoundaryId: input.approvalBoundaryId,
        gitHead: input.gitHead ?? "",
        dependencyFingerprint: input.dependencyFingerprint ?? "",
        lockfileFingerprint: input.lockfileFingerprint ?? "",
        environmentFingerprint: input.environmentFingerprint ?? "",
        runtimeVersion: input.runtimeVersion ?? process.version,
        toolVersion: input.toolVersion ?? "lumi-verification-v1",
    });
}
export function validateVerificationProof(proof) {
    const missing = [];
    if (!proof.relevantFileHashes || Object.keys(proof.relevantFileHashes).length === 0) {
        missing.push("relevantFileHashes");
    }
    if (!proof.workspaceFingerprint)
        missing.push("workspaceFingerprint");
    if (!proof.approvalBoundaryId)
        missing.push("approvalBoundaryId");
    if (!proof.gitHead)
        missing.push("gitHead");
    if (!proof.dependencyFingerprint)
        missing.push("dependencyFingerprint");
    if (!proof.lockfileFingerprint)
        missing.push("lockfileFingerprint");
    if (!proof.environmentFingerprint)
        missing.push("environmentFingerprint");
    if (!proof.runtimeVersion)
        missing.push("runtimeVersion");
    if (!proof.toolVersion)
        missing.push("toolVersion");
    return { valid: missing.length === 0, missing };
}
export function explainVerificationMiss(proof) {
    const { missing } = validateVerificationProof(proof);
    if (missing.includes("relevantFileHashes")) {
        return missDecision(JOYRIDE_REASON.MISS_VERIFICATION_MISSING_FILE_HASHES, "Missing relevant file hashes");
    }
    return missDecision(JOYRIDE_REASON.MISS_VERIFICATION_INCOMPLETE_PROOF, `Incomplete proof: ${missing.join(", ")}`);
}
export async function lookupVerificationProofWithExplain(cache, command, scope, relevantFileHashes) {
    const snapshot = await buildJoyRideWorkspaceSnapshot(scope.cwd, scope.terminalMode);
    const proof = {
        relevantFileHashes,
        workspaceFingerprint: snapshot.workspaceFingerprint,
        approvalBoundaryId: scope.approvalBoundaryId,
        generation: scope.generation,
        gitHead: snapshot.gitHead,
        dependencyFingerprint: snapshot.dependencyFingerprint,
        lockfileFingerprint: snapshot.lockfileFingerprint,
        environmentFingerprint: snapshot.environmentFingerprint,
        runtimeVersion: process.version,
        toolVersion: "lumi-verification-v1",
    };
    const validation = validateVerificationProof(proof);
    if (!validation.valid) {
        return explainVerificationMiss(proof);
    }
    return lookupVerificationProof(cache, command, scope, snapshot, relevantFileHashes);
}
//# sourceMappingURL=JoyRideVerification.js.map