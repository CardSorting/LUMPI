import { type CerebrasModelId, type ModelInfo } from "@shared/api";
import type OpenAI from "openai";
import type { DietCodeStorageMessage } from "@/shared/messages/content";
import type { DietCodeTool } from "@/shared/tools";
import type { ApiStream } from "../transform/stream";
import type { ApiHandler, CommonApiHandlerOptions } from "../types";
interface CerebrasHandlerOptions extends CommonApiHandlerOptions {
    cerebrasApiKey?: string;
    apiModelId?: string;
}
export declare const pruneHistoricalVisionPayloads: (messages: DietCodeStorageMessage[], activeVisionWindow?: number) => any;
export declare const compressDslText: (text: string) => any;
export declare const compactHistoricalToolOutputs: (messages: OpenAI.ChatCompletionMessageParam[], keepFullTurns?: number) => any;
export declare function prepareCerebrasMessages(messages: DietCodeStorageMessage[]): OpenAI.Chat.ChatCompletionMessageParam[];
export declare class CerebrasHandler implements ApiHandler {
    private options;
    constructor(options: CerebrasHandlerOptions);
    getModel(): {
        id: CerebrasModelId;
        info: ModelInfo;
    };
    createMessage(systemPrompt: string, messages: DietCodeStorageMessage[], _tools?: DietCodeTool[]): ApiStream;
}
export {};
//# sourceMappingURL=cerebras.d.ts.map