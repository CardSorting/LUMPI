import type { Anthropic } from "@anthropic-ai/sdk";
import type { WorkspaceRootManager } from "@core/workspace/WorkspaceRootManager";
import { DietCodeAccountService } from "@services/account/DietCodeAccountService";
import { McpHub } from "@services/mcp/McpHub";
import type { ModelInfo } from "@shared/api";
import type { ChatContent } from "@shared/ChatContent";
import type { ExtensionState } from "@shared/ExtensionMessage";
import type { HistoryItem } from "@shared/HistoryItem";
import type { McpMarketplaceCatalog } from "@shared/mcp";
import type { Settings } from "@shared/storage/state-keys";
import type { Mode } from "@shared/storage/types";
import type { TelemetrySetting } from "@shared/TelemetrySetting";
import type { UserInfo } from "@shared/UserInfo";
import { AuthService } from "@/services/auth/AuthService";
import { OcaAuthService } from "@/services/auth/oca/OcaAuthService";
import type { DietCodeExtensionContext } from "@/shared/dietcode";
import { SpiderEngine } from "../policy/spider/SpiderEngine.ts";
import { StateManager } from "../storage/StateManager.ts";
import { Task } from "../task/index.ts";
import type { TaskState } from "../task/TaskState.ts";
import type { IController } from "./types.ts";
export declare class Controller implements IController {
    readonly context: DietCodeExtensionContext;
    task?: Task;
    mcpHub: McpHub;
    accountService: DietCodeAccountService;
    authService: AuthService;
    ocaAuthService: OcaAuthService;
    readonly stateManager: StateManager;
    private workspaceManager?;
    private backgroundCommandRunning;
    private backgroundCommandTaskId?;
    /** Coalesces duplicate UI requests; lifecycle truth remains in TaskLifecycleFunnel. */
    private activeCancellation?;
    private remoteConfigTimer?;
    ensureWorkspaceManager(): Promise<WorkspaceRootManager | undefined>;
    getWorkspaceManager(): WorkspaceRootManager | undefined;
    private spider?;
    private spiderInitPromise?;
    getSpiderEngine(): Promise<SpiderEngine>;
    createTask(prompt: string): Promise<string>;
    /**
     * Starts the periodic remote config fetching timer
     * Fetches immediately and then every hour
     */
    private startRemoteConfigTimer;
    constructor(context: DietCodeExtensionContext);
    dispose(): Promise<void>;
    handleSignOut(): Promise<void>;
    handleOcaSignOut(): Promise<void>;
    setUserInfo(info?: UserInfo): Promise<void>;
    initTask(task?: string, images?: string[], files?: string[], historyItem?: HistoryItem, taskSettings?: Partial<Settings>, initialTaskState?: Partial<TaskState>): Promise<string>;
    reinitExistingTaskFromId(taskId: string, initialState?: Partial<TaskState>): Promise<void>;
    updateTelemetrySetting(telemetrySetting: TelemetrySetting): Promise<void>;
    toggleActModeForYoloMode(): Promise<boolean>;
    switchToPlanModeForAgent(): Promise<boolean>;
    private switchAgentMode;
    togglePlanActMode(modeToSwitchTo: Mode, _chatContent?: ChatContent): Promise<boolean>;
    cancelTask(): Promise<void>;
    private performCancellation;
    updateBackgroundCommandState(running: boolean, taskId?: string): void;
    cancelBackgroundCommand(): Promise<void>;
    handleAuthCallback(customToken: string, provider?: string | null, state?: string | null): Promise<void>;
    handleOcaAuthCallback(code: string, state: string): Promise<void>;
    handleMcpOAuthCallback(serverHash: string, code: string, state: string | null): Promise<void>;
    handleTaskCreation(prompt: string): Promise<string>;
    private fetchMcpMarketplaceFromApi;
    refreshMcpMarketplace(sendCatalogEvent: boolean): Promise<McpMarketplaceCatalog | undefined>;
    handleOpenRouterCallback(code: string): Promise<void>;
    handleRequestyCallback(code: string): Promise<void>;
    readOpenRouterModels(): Promise<Record<string, ModelInfo> | undefined>;
    handleHicapCallback(code: string): Promise<void>;
    getTaskWithId(id: string): Promise<{
        historyItem: HistoryItem;
        taskDirPath: string;
        apiConversationHistoryFilePath: string;
        uiMessagesFilePath: string;
        contextHistoryFilePath: string;
        taskMetadataFilePath: string;
        apiConversationHistory: Anthropic.MessageParam[];
    }>;
    getExportData(id: string): Promise<{
        version: string;
        historyItem: HistoryItem;
        apiConversationHistory: Anthropic.MessageParam[];
        uiMessages: any;
        contextHistory: any;
        taskMetadata: any;
    }>;
    importTask(importData: any): Promise<void>;
    exportTaskWithId(id: string): Promise<void>;
    deleteTaskFromState(id: string): Promise<any>;
    postStateToWebview(): Promise<void>;
    getStateToPostToWebview(): Promise<ExtensionState>;
    clearTask(): Promise<void>;
    updateTaskHistory(item: HistoryItem): Promise<HistoryItem[]>;
}
//# sourceMappingURL=index.d.ts.map