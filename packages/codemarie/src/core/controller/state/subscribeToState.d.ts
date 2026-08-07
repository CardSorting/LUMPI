import type { IController as Controller } from "@core/controller/types";
import type { EmptyRequest } from "@shared/proto/dietcode/common";
import type { State } from "@shared/proto/dietcode/state";
import type { ExtensionState } from "@/shared/ExtensionMessage";
import type { StreamingResponseHandler } from "../grpc-handler";
/**
 * Subscribe to state updates
 * @param controller The controller instance
 * @param request The empty request
 * @param responseStream The streaming response handler
 * @param requestId The ID of the request (passed by the gRPC handler)
 */
export declare function subscribeToState(controller: Controller, _request: EmptyRequest, responseStream: StreamingResponseHandler<State>, requestId?: string): Promise<void>;
/**
 * Send a state update to all active subscribers
 * @param state The state to send
 */
export declare function sendStateUpdate(state: ExtensionState): Promise<void>;
//# sourceMappingURL=subscribeToState.d.ts.map