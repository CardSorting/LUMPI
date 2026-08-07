export declare function invalidateSessionBriefCache(workspace?: string): void;
export declare function sessionBrief(workspace: string, forceRefresh?: boolean): Promise<Record<string, unknown> | null>;
export declare function formatRoadmapEnvironmentSection(brief: Record<string, unknown>): string;
export declare function getRoadmapEnvironmentSection(workspace: string): Promise<string>;
//# sourceMappingURL=RoadmapSession.d.ts.map