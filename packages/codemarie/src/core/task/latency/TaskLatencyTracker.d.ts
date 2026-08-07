export declare const TASK_IO_LATENCY_STAGES: readonly ["scheduler_ready", "dispatch_entered", "parameters_validated", "authority_resolved", "path_normalized", "workspace_containment_verified", "ignore_policy_resolved", "cache_lookup", "coalescer_admitted", "backend_requested", "backend_started", "first_useful_result", "backend_completed", "envelope_completed", "projection_ready"];
export type TaskIoLatencyStage = (typeof TASK_IO_LATENCY_STAGES)[number];
export type TaskLatencyEventName = "task_admitted" | "model_request_started" | "first_model_token" | "first_tool_recognized" | "first_progress_visible" | "tool_admitted" | "tool_dispatch_started" | "useful_io_started" | "useful_io_completed" | "sibling_queued" | "sibling_started" | "sibling_completed" | "completion_validation_started" | "authoritative_completion_decided" | "result_presentation_started" | "result_presentation_completed" | "persistence_scheduled" | "persistence_completed" | "persistence_failed" | TaskIoLatencyStage;
export declare const TASK_IO_COUNTER_NAMES: readonly ["statCalls", "lstatCalls", "realpathCalls", "accessCalls", "directoryReadCalls", "fileOpenCalls", "fileReadCalls", "repositorySearchSpawns", "shellSpawns", "cacheHits", "cacheMisses", "coalescedWaiters", "pathAuthorityCacheHits", "pathAuthorityCacheMisses", "ignorePolicyEvaluations", "bytesRead", "bytesCopied", "resultEnvelopeSerializationPasses", "eventLoopDelaySamples"];
export type TaskIoCounterName = (typeof TASK_IO_COUNTER_NAMES)[number];
export type TaskIoCounters = Record<TaskIoCounterName, number>;
export declare const TASK_IO_WORK_CLASSES: readonly ["metadata", "small-read", "search", "traversal", "verification-command", "mutation-command", "interactive"];
export type TaskIoWorkClass = (typeof TASK_IO_WORK_CLASSES)[number];
export interface TaskIoClassSnapshot {
    queued: number;
    active: number;
    maxQueued: number;
    maxActive: number;
    started: number;
    completed: number;
    cancelled: number;
}
export interface TaskLatencyGauges {
    eventLoopDelayMs: number;
    maxEventLoopDelayMs: number;
}
export interface TaskLatencyEvent {
    name: TaskLatencyEventName;
    atMs: number;
    invocationId?: string;
    sequence?: number;
    toolName?: string;
    status?: "queued" | "running" | "succeeded" | "failed" | "cancelled" | "skipped";
    scope?: string;
    ioClass?: TaskIoWorkClass;
}
export interface ToolIoLatencyDurations {
    readyToDispatchMs?: number;
    dispatchToParametersValidatedMs?: number;
    authorityResolutionMs?: number;
    pathNormalizationMs?: number;
    workspaceContainmentMs?: number;
    ignorePolicyResolutionMs?: number;
    cacheLookupMs?: number;
    coalescerAdmissionMs?: number;
    readyToBackendStartMs?: number;
    dispatchToBackendStartMs?: number;
    backendQueueMs?: number;
    readyToFirstUsefulResultMs?: number;
    backendToFirstUsefulResultMs?: number;
    backendDurationMs?: number;
    resultProcessingMs?: number;
    projectionMs?: number;
}
export interface ToolLatencySummary {
    invocationId: string;
    sequence?: number;
    toolName?: string;
    queueWaitMs?: number;
    executionMs?: number;
    status?: TaskLatencyEvent["status"];
    stages: Partial<Record<TaskIoLatencyStage, number>>;
    ioDurations: ToolIoLatencyDurations;
}
export interface TaskLatencySnapshot {
    events: TaskLatencyEvent[];
    taskAdmissionLatencyMs?: number;
    timeToFirstModelTokenMs?: number;
    timeToFirstRecognizedToolMs?: number;
    timeToFirstToolDispatchMs?: number;
    timeToFirstUsefulIoMs?: number;
    timeToFirstVisibleProgressMs?: number;
    presentationInducedDelayMs?: number;
    completionDecisionLatencyMs?: number;
    authoritativeResultToVisibleResultMs?: number;
    presentationOverheadMs?: number;
    postResultPersistenceDurationMs?: number;
    averageToolQueueWaitMs?: number;
    maxConcurrentSiblings: number;
    ioCounters: TaskIoCounters;
    ioGauges: TaskLatencyGauges;
    ioClasses: Record<TaskIoWorkClass, TaskIoClassSnapshot>;
    tools: ToolLatencySummary[];
}
type MonotonicClock = () => number;
/**
 * Task-local, in-memory latency evidence. Recording is deliberately fail-open:
 * diagnostics must never become execution authority or response-path I/O.
 */
export declare class TaskLatencyTracker {
    private readonly now;
    private readonly events;
    private eventCursor;
    private activeSiblings;
    private maxConcurrentSiblings;
    private readonly ioCounters;
    private readonly ioGauges;
    private readonly ioClasses;
    constructor(now?: MonotonicClock);
    mark(name: TaskLatencyEventName, detail?: Omit<TaskLatencyEvent, "name" | "atMs">): void;
    /** Mark a task-global event once, or a stage once for each invocation when invocationId is present. */
    markOnce(name: TaskLatencyEventName, detail?: Omit<TaskLatencyEvent, "name" | "atMs">): void;
    markIoStage(name: TaskIoLatencyStage, detail: Omit<TaskLatencyEvent, "name" | "atMs"> & {
        invocationId: string;
    }): void;
    incrementCounter(name: TaskIoCounterName, amount?: number): void;
    observeEventLoopDelay(delayMs: number): void;
    recordIoClassQueued(workClass: TaskIoWorkClass): void;
    recordIoClassStarted(workClass: TaskIoWorkClass): void;
    recordIoClassCompleted(workClass: TaskIoWorkClass): void;
    recordIoClassCancelled(workClass: TaskIoWorkClass, from?: "queued" | "active"): void;
    snapshot(): TaskLatencySnapshot;
    private eventsInOrder;
}
export {};
//# sourceMappingURL=TaskLatencyTracker.d.ts.map