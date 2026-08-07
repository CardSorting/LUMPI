/**
 * [LAYER: CORE]
 * Scratch artifact admission helpers — safe path only.
 */
import type { JoyRideCache } from "./JoyRideCache.js";
import { type JoyRideTaskScope } from "./JoyRideContext.js";
import { type JoyRideCacheDecision } from "./JoyRideDecisions.js";
import type { JoyRideCleanupHandler, JoyRideDurability } from "./types.js";
export interface ScratchArtifactSpec {
    artifactKind: string;
    ownerTaskId: string;
    ttlMs: number;
    estimatedBytes: number;
    cleanupHandler: JoyRideCleanupHandler;
    durability?: JoyRideDurability;
    diagnosticOnly?: boolean;
}
export interface ScratchArtifactEntry {
    kind: string;
    value: unknown;
    ownerTaskId: string;
    createdAt: number;
}
export declare function createScratchArtifactEntry(spec: ScratchArtifactSpec, value: unknown): ScratchArtifactEntry;
export declare function explainScratchRejection(reasonCode: string, reasonMessage: string): JoyRideCacheDecision;
export declare function rejectUnsafeArtifact(reasonCode: string, reasonMessage: string): JoyRideCacheDecision;
export declare function storeScratchArtifactWithCleanup(cache: JoyRideCache, spec: ScratchArtifactSpec, value: unknown, scope: JoyRideTaskScope): Promise<JoyRideCacheDecision>;
export declare function flushScratchForTask(cache: JoyRideCache, taskId: string): number;
export declare function disposeScratchArtifact(cache: JoyRideCache, key: string): boolean;
//# sourceMappingURL=JoyRideScratch.d.ts.map