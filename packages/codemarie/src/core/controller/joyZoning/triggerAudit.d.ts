import type { IController } from "@core/controller/types";
import { type JoyZoningAuditRequest, JoyZoningAuditResponse } from "@shared/proto/dietcode/joyzoning";
import { type StreamingResponseHandler } from "@/core/controller/grpc-handler";
/**
 * [HANDLING: JoyZoning Audit]
 * Triggers a deep forensic scan of the codebase to identify structural load,
 * substrate drift, and decomposition opportunities.
 */
export declare function triggerAudit(controller: IController, request: JoyZoningAuditRequest, responseStream: StreamingResponseHandler<JoyZoningAuditResponse>, requestId?: string): Promise<void>;
//# sourceMappingURL=triggerAudit.d.ts.map