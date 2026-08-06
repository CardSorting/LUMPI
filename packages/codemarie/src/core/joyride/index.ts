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

export type { JoyRideCacheHitAudit } from "./JoyRideAudit.js";
export { getJoyRideCacheHitAuditCount, getJoyRideCacheHitAuditTrail } from "./JoyRideAudit.js";
export type { JoyRideCommandClassification, JoyRideCommandTier } from "./JoyRideCommandClassifier.js";
export {
	canCommandSkipExecution,
	classifyCommand,
	isCommandCacheEligible,
	isEnvAlteringCommand,
	isReadOnlyCacheableCommand,
	isVerificationCommand,
} from "./JoyRideCommandClassifier.js";
export type { JoyRideOperationalConfig, JoyRideOperationalMode } from "./JoyRideConfig.js";
export {
	explainJoyRideConfig,
	getJoyRideConfig,
	getJoyRideDegradedReason,
	isCommandReuseEnabled,
	isDiagnosticsOnly,
	isJoyRideDegraded,
	isJoyRideDisabled,
	isScratchCacheEnabled,
	isSearchCacheEnabled,
	isVerificationCacheEnabled,
	loadJoyRideConfigFromEnv,
	resetJoyRideConfig,
	setJoyRideConfig,
} from "./JoyRideConfig.js";
export type { JoyRideTaskScope, JoyRideWorkspaceSnapshot } from "./JoyRideContext.js";
export { buildJoyRideWorkspaceSnapshot } from "./JoyRideContext.js";

export {
	clearJoyRideDecisionLog,
	explainJoyRideDecision,
	getJoyRideDecisionLog,
	getLastJoyRideDecision,
} from "./JoyRideDecisionLog.js";
export type {
	JoyRideCacheDecision,
	JoyRideCommandLookupDecision,
	JoyRideDecisionContext,
	JoyRideDecisionType,
	JoyRideDegradedDecision,
	JoyRideDiagnosticOnlyDecision,
	JoyRideDisabledDecision,
	JoyRideFallbackBehavior,
	JoyRideHitDecision,
	JoyRideMissDecision,
	JoyRideRejectedDecision,
	JoyRideSearchLookupDecision,
	JoyRideStaleDecision,
} from "./JoyRideDecisions.js";
export { isJoyRideHitDecision } from "./JoyRideDecisions.js";
export type { JoyRideDiagnosticReport } from "./JoyRideDiagnostics.js";
export {
	buildJoyRideDiagnosticReport,
	createJoyRideBugReportSnapshot,
	dumpJoyRideDiagnostics,
	formatJoyRideDiagnosticReport,
	getJoyRideStats,
	logJoyRideDiagnostics,
	summarizeJoyRideHealth,
} from "./JoyRideDiagnostics.js";
export {
	createJoyRideTaskScope,
	lookupSafeCommandResult,
	lookupSearchResult,
	lookupVerificationProof,
	storeCommandDiagnostic,
	storeFailedVerificationDiagnostic,
	storeReusableCommandResult,
	storeSearchResult,
	storeVerificationProof,
} from "./JoyRideHotPath.js";
export type {
	JoyRideCommandCacheEntry,
	JoyRideGrepCacheEntry,
	JoyRideSearchLookupOptions,
} from "./JoyRideHotPathTypes.js";
export {
	bumpTaskGeneration,
	flushTaskGeneration,
	flushWorkspace,
	registerTaskLifecycle,
	shutdownJoyRide,
	withTaskCacheScope,
} from "./JoyRideLifecycle.js";
export type { JoyRideReasonCode } from "./JoyRideReasonCodes.js";
export { JOYRIDE_REASON } from "./JoyRideReasonCodes.js";
export type { ScratchArtifactEntry, ScratchArtifactSpec } from "./JoyRideScratch.js";
export {
	createScratchArtifactEntry,
	disposeScratchArtifact,
	flushScratchForTask,
	rejectUnsafeArtifact,
	storeScratchArtifactWithCleanup,
} from "./JoyRideScratch.js";
export type { VerificationProofInput } from "./JoyRideVerification.js";
export {
	buildVerificationFingerprint,
	explainVerificationMiss,
	lookupVerificationProofWithExplain,
	validateVerificationProof,
} from "./JoyRideVerification.js";

import { JoyRideCache } from "./JoyRideCache.js";
import { shutdownJoyRide } from "./JoyRideLifecycle.js";

const joyRideCache = new JoyRideCache();

/** Singleton JoyRide cache instance — pass to modern lookup/store helpers only. */
export function getJoyRideCache(): JoyRideCache {
	return joyRideCache;
}

/** Extension deactivate shutdown — delegates to lifecycle helper. */
export function shutdownJoyRideCache(): number {
	return shutdownJoyRide(joyRideCache, "workspace_closed");
}

export { clearJoyRideDecisionLog as clearJoyRideDiagnostics } from "./JoyRideDecisionLog.js";

