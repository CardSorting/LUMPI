import * as crypto from "node:crypto";
import { sql } from "kysely";
import { Logger } from "@/shared/services/Logger";
import { destroyDb, getDb, getRawDb, registerDbPathChangeListener } from "./Config";
import { sqliteMaintenanceEngine } from "./SQLiteMaintenanceEngine";
import { disableSqlitePersistence, isNativeModuleVersionMismatch, isSqlitePersistenceBypassed, } from "./sqlitePersistence";
// Production-grade Mutex implementation
class Mutex {
    name;
    queue = [];
    locked = false;
    constructor(name) {
        this.name = name;
    }
    async acquire() {
        if (!this.locked) {
            this.locked = true;
            return () => this.release();
        }
        return new Promise((resolve) => {
            this.queue.push(() => resolve(() => this.release()));
        });
    }
    release() {
        const next = this.queue.shift();
        if (next) {
            next();
        }
        else {
            this.locked = false;
        }
    }
}
/**
 * Factory creating monomorphic WriteOp instances with constant V8 property layout.
 */
export function createMonomorphicWriteOp(type, table, values, where, conflictTarget, agentId, layer, hasIncrements, dedupKey) {
    return {
        type,
        table,
        values,
        where,
        conflictTarget,
        agentId,
        layer,
        hasIncrements,
        dedupKey,
    };
}
const LAYER_PRIORITY = {
    domain: 0,
    infrastructure: 1,
    ui: 2,
    plumbing: 3,
};
function normalizeWhere(where) {
    if (!where)
        return [];
    return Array.isArray(where) ? where : [where];
}
/**
 * BufferedDbPool provides a high-performance, asynchronous write-behind layer
 * over SQLite. It batches operations, manages agent-specific uncommitted state,
 * and ensures data consistency between in-memory buffers and on-disk storage.
 */
export class BufferedDbPool {
    bufferA = new Map();
    bufferB = new Map();
    activeBuffer = this.bufferA;
    inFlightOps = new Map();
    agentShadows = new Map();
    stateMutex = new Mutex("DbStateMutex");
    flushMutex = new Mutex("DbFlushMutex");
    flushInterval = null;
    db = null;
    rawDb = null;
    totalTransactions = 0;
    stmtCache = new Map();
    MAX_STMT_CACHE_SIZE = 250;
    parameterBuffer = new Array(2000); // Pre-allocated for chunked inserts
    activeBufferSize = 0;
    inFlightSize = 0;
    // Level 7: Event Horizon Status Index (O(1) Query Mapping)
    activeIndex = new Map();
    inFlightIndex = new Map();
    warmedIndices = new Set(); // Level 9: Authoritative Memory Indices
    opsFlushedSinceMaintenance = 0;
    MAINTENANCE_OPS_THRESHOLD = 10000;
    started = false;
    stopped = false;
    constructor() {
        // Timers are started lazily on first use so importing this singleton cannot
        // leak intervals before the extension has configured the database path.
        registerDbPathChangeListener(() => {
            this.db = null;
            this.rawDb = null;
            for (const stmt of this.stmtCache.values()) {
                try {
                    stmt?.dispose?.();
                }
                catch { }
            }
            this.stmtCache.clear();
        });
    }
    flushTimeout = null;
    currentFlushDelay = null;
    /**
     * Adaptive flush scheduling.
     */
    scheduleFlush(delay = 10) {
        if (this.stopped)
            return;
        if (this.flushTimeout) {
            if (this.currentFlushDelay !== null && this.currentFlushDelay <= delay) {
                return;
            }
            clearTimeout(this.flushTimeout);
        }
        this.currentFlushDelay = delay;
        this.flushTimeout = setTimeout(async () => {
            this.currentFlushDelay = null;
            this.flushTimeout = null;
            try {
                await this.flush();
            }
            finally {
                const release = await this.stateMutex.acquire();
                try {
                    let hasData = false;
                    for (const ops of this.activeBuffer.values()) {
                        if (ops.length > 0) {
                            hasData = true;
                            break;
                        }
                    }
                    if (hasData) {
                        this.scheduleFlush(10);
                    }
                }
                finally {
                    release();
                }
            }
        }, delay);
    }
    cleanupInterval = null;
    startFlushLoop() {
        if (this.started)
            return;
        this.started = true;
        this.stopped = false;
        this.scheduleFlush(1000);
        this.flushInterval = setInterval(() => this.scheduleFlush(1000), 1000);
        this.cleanupInterval = setInterval(() => this.cleanupShadows(), 30000);
        this.flushInterval.unref?.();
        this.cleanupInterval.unref?.();
        sqliteMaintenanceEngine.start();
    }
    ensureStarted() {
        if (!this.started || this.stopped)
            this.startFlushLoop();
    }
    async cleanupShadows() {
        const release = await this.stateMutex.acquire();
        try {
            const now = Date.now();
            const SHADOW_EXPIRATION = 5 * 60 * 1000;
            for (const [agentId, shadow] of this.agentShadows.entries()) {
                if (now - shadow.lastUpdated > SHADOW_EXPIRATION) {
                    this.agentShadows.delete(agentId);
                }
            }
        }
        finally {
            release();
        }
    }
    async beginWork(agentId) {
        this.ensureStarted();
        const release = await this.stateMutex.acquire();
        try {
            if (!this.agentShadows.has(agentId)) {
                this.agentShadows.set(agentId, {
                    ops: [],
                    affectedFiles: new Set(),
                    lastUpdated: Date.now(),
                    checksum: "INIT",
                });
            }
        }
        finally {
            release();
        }
    }
    async push(op, agentId, affectedFile) {
        return this.pushBatch([op], agentId, affectedFile);
    }
    async ensureDb() {
        if (!this.db) {
            const db = await getDb();
            await sql `PRAGMA cache_size = -16000;`.execute(db);
            await sql `PRAGMA temp_store = MEMORY;`.execute(db);
            await sql `PRAGMA auto_vacuum = INCREMENTAL;`.execute(db);
            await sql `PRAGMA journal_mode = WAL;`.execute(db);
            await sql `PRAGMA synchronous = NORMAL;`.execute(db);
            await sql `PRAGMA mmap_size = 268435456;`.execute(db);
            await sql `PRAGMA threads = 4;`.execute(db);
            await sql `PRAGMA busy_timeout = 5000;`.execute(db);
            await sql `PRAGMA wal_autocheckpoint = 1000;`.execute(db);
            await sql `PRAGMA journal_size_limit = 67108864;`.execute(db);
            this.db = db;
            this.rawDb = await getRawDb();
        }
        return this.db;
    }
    getStatement(sqlStr) {
        let stmt = this.stmtCache.get(sqlStr);
        if (!stmt && this.rawDb) {
            stmt = this.rawDb.prepare(sqlStr);
            if (this.stmtCache.size >= this.MAX_STMT_CACHE_SIZE) {
                const oldestKey = this.stmtCache.keys().next().value;
                if (oldestKey !== undefined) {
                    const oldStmt = this.stmtCache.get(oldestKey);
                    try {
                        oldStmt?.dispose?.();
                    }
                    catch { }
                    this.stmtCache.delete(oldestKey);
                }
            }
            this.stmtCache.set(sqlStr, stmt);
        }
        if (!stmt) {
            throw new Error("Raw database connection is not initialized.");
        }
        return stmt;
    }
    enqueueLatencies = [];
    processingLatencies = [];
    MAX_METRICS_SAMPLES = 5000;
    recordLatency(target, value) {
        target.push(value);
        if (target.length > this.MAX_METRICS_SAMPLES) {
            target.splice(0, target.length - this.MAX_METRICS_SAMPLES);
        }
    }
    calculatePercentile(samples, percentile) {
        if (samples.length === 0)
            return 0;
        const len = samples.length;
        if (len === 1)
            return samples[0] ?? 0;
        const dataset = len > 500 ? samples.slice(len - 500) : samples;
        const sorted = dataset.slice().sort((a, b) => a - b);
        const index = Math.ceil((percentile / 100) * sorted.length) - 1;
        return sorted[index] ?? 0;
    }
    addStatusIndex(op, targetIndex) {
        const statusValue = op.values?.status;
        if (op.table !== "agent_tasks" || typeof statusValue !== "string")
            return;
        let tableIndex = targetIndex.get(op.table);
        if (!tableIndex) {
            tableIndex = new Map();
            targetIndex.set(op.table, tableIndex);
        }
        const key = `status:${statusValue}`;
        let set = tableIndex.get(key);
        if (!set) {
            set = new Set();
            tableIndex.set(key, set);
        }
        set.add(op);
    }
    async pushBatch(ops, agentId, affectedFile) {
        this.ensureStarted();
        const enqueueStart = performance.now();
        let currentBufferLength = 0;
        for (const op of ops) {
            if (agentId)
                op.agentId = agentId;
            this.detectMetadata(op);
            // Level 7: Index maintenance (O(1))
            this.addStatusIndex(op, this.activeIndex);
        }
        if (agentId) {
            // Level 3 Optimization: Lock-free shadow access
            // Each agent is isolated; we only lock if we need to create the entry for the first time.
            let shadow = this.agentShadows.get(agentId);
            if (!shadow) {
                const release = await this.stateMutex.acquire();
                try {
                    shadow = this.agentShadows.get(agentId) ?? {
                        ops: [],
                        affectedFiles: new Set(),
                        lastUpdated: Date.now(),
                        checksum: "INIT",
                    };
                    this.agentShadows.set(agentId, shadow);
                }
                finally {
                    release();
                }
            }
            // Safe to push without stateMutex because this agentId is unique to this caller
            for (const op of ops) {
                shadow.ops.push({ ...op, agentId });
            }
            if (affectedFile)
                shadow.affectedFiles.add(affectedFile);
            shadow.lastUpdated = Date.now();
            // V150: Update Shadow Checksum (Rolling Hash)
            const opSummary = `${ops.length}:${ops[0]?.type}:${ops[0]?.table}`;
            shadow.checksum = crypto
                .createHash("sha256")
                .update(shadow.checksum + opSummary)
                .digest("hex");
        }
        else {
            if (ops.length > 0) {
                let tableBuffer = this.activeBuffer.get(ops[0].table);
                if (!tableBuffer) {
                    tableBuffer = [];
                    this.activeBuffer.set(ops[0].table, tableBuffer);
                }
                tableBuffer.push(...ops);
                this.activeBufferSize += ops.length;
                currentBufferLength = this.activeBufferSize;
            }
        }
        if (currentBufferLength > 100000) {
            Logger.warn(`[DbPool] CRITICAL backpressure: activeBuffer length is ${currentBufferLength}`);
        }
        const shouldFlush = currentBufferLength >= 10000;
        this.recordLatency(this.enqueueLatencies, performance.now() - enqueueStart);
        if (shouldFlush) {
            this.scheduleFlush(0);
        }
        else {
            this.scheduleFlush(5);
        }
    }
    async commitWork(agentId, _validator) {
        this.ensureStarted();
        let shadowOpsCount = 0;
        const release = await this.stateMutex.acquire();
        try {
            const shadow = this.agentShadows.get(agentId);
            this.agentShadows.delete(agentId);
            if (shadow && shadow.ops.length > 0) {
                shadowOpsCount = shadow.ops.length;
                for (const op of shadow.ops) {
                    let tableBuffer = this.activeBuffer.get(op.table);
                    if (!tableBuffer) {
                        tableBuffer = [];
                        this.activeBuffer.set(op.table, tableBuffer);
                    }
                    tableBuffer.push(op);
                    this.activeBufferSize++;
                    // Level 7: Index maintenance (O(1))
                    this.addStatusIndex(op, this.activeIndex);
                }
            }
        }
        finally {
            release();
        }
        if (shadowOpsCount > 0) {
            this.scheduleFlush(0);
        }
    }
    async rollbackWork(agentId, _reason) {
        this.ensureStarted();
        const release = await this.stateMutex.acquire();
        try {
            this.agentShadows.delete(agentId);
        }
        finally {
            release();
        }
    }
    async runTransaction(callback) {
        const agentId = `trx-${crypto.randomUUID()}`;
        await this.beginWork(agentId);
        try {
            const result = await callback(agentId);
            await this.commitWork(agentId);
            return result;
        }
        catch (e) {
            await this.rollbackWork(agentId);
            throw e;
        }
    }
    async flush() {
        if (isSqlitePersistenceBypassed())
            return;
        if (this.stopped && this.activeBufferSize === 0 && this.inFlightSize === 0)
            return;
        const releaseFlush = await this.flushMutex.acquire();
        let opsToFlush = [];
        const startTime = Date.now();
        try {
            const releaseState = await this.stateMutex.acquire();
            let hasData = false;
            try {
                const dirtyBuffer = this.activeBuffer;
                for (const ops of dirtyBuffer.values()) {
                    if (ops.length > 0) {
                        hasData = true;
                        break;
                    }
                }
                if (hasData) {
                    // Atomic Swap: Infinite Horizon (Partitioned)
                    this.activeBuffer = dirtyBuffer === this.bufferA ? this.bufferB : this.bufferA;
                    this.activeBuffer.clear(); // Reset the new active buffer map
                    this.inFlightSize = this.activeBufferSize;
                    this.activeBufferSize = 0;
                    this.inFlightOps = dirtyBuffer;
                    // Level 7: Index Swap
                    this.inFlightIndex = this.activeIndex;
                    this.activeIndex = new Map();
                    opsToFlush = Array.from(dirtyBuffer.values())
                        .flat()
                        .sort((a, b) => {
                        const pA = LAYER_PRIORITY[a.layer ?? "plumbing"];
                        const pB = LAYER_PRIORITY[b.layer ?? "plumbing"];
                        if (pA !== pB)
                            return pA - pB;
                        if (a.table !== b.table)
                            return a.table.localeCompare(b.table);
                        return a.type.localeCompare(b.type);
                    });
                }
                else if (this.inFlightOps.size > 0) {
                    opsToFlush = Array.from(this.inFlightOps.values()).flat();
                }
            }
            finally {
                releaseState();
            }
            if (opsToFlush.length === 0)
                return;
            const db = await this.ensureDb();
            let totalFlushed = 0;
            this.totalTransactions++;
            await db.transaction().execute(async (trx) => {
                const processedGroups = this.groupOps(opsToFlush);
                for (const group of processedGroups) {
                    const first = group[0];
                    if (!first)
                        continue;
                    const table = first.table;
                    // High-Performance Path: Chunked Raw SQL (Level 3 Quantum Boost)
                    if (group.length >= 100 && first.type === "insert" && this.rawDb) {
                        totalFlushed += await this.executeChunkedRawInsert(table, group);
                    }
                    else if (group.length > 1 && first.type === "insert") {
                        totalFlushed += await this.executeBulkInsert(trx, table, group);
                    }
                    else if (group.length > 1 && first.type === "update") {
                        totalFlushed += await this.executeBulkUpdate(trx, table, group);
                    }
                    else {
                        for (const op of group) {
                            await this.executeSingleOp(trx, op);
                            totalFlushed++;
                        }
                    }
                }
            });
            const duration = Date.now() - startTime;
            this.recordLatency(this.processingLatencies, duration);
            const throughput = Math.round(totalFlushed / (duration / 1000 || 0.001));
            if (duration > 50 || totalFlushed > 1000) {
                const p95p = this.calculatePercentile(this.processingLatencies, 95);
                const p99p = this.calculatePercentile(this.processingLatencies, 99);
                const p95e = this.calculatePercentile(this.enqueueLatencies, 95);
                Logger.info(`[DbPool] Flush: ${totalFlushed} ops in ${duration}ms (${throughput} ops/sec) | Latency: p95_proc=${p95p.toFixed(1)}ms, p99_proc=${p99p.toFixed(1)}ms, p95_enq=${p95e.toFixed(2)}ms`);
            }
            this.opsFlushedSinceMaintenance += totalFlushed;
            if (this.opsFlushedSinceMaintenance >= this.MAINTENANCE_OPS_THRESHOLD) {
                this.opsFlushedSinceMaintenance = 0;
                sqliteMaintenanceEngine.runMaintenance().catch((err) => {
                    Logger.warn(`[DbPool] Volume-triggered maintenance failed: ${err}`);
                });
            }
            const releaseStateClear = await this.stateMutex.acquire();
            try {
                this.inFlightOps.clear();
                this.inFlightSize = 0;
                this.inFlightIndex.clear();
            }
            finally {
                releaseStateClear();
            }
        }
        catch (e) {
            const err = e;
            const isRetryable = err.code === "SQLITE_BUSY" ||
                err.code === "SQLITE_LOCKED" ||
                err.code === "SQLITE_MISUSE" ||
                err.message?.includes("deadlock") ||
                err.message?.includes("closed") ||
                err.message?.includes("destroyed") ||
                err.message?.includes("interrupted") ||
                err.message?.includes("Library used incorrectly");
            const releaseStateFail = await this.stateMutex.acquire();
            try {
                if (isRetryable) {
                    for (const op of opsToFlush) {
                        let tableBuffer = this.activeBuffer.get(op.table);
                        if (!tableBuffer) {
                            tableBuffer = [];
                            this.activeBuffer.set(op.table, tableBuffer);
                        }
                        tableBuffer.unshift(op);
                        this.activeBufferSize++;
                        // Level 7: Restore index
                        this.addStatusIndex(op, this.activeIndex);
                    }
                }
                this.inFlightOps.clear();
                this.inFlightSize = 0;
                this.inFlightIndex.clear();
            }
            finally {
                releaseStateFail();
            }
            if (isRetryable)
                throw e;
        }
        finally {
            releaseFlush();
        }
    }
    async executeBulkUpdate(trx, table, group) {
        if (group.length === 0)
            return 0;
        const first = group[0];
        if (!first?.values)
            return 0;
        const canBatchIntoSingleStatement = group.every((op) => this.isSameValues(op.values, first.values) &&
            op.where &&
            !Array.isArray(op.where) &&
            op.where.column === "id" &&
            (op.where.operator === "=" || op.where.operator === undefined));
        if (canBatchIntoSingleStatement && first.where && !Array.isArray(first.where)) {
            const ids = [];
            for (const op of group) {
                const val = op.where.value;
                if (Array.isArray(val)) {
                    ids.push(...val);
                }
                else {
                    ids.push(val);
                }
            }
            const valuesWithNoIncrements = {};
            const increments = {};
            for (const [k, v] of Object.entries(first.values)) {
                if (this.isIncrement(v)) {
                    increments[k] = v.value;
                }
                else {
                    valuesWithNoIncrements[k] = v;
                }
            }
            const query = trx.updateTable(table);
            const sets = { ...valuesWithNoIncrements };
            for (const [k, v] of Object.entries(increments)) {
                sets[k] = sql `${sql.ref(k)} + ${v}`;
            }
            await query
                .set(sets)
                .where("id", "in", ids)
                .execute();
            return group.length;
        }
        const promises = group.map((op) => this.executeSingleOp(trx, op));
        await Promise.all(promises);
        return group.length;
    }
    async selectWhere(table, where, agentId, options) {
        if (isSqlitePersistenceBypassed())
            return [];
        this.ensureStarted();
        try {
            const db = await this.ensureDb();
            const release = await this.stateMutex.acquire();
            try {
                const conditions = normalizeWhere(where);
                const statusCond = conditions.find((c) => (c.column === "status" || c.column === "type") && (c.operator === "=" || !c.operator));
                const statusKey = statusCond ? `${statusCond.column}:${statusCond.value}` : null;
                const indexKey = statusCond ? `${table}:${statusKey}` : null;
                const isWarmed = Boolean(indexKey && this.warmedIndices.has(indexKey));
                const hasMemoryIndexData = Boolean(statusKey &&
                    (this.activeIndex.get(table)?.has(statusKey) || this.inFlightIndex.get(table)?.has(statusKey)));
                const isWarmedAndActive = isWarmed && hasMemoryIndexData;
                let diskResults = [];
                if (!isWarmedAndActive) {
                    let query = db.selectFrom(table).selectAll();
                    for (const cond of conditions) {
                        const opStr = cond.operator || "=";
                        if (Array.isArray(cond.value)) {
                            query = query.where(cond.column, "in", cond.value);
                        }
                        else {
                            query = query.where(cond.column, opStr, cond.value);
                        }
                    }
                    if (options?.orderBy) {
                        query = query.orderBy(options.orderBy.column, options.orderBy.direction);
                    }
                    if (options?.limit) {
                        query = query.limit(options.limit);
                    }
                    diskResults = (await query.execute());
                }
                const applyOps = (ops, sourceIndex, target) => {
                    // Level 7: Fast-Path Status Indexing
                    const statusCond = conditions.find((c) => (c.column === "status" || c.column === "type") && (c.operator === "=" || !c.operator));
                    let tableOps = [];
                    if (statusCond && sourceIndex) {
                        const key = `${statusCond.column}:${statusCond.value}`;
                        const set = sourceIndex.get(key);
                        tableOps = set || [];
                    }
                    else {
                        tableOps = ops;
                    }
                    for (const op of tableOps) {
                        // Additional safety check if we're using a full buffer instead of an index
                        if (op.table !== table)
                            continue;
                        const applyValues = (existing, newValues, hasIncs) => {
                            const next = { ...existing };
                            for (const [k, v] of Object.entries(newValues)) {
                                if (hasIncs && this.isIncrement(v)) {
                                    next[k] = (Number(next[k]) || 0) + v.value;
                                }
                                else {
                                    next[k] = v;
                                }
                            }
                            return next;
                        };
                        const opWhere = normalizeWhere(op.where);
                        // Pre-compute Sets for IN operators to O(1) lookup
                        const inSets = opWhere.map((c) => {
                            if (c.operator?.toUpperCase() === "IN" && Array.isArray(c.value)) {
                                return new Set(c.value);
                            }
                            return null;
                        });
                        const matches = (r, queryConditions) => {
                            const row = r;
                            if (queryConditions.length === 0)
                                return true;
                            return queryConditions.every((c, idx) => {
                                const val = row[c.column];
                                const opStr = (c.operator || "=").toUpperCase();
                                if (opStr === "IN") {
                                    // If this is matching against the op's where, use the pre-computed set
                                    // If this is matching against the SELECT's where, just use the array
                                    if (queryConditions === opWhere) {
                                        const set = inSets[idx];
                                        if (set)
                                            return set.has(val);
                                    }
                                    if (Array.isArray(c.value))
                                        return c.value.includes(val);
                                    return val === c.value;
                                }
                                if (opStr === "=")
                                    return val === c.value;
                                if (opStr === "!=")
                                    return val !== c.value;
                                if (opStr === ">")
                                    return Number(val) > Number(c.value);
                                if (opStr === "<")
                                    return Number(val) < Number(c.value);
                                if (opStr === ">=")
                                    return Number(val) >= Number(c.value);
                                if (opStr === "<=")
                                    return val !== null && Number(val) <= Number(c.value);
                                return false;
                            });
                        };
                        if (op.type === "insert" && op.values) {
                            const newRow = { ...op.values };
                            if (matches(newRow, conditions))
                                target.push(newRow);
                        }
                        else if (op.type === "upsert" && op.values) {
                            const pkMatch = (r) => {
                                const row = r;
                                if (opWhere.length > 0)
                                    return matches(row, opWhere);
                                return (row.id !== undefined &&
                                    op.values.id !== undefined &&
                                    row.id === op.values.id);
                            };
                            const existingIdx = target.findIndex(pkMatch);
                            if (existingIdx >= 0) {
                                const existing = target[existingIdx];
                                if (existing) {
                                    const next = applyValues(existing, op.values, op.hasIncrements);
                                    if (matches(next, conditions)) {
                                        target[existingIdx] = next;
                                    }
                                    else {
                                        target.splice(existingIdx, 1);
                                    }
                                }
                            }
                            else {
                                const newRow = { ...op.values };
                                if (matches(newRow, conditions))
                                    target.push(newRow);
                            }
                        }
                        else if (op.type === "update" && op.values) {
                            for (let i = target.length - 1; i >= 0; i--) {
                                const existing = target[i];
                                if (existing && matches(existing, opWhere)) {
                                    const next = applyValues(existing, op.values, op.hasIncrements);
                                    if (matches(next, conditions)) {
                                        target[i] = next;
                                    }
                                    else {
                                        target.splice(i, 1);
                                    }
                                }
                            }
                        }
                        else if (op.type === "delete") {
                            for (let i = target.length - 1; i >= 0; i--) {
                                const existing = target[i];
                                if (existing && matches(existing, opWhere))
                                    target.splice(i, 1);
                            }
                        }
                    }
                };
                let finalResults = [...diskResults];
                applyOps(this.inFlightOps.get(table) || [], this.inFlightIndex.get(table), finalResults);
                applyOps(this.activeBuffer.get(table) || [], this.activeIndex.get(table), finalResults);
                if (agentId) {
                    const shadow = this.agentShadows.get(agentId);
                    if (shadow)
                        applyOps(shadow.ops, undefined, finalResults);
                }
                if (options?.orderBy) {
                    const col = options.orderBy.column;
                    const dir = options.orderBy.direction;
                    finalResults.sort((a, b) => {
                        const valA = a[col];
                        const valB = b[col];
                        if (valA === undefined || valB === undefined || valA === null || valB === null)
                            return 0;
                        if (valA < valB)
                            return dir === "asc" ? -1 : 1;
                        if (valA > valB)
                            return dir === "asc" ? 1 : -1;
                        return 0;
                    });
                }
                if (options?.limit)
                    finalResults = finalResults.slice(0, options.limit);
                return finalResults;
            }
            finally {
                release();
            }
        }
        catch (error) {
            if (isNativeModuleVersionMismatch(error)) {
                disableSqlitePersistence(error instanceof Error ? error.message : String(error));
                return [];
            }
            throw error;
        }
    }
    async selectOne(table, where, agentId) {
        const results = await this.selectWhere(table, where, agentId);
        return results.length > 0 ? results[results.length - 1] : null;
    }
    static increment(value) {
        return { _type: "increment", value };
    }
    groupOps(ops) {
        const coalescedOps = [];
        const updateCache = new Map();
        for (const op of ops) {
            if (op.type === "update" && op.dedupKey) {
                const existingIdx = updateCache.get(op.dedupKey);
                if (existingIdx !== undefined) {
                    const targetOp = coalescedOps[existingIdx];
                    if (targetOp?.values && op.values) {
                        for (const [key, val] of Object.entries(op.values)) {
                            const existingVal = targetOp.values[key];
                            if (this.isIncrement(val)) {
                                if (this.isIncrement(existingVal)) {
                                    existingVal.value += val.value;
                                }
                                else if (typeof existingVal === "number") {
                                    targetOp.values[key] = existingVal + val.value;
                                }
                                else {
                                    targetOp.values[key] = { ...val }; // Clone increment
                                }
                            }
                            else {
                                targetOp.values[key] = val; // Raw value overrides previous state
                            }
                        }
                        // Recalculate hasIncrements
                        targetOp.hasIncrements = Object.values(targetOp.values).some((v) => this.isIncrement(v));
                        continue;
                    }
                }
                else {
                    updateCache.set(op.dedupKey, coalescedOps.length);
                }
            }
            coalescedOps.push(op);
        }
        const groups = [];
        let currentGroup = [];
        for (const op of coalescedOps) {
            if (op.type === "insert" && op.values) {
                if (currentGroup.length > 0 && currentGroup[0]?.table === op.table && currentGroup[0]?.type === "insert") {
                    currentGroup.push(op);
                }
                else {
                    if (currentGroup.length > 0)
                        groups.push(currentGroup);
                    currentGroup = [op];
                }
            }
            else {
                if (currentGroup.length > 0)
                    groups.push(currentGroup);
                currentGroup = [];
                groups.push([op]);
            }
        }
        if (currentGroup.length > 0)
            groups.push(currentGroup);
        return groups;
    }
    async executeChunkedRawInsert(table, group) {
        if (group.length === 0 || !this.rawDb)
            return 0;
        const firstOp = group[0];
        if (!firstOp?.values)
            return 0;
        const columns = Object.keys(firstOp.values);
        const columnCount = Math.max(1, columns.length);
        const CHUNK_SIZE = Math.min(100, Math.max(1, Math.floor(this.parameterBuffer.length / columnCount)));
        let totalFlushed = 0;
        for (let i = 0; i < group.length; i += CHUNK_SIZE) {
            const chunk = group.slice(i, i + CHUNK_SIZE);
            const valuePlaceholders = `(${columns.map(() => "?").join(",")})`;
            const placeholders = chunk.map(() => valuePlaceholders).join(",");
            const sqlStr = `INSERT INTO ${table} (${columns.join(",")}) VALUES ${placeholders}`;
            const stmt = this.getStatement(sqlStr);
            // Level 4 Optimization: Zero-Allocation Parameter Flattening
            // Reuse the pre-allocated parameterBuffer to avoid GC pressure for 1M+ ops
            let pIdx = 0;
            for (const op of chunk) {
                const vals = op.values;
                for (const col of columns) {
                    this.parameterBuffer[pIdx++] = vals[col];
                }
            }
            const params = this.parameterBuffer.slice(0, pIdx);
            try {
                stmt.run(...params);
            }
            finally {
                // Memory leak prevention: Dereference inserted objects so V8 GC can collect them
                this.parameterBuffer.fill(undefined, 0, pIdx);
            }
            totalFlushed += chunk.length;
        }
        return totalFlushed;
    }
    async executeBulkInsert(trx, table, group) {
        const firstOp = group[0];
        if (!firstOp?.values)
            return 0;
        const columnCount = Object.keys(firstOp.values).length || 1;
        const CHUNK_SIZE = Math.max(1, Math.floor(5000 / columnCount));
        let flushed = 0;
        for (let i = 0; i < group.length; i += CHUNK_SIZE) {
            const chunk = group.slice(i, i + CHUNK_SIZE);
            const values = chunk.map((op) => op.values).filter((v) => v !== undefined);
            await trx
                .insertInto(table)
                .values(values)
                .execute();
            flushed += chunk.length;
        }
        return flushed;
    }
    isIncrement(value) {
        return (typeof value === "object" && value !== null && "_type" in value && value._type === "increment");
    }
    detectMetadata(op) {
        op.hasIncrements = false;
        if (op.values) {
            for (const v of Object.values(op.values)) {
                if (this.isIncrement(v)) {
                    op.hasIncrements = true;
                    break;
                }
            }
        }
        if (op.type === "update" &&
            op.where &&
            !Array.isArray(op.where) &&
            op.where.column === "id" &&
            (op.where.operator === "=" || op.where.operator === undefined)) {
            op.dedupKey = `${op.table}:${op.where.value}`;
        }
    }
    async executeSingleOp(trx, op) {
        const conditions = normalizeWhere(op.where);
        if (op.type === "insert" && op.values) {
            await trx.insertInto(op.table).values(op.values).execute();
        }
        else if (op.type === "upsert" && op.values) {
            let query = trx.insertInto(op.table).values(op.values);
            if (op.conflictTarget) {
                const targets = Array.isArray(op.conflictTarget) ? op.conflictTarget : [op.conflictTarget];
                query = query.onConflict((oc) => oc.columns(targets).doUpdateSet(op.values));
            }
            else {
                query = query.onConflict((oc) => oc.column("id").doUpdateSet(op.values));
            }
            await query.execute();
        }
        else if (op.type === "update" && op.values) {
            const sets = {};
            for (const [k, v] of Object.entries(op.values)) {
                if (this.isIncrement(v)) {
                    sets[k] = sql `${sql.ref(k)} + ${v.value}`;
                }
                else {
                    sets[k] = v;
                }
            }
            let query = trx.updateTable(op.table).set(sets);
            for (const cond of conditions) {
                const opStr = cond.operator || "=";
                if (Array.isArray(cond.value)) {
                    query = query.where(cond.column, "in", cond.value);
                }
                else {
                    query = query.where(cond.column, opStr, cond.value);
                }
            }
            await query.execute();
        }
        else if (op.type === "delete") {
            let query = trx.deleteFrom(op.table);
            for (const cond of conditions) {
                const opStr = cond.operator || "=";
                if (Array.isArray(cond.value)) {
                    query = query.where(cond.column, "in", cond.value);
                }
                else {
                    query = query.where(cond.column, opStr, cond.value);
                }
            }
            await query.execute();
        }
    }
    getMetrics() {
        return {
            activeBuffer: this.activeBuffer === this.bufferA ? "A" : "B",
            activeBufferSize: this.activeBufferSize,
            inFlightOpsSize: this.inFlightSize,
            activeShadows: this.agentShadows.size,
            totalTransactions: this.totalTransactions,
            latencies: {
                enqueue: {
                    p95: this.calculatePercentile(this.enqueueLatencies, 95),
                    p99: this.calculatePercentile(this.enqueueLatencies, 99),
                },
                processing: {
                    p95: this.calculatePercentile(this.processingLatencies, 95),
                    p99: this.calculatePercentile(this.processingLatencies, 99),
                },
            },
        };
    }
    isSameValues(a, b) {
        if (a === b)
            return true;
        const keysA = Object.keys(a);
        const keysB = Object.keys(b);
        if (keysA.length !== keysB.length)
            return false;
        for (const key of keysA) {
            if (a[key] !== b[key]) {
                // Handle Increment objects specifically
                const valA = a[key];
                const valB = b[key];
                if (this.isIncrement(valA) && this.isIncrement(valB)) {
                    if (valA.value !== valB.value)
                        return false;
                }
                else {
                    return false;
                }
            }
        }
        return true;
    }
    /**
     * Level 9: Sovereign Recovery (Warmup)
     * Populates the in-memory Level 7 indexes from the Level 2 Checkpoint (Disk).
     * This ensures the "Brain" wakes up at full speed after a reboot.
     */
    async warmupTable(table, statusCol, statusValue) {
        if (isSqlitePersistenceBypassed())
            return 0;
        this.ensureStarted();
        try {
            const db = await this.ensureDb();
            const rows = (await db.selectFrom(table).selectAll()
                .where(statusCol, "=", statusValue)
                .limit(500)
                .execute());
            if (rows.length === 0)
                return 0;
            let tableIndex = this.activeIndex.get(table);
            if (!tableIndex) {
                tableIndex = new Map();
                this.activeIndex.set(table, tableIndex);
            }
            const key = `${statusCol}:${statusValue}`;
            // Rebuild the warmed set every time; never append duplicate synthetic rows.
            const set = new Set();
            tableIndex.set(key, set);
            // Convert disk rows into a "Virtual WriteOp" to satisfy Level 1 Select logic
            for (const row of rows) {
                const op = {
                    type: "insert",
                    table,
                    values: row,
                    hasIncrements: false,
                };
                set.add(op);
            }
            // Level 9: Mark as Authoritative
            this.warmedIndices.add(`${table}:${statusCol}:${statusValue}`);
            return rows.length;
        }
        catch (error) {
            if (isNativeModuleVersionMismatch(error)) {
                disableSqlitePersistence(error instanceof Error ? error.message : String(error));
                return 0;
            }
            throw error;
        }
    }
    async getActiveAffectedFiles() {
        const release = await this.stateMutex.acquire();
        try {
            const activeFiles = new Map();
            for (const [agentId, shadow] of this.agentShadows.entries()) {
                for (const file of shadow.affectedFiles) {
                    activeFiles.set(file, agentId);
                }
            }
            return activeFiles;
        }
        finally {
            release();
        }
    }
    async selectAllFrom(table, agentId) {
        return this.selectWhere(table, [], agentId);
    }
    async stop() {
        if (this.stopped)
            return;
        this.stopped = true;
        sqliteMaintenanceEngine.stop();
        try {
            await sqliteMaintenanceEngine.runMaintenance({ forceTruncateWal: true });
        }
        catch { }
        if (this.flushInterval)
            clearInterval(this.flushInterval);
        if (this.cleanupInterval)
            clearInterval(this.cleanupInterval);
        if (this.flushTimeout)
            clearTimeout(this.flushTimeout);
        this.flushInterval = null;
        this.cleanupInterval = null;
        this.flushTimeout = null;
        await this.flush();
        this.bufferA.clear();
        this.bufferB.clear();
        this.activeBuffer.clear();
        this.inFlightOps.clear();
        this.agentShadows.clear();
        this.activeIndex.clear();
        this.inFlightIndex.clear();
        this.warmedIndices.clear();
        for (const stmt of this.stmtCache.values()) {
            try {
                stmt?.dispose?.();
            }
            catch { }
        }
        this.stmtCache.clear();
        this.parameterBuffer.fill(undefined);
        this.enqueueLatencies = [];
        this.processingLatencies = [];
        this.activeBufferSize = 0;
        this.inFlightSize = 0;
        this.rawDb = null;
        this.db = null;
        await destroyDb();
        this.started = false;
    }
}
export const dbPool = new BufferedDbPool();
//# sourceMappingURL=BufferedDbPool.js.map