/** Unified workspace cache invalidation — snapshot + session brief. */
import { invalidateSessionBriefCache } from "./RoadmapSession.js";
import { invalidateSnapshotCache } from "./RoadmapSnapshot.js";
export function invalidateRoadmapWorkspaceCache(workspace) {
    invalidateSnapshotCache(workspace);
    invalidateSessionBriefCache(workspace);
}
//# sourceMappingURL=RoadmapCache.js.map