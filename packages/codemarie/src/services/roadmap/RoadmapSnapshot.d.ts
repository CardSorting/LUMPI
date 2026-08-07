import type { RoadmapValidation } from "./RoadmapSchema.js";
export type EvidenceTier = "light" | "standard" | "full";
export interface WorkspaceSnapshot {
    workspace: string;
    roadmapPath: string;
    roadmapMtimeMs: number | null;
    tier: EvidenceTier;
    evidence: Record<string, unknown>;
    validation: RoadmapValidation | null;
    gateState: Record<string, unknown>;
    cachedAt: number;
}
export declare function getCachedSnapshotKey(workspace: string, tier: EvidenceTier): Promise<string>;
export declare function getSnapshotFromCache(key: string): WorkspaceSnapshot | undefined;
export declare function setSnapshotCache(key: string, snapshot: WorkspaceSnapshot): void;
export declare function invalidateSnapshotCache(workspace?: string): void;
export declare function buildSnapshotKey(workspace: string, tier: EvidenceTier): Promise<{
    key: string;
    roadmapPath: string;
    mtime: number | null;
}>;
//# sourceMappingURL=RoadmapSnapshot.d.ts.map