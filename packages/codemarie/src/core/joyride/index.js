/**
 * [LAYER: CORE]
 * Modern JoyRide execution cache API — typed decisions only (frozen contract).
 *
 * @license MIT
 * Copyright (c) CardSorting
 * @see JoyRideContract.ts for export/import boundary rules.
 * @see CONTRIBUTING.md for contributor workflow.
 * Legacy APIs were removed. Use typed decision APIs only.
 */
export { getJoyRideCacheHitAuditCount, getJoyRideCacheHitAuditTrail } from "./JoyRideAudit.js";
export { canCommandSkipExecution, classifyCommand, isCommandCacheEligible, isEnvAlteringCommand, isReadOnlyCacheableCommand, isVerificationCommand, } from "./JoyRideCommandClassifier.js";
export { explainJoyRideConfig, getJoyRideConfig, getJoyRideDegradedReason, isCommandReuseEnabled, isDiagnosticsOnly, isJoyRideDegraded, isJoyRideDisabled, isScratchCacheEnabled, isSearchCacheEnabled, isVerificationCacheEnabled, loadJoyRideConfigFromEnv, resetJoyRideConfig, setJoyRideConfig, } from "./JoyRideConfig.js";
export { buildJoyRideWorkspaceSnapshot } from "./JoyRideContext.js";
export { clearJoyRideDecisionLog, explainJoyRideDecision, getJoyRideDecisionLog, getLastJoyRideDecision, } from "./JoyRideDecisionLog.js";
export { isJoyRideHitDecision } from "./JoyRideDecisions.js";
export { buildJoyRideDiagnosticReport, createJoyRideBugReportSnapshot, dumpJoyRideDiagnostics, formatJoyRideDiagnosticReport, getJoyRideStats, logJoyRideDiagnostics, summarizeJoyRideHealth, } from "./JoyRideDiagnostics.js";
export { createJoyRideTaskScope, lookupSafeCommandResult, lookupSearchResult, lookupVerificationProof, storeCommandDiagnostic, storeFailedVerificationDiagnostic, storeReusableCommandResult, storeSearchResult, storeVerificationProof, } from "./JoyRideHotPath.js";
export { bumpTaskGeneration, flushTaskGeneration, flushWorkspace, registerTaskLifecycle, shutdownJoyRide, withTaskCacheScope, } from "./JoyRideLifecycle.js";
export { JOYRIDE_REASON } from "./JoyRideReasonCodes.js";
export { createScratchArtifactEntry, disposeScratchArtifact, flushScratchForTask, rejectUnsafeArtifact, storeScratchArtifactWithCleanup, } from "./JoyRideScratch.js";
export { buildVerificationFingerprint, explainVerificationMiss, lookupVerificationProofWithExplain, validateVerificationProof, } from "./JoyRideVerification.js";
import { JoyRideCache } from "./JoyRideCache.js";
import { shutdownJoyRide } from "./JoyRideLifecycle.js";
const joyRideCache = new JoyRideCache();
/** Singleton JoyRide cache instance — pass to modern lookup/store helpers only. */
export function getJoyRideCache() {
    return joyRideCache;
}
/** Extension deactivate shutdown — delegates to lifecycle helper. */
export function shutdownJoyRideCache() {
    return shutdownJoyRide(joyRideCache, "workspace_closed");
}
export { clearJoyRideDecisionLog as clearJoyRideDiagnostics } from "./JoyRideDecisionLog.js";
//# sourceMappingURL=index.js.map