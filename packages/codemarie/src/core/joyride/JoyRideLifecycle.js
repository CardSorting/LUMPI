/**
 * [LAYER: CORE]
 * JoyRide lifecycle helpers — centralized task/workspace flush and shutdown.
 */
import { JOYRIDE_REASON } from "./JoyRideReasonCodes.js";
export function registerTaskLifecycle(cache, taskId, generation = 0) {
    cache.registerTask(taskId, generation);
}
export async function withTaskCacheScope(cache, taskId, generation, fn) {
    registerTaskLifecycle(cache, taskId, generation);
    try {
        return await fn();
    }
    finally {
        // Caller decides when to flush; scope only registers generation.
    }
}
export function bumpTaskGeneration(cache, taskId, _reason = JOYRIDE_REASON.STALE_TASK_GENERATION) {
    return cache.bumpTaskGeneration(taskId);
}
export function flushTaskGeneration(cache, taskId, reason = "task_completed") {
    return cache.flushTask(taskId, reason);
}
export function flushWorkspace(cache, workspaceFingerprint, reason = "workspace_drift") {
    return cache.invalidateWorkspace(workspaceFingerprint, reason);
}
export function shutdownJoyRide(cache, reason = "workspace_closed") {
    return cache.shutdown(reason);
}
//# sourceMappingURL=JoyRideLifecycle.js.map