import { Logger } from "@/shared/services/Logger";
import { getRequestRegistry } from "./grpc-request-registry";
const activeHubs = new Set();
/** Clears all persistent subscription hubs (extension shutdown). */
export function disposeAllPersistentSubscriptionHubs() {
    for (const hub of activeHubs) {
        hub.dispose();
    }
    activeHubs.clear();
}
/**
 * Centralized server-side hub for persistent streaming subscriptions.
 * Provides ref-safe registration and isolated fanout with dead-subscriber pruning.
 */
export class PersistentSubscriptionHub {
    subscriptions = new Set();
    debugLabel;
    constructor(debugLabel) {
        this.debugLabel = debugLabel;
        activeHubs.add(this);
    }
    get size() {
        return this.subscriptions.size;
    }
    register(responseStream, requestId, metadata) {
        this.subscriptions.add(responseStream);
        if (!requestId) {
            return;
        }
        const cleanup = () => {
            this.subscriptions.delete(responseStream);
        };
        getRequestRegistry().registerRequest(requestId, cleanup, metadata, responseStream);
    }
    async broadcast(message) {
        const result = { delivered: 0, pruned: 0, failed: 0 };
        for (const responseStream of Array.from(this.subscriptions)) {
            try {
                await responseStream(message, false);
                result.delivered += 1;
            }
            catch (error) {
                result.failed += 1;
                this.subscriptions.delete(responseStream);
                result.pruned += 1;
                Logger.warn(`[PersistentSubscriptionHub:${this.debugLabel}] Pruned dead subscriber`, error);
            }
        }
        if (result.pruned > 0) {
            Logger.info(`[PersistentSubscriptionHub:${this.debugLabel}] Fanout delivered=${result.delivered} pruned=${result.pruned}`);
        }
        return result;
    }
    dispose() {
        this.subscriptions.clear();
        activeHubs.delete(this);
    }
}
//# sourceMappingURL=persistent-subscription-hub.js.map