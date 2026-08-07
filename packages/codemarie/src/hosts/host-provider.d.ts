type WebviewProvider = any;
type CommentReviewController = any;
type DiffViewProvider = any;
type ITerminalManager = any;
import type { HostBridgeClientProvider } from "./host-provider-types.ts";
/**
 * Singleton class that manages host-specific providers for dependency injection.
 *
 * This system runs on two different platforms (VSCode extension and dietcode-core),
 * so all the host-specific classes and properties are contained in here. The
 * rest of the codebase can use the host provider interface to access platform-specific
 * implementations in a platform-agnostic way.
 *
 * Usage:
 * - Initialize once: HostProvider.initialize(webviewCreator, diffCreator, hostBridge)
 * - Access HostBridge services: HostProvider.window.showMessage()
 * - Access Host Provider factories: HostProvider.get().createDiffViewProvider()
 */
export declare class HostProvider {
    private static instance;
    createWebviewProvider: WebviewProviderCreator;
    createDiffViewProvider: DiffViewProviderCreator;
    createCommentReviewController: CommentReviewControllerCreator;
    createTerminalManager: TerminalManagerCreator;
    hostBridge: HostBridgeClientProvider;
    logToChannel: LogToChannel;
    getCallbackUrl: (path: string) => Promise<string>;
    getBinaryLocation: (name: string) => Promise<string>;
    extensionFsPath: string;
    globalStorageFsPath: string;
    private constructor();
    static initialize(webviewProviderCreator: WebviewProviderCreator, diffViewProviderCreator: DiffViewProviderCreator, commentReviewControllerCreator: CommentReviewControllerCreator, terminalManagerCreator: TerminalManagerCreator, hostBridgeProvider: HostBridgeClientProvider, logToChannel: LogToChannel, getCallbackUrl: (path: string) => Promise<string>, getBinaryLocation: (name: string) => Promise<string>, extensionFsPath: string, globalStorageFsPath: string): HostProvider;
    /**
     * Gets the singleton instance
     */
    static get(): HostProvider;
    static isInitialized(): boolean;
    /**
     * Resets the HostProvider instance (primarily for testing)
     * This allows tests to reinitialize the HostProvider with different configurations
     */
    static reset(): void;
    static get workspace(): import("../generated/hosts/host-bridge-client-types.ts").WorkspaceServiceClientInterface;
    static get env(): import("../generated/hosts/host-bridge-client-types.ts").EnvServiceClientInterface;
    static get window(): import("../generated/hosts/host-bridge-client-types.ts").WindowServiceClientInterface;
    static get diff(): import("../generated/hosts/host-bridge-client-types.ts").DiffServiceClientInterface;
}
/**
 * A function that creates WebviewProvider instances
 */
export type WebviewProviderCreator = () => WebviewProvider;
/**
 * A function that creates DiffViewProvider instances
 */
export type DiffViewProviderCreator = () => DiffViewProvider;
/**
 * A function that creates CommentReviewController instances
 */
export type CommentReviewControllerCreator = () => CommentReviewController;
export type LogToChannel = (message: string) => void;
/**
 * A function that creates TerminalManager instances
 */
export type TerminalManagerCreator = () => ITerminalManager;
export {};
//# sourceMappingURL=host-provider.d.ts.map