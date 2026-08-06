import type { IController as Controller } from "@core/controller/types";
import type { EmptyRequest } from "@shared/proto/dietcode/common";
import type { OcaAuthState } from "@shared/proto/dietcode/oca_account";
import { OcaAuthService } from "@/services/auth/oca/OcaAuthService";
import type { StreamingResponseHandler } from "../grpc-handler";

export async function ocaSubscribeToAuthStatusUpdate(
	_controller: Controller,
	request: EmptyRequest,
	responseStream: StreamingResponseHandler<OcaAuthState>,
	requestId?: string,
): Promise<void> {
	return OcaAuthService.getInstance().subscribeToAuthStatusUpdate(request, responseStream, requestId);
}
