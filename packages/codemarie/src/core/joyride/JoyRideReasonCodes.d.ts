/**
 * [LAYER: CORE]
 * Stable JoyRide reason-code vocabulary for decisions, logs, and bug reports.
 */
export declare const JOYRIDE_REASON: {
    readonly HIT_COMMAND_SAFE_ALLOWLISTED: "hit.command.safeAllowlisted";
    readonly HIT_SEARCH_WORKSPACE_FINGERPRINT: "hit.search.workspaceFingerprintMatched";
    readonly HIT_VERIFICATION_COMPLETE_PROOF: "hit.verification.completeProofMatched";
    readonly MISS_CONFIG_DISABLED: "miss.config.disabled";
    readonly MISS_CONFIG_DIAGNOSTICS_ONLY: "miss.config.diagnosticsOnly";
    readonly MISS_CONFIG_COMMAND_REUSE_DISABLED: "miss.config.commandReuseDisabled";
    readonly MISS_CONFIG_VERIFICATION_CACHE_DISABLED: "miss.config.verificationCacheDisabled";
    readonly MISS_CONFIG_SEARCH_CACHE_DISABLED: "miss.config.searchCacheDisabled";
    readonly MISS_CACHE_DEGRADED: "miss.cacheDegraded";
    readonly MISS_NO_ENTRY: "miss.noEntry";
    readonly MISS_EXPIRED: "miss.expired";
    readonly MISS_COMMAND_UNKNOWN: "miss.command.unknown";
    readonly MISS_COMMAND_UNSAFE_SYNTAX: "miss.command.unsafeSyntax";
    readonly MISS_COMMAND_NOT_ALLOWLISTED: "miss.command.notAllowlisted";
    readonly MISS_COMMAND_ENV_ALTERING: "miss.command.envAltering";
    readonly MISS_COMMAND_DIAGNOSTIC_ONLY: "miss.command.diagnosticOnly";
    readonly MISS_VERIFICATION_MISSING_FILE_HASHES: "miss.verification.missingFileHashes";
    readonly MISS_VERIFICATION_INCOMPLETE_PROOF: "miss.verification.incompleteProof";
    readonly MISS_SEARCH_NO_ENTRY: "miss.search.noEntry";
    readonly MISS_SEARCH_CWD_CHANGED: "miss.search.cwdChanged";
    readonly MISS_SEARCH_QUERY_CHANGED: "miss.search.queryChanged";
    readonly MISS_SEARCH_GLOB_CHANGED: "miss.search.includeGlobChanged";
    readonly STALE_FILE_HASH_CHANGED: "stale.fileHashChanged";
    readonly STALE_GIT_HEAD_CHANGED: "stale.gitHeadChanged";
    readonly STALE_LOCKFILE_CHANGED: "stale.lockfileChanged";
    readonly STALE_WORKSPACE_GENERATION: "stale.workspaceGenerationChanged";
    readonly STALE_TASK_GENERATION: "stale.taskGenerationChanged";
    readonly STALE_APPROVAL_BOUNDARY: "stale.approvalBoundaryChanged";
    readonly STALE_VALIDATION_FAILED: "stale.validationFailed";
    readonly STALE_MARKED: "stale.marked";
    readonly REJECT_SECRET_DETECTED: "reject.secretDetected";
    readonly REJECT_OVERSIZED: "reject.oversized";
    readonly REJECT_SCRATCH_CACHE_DISABLED: "reject.scratchCacheDisabled";
    readonly REJECT_MISSING_CLEANUP_HANDLER: "reject.missingCleanupHandler";
    readonly REJECT_MISSING_OWNER_TASK: "reject.missingOwnerTask";
    readonly REJECT_MISSING_TTL: "reject.missingTTL";
    readonly REJECT_LATE_WRITE: "reject.lateWrite";
    readonly REJECT_UNSCOPED_ENTRY: "reject.unscopedEntry";
    readonly REJECT_CACHE_INTERNAL_ERROR: "reject.cacheInternalError";
    readonly DEGRADED_INTERNAL_FAILURE: "degraded.internalFailure";
    readonly FALLBACK_NORMAL_EXECUTION: "fallback.normalExecution";
    readonly FALLBACK_CACHE_INTERNAL_ERROR: "fallback.cacheInternalError";
    readonly TRIM_TTL: "trim.ttl";
    readonly TRIM_LRU: "trim.lru";
    readonly TRIM_PRESSURE: "trim.pressure";
    readonly TRIM_EMERGENCY: "trim.emergency";
    readonly CLEANUP_SUCCESS: "cleanup.success";
    readonly CLEANUP_FAILURE: "cleanup.failure";
    readonly LIFECYCLE_TASK_FLUSH: "lifecycle.taskFlush";
    readonly LIFECYCLE_WORKSPACE_FLUSH: "lifecycle.workspaceFlush";
    readonly LIFECYCLE_SHUTDOWN: "lifecycle.shutdown";
};
export type JoyRideReasonCode = (typeof JOYRIDE_REASON)[keyof typeof JOYRIDE_REASON];
//# sourceMappingURL=JoyRideReasonCodes.d.ts.map