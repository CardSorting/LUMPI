import type { IController } from "@core/controller/types";
import { type JoyZoningRefactorRequest, JoyZoningRefactorResponse } from "@shared/proto/dietcode/joyzoning";
/**
 * V400: Standard Single-File Refactor.
 * Executes a specific refactor action on a single file.
 */
export declare function executeRefactor(controller: IController, request: JoyZoningRefactorRequest): Promise<JoyZoningRefactorResponse>;
//# sourceMappingURL=executeRefactor.d.ts.map