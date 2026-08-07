import type { TaskConfig } from "@core/task/tools/types/TaskConfig";
import { type WorkspaceFact, type WorkspaceIntelligenceFinalizationInput, type WorkspaceIntelligenceRunResult } from "./types";
export declare class WorkspaceIntelligenceEngine {
    private readonly config;
    private readonly store;
    constructor(config: TaskConfig);
    learnFromFinalization(input: WorkspaceIntelligenceFinalizationInput): Promise<WorkspaceIntelligenceRunResult>;
    private publishToCognitiveMemory;
}
export declare function mergeAndLifecycleManageFacts(currentFacts: WorkspaceFact[], previousFacts: WorkspaceFact[], input: WorkspaceIntelligenceFinalizationInput): WorkspaceFact[];
//# sourceMappingURL=WorkspaceIntelligenceEngine.d.ts.map