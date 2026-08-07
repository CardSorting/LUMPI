import type { IController as Controller } from "@core/controller/types";
import { Empty, type EmptyRequest } from "@shared/proto/dietcode/common";
import type { StreamingResponseHandler } from "../grpc-handler";
export declare function subscribeToChatButtonClicked(_controller: Controller, _request: EmptyRequest, responseStream: StreamingResponseHandler<Empty>, requestId?: string): Promise<void>;
export declare function sendChatButtonClickedEvent(): Promise<void>;
//# sourceMappingURL=subscribeToChatButtonClicked.d.ts.map