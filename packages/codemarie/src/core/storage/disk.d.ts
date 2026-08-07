import type { Anthropic } from "@anthropic-ai/sdk";
import type { EnvironmentMetadataEntry, TaskMetadata } from "@core/context/context-tracking/ContextTrackerTypes";
import type { DietCodeMessage } from "@shared/ExtensionMessage";
import type { HistoryItem } from "@shared/HistoryItem";
import type { RemoteConfig } from "@shared/remote-config/schema";
import type { GlobalState, Settings } from "@shared/storage/state-keys";
import type { McpMarketplaceCatalog } from "@/shared/mcp";
import type { DietCodeStorageMessage } from "@/shared/messages/content";
/**
 * NOTE: `reconstructTaskHistory` (../commands/reconstructTaskHistory) and
 * `StateManager` (./StateManager) are intentionally imported lazily via dynamic
 * `import()` at their single call sites below. Both are higher-level modules
 * that depend (transitively) on this low-level IO module, so a static import
 * here would invert the dependency direction and form a circular dependency.
 * Lazy import keeps the static graph acyclic; the runtime cost is negligible
 * (modules are cached after first load, and StateManager is a singleton).
 */
/**
 * Atomically write data to a file using temp file + rename pattern.
 * This prevents readers from seeing partial/incomplete data by writing to a temporary
 * file first, then renaming it to the target location. The rename operation is atomic
 * in most cases on modern systems, though behavior may vary across platforms and filesystems.
 *
 * @param filePath - The target file path
 * @param data - The data to write
 */
export declare function atomicWriteFile(filePath: string, data: string, updateChecksum?: boolean, createBackup?: boolean): Promise<void>;
/**
 * Sweeps orphaned .tmp write-behind files created during interrupted atomic writes to halt disk erosion.
 */
export declare function cleanStaleTempFiles(dirPath: string, maxAgeMs?: number): Promise<number>;
export declare function calculateFileChecksum(filePath: string): Promise<string>;
export declare function verifyIntegrity(settingsDir: string): Promise<{
    ok: boolean;
    mismatched: string[];
}>;
export declare const GlobalFileNames: {
    apiConversationHistory: string;
    contextHistory: string;
    uiMessages: string;
    dietcodeRecommendedModels: string;
    dietcodeModels: string;
    openRouterModels: string;
    vercelAiGatewayModels: string;
    groqModels: string;
    basetenModels: string;
    hicapModels: string;
    nousResearchModels: string;
    mcpSettings: string;
    dietcodeRules: string;
    workflows: string;
    hooksDir: string;
    dietcoderuleSkillsDir: string;
    dietcodeSkillsDir: string;
    claudeSkillsDir: string;
    agentsSkillsDir: string;
    cursorRulesDir: string;
    cursorRulesFile: string;
    windsurfRules: string;
    agentsRulesFile: string;
    taskMetadata: string;
    mcpMarketplaceCatalog: string;
    remoteConfig: (orgId: string) => string;
};
export declare function getDocumentsPath(): Promise<string>;
/**
 * Returns the cross-platform path to the DietCode home directory (~/.dietcode).
 * This works on macOS, Linux, and Windows:
 * - macOS: /Users/username/.dietcode
 * - Linux: /home/username/.dietcode
 * - Windows: C:\Users\username\.dietcode
 *
 * This is intended to eventually replace ~/Documents/DietCode as the global config location.
 */
export declare function getDietCodeHomePath(): string;
export declare function ensureTaskDirectoryExists(taskId: string): Promise<string>;
export declare function ensureRulesDirectoryExists(): Promise<string>;
export declare function ensureWorkflowsDirectoryExists(): Promise<string>;
export declare function ensureMcpServersDirectoryExists(): Promise<string>;
export declare function ensureHooksDirectoryExists(): Promise<string>;
/**
 * Returns the global agent skills directory path (~/.agents/skills).
 * Creates the directory if it doesn't exist.
 * This is the opinionated location for new global skills.
 */
export declare function ensureAgentSkillsDirectoryExists(options: {
    isGlobal: boolean;
    workspacePath?: string;
}): Promise<string>;
export type SkillsScanDirectory = {
    path: string;
    source: "project" | "global";
};
/**
 * Returns the list of skills directories to scan without creating them.
 * Order is project directories first, then global directories.
 */
export declare function getSkillsDirectoriesForScan(cwd: string): SkillsScanDirectory[];
export declare function ensureSettingsDirectoryExists(): Promise<string>;
/**
 * Gets the path to the MCP settings file, creating it if it doesn't exist
 * @param settingsDirectoryPath Path to the settings directory
 * @returns Path to the MCP settings file
 */
export declare function getMcpSettingsFilePath(settingsDirectoryPath: string): Promise<string>;
export declare function getSavedApiConversationHistory(taskId: string): Promise<DietCodeStorageMessage[]>;
export declare function saveApiConversationHistory(taskId: string, apiConversationHistory: Anthropic.MessageParam[], immediate?: boolean): Promise<void>;
export declare function getSavedDietCodeMessages(taskId: string): Promise<DietCodeMessage[]>;
export declare function saveDietCodeMessages(taskId: string, uiMessages: DietCodeMessage[], immediate?: boolean): Promise<void>;
/**
 * Collects environment metadata for the current system and host.
 * This information is used for debugging and task portability.
 * Returns metadata without timestamp - timestamp is added by EnvironmentContextTracker.
 */
export declare function collectEnvironmentMetadata(): Promise<Omit<EnvironmentMetadataEntry, "ts">>;
export declare function getTaskMetadata(taskId: string): Promise<TaskMetadata>;
export declare function saveTaskMetadata(taskId: string, metadata: TaskMetadata, immediate?: boolean): Promise<void>;
export declare function ensureStateDirectoryExists(): Promise<string>;
export declare function ensureCacheDirectoryExists(): Promise<string>;
export declare function readMcpMarketplaceCatalogFromCache(): Promise<McpMarketplaceCatalog | undefined>;
export declare function writeMcpMarketplaceCatalogToCache(catalog: McpMarketplaceCatalog): Promise<void>;
export declare function getTaskHistoryStateFilePath(): Promise<string>;
export declare function taskHistoryStateFileExists(): Promise<boolean>;
export declare function readTaskHistoryFromState(): Promise<HistoryItem[]>;
export declare function writeTaskHistoryToState(items: HistoryItem[]): Promise<void>;
export declare function readTaskSettingsFromStorage(taskId: string): Promise<Partial<GlobalState>>;
export declare function writeTaskSettingsToStorage(taskId: string, settings: Partial<Settings>): Promise<void>;
export declare function readRemoteConfigFromCache(organizationId: string): Promise<RemoteConfig | undefined>;
export declare function writeRemoteConfigToCache(organizationId: string, config: RemoteConfig): Promise<void>;
export declare function deleteRemoteConfigFromCache(organizationId: string): Promise<void>;
/**
 * Gets the path to the global hooks directory if it exists.
 * Returns undefined if the directory doesn't exist.
 */
export declare function getGlobalHooksDir(): Promise<string | undefined>;
/**
 * Gets the paths to all hooks directories to search for hooks, including:
 * 1. The global hooks directory (if it exists)
 * 2. Each workspace root's .dietcoderules/hooks directory (if they exist)
 *
 * Note: Hooks from different directories may be executed concurrently.
 * No execution order is guaranteed between hooks from different directories.
 * A workspace may not use hooks, and the resulting array will be empty. A
 * multi-root workspace may have multiple hooks directories.
 */
export declare function getAllHooksDirs(): Promise<string[]>;
/**
 * Gets the paths to the workspace's .dietcoderules/hooks directories to search for
 * hooks. A workspace may not use hooks, and the resulting array will be empty. A
 * multi-root workspace may have multiple hooks directories.
 */
export declare function getWorkspaceHooksDirs(): Promise<string[]>;
/**
 * Writes the conversation history to a temporary JSON file for PreCompact hook consumption.
 * The file is created in the task's directory with a unique timestamp-based name.
 * Returns the absolute path to the created file.
 *
 * @param taskId The task ID
 * @param apiConversationHistory The conversation history to write
 * @param timestamp Optional timestamp to use for the filename (defaults to Date.now())
 * @returns The absolute path to the temporary file
 */
export declare function writeConversationHistoryJson(taskId: string, apiConversationHistory: Anthropic.MessageParam[], timestamp?: number): Promise<string>;
/**
 * Cleans up a temporary conversation history file created for hook execution.
 * Silently handles errors (file already deleted, permissions, etc.)
 *
 * @param filePath The path to the temporary file to delete
 */
export declare function cleanupConversationHistoryFile(filePath: string): Promise<void>;
/**
 * Writes the conversation history in human-readable text format to a temporary file for PreCompact hook consumption.
 * This formats the conversation history (user and assistant messages) in a readable text format,
 * making it easy to analyze the conversation flow without parsing JSON.
 *
 * @param taskId The task ID
 * @param conversationHistory The conversation history messages
 * @param timestamp Optional timestamp to use for the filename (defaults to Date.now())
 * @returns The absolute path to the temporary file
 */
export declare function writeConversationHistoryText(taskId: string, conversationHistory: Anthropic.MessageParam[], timestamp?: number): Promise<string>;
//# sourceMappingURL=disk.d.ts.map