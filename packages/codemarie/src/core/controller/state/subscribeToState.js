import { Logger } from "@/shared/services/Logger";
import { PersistentSubscriptionHub } from "../persistent-subscription-hub";
const hub = new PersistentSubscriptionHub("state");
/**
 * Subscribe to state updates
 * @param controller The controller instance
 * @param request The empty request
 * @param responseStream The streaming response handler
 * @param requestId The ID of the request (passed by the gRPC handler)
 */
export async function subscribeToState(controller, _request, responseStream, requestId) {
    hub.register(responseStream, requestId, { type: "state_subscription" });
    const initialState = await controller.getStateToPostToWebview();
    const initialStateJson = JSON.stringify(initialState);
    try {
        await responseStream({ stateJson: initialStateJson }, false);
    }
    catch (error) {
        Logger.error("Error sending initial state:", error);
    }
}
/**
 * Send a state update to all active subscribers
 * @param state The state to send
 */
export async function sendStateUpdate(state) {
    const stateJson = JSON.stringify(state);
    await hub.broadcast({ stateJson });
}
//# sourceMappingURL=subscribeToState.js.map