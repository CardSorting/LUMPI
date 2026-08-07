/**
 * [LAYER: CORE]
 * JoyRide lifecycle helpers — centralized task/workspace flush and shutdown.
 */
import type { JoyRideCache } from "./JoyRideCache.js";
import type { JoyRideInvalidationReason } from "./types.js";
export declare function registerTaskLifecycle(cache: JoyRideCache, taskId: string, generation?: number): void;
export declare function withTaskCacheScope<T>(cache: JoyRideCache, taskId: string, generation: number, fn: () => Promise<T>): Promise<T>;
export declare function bumpTaskGeneration(cache: JoyRideCache, taskId: string, _reason?: "stale.taskGenerationChanged"): number;
export declare function flushTaskGeneration(cache: JoyRideCache, taskId: string, reason?: JoyRideInvalidationReason): number;
export declare function flushWorkspace(cache: JoyRideCache, workspaceFingerprint: string, reason?: JoyRideInvalidationReason): number;
export declare function shutdownJoyRide(cache: JoyRideCache, reason?: JoyRideInvalidationReason): number;
//# sourceMappingURL=JoyRideLifecycle.d.ts.map