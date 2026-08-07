import type { IController as Controller } from "@core/controller/types";
import type { EmptyRequest } from "@shared/proto/dietcode/common";
import type { McpMarketplaceCatalog } from "@shared/proto/dietcode/mcp";
import type { StreamingResponseHandler } from "../grpc-handler";
/**
 * Subscribe to MCP marketplace catalog updates
 * @param controller The controller instance
 * @param request The empty request
 * @param responseStream The streaming response handler
 * @param requestId The ID of the request (passed by the gRPC handler)
 */
export declare function subscribeToMcpMarketplaceCatalog(_controller: Controller, _request: EmptyRequest, responseStream: StreamingResponseHandler<McpMarketplaceCatalog>, requestId?: string): Promise<void>;
/**
 * Send an MCP marketplace catalog event to all active subscribers
 */
export declare function sendMcpMarketplaceCatalogEvent(catalog: McpMarketplaceCatalog): Promise<void>;
//# sourceMappingURL=subscribeToMcpMarketplaceCatalog.d.ts.map