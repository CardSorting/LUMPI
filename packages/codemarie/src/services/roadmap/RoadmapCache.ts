/** Unified workspace cache invalidation — snapshot + session brief. */

import { invalidateSessionBriefCache } from "./RoadmapSession.js";
import { invalidateSnapshotCache } from "./RoadmapSnapshot.js";

export function invalidateRoadmapWorkspaceCache(workspace?: string): void {
	invalidateSnapshotCache(workspace);
	invalidateSessionBriefCache(workspace);
}
