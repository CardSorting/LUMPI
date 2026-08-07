import { type ApiHandler } from "@core/api";
import type { ApiStream } from "@core/api/transform/stream";
import { type ToolUse } from "@core/assistant-message";
import { ContextManager } from "@core/context/context-management/ContextManager";
import type { WorkspaceRootManager } from "@core/workspace/WorkspaceRootManager";
import type { ICheckpointManager } from "@integrations/checkpoints/types";
import type { ITerminalManager } from "@integrations/terminal/types";
import { BrowserSession } from "@services/browser/BrowserSession";
import type { McpHub } from "@services/mcp/McpHub";
import { type InternalDiagnosticMetadata } from "@shared/diagnostics/webviewDiagnostics";
import type { DietCodeAsk, DietCodeSay, TaskAuditMetadata } from "@shared/ExtensionMessage";
import type { HistoryItem } from "@shared/HistoryItem";
import { DietCodeDefaultTool } from "@shared/tools";
import type { DietCodeAskResponse } from "@shared/WebviewMessage";
import { type CommandExecutionOptions } from "@/integrations/terminal";
import type { DietCodeContent, DietCodeToolResponseContent } from "@/shared/messages";
import type { IController } from "../controller/types";
import type { StateManager } from "../storage/StateManager";
import { type TaskLatencySnapshot } from "./latency/TaskLatencyTracker";
import { MessageStateHandler } from "./message-state";
import { TaskState } from "./TaskState";
export type ToolResponse = DietCodeToolResponseContent;
type TaskParams = {
    controller: IController;
    mcpHub: McpHub;
    updateTaskHistory: (historyItem: HistoryItem) => Promise<HistoryItem[]>;
    postStateToWebview: () => Promise<void>;
    reinitExistingTaskFromId: (taskId: string, initialState?: Partial<TaskState>) => Promise<void>;
    cancelTask: () => Promise<void>;
    shellIntegrationTimeout: number;
    terminalReuseEnabled: boolean;
    terminalOutputLineLimit: number;
    defaultTerminalProfile: string;
    cwd: string;
    stateManager: StateManager;
    workspaceManager?: WorkspaceRootManager;
    task?: string;
    images?: string[];
    files?: string[];
    historyItem?: HistoryItem;
    taskId: string;
    taskLockAcquired: boolean;
    initialTaskState?: Partial<TaskState>;
};
export type RequestLoopResult = {
    kind: "continue";
} | {
    kind: "stop";
    reason: "suspended" | "terminal" | "cancellation_fenced" | "stale_generation" | "generation_replaced" | "lifecycle_unavailable" | "retry_dismissed" | "exception_thrown";
};
export declare class Task {
    readonly taskId: string;
    readonly ulid: string;
    private taskIsFavorited?;
    private cwd;
    private taskInitializationStartTime;
    taskState: TaskState;
    private taskRuntimeReady;
    /** True while initiateTaskLoop is running (prevents parallel agent loops). */
    private taskLoopActive;
    private idleGapContinuationInProgress;
    private stateMutex;
    private withStateLock;
    /**
     * Atomically set active hook execution with mutex protection
     * Prevents TOCTOU races when setting hook execution state
     * PUBLIC: Exposed for ToolExecutor to use
     */
    setActiveHookExecution(hookExecution: NonNullable<typeof this.taskState.activeHookExecution>): Promise<void>;
    /**
     * Atomically clear active hook execution with mutex protection
     * Prevents TOCTOU races when clearing hook execution state
     * PUBLIC: Exposed for ToolExecutor to use
     */
    clearActiveHookExecution(): Promise<void>;
    /**
     * Atomically read active hook execution state with mutex protection
     * Returns a snapshot of the current state to prevent TOCTOU races
     * PUBLIC: Exposed for ToolExecutor to use
     */
    getActiveHookExecution(): Promise<typeof this.taskState.activeHookExecution>;
    private controller;
    private mcpHub;
    api: ApiHandler;
    terminalManager: ITerminalManager;
    private urlContentFetcher;
    browserSession: BrowserSession;
    contextManager: ContextManager;
    private diffViewProvider;
    checkpointManager?: ICheckpointManager;
    private initialCheckpointCommitPromise?;
    private dietcodeIgnoreController;
    private commandPermissionController;
    private toolExecutor;
    /**
     * Whether the task is using native tool calls.
     * This is used to determine how we would format response.
     * Example: We don't add noToolsUsed response when native tool call is used
     * because of the expected format from the tool calls is different.
     */
    private useNativeToolCalls;
    private streamHandler;
    private terminalExecutionMode;
    private fileContextTracker;
    private modelContextTracker;
    private environmentContextTracker;
    private FocusChainManager?;
    private updateTaskHistory;
    private postStateToWebview;
    private reinitExistingTaskFromId;
    private cancelTask;
    private stateManager;
    private knowledgeGraphService?;
    messageStateHandler: MessageStateHandler;
    workspaceManager?: WorkspaceRootManager;
    private taskLockAcquired;
    private commandExecutor;
    private environmentLeaseSnapshot?;
    private readonly latencyTracker;
    private siblingBatchSequence;
    private activeSiblingScheduler?;
    private activeSiblingBatchPromise?;
    private ioAbortController;
    private activeSingleIoPromise?;
    /** Owned advisory tail; canonical tool settlement never awaits presentation. */
    private presentationReplayTail;
    constructor(params: TaskParams);
    private refreshEnvironmentLease;
    /** Task-local advisory timing evidence for tests and development diagnostics. */
    getLatencySnapshot(): TaskLatencySnapshot;
    ask(type: DietCodeAsk, text?: string, partial?: boolean): Promise<{
        response: DietCodeAskResponse;
        text?: string;
        images?: string[];
        files?: string[];
        askTs?: number;
    }>;
    handleWebviewAskResponse(askResponse: DietCodeAskResponse, text?: string, images?: string[], files?: string[]): Promise<void>;
    private hasUnansweredAsk;
    private consumeIdleGapFeedbackIfPending;
    private queueIdleGapFeedback;
    private rollbackStagedApiUserTurn;
    /**
     * When feedback arrives while the task loop is idle, restart the agent loop to process it.
     * When the loop is active, injection checkpoints inside recursivelyMakeDietCodeRequests handle it.
     */
    private scheduleIdleGapContinuation;
    private resumeTaskLoopForQueuedIdleGapFeedback;
    private continueFromSteeringInterrupt;
    say(type: DietCodeSay, text?: string, images?: string[], files?: string[], partial?: boolean, auditMetadata?: TaskAuditMetadata, completionFunnelEvent?: import("@shared/completion/completionFunnelEvent").CompletionFunnelEvent, diagnostics?: InternalDiagnosticMetadata): Promise<number | undefined>;
    sayAndCreateMissingParamError(toolName: DietCodeDefaultTool, paramName: string, relPath?: string): Promise<any>;
    removeLastPartialMessageIfExistsWithType(type: "ask" | "say", askOrSay: DietCodeAsk | DietCodeSay): Promise<void>;
    private saveCheckpointCallback;
    /**
     * Check if parallel tool calling is enabled.
     * Parallel tool calling is enabled if:
     * 1. User has enabled it in settings, OR
     * 2. The current model/provider supports native tool calling and handles parallel tools well
     */
    private isParallelToolCallingEnabled;
    private switchToActModeCallback;
    private switchToPlanModeCallback;
    private handleHookCancellation;
    /**
     * Calculate the new deleted range for PreCompact hook
     * @param apiConversationHistory The full API conversation history
     * @returns Tuple with start and end indices for the deleted range
     */
    private calculatePreCompactDeletedRange;
    private runUserPromptSubmitHook;
    isRuntimeReady(): boolean;
    private lifecycleAuthority;
    private requireLifecycleCommit;
    private activateNewTaskLifecycle;
    private prepareResumeLifecycle;
    private commitResumeLifecycle;
    startTask(task?: string, images?: string[], files?: string[]): Promise<void>;
    private resolveResumeAskType;
    resumeTaskFromHistory(): Promise<void>;
    private initiateTaskLoop;
    private shouldRunTaskCancelHook;
    abortTask(options?: {
        reason?: string;
    }): Promise<void>;
    executeCommandTool(command: string, timeoutSeconds: number | undefined, options?: CommandExecutionOptions): Promise<[boolean, DietCodeToolResponseContent]>;
    /**
     * Cancel a background command that is running in the background
     * @returns true if a command was cancelled, false if no command was running
     */
    cancelBackgroundCommand(ownerId?: string): Promise<boolean>;
    /**
     * Cancel a currently running hook execution
     * @returns true if a hook was cancelled, false if no hook was running
     */
    cancelHookExecution(): Promise<boolean>;
    private isHarnessTerminalForNoToolsNudge;
    private buildNoToolsUsedNudge;
    private getCurrentProviderInfo;
    private writePromptMetadataArtifacts;
    private getApiRequestIdSafe;
    private handleContextWindowExceededError;
    private applySilentTurnBoundaryContextRollover;
    attemptApiRequest(previousApiReqIndex: number): ApiStream;
    private resolveSiblingWorkspaceLocality;
    private replaySiblingPresentation;
    private scheduleSiblingPresentation;
    private executeSiblingToolBatch;
    presentAssistantMessage(): Promise<void>;
    recursivelyMakeDietCodeRequests(userContent: DietCodeContent[], includeFileDetails?: boolean, loopGenerationId?: any): Promise<RequestLoopResult>;
    loadContext(userContent: DietCodeContent[], includeFileDetails?: boolean, useCompactPrompt?: boolean): Promise<[DietCodeContent[], string, boolean]>;
    processNativeToolCalls(assistantTextOnly: string, toolBlocks: ToolUse[]): Promise<void>;
    /**
     * Format workspace roots section for multi-root workspaces
     */
    private formatWorkspaceRootsSection;
    /**
     * Get the display name for the primary workspace
     */
    private getPrimaryWorkspaceName;
    /**
     * Format the file details header based on workspace configuration
     */
    private formatFileDetailsHeader;
    getEnvironmentDetails(includeFileDetails?: boolean): Promise<string>;
    private getKnowledgeGraphService;
    private loadWorkspaceIntelligence;
}
export {};
//# sourceMappingURL=index.d.ts.map