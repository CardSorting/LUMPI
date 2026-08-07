import type { RoadmapService } from "./RoadmapService.js";
export declare function runDoctorChecks(roadmapService: RoadmapService, workspace: string): Promise<Record<string, unknown>>;
export declare function formatDoctorReport(checks: Array<{
    name: string;
    ok: boolean;
    detail: string;
}>, recommendations: string[], nextRec: {
    command: string;
    detail: string;
}, status: Record<string, unknown>): string;
//# sourceMappingURL=RoadmapDoctor.d.ts.map