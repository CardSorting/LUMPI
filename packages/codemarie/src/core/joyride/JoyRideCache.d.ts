/**
 * [LAYER: CORE]
 * Bounded, invalidation-aware in-process execution cache for active agent hot paths.
 */
import { type JoyRideBudgetConfig, type JoyRideCacheEntry, type JoyRideCacheStats, type JoyRideExplainResult, type JoyRideInvalidateTarget, type JoyRideInvalidationReason, type JoyRideSetMetadata, type JoyRideSetResult, type JoyRideTrimResult, type JoyRideValidationFingerprint } from "./types";
export declare class JoyRideCache {
    private readonly budget;
    private readonly entries;
    private totalBytes;
    private readonly bytesByKind;
    private readonly bytesByTask;
    private artifactCount;
    private hitCount;
    private missCount;
    private evictionCount;
    private staleInvalidationCount;
    private verificationCacheReuseCount;
    private pressureTrimEvents;
    private emergencyTrimEvents;
    private rejectedAdmissionCount;
    private rejectedUnsafeEntryCount;
    private rejectedOversizedEntryCount;
    private staleReusePreventionCount;
    private taskCleanupCount;
    private scratchCleanupCount;
    private spillCount;
    private cacheValidationFailureCount;
    private duplicateArtifactDeduplicationCount;
    private ttlEvictionCount;
    private lruEvictionCount;
    private lateWriteRejectionCount;
    private cleanupFailureCount;
    private lastFlushDurationMs;
    private lastShutdownDurationMs;
    /** Active task generation per taskId; late writes from obsolete generations are rejected. */
    private readonly taskGenerations;
    /** Tracks cleanup invocation to prevent duplicate cleanup. */
    private readonly cleanupInvokedKeys;
    /** Cleanup status per entry key. */
    private readonly cleanupStatusByKey;
    constructor(config?: Partial<JoyRideBudgetConfig>);
    get<T = unknown>(key: string, validation?: JoyRideValidationFingerprint): T | undefined;
    has(key: string, validation?: JoyRideValidationFingerprint): boolean;
    set(key: string, value: unknown, metadata: JoyRideSetMetadata): JoyRideSetResult;
    trySet(key: string, value: unknown, metadata: JoyRideSetMetadata): JoyRideSetResult;
    invalidate(target: JoyRideInvalidateTarget): number;
    flush(target?: JoyRideInvalidateTarget): number;
    flushTask(taskId: string, reason?: JoyRideInvalidationReason): number;
    registerTask(taskId: string, generation?: number): void;
    bumpTaskGeneration(taskId: string): number;
    isTaskGenerationValid(taskId: string, generation: number): boolean;
    invalidateWorkspace(workspaceFingerprint: string, reason?: JoyRideInvalidationReason): number;
    flushWorkspace(workspaceId: string, reason?: JoyRideInvalidationReason): number;
    estimateSize(): number;
    trimToBudget(): JoyRideTrimResult;
    emergencyTrim(reason?: JoyRideInvalidationReason): JoyRideTrimResult;
    getStats(): JoyRideCacheStats;
    markStale(key: string, reason: JoyRideInvalidationReason | string): boolean;
    validate(entryOrKey: JoyRideCacheEntry<unknown> | string, fingerprint: JoyRideValidationFingerprint): boolean;
    touch(key: string): boolean;
    dispose(entryOrKey: JoyRideCacheEntry<unknown> | string): boolean;
    explain(key: string): JoyRideExplainResult;
    runPeriodicMaintenance(): JoyRideTrimResult;
    shutdown(reason?: JoyRideInvalidationReason): number;
    private admit;
    private reject;
    private isExpired;
    private touchEntry;
    private validateEntry;
    private sameRecord;
    private containsUnsafeMaterial;
    private estimateValueBytes;
    private matchesTarget;
    private isWithinBudget;
    private selectEvictionCandidate;
    private compareEvictionCandidates;
    private kindEvictionRank;
    private accountAdd;
    private accountRemove;
    private deleteEntry;
    private invokeCleanup;
    private countStaleDiagnostics;
    private pruneStaleDiagnostics;
    private isVerificationValidationComplete;
    private isDiagnosticOnlyEntry;
    private explainReuseBlock;
    private appendReason;
    private isKnownReason;
    private createZeroKindRecord;
}
//# sourceMappingURL=JoyRideCache.d.ts.map