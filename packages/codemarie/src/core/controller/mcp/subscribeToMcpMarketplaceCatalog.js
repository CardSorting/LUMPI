import { PersistentSubscriptionHub } from "../persistent-subscription-hub";
const hub = new PersistentSubscriptionHub("mcpMarketplaceCatalog");
/**
 * Subscribe to MCP marketplace catalog updates
 * @param controller The controller instance
 * @param request The empty request
 * @param responseStream The streaming response handler
 * @param requestId The ID of the request (passed by the gRPC handler)
 */
export async function subscribeToMcpMarketplaceCatalog(_controller, _request, responseStream, requestId) {
    hub.register(responseStream, requestId, { type: "mcp_marketplace_subscription" });
}
/**
 * Send an MCP marketplace catalog event to all active subscribers
 */
export async function sendMcpMarketplaceCatalogEvent(catalog) {
    await hub.broadcast(catalog);
}
//# sourceMappingURL=subscribeToMcpMarketplaceCatalog.js.map