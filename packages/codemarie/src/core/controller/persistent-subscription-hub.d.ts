import type { StreamingResponseHandler } from "./grpc-handler-types";
export interface FanoutResult {
    delivered: number;
    pruned: number;
    failed: number;
}
/** Clears all persistent subscription hubs (extension shutdown). */
export declare function disposeAllPersistentSubscriptionHubs(): void;
/**
 * Centralized server-side hub for persistent streaming subscriptions.
 * Provides ref-safe registration and isolated fanout with dead-subscriber pruning.
 */
export declare class PersistentSubscriptionHub<T> {
    private readonly subscriptions;
    private readonly debugLabel;
    constructor(debugLabel: string);
    get size(): number;
    register(responseStream: StreamingResponseHandler<T>, requestId: string | undefined, metadata?: unknown): void;
    broadcast(message: T): Promise<FanoutResult>;
    dispose(): void;
}
//# sourceMappingURL=persistent-subscription-hub.d.ts.map