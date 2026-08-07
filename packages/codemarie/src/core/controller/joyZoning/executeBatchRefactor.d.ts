import type { IController } from "@core/controller/types";
import { type JoyZoningBatchRefactorRequest, JoyZoningBatchRefactorResponse } from "@shared/proto/dietcode/joyzoning";
/**
 * V500: Industrial Batch Orchestration.
 * Orchestrates multi-file refactors using dependency-aware sorting and context grouping.
 */
export declare function executeBatchRefactor(controller: IController, request: JoyZoningBatchRefactorRequest): Promise<JoyZoningBatchRefactorResponse>;
//# sourceMappingURL=executeBatchRefactor.d.ts.map