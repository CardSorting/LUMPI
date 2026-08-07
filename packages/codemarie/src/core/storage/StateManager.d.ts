import type { ApiConfiguration, ModelInfo } from "@shared/api";
import { type GlobalState, type GlobalStateAndSettings, type LocalState, type RemoteConfigFields, type Secrets, type Settings } from "@shared/storage/state-keys";
import type { StorageContext } from "@shared/storage/storage-context";
export interface PersistenceErrorEvent {
    error: Error;
}
/**
 * In-memory state manager for fast state access.
 * Provides immediate reads/writes with async disk persistence.
 *
 * All persistent storage is backed by file-based stores via StorageContext.
 * This is shared across all platforms (VSCode, CLI, JetBrains).
 *
 * MULTI-INSTANCE BEHAVIOR:
 * StateManager reads from disk ONLY during initialize(). After that, all reads come from
 * the in-memory cache. Writes update both the cache and disk, but other running instances
 * won't see those changes because they don't re-read from disk.
 *
 * This means: If you have multiple VS Code windows open, each has its own StateManager
 * instance with its own cache. Changing a setting (like plan/act mode) in Window A writes
 * to disk, but Window B keeps using its cached value. Window B only sees the change after
 * restart (when it re-initializes from disk).
 *
 * This is intentional for performance (avoids constant disk reads) and provides natural
 * isolation between concurrent instances. Task-specific state is independent anyway since
 * each window typically runs different tasks.
 */
export declare class StateManager {
    private static instance;
    private globalStateCache;
    private taskStateCache;
    private sessionOverrideCache;
    private remoteConfigCache;
    private secretsCache;
    private workspaceStateCache;
    /**
     * File-backed storage context. All reads/writes to persistent state go through here.
     * Do NOT access VSCode's ExtensionContext for storage — use this instead.
     */
    private storage;
    private isInitialized;
    private readonly MODEL_CACHE_TTL_MS;
    private modelInfoCache;
    private pendingGlobalState;
    private pendingTaskState;
    private pendingSecrets;
    private pendingWorkspaceState;
    private persistenceTimeout;
    private autoPurgeTimer;
    private readonly PERSISTENCE_DELAY_MS;
    private taskHistoryWatcher;
    onPersistenceError?: (event: PersistenceErrorEvent) => void;
    onSyncExternalChange?: () => void | Promise<void>;
    private constructor();
    /**
     * Start unref'd periodic background purge for expired model info caches
     */
    private startAutoCachePurge;
    /**
     * Initialize the cache by loading data from the file-backed StorageContext.
     */
    static initialize(storage: StorageContext): Promise<StateManager>;
    static get(): StateManager;
    /**
     * Register callbacks for state manager events
     */
    registerCallbacks(callbacks: {
        onPersistenceError?: (event: PersistenceErrorEvent) => void | Promise<void>;
        onSyncExternalChange?: () => void | Promise<void>;
    }): void;
    /**
     * Set method for global state keys - updates cache immediately and schedules debounced persistence
     */
    setGlobalState<K extends keyof GlobalStateAndSettings>(key: K, value: GlobalStateAndSettings[K]): void;
    /**
     * Batch set method for global state keys - updates cache immediately and schedules debounced persistence
     */
    setGlobalStateBatch(updates: Partial<GlobalStateAndSettings>): void;
    private setRemoteConfigState;
    /**
     * Set method for task settings keys - updates cache immediately and schedules debounced persistence
     */
    setTaskSettings<K extends keyof Settings>(taskId: string, key: K, value: Settings[K]): void;
    /**
     * Batch set method for task settings keys - updates cache immediately and schedules debounced persistence
     */
    setTaskSettingsBatch(taskId: string, updates: Partial<Settings>): void;
    /**
     * Load task settings from disk into cache
     */
    loadTaskSettings(taskId: string): Promise<void>;
    /**
     * Clear task settings cache - ensures pending changes are persisted first
     */
    clearTaskSettings(): Promise<void>;
    /**
     * Set method for secret keys - updates cache immediately and schedules debounced persistence
     */
    setSecret<K extends keyof Secrets>(key: K, value: Secrets[K]): void;
    /**
     * Batch set method for secret keys - updates cache immediately and schedules debounced persistence
     */
    setSecretsBatch(updates: Partial<Secrets>): void;
    /**
     * Set method for workspace state keys - updates cache immediately and schedules debounced persistence
     */
    setWorkspaceState<K extends keyof LocalState>(key: K, value: LocalState[K]): void;
    /**
     * Batch set method for workspace state keys - updates cache immediately and schedules debounced persistence
     */
    setWorkspaceStateBatch(updates: Partial<LocalState>): void;
    /**
     * Set a session-scoped override for a settings key.
     * Session overrides are in-memory only and are NEVER persisted to disk.
     * They take precedence after remote config but before task-specific and global settings.
     *
     * Use this for CLI flags like --yolo that should apply for the current
     * process lifetime only, without modifying the user's saved settings.
     */
    setSessionOverride<K extends keyof Settings>(key: K, value: Settings[K]): void;
    /**
     * Set method for remote config field - updates cache immediately (no persistence)
     * Remote config is read-only from the extension's perspective and only stored in memory
     */
    setRemoteConfigField<K extends keyof RemoteConfigFields>(key: K, value: RemoteConfigFields[K]): void;
    /**
     * Get method for remote config settings - returns cache immediately (no persistence)
     * Remote config is read-only from the extension's perspective and only stored in memory
     */
    getRemoteConfigSettings(): Partial<RemoteConfigFields>;
    /**
     * Clear remote config cache
     * Used when switching organizations or when remote config is no longer applicable
     */
    clearRemoteConfig(): void;
    /**
     * Set models cache for a specific provider (in-memory only, not persisted)
     */
    setModelsCache(provider: "dietcode" | "openRouter" | "groq" | "baseten" | "huggingFace" | "requesty" | "huaweiCloudMaas" | "hicap" | "aihubmix" | "liteLlm" | "vercel" | "nousResearch", models: Record<string, ModelInfo>): void;
    /**
     * Purge expired model info caches and stale storage hashes to free heap memory
     */
    purgeExpiredCaches(): void;
    getModelsCache(provider: "dietcode" | "openRouter" | "groq" | "baseten" | "huggingFace" | "requesty" | "huaweiCloudMaas" | "hicap" | "aihubmix" | "liteLlm" | "vercel" | "nousResearch"): Record<string, ModelInfo> | null;
    /**
     * Get model info by provider and model ID (from in-memory cache)
     */
    getModelInfo(provider: "openRouter" | "groq" | "baseten" | "huggingFace" | "requesty" | "huaweiCloudMaas" | "hicap" | "aihubmix" | "liteLlm" | "nousResearch", modelId: string): ModelInfo | undefined;
    private setupTaskHistoryWatcher;
    /**
     * Convenience method for getting API configuration
     * Ensures cache is initialized if not already done
     */
    getApiConfiguration(): ApiConfiguration;
    /**
     * Convenience method for setting API configuration
     * Automatically categorizes keys based on STATE_DEFINITION and SecretKeys
     */
    setApiConfiguration(apiConfiguration: ApiConfiguration): void;
    /**
     * Get method for global settings keys - reads from in-memory cache
     * Precedence: remote config > session override > task settings > global settings
     */
    getGlobalSettingsKey<K extends keyof Settings>(key: K): Settings[K];
    /**
     * Get method for global state keys - reads from in-memory cache
     */
    getGlobalStateKey<K extends keyof GlobalState>(key: K): GlobalState[K];
    /**
     * Get method for secret keys - reads from in-memory cache
     */
    getSecretKey<K extends keyof Secrets>(key: K): Secrets[K];
    /**
     * Get method for workspace state keys - reads from in-memory cache
     */
    getWorkspaceStateKey<K extends keyof LocalState>(key: K): LocalState[K];
    /**
     * Reinitialize the state manager by clearing all state and reloading from disk
     * Used for error recovery when write operations fail
     */
    reInitialize(currentTaskId?: string): Promise<void>;
    /**
     * Completely reset all workspace states by deleting the workspaces directory.
     * This is a destructive operation used for full factory resets.
     */
    resetAllWorkspaces(): Promise<void>;
    /**
     * Dispose of the state manager
     */
    private dispose;
    private persistPendingState;
    /**
     * Flush all pending state changes immediately to disk
     * Bypasses the debounced persistence and forces immediate writes
     */
    flushPendingState(): Promise<void>;
    /**
     * Schedule debounced persistence - simple timeout-based persistence
     */
    private scheduleDebouncedPersistence;
    private persistGlobalStateBatch;
    private persistTaskStateBatch;
    private persistSecretsBatch;
    private persistWorkspaceStateBatch;
    /**
     * Private method to populate cache with all extension state without triggering persistence
     * Used during initialization
     */
    private populateCache;
    /**
     * Helper to get a setting value with override support
     * Precedence: remote config > task settings > global settings
     */
    private getSettingWithOverride;
    /**
     * Helper to get a secret value
     */
    private getSecret;
    /**
     * Construct API configuration from cached component keys
     */
    private constructApiConfigurationFromCache;
    /**
     * Get all global state entries (for debugging/inspection)
     */
    getAllGlobalStateEntries(): Record<string, unknown>;
    /**
     * Get all workspace state entries (for debugging/inspection)
     */
    getAllWorkspaceStateEntries(): Record<string, unknown>;
    /**
     * Get the list of persistently trusted tool names
     */
    getTrustedTools(): string[];
    /**
     * Add a tool name to the persistent trust list
     */
    addTrustedTool(tool: string): void;
    /**
     * Remove a tool name from the persistent trust list
     */
    removeTrustedTool(tool: string): void;
    /**
     * Get the list of persistently trusted command prefixes
     */
    getTrustedCommands(): string[];
    /**
     * Add a command prefix to the persistent trust list
     */
    addTrustedCommand(command: string): void;
    /**
     * Remove a command prefix from the persistent trust list
     */
    removeTrustedCommand(command: string): void;
    /**
     * Get the list of persistently trusted MCP servers
     */
    getTrustedMcpServers(): string[];
    /**
     * Add an MCP server to the persistent trust list
     */
    addTrustedMcpServer(serverName: string): void;
    /**
     * Remove an MCP server from the persistent trust list
     */
    removeTrustedMcpServer(serverName: string): void;
    /**
     * Clear all persistent trust for tools and commands
     */
    clearPersistentTrust(): void;
}
//# sourceMappingURL=StateManager.d.ts.map