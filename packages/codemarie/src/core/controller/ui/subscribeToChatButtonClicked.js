import { Empty } from "@shared/proto/dietcode/common";
import { PersistentSubscriptionHub } from "../persistent-subscription-hub";
const hub = new PersistentSubscriptionHub("chatButtonClicked");
export async function subscribeToChatButtonClicked(_controller, _request, responseStream, requestId) {
    hub.register(responseStream, requestId, { type: "chatButtonClicked_subscription" });
}
export async function sendChatButtonClickedEvent() {
    await hub.broadcast(Empty.create({}));
}
//# sourceMappingURL=subscribeToChatButtonClicked.js.map