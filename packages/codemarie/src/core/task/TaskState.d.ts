import type { Anthropic } from "@anthropic-ai/sdk";
import type { AssistantMessageContent } from "@core/assistant-message";
import type { TaskAuditMetadata } from "@shared/ExtensionMessage";
import type { ExecutionFunnelEvent } from "@shared/execution/executionFunnelEvent";
import type { LockClaim } from "@shared/governance/lockTypes";
import type { TaskLifecycleEvent } from "@shared/lifecycle/taskLifecycleEvent";
import type { WorkLaneClaim } from "@shared/subagent/governedExecution";
import type { DietCodeAskResponse } from "@shared/WebviewMessage";
import type { HookExecution } from "./types/HookExecution";
export declare class TaskState {
    /**
     * Identity proposed for first registration. Once registered, the lifecycle
     * projection is the only source of the active generation identifier.
     */
    private readonly proposedLifecycleGeneration;
    /** Authoritative committed lifecycle record projection. Written only by TaskLifecycleFunnel. */
    lifecycleFunnelRecordJson?: string;
    /** Latest immutable lifecycle event projection. Written only after durable commit. */
    lifecycleFunnelEventJson?: string;
    /** Bounded ordered lifecycle history projection. */
    lifecycleFunnelHistory?: readonly TaskLifecycleEvent[];
    get executionGeneration(): string;
    /** Read-only compatibility projection; cancellation authority lives in the lifecycle record. */
    get abort(): boolean;
    recursionDepth: number;
    maxTokens?: number;
    maxCost?: number;
    taskStartTimeMs: number;
    taskFirstTokenTimeMs?: number;
    isStreaming: boolean;
    isWaitingForFirstChunk: boolean;
    didCompleteReadingStream: boolean;
    currentStreamingContentIndex: number;
    assistantMessageContent: AssistantMessageContent[];
    userMessageContent: (Anthropic.TextBlockParam | Anthropic.ImageBlockParam | Anthropic.ToolResultBlockParam)[];
    userMessageContentReady: boolean;
    toolUseIdMap: Map<string, string>;
    presentAssistantMessageLocked: boolean;
    presentAssistantMessageHasPendingUpdates: boolean;
    askResponse?: DietCodeAskResponse;
    askResponseText?: string;
    askResponseImages?: string[];
    askResponseFiles?: string[];
    lastMessageTs?: number;
    didRespondToPlanAskBySwitchingMode: boolean;
    steeringInterruptRequested: boolean;
    pendingSteeringFeedback?: {
        text?: string;
        images?: string[];
        files?: string[];
    };
    idleGapFeedbackRequested: boolean;
    idleGapFeedbackAcknowledged: boolean;
    pendingIdleGapFeedback?: {
        text?: string;
        images?: string[];
        files?: string[];
    };
    conversationHistoryDeletedRange?: [number, number];
    didEditFile: boolean;
    lastToolName: string;
    /** Sole modern execution authority cached as one immutable funnel event. */
    executionFunnelEventJson?: string;
    /** Bounded terminal audit trail. Non-terminal handler/UI messages are never authority. */
    executionFunnelHistory?: ExecutionFunnelEvent[];
    /** Current-generation replay ledger; bounded event history is not replay authority. */
    executionInvocationLedger: Record<string, ExecutionFunnelEvent["phase"]>;
    consecutiveMistakeCount: number;
    doubleCheckCompletionPending: boolean;
    didAutomaticallyRetryFailedApiRequest: boolean;
    checkpointManagerErrorMessage?: string;
    autoRetryAttempts: number;
    apiRequestCount: number;
    apiRequestsSinceLastTodoUpdate: number;
    goldenCartridgeActive: boolean;
    /** Ephemeral structured evidence owned by this task; never persisted as repository authority. */
    goldenCartridgeEvidenceCache: Map<string, {
        revision: number;
        verb: string;
        result: unknown;
        evidence: unknown[];
        createdAt: number;
    }>;
    goldenCartridgeEvidenceGeneration: number;
    goldenCartridgeCanonicalWorkspaceRevision?: number;
    goldenCartridgeObservedMutationFlag: boolean;
    goldenCartridgeWorkingSet?: Record<string, unknown>;
    goldenCartridgeRecentResults: Map<string, unknown>;
    goldenCartridgeValidationHistory: import("@shared/golden-cartridge").GoldenCartridgeValidationObservation[];
    goldenCartridgeMetrics: {
        callsByVerb: Record<string, number>;
        cacheHits: number;
        cacheMisses: number;
        compressions: number;
        patchAttempts: number;
        patchFailures: number;
        commands: number;
        testCommands: number;
        commandDurationMs: number;
        validationRecommended: number;
        validationReused: number;
        validationInvalidated: number;
        evidenceItemsReused: number;
        evidenceItemsInvalidated: number;
        repositoryCollectionsReused: number;
        repositoryRevisionChanges: number;
        lastMutationAt: number | undefined;
    };
    currentFocusChainChecklist: string | null;
    todoListWasUpdatedByUser: boolean;
    activeHookExecution?: HookExecution;
    policyHealth: PolicyHealth;
    lastViolationDetails?: {
        violations: string[];
        hint?: string;
    };
    currentlySummarizing: boolean;
    lastAutoCompactTriggerIndex?: number;
    currentTurnReadHistory: Map<string, number>;
    currentTurnTotalReadCount: number;
    currentTurnUniqueReadCount: number;
    currentTurnExplorationCount: number;
    taskReadHistory: Map<string, number>;
    swarmBlackboard: string[];
    sovereignAuditSynthesis?: string;
    /** Active governed swarm runtime — parent may continue safe I/O while lanes execute. */
    swarmRuntime?: {
        swarmId: string;
        startedAt: number;
        lanesTotal: number;
        lanesComplete: number;
        lanesDegraded: number;
        lanesHardBlocked: number;
        parentIdleSince?: number;
        advisoryNoiseSuppressed: number;
    };
    preAuditedIntent?: string;
    lastCompletionAudit?: TaskAuditMetadata;
    pendingCompletionAuditPersistence?: TaskAuditMetadata;
    lastAdvisoryAudit?: TaskAuditMetadata;
    /** Cache key for advisory audits (act-mode, command output) — reused at completion. */
    lastAdvisoryAuditCacheKey?: string;
    lastAdvisoryAuditCachedAt?: number;
    /** Deferred plan-mode audit — used as completion gate baseline when message metadata is absent. */
    lastPlanAuditMetadata?: TaskAuditMetadata;
    /** Cache key for last completion audit — avoids redundant auditTask on unchanged results. */
    lastCompletionAuditCacheKey?: string;
    lastCompletionAuditCachedAt?: number;
    lastCompletionAuditCheckpointHash?: string;
    workspaceStateVersion?: number;
    auditFindingHistory?: any[];
    actModeAuditCounter?: number;
    completionGateBlockCount?: number;
    /** Fingerprint of the last gate-blocked completion result — detects no-op retries. */
    lastBlockedCompletionResultFingerprint?: string;
    /** Timestamp of last attempt_completion invocation — used for retry cooldown. */
    lastCompletionAttemptAt?: number;
    /** Monotonic attempt counter — observability + idempotency context in gate status. */
    completionAttemptCount?: number;
    /** Checkpoint hash at last gate block — invalidates duplicate guard when workspace changed. */
    lastGateBlockCheckpointHash?: string;
    /** Last preflight/gate block reason — agent-parseable observability in status brief. */
    lastCompletionBlockReason?: string;
    /** Last failed pipeline stage — cached for subagent handoff and status blocks. */
    lastCompletionFailedStage?: string;
    /** Gate pressure tier at last block — stable | elevated | critical | tripped. */
    completionGatePressureLevel?: string;
    /** Cached machine-parseable envelope — synced on each gate block for subagent handoff. */
    completionGateObservabilityEnvelope?: string;
    /** Ring buffer of recent gate block events — event-sourced agent context. */
    completionGateBlockHistory?: Array<{
        reason: string;
        stage: string;
        at: number;
        soft: boolean;
        blockCount: number;
    }>;
    /** Block count when proactive gate advisory was last emitted — debounces info spam. */
    lastProactiveGuidanceBlockCount?: number;
    /** Whether the first-attempt preflight readiness hint was emitted. */
    preflightReadinessHintEmitted?: boolean;
    /** Correlation ID for the current completion attempt cycle — tracing across gate blocks. */
    completionGateSessionId?: string;
    /** Coordinator authority diagnostics from governance paralysis / stale receipt detection. */
    governanceDiagnostics?: import("@shared/subagent/coordinatorAuthority").GovernanceDiagnosticEvent[];
    /** Sole modern completion authority cached as one immutable funnel event. */
    completionFunnelEventJson?: string;
    /** Optional post-completion documentation maintenance state; never a completion gate. */
    finalizationPhase?: "ready" | "running" | "completed" | "failed";
    finalizationRunId?: string;
    finalizationEvidenceJson?: string;
    /** Cached roadmap gate recovery payload for structured agent envelope on next error format. */
    lastRoadmapGateRecovery?: {
        remediationSteps?: string[];
        blockingGates?: Array<{
            id?: string;
            label: string;
            why: string;
            fix?: string;
        }>;
        autoClearableOnly?: boolean;
    };
    /** Graph revision — incremented on every meaningful state transition for snapshot synchronization. */
    completionGraphRevision?: number;
    /** Graph revision at last completion attempt — used for no-op retry suppression. */
    lastCompletionAttemptGraphRevision?: number;
    /** Whether a reconciliation debounce is active (prevents no-op retry thrashing). */
    reconciliationDebounceActive?: boolean;
    /** Per-task memo for getLatestCheckpointHashFromMessages — avoids redundant message scans. */
    _cachedCheckpointHash?: string;
    /** Per-task memo: message count at last checkpoint hash scan. */
    _cachedCheckpointMsgCount?: number;
    /** Graph revision at the time the last completion audit was cached. */
    lastCompletionAuditGraphRevision?: number;
    /** Checkpoint hash used for the last half-open circuit breaker probe attempt.
     * Prevents multiple probes on the same workspace checkpoint. */
    lastProbeCheckpointHash?: string;
    recoveryBudget?: {
        taskId: string;
        maxAttempts: number;
        attemptsUsed: number;
        maxElapsedMs: number;
        startedAt: number;
        maxNoProgressAttempts: number;
        noProgressAttempts: number;
        lastProgressVersion: number;
    };
    lastProgressMarker?: {
        workspaceContentVersion: number;
        auditMetadataVersion: number;
        completedLaneCount: number;
        activeBlockerCount: number;
    };
    workspaceContentVersion: number;
    auditMetadataVersion: number;
    executionQualityCounters: {
        invalidToolCalls: number;
        repeatedIdenticalFailures: number;
        prematureCompletionAttempts: number;
        recoverableCompletionBlocks: number;
        integrityFailures: number;
        noProgressIterations: number;
    };
    swarmId?: string;
    laneIndex?: number;
    activeLockClaim?: LockClaim | WorkLaneClaim;
    lastCompletionDecisionId?: string;
    lastCompletionDecisionResult?: string;
    workspaceIntelligenceSummary?: string;
}
export declare enum PolicyHealth {
    STABLE = "stable",
    WARNING = "warning",
    FAILING = "failing"
}
//# sourceMappingURL=TaskState.d.ts.map