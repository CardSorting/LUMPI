import type { IController as Controller } from "@core/controller/types";
import type { GrpcCancel, GrpcRequest } from "@/shared/WebviewMessage";
import type { PostMessageToWebview, StreamingResponseHandler } from "./grpc-handler-types";
export type { PostMessageToWebview, StreamingResponseHandler };
/**
 * Handles a gRPC request from the webview.
 */
export declare function handleGrpcRequest(controller: Controller, postMessageToWebview: PostMessageToWebview, request: GrpcRequest): Promise<void>;
/**
 * Handles a gRPC request cancellation from the webview.
 * @param controller The controller instance
 * @param request The cancellation request
 */
export declare function handleGrpcRequestCancel(postMessageToWebview: PostMessageToWebview, request: GrpcCancel): Promise<void>;
export { disposeRequestRegistry, getRequestRegistry } from "@/core/controller/grpc-request-registry";
//# sourceMappingURL=grpc-handler.d.ts.map