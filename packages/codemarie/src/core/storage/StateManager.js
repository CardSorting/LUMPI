import { ApiHandlerSettingsKeys, isSecretKey, isSettingsKey, SecretKeys, } from "@shared/storage/state-keys";
import chokidar from "chokidar";
import { initializeDistinctId } from "@/services/logging/distinctId";
import { Logger } from "@/shared/services/Logger";
import { AgentConfigLoader } from "../task/tools/subagent/AgentConfigLoader";
import { getTaskHistoryStateFilePath, readTaskHistoryFromState, readTaskSettingsFromStorage, writeTaskHistoryToState, writeTaskSettingsToStorage, } from "./disk";
import { STATE_MANAGER_NOT_INITIALIZED } from "./error-messages";
import { filterAllowedRemoteConfigFields } from "./remote-config/field-filter";
import { readGlobalStateFromStorage, readSecretsFromStorage, readWorkspaceStateFromStorage, } from "./utils/state-helpers";
import { writeCoalescer } from "./WriteCoalescer";
function isValueEqual(a, b) {
    if (a === b) {
        return true;
    }
    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) {
            return false;
        }
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) {
                return false;
            }
        }
        return true;
    }
    return false;
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
export class StateManager {
    static instance = null;
    globalStateCache = {};
    taskStateCache = {};
    sessionOverrideCache = {};
    remoteConfigCache = {};
    secretsCache = {};
    workspaceStateCache = {};
    /**
     * File-backed storage context. All reads/writes to persistent state go through here.
     * Do NOT access VSCode's ExtensionContext for storage — use this instead.
     */
    storage;
    isInitialized = false;
    // Cache TTL: 1 hour - long enough to prevent duplicate fetches, short enough to see new models
    MODEL_CACHE_TTL_MS = 60 * 60 * 1000;
    // In-memory model info cache (not persisted to disk)
    // These are for dynamic providers that fetch models from APIs
    modelInfoCache = {
        dietcodeModels: null,
        openRouterModels: null,
        groqModels: null,
        basetenModels: null,
        huggingFaceModels: null,
        requestyModels: null,
        huaweiCloudMaasModels: null,
        hicapModels: null,
        aihubmixModels: null,
        liteLlmModels: null,
        vercelModels: null,
        nousResearchModels: null,
    };
    // Debounced persistence state
    pendingGlobalState = new Set();
    pendingTaskState = new Map();
    pendingSecrets = new Set();
    pendingWorkspaceState = new Set();
    persistenceTimeout = null;
    autoPurgeTimer = null;
    PERSISTENCE_DELAY_MS = 500;
    taskHistoryWatcher = null;
    // Callback for persistence errors
    onPersistenceError;
    // Callback to sync external state changes with the UI client
    onSyncExternalChange;
    constructor(storage) {
        this.storage = storage;
    }
    /**
     * Start unref'd periodic background purge for expired model info caches
     */
    startAutoCachePurge() {
        if (this.autoPurgeTimer) {
            return;
        }
        this.autoPurgeTimer = setInterval(() => {
            this.purgeExpiredCaches();
        }, 15 * 60 * 1000);
        if (this.autoPurgeTimer.unref) {
            this.autoPurgeTimer.unref();
        }
    }
    /**
     * Initialize the cache by loading data from the file-backed StorageContext.
     */
    static async initialize(storage) {
        if (!StateManager.instance) {
            StateManager.instance = new StateManager(storage);
        }
        if (StateManager.instance.isInitialized) {
            throw new Error("StateManager has already been initialized.");
        }
        try {
            await initializeDistinctId(storage);
            // Verify integrity of configuration files
            const { verifyIntegrity } = await import("./disk");
            const integrity = await verifyIntegrity(storage.dataDir);
            if (!integrity.ok) {
                Logger.warn(`[Forensics] Config integrity compromised. Mismatched files: ${integrity.mismatched.join(", ")}`);
                // We don't block boot, but we flag it for the immunity system
            }
            // Load all extension state from file-backed stores
            const globalState = await readGlobalStateFromStorage(storage.globalState);
            const secrets = readSecretsFromStorage(storage.secrets);
            const workspaceState = readWorkspaceStateFromStorage(storage.workspaceState);
            // Populate the cache with all extension state and secrets fields
            // Use populate method to avoid triggering persistence during initialization
            StateManager.instance.populateCache(globalState, secrets, workspaceState);
            // Start watcher for taskHistory.json so external edits update cache (no persist loop)
            await StateManager.instance.setupTaskHistoryWatcher();
            StateManager.instance.startAutoCachePurge();
            StateManager.instance.isInitialized = true;
            await AgentConfigLoader.getInstance().ready();
        }
        catch (error) {
            Logger.error("[StateManager] Failed to initialize:", error);
            throw error;
        }
        return StateManager.instance;
    }
    static get() {
        if (!StateManager.instance) {
            throw new Error("StateManager has not been initialized");
        }
        return StateManager.instance;
    }
    /**
     * Register callbacks for state manager events
     */
    registerCallbacks(callbacks) {
        if (callbacks.onPersistenceError) {
            this.onPersistenceError = callbacks.onPersistenceError;
        }
        if (callbacks.onSyncExternalChange) {
            this.onSyncExternalChange = callbacks.onSyncExternalChange;
        }
    }
    /**
     * Set method for global state keys - updates cache immediately and schedules debounced persistence
     */
    setGlobalState(key, value) {
        if (!this.isInitialized) {
            throw new Error(STATE_MANAGER_NOT_INITIALIZED);
        }
        if (isValueEqual(this.globalStateCache[key], value)) {
            return;
        }
        // Update cache immediately for instant access
        this.globalStateCache[key] = value;
        // Add to pending persistence set and schedule debounced write
        this.pendingGlobalState.add(key);
        this.scheduleDebouncedPersistence();
    }
    /**
     * Batch set method for global state keys - updates cache immediately and schedules debounced persistence
     */
    setGlobalStateBatch(updates) {
        if (!this.isInitialized) {
            throw new Error(STATE_MANAGER_NOT_INITIALIZED);
        }
        let hasChanges = false;
        for (const [key, value] of Object.entries(updates)) {
            const stateKey = key;
            if (!isValueEqual(this.globalStateCache[stateKey], value)) {
                this.globalStateCache[stateKey] = value;
                this.pendingGlobalState.add(stateKey);
                hasChanges = true;
            }
        }
        if (hasChanges) {
            this.scheduleDebouncedPersistence();
        }
    }
    setRemoteConfigState(updates) {
        if (!this.isInitialized) {
            throw new Error(STATE_MANAGER_NOT_INITIALIZED);
        }
        // Update cache in one go
        this.remoteConfigCache = {
            ...this.remoteConfigCache,
            ...filterAllowedRemoteConfigFields(updates, this.getRemoteConfigSettings().remoteConfiguredProviders),
        };
    }
    /**
     * Set method for task settings keys - updates cache immediately and schedules debounced persistence
     */
    setTaskSettings(taskId, key, value) {
        if (!this.isInitialized) {
            throw new Error(STATE_MANAGER_NOT_INITIALIZED);
        }
        if (isValueEqual(this.taskStateCache[key], value)) {
            return;
        }
        // Update cache immediately for instant access
        this.taskStateCache[key] = value;
        // Add to pending persistence set and schedule debounced write
        if (!this.pendingTaskState.has(taskId)) {
            this.pendingTaskState.set(taskId, new Set());
        }
        this.pendingTaskState.get(taskId)?.add(key);
        this.scheduleDebouncedPersistence();
    }
    /**
     * Batch set method for task settings keys - updates cache immediately and schedules debounced persistence
     */
    setTaskSettingsBatch(taskId, updates) {
        if (!this.isInitialized) {
            throw new Error(STATE_MANAGER_NOT_INITIALIZED);
        }
        let hasChanges = false;
        for (const [key, value] of Object.entries(updates)) {
            const settingsKey = key;
            if (!isValueEqual(this.taskStateCache[settingsKey], value)) {
                this.taskStateCache[settingsKey] = value;
                if (!this.pendingTaskState.has(taskId)) {
                    this.pendingTaskState.set(taskId, new Set());
                }
                this.pendingTaskState.get(taskId)?.add(settingsKey);
                hasChanges = true;
            }
        }
        if (hasChanges) {
            this.scheduleDebouncedPersistence();
        }
    }
    /**
     * Load task settings from disk into cache
     */
    async loadTaskSettings(taskId) {
        if (!this.isInitialized) {
            throw new Error(STATE_MANAGER_NOT_INITIALIZED);
        }
        try {
            const taskSettings = await readTaskSettingsFromStorage(taskId);
            // Populate task cache with loaded settings
            Object.assign(this.taskStateCache, taskSettings);
        }
        catch (error) {
            // If reading fails, just use empty cache
            Logger.error("[StateManager] Failed to load task settings, defaulting to globally selected settings.", error);
        }
    }
    /**
     * Clear task settings cache - ensures pending changes are persisted first
     */
    async clearTaskSettings() {
        // If there are pending task settings, persist them first
        if (this.pendingTaskState.size > 0) {
            try {
                // Persist pending task state immediately
                await this.persistTaskStateBatch(this.pendingTaskState);
                // Clear pending set after successful persistence
                this.pendingTaskState.clear();
            }
            catch (error) {
                Logger.error("[StateManager] Failed to persist task settings before clearing:", error);
            }
        }
        this.taskStateCache = {};
        this.pendingTaskState.clear();
    }
    /**
     * Set method for secret keys - updates cache immediately and schedules debounced persistence
     */
    setSecret(key, value) {
        if (!this.isInitialized) {
            throw new Error(STATE_MANAGER_NOT_INITIALIZED);
        }
        // Update cache immediately for instant access
        this.secretsCache[key] = value;
        // Add to pending persistence set and schedule debounced write
        this.pendingSecrets.add(key);
        this.scheduleDebouncedPersistence();
    }
    /**
     * Batch set method for secret keys - updates cache immediately and schedules debounced persistence
     */
    setSecretsBatch(updates) {
        if (!this.isInitialized) {
            throw new Error(STATE_MANAGER_NOT_INITIALIZED);
        }
        // Update cache immediately for all keys
        Object.entries(updates).forEach(([key, value]) => {
            // Skip unchanged values as we don't want to trigger unnecessary
            // writes & incorrectly fire an onDidChange events.
            const current = this.secretsCache[key];
            if (current === value) {
                return;
            }
            this.secretsCache[key] = value;
            this.pendingSecrets.add(key);
        });
        // Schedule debounced persistence
        this.scheduleDebouncedPersistence();
    }
    /**
     * Set method for workspace state keys - updates cache immediately and schedules debounced persistence
     */
    setWorkspaceState(key, value) {
        if (!this.isInitialized) {
            throw new Error(STATE_MANAGER_NOT_INITIALIZED);
        }
        if (this.workspaceStateCache[key] === value) {
            return;
        }
        // Update cache immediately for instant access
        this.workspaceStateCache[key] = value;
        // Add to pending persistence set and schedule debounced write
        this.pendingWorkspaceState.add(key);
        this.scheduleDebouncedPersistence();
    }
    /**
     * Batch set method for workspace state keys - updates cache immediately and schedules debounced persistence
     */
    setWorkspaceStateBatch(updates) {
        if (!this.isInitialized) {
            throw new Error(STATE_MANAGER_NOT_INITIALIZED);
        }
        let hasChanges = false;
        for (const [key, value] of Object.entries(updates)) {
            const localKey = key;
            if (this.workspaceStateCache[localKey] !== value) {
                this.workspaceStateCache[localKey] = value;
                this.pendingWorkspaceState.add(localKey);
                hasChanges = true;
            }
        }
        if (hasChanges) {
            this.scheduleDebouncedPersistence();
        }
    }
    /**
     * Set a session-scoped override for a settings key.
     * Session overrides are in-memory only and are NEVER persisted to disk.
     * They take precedence after remote config but before task-specific and global settings.
     *
     * Use this for CLI flags like --yolo that should apply for the current
     * process lifetime only, without modifying the user's saved settings.
     */
    setSessionOverride(key, value) {
        if (!this.isInitialized) {
            throw new Error(STATE_MANAGER_NOT_INITIALIZED);
        }
        this.sessionOverrideCache[key] = value;
    }
    /**
     * Set method for remote config field - updates cache immediately (no persistence)
     * Remote config is read-only from the extension's perspective and only stored in memory
     */
    setRemoteConfigField(key, value) {
        if (!this.isInitialized) {
            throw new Error(STATE_MANAGER_NOT_INITIALIZED);
        }
        // Update cache immediately for instant access (no persistence needed)
        this.remoteConfigCache[key] = value;
    }
    /**
     * Get method for remote config settings - returns cache immediately (no persistence)
     * Remote config is read-only from the extension's perspective and only stored in memory
     */
    getRemoteConfigSettings() {
        if (!this.isInitialized) {
            throw new Error(STATE_MANAGER_NOT_INITIALIZED);
        }
        return this.remoteConfigCache;
    }
    /**
     * Clear remote config cache
     * Used when switching organizations or when remote config is no longer applicable
     */
    clearRemoteConfig() {
        if (!this.isInitialized) {
            throw new Error(STATE_MANAGER_NOT_INITIALIZED);
        }
        this.remoteConfigCache = {};
    }
    /**
     * Set models cache for a specific provider (in-memory only, not persisted)
     */
    setModelsCache(provider, models) {
        const cacheKey = `${provider}Models`;
        this.modelInfoCache[cacheKey] = { data: models, timestamp: Date.now() };
    }
    /**
     * Purge expired model info caches and stale storage hashes to free heap memory
     */
    purgeExpiredCaches() {
        const now = Date.now();
        for (const key of Object.keys(this.modelInfoCache)) {
            const entry = this.modelInfoCache[key];
            if (entry && now - entry.timestamp > this.MODEL_CACHE_TTL_MS) {
                this.modelInfoCache[key] = null;
            }
        }
        writeCoalescer.purgeStaleHashes();
    }
    getModelsCache(provider) {
        this.purgeExpiredCaches();
        const cacheKey = `${provider}Models`;
        const cached = this.modelInfoCache[cacheKey];
        if (!cached) {
            return null;
        }
        return cached.data;
    }
    /**
     * Get model info by provider and model ID (from in-memory cache)
     */
    getModelInfo(provider, modelId) {
        this.purgeExpiredCaches();
        const cacheKey = `${provider}Models`;
        const cached = this.modelInfoCache[cacheKey];
        if (!cached) {
            return undefined;
        }
        return cached.data[modelId];
    }
    /**
     * Initialize chokidar watcher for the taskHistory.json file
     * Updates in-memory cache on external changes without writing back to disk.
     */
    async setupTaskHistoryWatcher() {
        try {
            const historyFile = await getTaskHistoryStateFilePath();
            // Close any existing watcher before creating a new one
            if (this.taskHistoryWatcher) {
                await this.taskHistoryWatcher.close();
                this.taskHistoryWatcher = null;
            }
            this.taskHistoryWatcher = chokidar.watch(historyFile, {
                persistent: true,
                ignoreInitial: true,
                atomic: true,
                awaitWriteFinish: { stabilityThreshold: 300, pollInterval: 100 },
            });
            const syncTaskHistoryFromDisk = async () => {
                try {
                    if (!this.isInitialized) {
                        return;
                    }
                    const onDisk = await readTaskHistoryFromState();
                    const cached = this.globalStateCache.taskHistory || [];
                    if (onDisk.length !== cached.length ||
                        (onDisk.length > 0 && (onDisk[0]?.id !== cached[0]?.id || onDisk[0]?.ts !== cached[0]?.ts))) {
                        this.globalStateCache.taskHistory = onDisk;
                        await this.onSyncExternalChange?.();
                    }
                }
                catch (err) {
                    Logger.error("[StateManager] Failed to reload task history on change:", err);
                }
            };
            this.taskHistoryWatcher
                .on("add", () => syncTaskHistoryFromDisk())
                .on("change", () => syncTaskHistoryFromDisk())
                .on("unlink", async () => {
                this.globalStateCache.taskHistory = [];
                await this.onSyncExternalChange?.();
            })
                .on("error", (error) => Logger.error("[StateManager] TaskHistory watcher error:", error));
        }
        catch (err) {
            Logger.error("[StateManager] Failed to set up taskHistory watcher:", err);
        }
    }
    /**
     * Convenience method for getting API configuration
     * Ensures cache is initialized if not already done
     */
    getApiConfiguration() {
        if (!this.isInitialized) {
            throw new Error(STATE_MANAGER_NOT_INITIALIZED);
        }
        // Construct API configuration from cached component keys
        return this.constructApiConfigurationFromCache();
    }
    /**
     * Convenience method for setting API configuration
     * Automatically categorizes keys based on STATE_DEFINITION and SecretKeys
     */
    setApiConfiguration(apiConfiguration) {
        if (!this.isInitialized) {
            throw new Error(STATE_MANAGER_NOT_INITIALIZED);
        }
        // Automatically categorize the API configuration keys
        const { settingsUpdates, secretsUpdates } = Object.entries(apiConfiguration).reduce((acc, [key, value]) => {
            if (key === undefined || value === undefined) {
                return acc; // Skip undefined values
            }
            if (isSecretKey(key)) {
                // This is a secret key
                acc.secretsUpdates[key] = value;
            }
            else if (isSettingsKey(key)) {
                // This is a settings key
                acc.settingsUpdates[key] = value;
            }
            return acc;
        }, { settingsUpdates: {}, secretsUpdates: {} });
        // Batch update settings (stored in global state)
        if (Object.keys(settingsUpdates).length > 0) {
            this.setRemoteConfigState(settingsUpdates);
            this.setGlobalStateBatch(settingsUpdates);
        }
        // Batch update secrets
        if (Object.keys(secretsUpdates).length > 0) {
            this.setSecretsBatch(secretsUpdates);
        }
    }
    /**
     * Get method for global settings keys - reads from in-memory cache
     * Precedence: remote config > session override > task settings > global settings
     */
    getGlobalSettingsKey(key) {
        if (!this.isInitialized) {
            throw new Error(STATE_MANAGER_NOT_INITIALIZED);
        }
        if (key === "yoloModeToggled") {
            return false;
        }
        if (this.remoteConfigCache[key] !== undefined) {
            return this.remoteConfigCache[key];
        }
        if (this.sessionOverrideCache[key] !== undefined) {
            return this.sessionOverrideCache[key];
        }
        if (this.taskStateCache[key] !== undefined) {
            return this.taskStateCache[key];
        }
        return this.globalStateCache[key];
    }
    /**
     * Get method for global state keys - reads from in-memory cache
     */
    getGlobalStateKey(key) {
        if (!this.isInitialized) {
            throw new Error(STATE_MANAGER_NOT_INITIALIZED);
        }
        if (this.remoteConfigCache[key] !== undefined) {
            return this.remoteConfigCache[key];
        }
        return this.globalStateCache[key];
    }
    /**
     * Get method for secret keys - reads from in-memory cache
     */
    getSecretKey(key) {
        if (!this.isInitialized) {
            throw new Error(STATE_MANAGER_NOT_INITIALIZED);
        }
        return this.secretsCache[key];
    }
    /**
     * Get method for workspace state keys - reads from in-memory cache
     */
    getWorkspaceStateKey(key) {
        if (!this.isInitialized) {
            throw new Error(STATE_MANAGER_NOT_INITIALIZED);
        }
        return this.workspaceStateCache[key];
    }
    /**
     * Reinitialize the state manager by clearing all state and reloading from disk
     * Used for error recovery when write operations fail
     */
    async reInitialize(currentTaskId) {
        if (this.persistenceTimeout) {
            try {
                await this.persistPendingState();
            }
            catch (error) {
                Logger.error("[StateManager] Failed to persist pending state during reInitialize:", error);
            }
        }
        // Clear all cached data and pending state
        this.dispose();
        // Reinitialize from the same storage context
        await StateManager.initialize(this.storage);
        // If there's an active task, reload its settings
        if (currentTaskId) {
            await this.loadTaskSettings(currentTaskId);
        }
    }
    /**
     * Completely reset all workspace states by deleting the workspaces directory.
     * This is a destructive operation used for full factory resets.
     */
    async resetAllWorkspaces() {
        if (!this.isInitialized) {
            throw new Error(STATE_MANAGER_NOT_INITIALIZED);
        }
        const fs = await import("fs/promises");
        const path = await import("path");
        const workspacesDir = path.join(this.storage.dataDir, "workspaces");
        try {
            await fs.rm(workspacesDir, { recursive: true, force: true });
            // Re-create the directory for the current workspace
            await fs.mkdir(this.storage.workspaceStoragePath, { recursive: true });
            // Clear in-memory workspace cache
            this.workspaceStateCache = {};
            this.pendingWorkspaceState.clear();
        }
        catch (error) {
            Logger.error("[StateManager] Failed to reset all workspaces:", error);
            throw error;
        }
    }
    /**
     * Dispose of the state manager
     */
    dispose() {
        if (this.persistenceTimeout) {
            clearTimeout(this.persistenceTimeout);
            this.persistenceTimeout = null;
        }
        if (this.autoPurgeTimer) {
            clearInterval(this.autoPurgeTimer);
            this.autoPurgeTimer = null;
        }
        // Close file watcher if active
        if (this.taskHistoryWatcher) {
            this.taskHistoryWatcher.close();
            this.taskHistoryWatcher = null;
        }
        this.pendingGlobalState.clear();
        this.pendingSecrets.clear();
        this.pendingWorkspaceState.clear();
        this.pendingTaskState.clear();
        this.globalStateCache = {};
        this.secretsCache = {};
        this.workspaceStateCache = {};
        this.taskStateCache = {};
        this.remoteConfigCache = {};
        this.sessionOverrideCache = {};
        this.isInitialized = false;
    }
    /**
     * Private method to persist all pending state changes
     * Returns early if nothing is pending
     */
    async persistPendingState() {
        // Early return if nothing to persist
        if (this.pendingGlobalState.size === 0 &&
            this.pendingSecrets.size === 0 &&
            this.pendingWorkspaceState.size === 0 &&
            this.pendingTaskState.size === 0) {
            return;
        }
        // Execute all persistence operations in parallel
        await Promise.all([
            this.persistGlobalStateBatch(this.pendingGlobalState),
            this.persistSecretsBatch(this.pendingSecrets),
            this.persistWorkspaceStateBatch(this.pendingWorkspaceState),
            this.persistTaskStateBatch(this.pendingTaskState),
        ]);
        // Clear pending sets after successful persistence
        this.pendingGlobalState.clear();
        this.pendingSecrets.clear();
        this.pendingWorkspaceState.clear();
        this.pendingTaskState.clear();
    }
    /**
     * Flush all pending state changes immediately to disk
     * Bypasses the debounced persistence and forces immediate writes
     */
    async flushPendingState() {
        // Cancel any pending timeout
        if (this.persistenceTimeout) {
            clearTimeout(this.persistenceTimeout);
            this.persistenceTimeout = null;
        }
        // Execute persistence immediately
        await this.persistPendingState();
    }
    /**
     * Schedule debounced persistence - simple timeout-based persistence
     */
    scheduleDebouncedPersistence() {
        // Clear existing timeout if one is pending
        if (this.persistenceTimeout) {
            clearTimeout(this.persistenceTimeout);
        }
        // Schedule a new timeout to persist pending changes
        this.persistenceTimeout = setTimeout(async () => {
            try {
                await this.persistPendingState();
                this.persistenceTimeout = null;
            }
            catch (error) {
                Logger.error("[StateManager] Failed to persist pending changes:", error);
                this.persistenceTimeout = null;
                // Call persistence error callback for error recovery
                this.onPersistenceError?.({ error: error });
            }
        }, this.PERSISTENCE_DELAY_MS);
    }
    /**
     * Persist global state keys to the file-backed store.
     * Uses setBatch for efficiency (single disk write).
     */
    async persistGlobalStateBatch(keys) {
        // Separate taskHistory (goes to its own file) from regular global state
        const regularEntries = {};
        for (const key of keys) {
            if (key === "taskHistory") {
                // Route task history persistence to its own file
                await writeTaskHistoryToState(this.globalStateCache[key]);
            }
            else {
                regularEntries[key] = this.globalStateCache[key];
            }
        }
        // Batch write all regular keys in a single disk operation
        if (Object.keys(regularEntries).length > 0) {
            this.storage.globalStateBackingStore.setBatch(regularEntries);
        }
    }
    /**
     * Private method to batch persist task state keys with a single write operation
     */
    async persistTaskStateBatch(pendingTaskStates) {
        if (pendingTaskStates.size === 0) {
            return;
        }
        // Persist each task's settings
        await Promise.all(Array.from(pendingTaskStates.entries()).map(([taskId, keys]) => {
            if (keys.size === 0) {
                return Promise.resolve();
            }
            const settingsToWrite = {};
            for (const key of keys) {
                const value = this.taskStateCache[key];
                if (value !== undefined) {
                    settingsToWrite[key] = value;
                }
            }
            return writeTaskSettingsToStorage(taskId, settingsToWrite);
        }));
    }
    /**
     * Persist secrets to the file-backed store.
     * Uses setBatch for efficiency (single disk write).
     */
    async persistSecretsBatch(keys) {
        const entries = {};
        for (const key of keys) {
            const value = this.secretsCache[key];
            entries[key] = value || undefined; // Convert empty strings to undefined (delete)
        }
        this.storage.secrets.setBatch(entries);
    }
    /**
     * Persist workspace state to the file-backed store.
     * Uses setBatch for efficiency (single disk write).
     */
    async persistWorkspaceStateBatch(keys) {
        const entries = {};
        for (const key of keys) {
            entries[key] = this.workspaceStateCache[key];
        }
        this.storage.workspaceState.setBatch(entries);
    }
    /**
     * Private method to populate cache with all extension state without triggering persistence
     * Used during initialization
     */
    populateCache(globalState, secrets, workspaceState) {
        Object.assign(this.globalStateCache, globalState);
        Object.assign(this.secretsCache, secrets);
        Object.assign(this.workspaceStateCache, workspaceState);
    }
    /**
     * Helper to get a setting value with override support
     * Precedence: remote config > task settings > global settings
     */
    getSettingWithOverride(key) {
        const remoteValue = this.remoteConfigCache[key];
        if (remoteValue !== undefined) {
            return remoteValue;
        }
        const taskValue = this.taskStateCache[key];
        if (taskValue !== undefined) {
            return taskValue;
        }
        return this.globalStateCache[key];
    }
    /**
     * Helper to get a secret value
     */
    getSecret(key) {
        return this.secretsCache[key];
    }
    /**
     * Construct API configuration from cached component keys
     */
    constructApiConfigurationFromCache() {
        // Build secrets object
        const secrets = Object.fromEntries(SecretKeys.map((key) => [key, this.getSecret(key)]));
        // Preserve legacy fallback behavior for LiteLLM API key:
        // if a remoteLiteLlmApiKey is set (via remote config), it should
        // take precedence over the local liteLlmApiKey.
        const remoteLiteLlmApiKey = this.secretsCache.remoteLiteLlmApiKey;
        if (remoteLiteLlmApiKey !== undefined && remoteLiteLlmApiKey !== null && remoteLiteLlmApiKey !== "") {
            secrets.liteLlmApiKey = remoteLiteLlmApiKey;
        }
        // Build API handler settings object with task override support
        const settings = Object.fromEntries(ApiHandlerSettingsKeys.map((key) => [key, this.getSettingWithOverride(key)]));
        return { ...settings, ...secrets };
    }
    /**
     * Get all global state entries (for debugging/inspection)
     */
    getAllGlobalStateEntries() {
        if (!this.isInitialized) {
            throw new Error(STATE_MANAGER_NOT_INITIALIZED);
        }
        return { ...this.globalStateCache };
    }
    /**
     * Get all workspace state entries (for debugging/inspection)
     */
    getAllWorkspaceStateEntries() {
        if (!this.isInitialized) {
            throw new Error(STATE_MANAGER_NOT_INITIALIZED);
        }
        return { ...this.workspaceStateCache };
    }
    /**
     * Get the list of persistently trusted tool names
     */
    getTrustedTools() {
        return this.getGlobalStateKey("trustedTools") || [];
    }
    /**
     * Add a tool name to the persistent trust list
     */
    addTrustedTool(tool) {
        const trusted = new Set(this.getTrustedTools());
        if (!trusted.has(tool)) {
            trusted.add(tool);
            this.setGlobalState("trustedTools", Array.from(trusted));
        }
    }
    /**
     * Remove a tool name from the persistent trust list
     */
    removeTrustedTool(tool) {
        const trusted = new Set(this.getTrustedTools());
        if (trusted.has(tool)) {
            trusted.delete(tool);
            this.setGlobalState("trustedTools", Array.from(trusted));
        }
    }
    /**
     * Get the list of persistently trusted command prefixes
     */
    getTrustedCommands() {
        return this.getGlobalStateKey("trustedCommands") || [];
    }
    /**
     * Add a command prefix to the persistent trust list
     */
    addTrustedCommand(command) {
        const trusted = new Set(this.getTrustedCommands());
        if (!trusted.has(command)) {
            trusted.add(command);
            this.setGlobalState("trustedCommands", Array.from(trusted));
        }
    }
    /**
     * Remove a command prefix from the persistent trust list
     */
    removeTrustedCommand(command) {
        const trusted = new Set(this.getTrustedCommands());
        if (trusted.has(command)) {
            trusted.delete(command);
            this.setGlobalState("trustedCommands", Array.from(trusted));
        }
    }
    /**
     * Get the list of persistently trusted MCP servers
     */
    getTrustedMcpServers() {
        return this.getGlobalStateKey("trustedMcpServers") || [];
    }
    /**
     * Add an MCP server to the persistent trust list
     */
    addTrustedMcpServer(serverName) {
        const trusted = new Set(this.getTrustedMcpServers());
        if (!trusted.has(serverName)) {
            trusted.add(serverName);
            this.setGlobalState("trustedMcpServers", Array.from(trusted));
        }
    }
    /**
     * Remove an MCP server from the persistent trust list
     */
    removeTrustedMcpServer(serverName) {
        const trusted = new Set(this.getTrustedMcpServers());
        if (trusted.has(serverName)) {
            trusted.delete(serverName);
            this.setGlobalState("trustedMcpServers", Array.from(trusted));
        }
    }
    /**
     * Clear all persistent trust for tools and commands
     */
    clearPersistentTrust() {
        this.setGlobalStateBatch({
            trustedTools: [],
            trustedCommands: [],
            trustedMcpServers: [],
        });
    }
}
//# sourceMappingURL=StateManager.js.map