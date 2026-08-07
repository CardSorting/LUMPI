export interface StorageBreakdown {
    tasksBytes: number;
    checkpointsBytes: number;
    cacheBytes: number;
    puppeteerBytes: number;
    systemTempBytes: number;
    totalBytes: number;
}
export interface StorageOptimizationResult {
    freedBytes: number;
    breakdownBefore: StorageBreakdown;
    breakdownAfter: StorageBreakdown;
}
/**
 * Singleton service for managing and optimizing LUMI extension storage.
 * Implements multi-tiered cache management, shadow Git vacuuming,
 * orphan task eviction, and background maintenance.
 */
export declare class StorageManager {
    private static instance;
    private maintenanceTimer;
    private isOptimizing;
    private constructor();
    static getInstance(): StorageManager;
    /**
     * Calculates comprehensive storage breakdown across all LUMI storage domains.
     */
    getStorageBreakdown(): Promise<StorageBreakdown>;
    private safeFolderSize;
    /**
     * Performs shadow Git vacuuming (`git gc --prune=now`) on all workspace shadow repos.
     */
    vacuumCheckpoints(): Promise<void>;
    /**
     * Cleans temporary files, expired cache items, and system temp directory.
     */
    cleanCacheAndTemp(maxAgeMs?: number): Promise<number>;
    /**
     * Cleans stale puppeteer profiles, screenshots, and temporary browser downloads.
     */
    cleanPuppeteerStorage(maxAgeMs?: number): Promise<number>;
    /**
     * Scans for orphaned task directories and orphaned shadow checkpoint directories.
     */
    cleanOrphanTasksAndCheckpoints(validTaskIds?: string[]): Promise<number>;
    /**
     * Full multi-stage storage optimization pipeline.
     */
    optimizeStorage(validTaskIds?: string[]): Promise<StorageOptimizationResult>;
    /**
     * Starts background maintenance timer (every 12 hours).
     */
    startBackgroundMaintenance(validTaskIds?: string[]): void;
    stopBackgroundMaintenance(): void;
}
//# sourceMappingURL=StorageManager.d.ts.map