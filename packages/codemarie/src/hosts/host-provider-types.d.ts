import type { DiffServiceClientInterface, EnvServiceClientInterface, WindowServiceClientInterface, WorkspaceServiceClientInterface } from "../generated/hosts/host-bridge-client-types.ts";
/**
 * Interface for host bridge client providers
 */
export interface HostBridgeClientProvider {
    workspaceClient: WorkspaceServiceClientInterface;
    envClient: EnvServiceClientInterface;
    windowClient: WindowServiceClientInterface;
    diffClient: DiffServiceClientInterface;
}
/**
 * Callback interface for streaming requests
 */
export interface StreamingCallbacks<T = any> {
    onResponse: (response: T) => void;
    onError?: (error: Error) => void;
    onComplete?: () => void;
}
//# sourceMappingURL=host-provider-types.d.ts.map