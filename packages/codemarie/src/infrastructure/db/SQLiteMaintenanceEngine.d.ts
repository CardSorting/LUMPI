export interface RetentionPolicy {
    /** Max age in milliseconds for telemetry rows (default: 30 days) */
    telemetryMaxAgeMs?: number;
    /** Max rows to retain in telemetry (default: 25000) */
    telemetryMaxRows?: number;
    /** Max age in milliseconds for audit_events (default: 30 days) */
    auditMaxAgeMs?: number;
    /** Max rows to retain in audit_events (default: 25000) */
    auditMaxRows?: number;
    /** Max age for completed task lifecycle events (default: 14 days) */
    taskEventsMaxAgeMs?: number;
    /** Max rows to retain in nodes table (default: 10000) */
    nodesMaxRows?: number;
    /** Max rows to retain in trees table (default: 10000) */
    treesMaxRows?: number;
    /** Max age in milliseconds for stashes (default: 14 days) */
    stashesMaxAgeMs?: number;
    /** Max age in milliseconds for completed/failed streams (default: 14 days) */
    streamsMaxAgeMs?: number;
    /** Max age in milliseconds for completed/failed tasks (default: 14 days) */
    tasksMaxAgeMs?: number;
    /** Max age in milliseconds for decisions (default: 30 days) */
    decisionsMaxAgeMs?: number;
}
export declare class SQLiteMaintenanceEngine {
    private policy;
    private maintenanceInterval;
    private isRunning;
    constructor(policy?: RetentionPolicy);
    start(intervalMs?: number): void;
    stop(): void;
    runMaintenance(options?: {
        forceTruncateWal?: boolean;
    }): Promise<{
        prunedClaims: number;
        prunedLocks: number;
        prunedTelemetry: number;
        prunedAuditEvents: number;
        prunedKnowledge: number;
        prunedReflogs: number;
        prunedNodes: number;
        prunedTrees: number;
        prunedFiles: number;
        prunedOrphanEdges: number;
        prunedStreamsAndTasks: number;
        prunedDecisions: number;
        freelistPagesVacuumed: number;
        walCheckpointResult: {
            busy: number;
            log: number;
            checkpointed: number;
        };
        ftsOptimized: boolean;
    }>;
    getStorageHealthReport(): Promise<{
        fileSizeBytes: number;
        walSizeBytes: number;
        freelistCount: number;
        fragmentationRatio: number;
        healthStatus: "healthy" | "bloated" | "critical";
        recommendations: string[];
    }>;
}
export declare const sqliteMaintenanceEngine: SQLiteMaintenanceEngine;
//# sourceMappingURL=SQLiteMaintenanceEngine.d.ts.map