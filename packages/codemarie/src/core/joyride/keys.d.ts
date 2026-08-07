/**
 * [LAYER: CORE]
 * Stable JoyRide cache key and fingerprint helpers.
 */
export interface JoyRideKeyMaterial {
    key: string;
    fingerprint: string;
    namespace: string;
    parts: Record<string, unknown>;
}
export declare function stableStringify(value: unknown): string;
export declare function createJoyRideFingerprint(value: unknown): string;
export declare function createJoyRideKey(namespace: string, parts: Record<string, unknown>): JoyRideKeyMaterial;
export declare function createCommandResultCacheKey(input: {
    command: string;
    cwd: string;
    environmentFingerprint: string;
    relevantFileHashes?: Record<string, string>;
    dependencyFingerprint?: string;
    gitHead?: string;
    runtimeVersion?: string;
    toolVersion?: string;
}): JoyRideKeyMaterial;
export declare function createGrepResultCacheKey(input: {
    query: string;
    cwd: string;
    includeGlobs?: string[];
    excludeGlobs?: string[];
    workspaceFingerprint: string;
    changedFileGeneration: number;
    caseSensitive?: boolean;
    searchImplementationVersion?: string;
}): JoyRideKeyMaterial;
export declare function createFileMetadataCacheKey(input: {
    absolutePath: string;
    fileHash: string;
    mtimeGeneration: number;
    workspaceFingerprint: string;
}): JoyRideKeyMaterial;
export declare function createVerificationCacheKey(input: {
    command: string;
    cwd: string;
    dependencyFingerprint: string;
    lockfileFingerprint: string;
    relevantFileHashes: Record<string, string>;
    environmentFingerprint: string;
    approvalBoundaryId: string;
    gitHead: string;
    runtimeVersion?: string;
    toolVersion?: string;
}): JoyRideKeyMaterial;
export declare function createDiffCacheKey(input: {
    baseHash: string;
    targetHash: string;
    filePath: string;
    taskId: string;
}): JoyRideKeyMaterial;
export declare function createScratchArtifactCacheKey(input: {
    taskId: string;
    artifactKind: string;
    contentHash: string;
    generation: number;
    cleanupPolicy: string;
}): JoyRideKeyMaterial;
//# sourceMappingURL=keys.d.ts.map