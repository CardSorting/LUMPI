import { randomUUID } from "node:crypto";
export class TaskState {
    /**
     * Identity proposed for first registration. Once registered, the lifecycle
     * projection is the only source of the active generation identifier.
     */
    proposedLifecycleGeneration = randomUUID();
    /** Authoritative committed lifecycle record projection. Written only by TaskLifecycleFunnel. */
    lifecycleFunnelRecordJson;
    /** Latest immutable lifecycle event projection. Written only after durable commit. */
    lifecycleFunnelEventJson;
    /** Bounded ordered lifecycle history projection. */
    lifecycleFunnelHistory;
    get executionGeneration() {
        if (this.lifecycleFunnelRecordJson) {
            try {
                return JSON.parse(this.lifecycleFunnelRecordJson).generationId;
            }
            catch {
                // A malformed projection cannot invent a generation; the funnel's
                // eligibility read will fail closed before execution admission.
            }
        }
        return this.proposedLifecycleGeneration;
    }
    /** Read-only compatibility projection; cancellation authority lives in the lifecycle record. */
    get abort() {
        if (!this.lifecycleFunnelRecordJson)
            return false;
        try {
            const record = JSON.parse(this.lifecycleFunnelRecordJson);
            return record.cancellation.status === "requested" || record.terminalOutcome === "cancelled";
        }
        catch {
            return true;
        }
    }
    recursionDepth = 0;
    maxTokens;
    maxCost;
    // Task-level timing
    taskStartTimeMs = Date.now();
    taskFirstTokenTimeMs;
    // Streaming flags
    isStreaming = false;
    isWaitingForFirstChunk = false;
    didCompleteReadingStream = false;
    // Content processing
    currentStreamingContentIndex = 0;
    assistantMessageContent = [];
    userMessageContent = [];
    userMessageContentReady = false;
    // Map of tool names to their tool_use_id for creating proper ToolResultBlockParam
    toolUseIdMap = new Map();
    // Presentation locks
    presentAssistantMessageLocked = false;
    presentAssistantMessageHasPendingUpdates = false;
    // Ask/Response handling
    askResponse;
    askResponseText;
    askResponseImages;
    askResponseFiles;
    lastMessageTs;
    // Plan mode specific state
    didRespondToPlanAskBySwitchingMode = false;
    // Mid-stream user steering (message sent while agent is working)
    steeringInterruptRequested = false;
    pendingSteeringFeedback;
    // Between-turn user feedback (after a response completes, before the next API request)
    idleGapFeedbackRequested = false;
    idleGapFeedbackAcknowledged = false;
    pendingIdleGapFeedback;
    // Context and history
    conversationHistoryDeletedRange;
    // Tool execution flags
    didEditFile = false;
    lastToolName = ""; // Track last tool used for consecutive call detection
    /** Sole modern execution authority cached as one immutable funnel event. */
    executionFunnelEventJson;
    /** Bounded terminal audit trail. Non-terminal handler/UI messages are never authority. */
    executionFunnelHistory;
    /** Current-generation replay ledger; bounded event history is not replay authority. */
    executionInvocationLedger = {};
    // Error tracking
    consecutiveMistakeCount = 0;
    doubleCheckCompletionPending = false;
    didAutomaticallyRetryFailedApiRequest = false;
    checkpointManagerErrorMessage;
    // Retry tracking for auto-retry feature
    autoRetryAttempts = 0;
    // Focus Chain / Todo List Management
    apiRequestCount = 0;
    apiRequestsSinceLastTodoUpdate = 0;
    goldenCartridgeActive = false;
    /** Ephemeral structured evidence owned by this task; never persisted as repository authority. */
    goldenCartridgeEvidenceCache = new Map();
    goldenCartridgeEvidenceGeneration = 0;
    goldenCartridgeCanonicalWorkspaceRevision;
    goldenCartridgeObservedMutationFlag = false;
    goldenCartridgeWorkingSet;
    goldenCartridgeRecentResults = new Map();
    goldenCartridgeValidationHistory = [];
    goldenCartridgeMetrics = {
        callsByVerb: {},
        cacheHits: 0,
        cacheMisses: 0,
        compressions: 0,
        patchAttempts: 0,
        patchFailures: 0,
        commands: 0,
        testCommands: 0,
        commandDurationMs: 0,
        validationRecommended: 0,
        validationReused: 0,
        validationInvalidated: 0,
        evidenceItemsReused: 0,
        evidenceItemsInvalidated: 0,
        repositoryCollectionsReused: 0,
        repositoryRevisionChanges: 0,
        lastMutationAt: undefined,
    };
    currentFocusChainChecklist = null;
    todoListWasUpdatedByUser = false;
    // Hook execution tracking for cancellation
    activeHookExecution;
    // Policy Health & Auditing
    policyHealth = PolicyHealth.STABLE;
    lastViolationDetails;
    // Auto-context summarization
    currentlySummarizing = false;
    lastAutoCompactTriggerIndex;
    // Adaptive architectural guidance
    currentTurnReadHistory = new Map();
    currentTurnTotalReadCount = 0;
    currentTurnUniqueReadCount = 0;
    currentTurnExplorationCount = 0;
    taskReadHistory = new Map();
    // Cross-Agent Intelligence (Blackboard)
    swarmBlackboard = [];
    sovereignAuditSynthesis;
    /** Active governed swarm runtime — parent may continue safe I/O while lanes execute. */
    swarmRuntime;
    // Agent ergonomics: intent routing + completion audit state
    preAuditedIntent;
    lastCompletionAudit;
    pendingCompletionAuditPersistence;
    lastAdvisoryAudit;
    /** Cache key for advisory audits (act-mode, command output) — reused at completion. */
    lastAdvisoryAuditCacheKey;
    lastAdvisoryAuditCachedAt;
    /** Deferred plan-mode audit — used as completion gate baseline when message metadata is absent. */
    lastPlanAuditMetadata;
    /** Cache key for last completion audit — avoids redundant auditTask on unchanged results. */
    lastCompletionAuditCacheKey;
    lastCompletionAuditCachedAt;
    lastCompletionAuditCheckpointHash;
    workspaceStateVersion;
    auditFindingHistory;
    actModeAuditCounter;
    completionGateBlockCount;
    /** Fingerprint of the last gate-blocked completion result — detects no-op retries. */
    lastBlockedCompletionResultFingerprint;
    /** Timestamp of last attempt_completion invocation — used for retry cooldown. */
    lastCompletionAttemptAt;
    /** Monotonic attempt counter — observability + idempotency context in gate status. */
    completionAttemptCount;
    /** Checkpoint hash at last gate block — invalidates duplicate guard when workspace changed. */
    lastGateBlockCheckpointHash;
    /** Last preflight/gate block reason — agent-parseable observability in status brief. */
    lastCompletionBlockReason;
    /** Last failed pipeline stage — cached for subagent handoff and status blocks. */
    lastCompletionFailedStage;
    /** Gate pressure tier at last block — stable | elevated | critical | tripped. */
    completionGatePressureLevel;
    /** Cached machine-parseable envelope — synced on each gate block for subagent handoff. */
    completionGateObservabilityEnvelope;
    /** Ring buffer of recent gate block events — event-sourced agent context. */
    completionGateBlockHistory;
    /** Block count when proactive gate advisory was last emitted — debounces info spam. */
    lastProactiveGuidanceBlockCount;
    /** Whether the first-attempt preflight readiness hint was emitted. */
    preflightReadinessHintEmitted;
    /** Correlation ID for the current completion attempt cycle — tracing across gate blocks. */
    completionGateSessionId;
    /** Coordinator authority diagnostics from governance paralysis / stale receipt detection. */
    governanceDiagnostics;
    /** Sole modern completion authority cached as one immutable funnel event. */
    completionFunnelEventJson;
    /** Optional post-completion documentation maintenance state; never a completion gate. */
    finalizationPhase;
    finalizationRunId;
    finalizationEvidenceJson;
    /** Cached roadmap gate recovery payload for structured agent envelope on next error format. */
    lastRoadmapGateRecovery;
    /** Graph revision — incremented on every meaningful state transition for snapshot synchronization. */
    completionGraphRevision;
    /** Graph revision at last completion attempt — used for no-op retry suppression. */
    lastCompletionAttemptGraphRevision;
    /** Whether a reconciliation debounce is active (prevents no-op retry thrashing). */
    reconciliationDebounceActive;
    /** Per-task memo for getLatestCheckpointHashFromMessages — avoids redundant message scans. */
    _cachedCheckpointHash;
    /** Per-task memo: message count at last checkpoint hash scan. */
    _cachedCheckpointMsgCount;
    /** Graph revision at the time the last completion audit was cached. */
    lastCompletionAuditGraphRevision;
    /** Checkpoint hash used for the last half-open circuit breaker probe attempt.
     * Prevents multiple probes on the same workspace checkpoint. */
    lastProbeCheckpointHash;
    recoveryBudget;
    lastProgressMarker;
    workspaceContentVersion = 0;
    auditMetadataVersion = 0;
    executionQualityCounters = {
        invalidToolCalls: 0,
        repeatedIdenticalFailures: 0,
        prematureCompletionAttempts: 0,
        recoverableCompletionBlocks: 0,
        integrityFailures: 0,
        noProgressIterations: 0,
    };
    swarmId;
    laneIndex;
    activeLockClaim;
    lastCompletionDecisionId;
    lastCompletionDecisionResult;
    // Workspace Intelligence
    workspaceIntelligenceSummary;
}
export { PolicyHealth };
var PolicyHealth;
(function (PolicyHealth) {
    PolicyHealth["STABLE"] = "stable";
    PolicyHealth["WARNING"] = "warning";
    PolicyHealth["FAILING"] = "failing";
})(PolicyHealth || (PolicyHealth = {}));
//# sourceMappingURL=TaskState.js.map