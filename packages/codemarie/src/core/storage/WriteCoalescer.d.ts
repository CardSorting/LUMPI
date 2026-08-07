/**
 * WriteCoalescer provides a high-performance, in-memory write-behind buffer.
 * Rapid consecutive write requests targeting the same file path (e.g. ui_messages.json,
 * api_conversation_history.json, task_metadata.json during streaming token output) are
 * merged in memory, hyper-compressed, content-deduplicated, and debounced to prevent SSD erosion.
 */
export declare class WriteCoalescer {
    private static instance;
    private pendingWrites;
    private lastWrittenHashes;
    static getInstance(): WriteCoalescer;
    /**
     * Schedule a debounced write with payload content-hash deduplication.
     * If the generated payload is identical to what was last written to disk, the write is cleanly skipped.
     *
     * @param filePath The absolute target file path
     * @param dataSupplier Function returning the latest serialized content payload
     * @param writeFn Async write function executing the disk write
     * @param debounceMs Debounce window in ms (default 500ms)
     * @param maxDelayMs Maximum delay before forcing a write flush (default 3000ms)
     */
    /**
     * Schedule a debounced write with payload content-hash deduplication.
     * If the generated payload is identical to what was last written to disk, the write is cleanly skipped.
     *
     * @param filePath The absolute target file path
     * @param dataSupplier Function returning the latest serialized content payload
     * @param writeFn Async write function executing the disk write
     * @param debounceMs Debounce window in ms (default 500ms)
     * @param maxDelayMs Maximum delay before forcing a write flush (default 3000ms)
     */
    coalesceWriteWithPayload(filePath: string, dataSupplier: () => string, writeFn: (data: string) => Promise<void>, debounceMs?: number, maxDelayMs?: number): void;
    /**
     * Schedule a debounced write for a specific file path (legacy function wrapper).
     */
    coalesceWrite(filePath: string, writeFn: () => Promise<void>, debounceMs?: number, maxDelayMs?: number): void;
    private readonly MAX_HASH_CACHE_SIZE;
    private recordWrittenHash;
    private executeWriteWithPrecomputedPayload;
    /**
     * Immediately flush any pending write for a specific file path.
     */
    flush(filePath: string): Promise<void>;
    /**
     * Immediately flush all pending writes across all target files.
     */
    flushAll(): Promise<void>;
    /**
     * Check if a file path currently has a pending write queued.
     */
    hasPending(filePath: string): boolean;
    /**
     * Explicitly purge cached content hashes to free internal memory.
     */
    purgeStaleHashes(): void;
    /**
     * Dispose of all timers and clear maps for clean shutdown.
     */
    dispose(): void;
}
export declare const writeCoalescer: WriteCoalescer;
//# sourceMappingURL=WriteCoalescer.d.ts.map