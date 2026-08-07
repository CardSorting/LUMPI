import type { RoadmapService } from "./RoadmapService.js";
export declare function formatCockpitReport(payload: Record<string, unknown>, options?: {
    agentId?: string;
    verbose?: boolean;
}): string;
export declare function buildCockpitPayload(roadmapService: RoadmapService, workspace: string, options?: {
    agentId?: string;
    verbose?: boolean;
}): Promise<Record<string, unknown>>;
//# sourceMappingURL=RoadmapCockpit.d.ts.map