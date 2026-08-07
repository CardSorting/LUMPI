import * as fs from "fs/promises";
import * as path from "path";
import { getRoadmapConfig } from "./RoadmapConfig.js";
const snapshotCache = new Map();
function cacheKey(workspace, tier, roadmapMtimeMs) {
    return `${path.resolve(workspace)}::${tier}::${roadmapMtimeMs ?? "none"}`;
}
async function roadmapMtime(roadmapPath) {
    try {
        const stat = await fs.stat(roadmapPath);
        return stat.mtimeMs;
    }
    catch {
        return null;
    }
}
export async function getCachedSnapshotKey(workspace, tier) {
    const roadmapPath = path.join(workspace, "ROADMAP.md");
    const mtime = await roadmapMtime(roadmapPath);
    return cacheKey(workspace, tier, mtime);
}
export function getSnapshotFromCache(key) {
    const entry = snapshotCache.get(key);
    if (!entry)
        return undefined;
    const ttlMs = getRoadmapConfig().evidence_cache_ttl_seconds * 1000;
    if (Date.now() - entry.cachedAt > ttlMs) {
        snapshotCache.delete(key);
        return undefined;
    }
    return entry;
}
export function setSnapshotCache(key, snapshot) {
    snapshotCache.set(key, snapshot);
}
export function invalidateSnapshotCache(workspace) {
    if (!workspace) {
        snapshotCache.clear();
        return;
    }
    const prefix = `${path.resolve(workspace)}::`;
    for (const key of snapshotCache.keys()) {
        if (key.startsWith(prefix)) {
            snapshotCache.delete(key);
        }
    }
}
export async function buildSnapshotKey(workspace, tier) {
    const roadmapPath = path.join(workspace, "ROADMAP.md");
    const mtime = await roadmapMtime(roadmapPath);
    return { key: cacheKey(workspace, tier, mtime), roadmapPath, mtime };
}
//# sourceMappingURL=RoadmapSnapshot.js.map