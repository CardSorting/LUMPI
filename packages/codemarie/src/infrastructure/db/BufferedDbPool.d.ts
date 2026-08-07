import { type Schema } from "./Config";
export type DbLayer = "domain" | "infrastructure" | "ui" | "plumbing";
type WhereCondition = {
    column: string;
    value: string | number | string[] | number[] | null;
    operator?: "=" | "<" | ">" | "<=" | ">=" | "!=" | "IN" | "in" | "In" | "UNSAFE_IN" | "IS" | "IS NOT" | "LIKE";
};
export type Increment = {
    _type: "increment";
    value: number;
};
export type WriteOp = {
    type: "insert" | "update" | "delete" | "upsert";
    table: keyof Schema;
    values?: Record<string, unknown | Increment>;
    where?: WhereCondition | WhereCondition[];
    conflictTarget?: string | string[];
    agentId?: string;
    layer?: DbLayer;
    hasIncrements?: boolean;
    dedupKey?: string;
};
/**
 * Factory creating monomorphic WriteOp instances with constant V8 property layout.
 */
export declare function createMonomorphicWriteOp(type: WriteOp["type"], table: keyof Schema, values?: Record<string, unknown | Increment>, where?: WhereCondition | WhereCondition[], conflictTarget?: string | string[], agentId?: string, layer?: DbLayer, hasIncrements?: boolean, dedupKey?: string): WriteOp;
/**
 * BufferedDbPool provides a high-performance, asynchronous write-behind layer
 * over SQLite. It batches operations, manages agent-specific uncommitted state,
 * and ensures data consistency between in-memory buffers and on-disk storage.
 */
export declare class BufferedDbPool {
    private bufferA;
    private bufferB;
    private activeBuffer;
    private inFlightOps;
    private agentShadows;
    private stateMutex;
    private flushMutex;
    private flushInterval;
    private db;
    private rawDb;
    private totalTransactions;
    private stmtCache;
    private readonly MAX_STMT_CACHE_SIZE;
    private parameterBuffer;
    private activeBufferSize;
    private inFlightSize;
    private activeIndex;
    private inFlightIndex;
    private warmedIndices;
    private opsFlushedSinceMaintenance;
    private readonly MAINTENANCE_OPS_THRESHOLD;
    private started;
    private stopped;
    constructor();
    private flushTimeout;
    private currentFlushDelay;
    /**
     * Adaptive flush scheduling.
     */
    private scheduleFlush;
    private cleanupInterval;
    private startFlushLoop;
    private ensureStarted;
    private cleanupShadows;
    beginWork(agentId: string): Promise<void>;
    push(op: WriteOp, agentId?: string, affectedFile?: string): Promise<void>;
    private ensureDb;
    private getStatement;
    private enqueueLatencies;
    private processingLatencies;
    private MAX_METRICS_SAMPLES;
    private recordLatency;
    private calculatePercentile;
    private addStatusIndex;
    pushBatch(ops: WriteOp[], agentId?: string, affectedFile?: string): Promise<void>;
    commitWork(agentId: string, _validator?: unknown): Promise<void>;
    rollbackWork(agentId: string, _reason?: string): Promise<void>;
    runTransaction<T>(callback: (agentId: string) => Promise<T>): Promise<T>;
    flush(): Promise<void>;
    private executeBulkUpdate;
    selectWhere<T extends keyof Schema>(table: T, where: WhereCondition | WhereCondition[], agentId?: string, options?: {
        orderBy?: {
            column: keyof Schema[T];
            direction: "asc" | "desc";
        };
        limit?: number;
    }): Promise<Schema[T][]>;
    selectOne<T extends keyof Schema>(table: T, where: WhereCondition | WhereCondition[], agentId?: string): Promise<Schema[T] | null>;
    static increment(value: number): Increment;
    private groupOps;
    private executeChunkedRawInsert;
    private executeBulkInsert;
    private isIncrement;
    private detectMetadata;
    private executeSingleOp;
    getMetrics(): {
        activeBuffer: string;
        activeBufferSize: number;
        inFlightOpsSize: number;
        activeShadows: number;
        totalTransactions: number;
        latencies: {
            enqueue: {
                p95: number;
                p99: number;
            };
            processing: {
                p95: number;
                p99: number;
            };
        };
    };
    private isSameValues;
    /**
     * Level 9: Sovereign Recovery (Warmup)
     * Populates the in-memory Level 7 indexes from the Level 2 Checkpoint (Disk).
     * This ensures the "Brain" wakes up at full speed after a reboot.
     */
    warmupTable<T extends keyof Schema>(table: T, statusCol: string, statusValue: string): Promise<number>;
    getActiveAffectedFiles(): Promise<Map<string, string>>;
    selectAllFrom<T extends keyof Schema>(table: T, agentId?: string): Promise<Schema[T][]>;
    stop(): Promise<void>;
}
export declare const dbPool: BufferedDbPool;
export {};
//# sourceMappingURL=BufferedDbPool.d.ts.map