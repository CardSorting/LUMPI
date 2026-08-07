/**
 * [LAYER: CORE]
 */
import { ForensicEngine } from "./ForensicEngine";
import { MetricsEngine } from "./MetricsEngine";
import type { SpiderEntropyReport, SpiderNode, SpiderRegistryPayload, SpiderSnapshot, SpiderViolation } from "./types";
export type { SpiderNode, SpiderEntropyReport, SpiderViolation, SpiderSnapshot, SpiderRegistryPayload };
export interface RebuildRegistryOptions {
    isCancelled?: () => boolean;
    pressureMap?: Map<string, number>;
}
import type { AnomalyRegistry } from "../../integrity/AnomalyRegistry";
import type { StabilityMonitor } from "../../integrity/StabilityMonitor";
/**
 * SpiderEngine: The Facade orchestrating structural graph analysis,
 * entropy scoring, and evolution tracking.
 */
export declare class SpiderEngine {
    cwd: string;
    nodes: Map<string, SpiderNode>;
    ghosts: Set<string>;
    version: number;
    isRecovering: boolean;
    /**
     * V9: Centralized source of truth for architectural aliases.
     * Synchronizes ForensicEngine, TspPolicyPlugin, and FluidPolicyEngine.
     */
    static getGlobalAliases(): Record<string, string>;
    private resolver;
    metrics: MetricsEngine;
    private persistence;
    forensic: ForensicEngine;
    private suppressions;
    private graphRevision;
    private lastCycleRevision;
    private cachedCycles;
    private sessionBuffer;
    private stabilityLock;
    private stabilityLockId;
    private stabilityHeartbeat;
    private substrateCheckpoint;
    private checkpointTimestamp;
    private reachabilityTimeout;
    constructor(cwd: string);
    /**
     * V200: Structural Resilience.
     * Captures a binary snapshot of the current structural truth.
     */
    createCheckpoint(): void;
    /**
     * V200: Structural Resilience.
     * Reverts the substrate to the last valid checkpoint.
     */
    rollbackSubstrate(): boolean;
    /**
     * V190: Stability Governance.
     * Acquires a mutual exclusion lock to prevent structural corruption during
     * concurrent or multi-step refactoring operations.
     */
    acquireStabilityLock(owner: string, sessionId?: string): Promise<string | null>;
    releaseStabilityLock(owner: string, lockId: string): void;
    /**
     * V215: Dynamic Activity Pressure.
     * Calculates pressure by combining physical memory usage, graph density,
     * and behavioral activity (churn/doubt) from the StabilityMonitor.
     */
    computeActivityPressure(monitor?: import("../../integrity/StabilityMonitor").StabilityMonitor): number;
    private clearStabilityHeartbeat;
    /**
     * V200: Structural Hygiene (Disposal).
     * Forcefully releases all persistent memory and timers to prevent leaks.
     */
    dispose(): void;
    /**
     * V200: TC39 Disposability Standard.
     */
    [Symbol.dispose](): void;
    getForensicEngine(): ForensicEngine;
    warmUp(entryPoints?: string[]): Promise<void>;
    buildGraph(files: {
        filePath: string;
        content: string;
    }[]): void;
    updateNode(filePath: string, content: string, skipResolution?: boolean): void;
    private extractExports;
    private visitExports;
    private extractDetailedImports;
    private visitDetailedImports;
    private getDefaultMetrics;
    private extractMetrics;
    private visitMetrics;
    private checkDeepAny;
    private detectInterface;
    private updateIncrementalCoupling;
    private scheduleReachability;
    /**
     * V200: Merkle Verification.
     * Compares the in-memory Merkle Root with a fresh physical scan
     * to detect stealth drift or external modifications.
     */
    verifySubstrateIntegrity(): Promise<{
        synchronized: boolean;
        drift: number;
    }>;
    private checkStabilityPressure;
    computeEntropy(): SpiderEntropyReport;
    computeCouplingMetrics(): any;
    computeReachability(): any;
    detectCycles(): string[][];
    getViolations(monitor?: import("../../integrity/StabilityMonitor").StabilityMonitor): SpiderViolation[];
    /**
     * V204: Non-Blocking Integrity Advisories (TIA).
     * Provides structural guidance without triggering a policy block or metabolic spiral.
     */
    getIntegrityAdvisories(filePath?: string): SpiderViolation[];
    addSuppression(violationId: string, path: string, message: string): void;
    clearSuppressions(): void;
    setSessionBuffer(buffer: Map<string, string>): void;
    getSessionBuffer(): Map<string, string>;
    getViolationHotspots(): string[];
    getFilesByPath(dir: string): string[];
    takeSnapshot(): Promise<SpiderSnapshot>;
    getSnapshotHistory(): SpiderSnapshot[];
    /**
     * V204: Fuzzy Forensic Sensing.
     * Finds symbols in the substrate that are lexicographically similar to the target.
     */
    /**
     * V204: Global Forensic Mapping.
     * Locates all files that export a specific symbol.
     */
    findGlobalProviders(symbol: string): string[];
    /**
     * V204: Fuzzy Forensic Sensing.
     * Finds symbols in the substrate that are lexicographically similar to the target.
     */
    findSimilarSymbols(symbol: string, limit?: number): string[];
    getLatestSnapshot(): Promise<SpiderSnapshot | null>;
    /**
     * V150: Memory-Only Substrate.
     * Explicitly loads the registry from a provided buffer or string.
     * If no data is provided, it triggers a fast project scan.
     */
    loadRegistry(data?: Buffer | string): Promise<boolean>;
    /**
     * V150: Computes an aggregate Merkle Root for the entire substrate.
     */
    computeMerkleRoot(): string;
    /**
     * V160: Industrial Hardening - Batch Rebuild.
     * Autonomously rebuilds the graph with throttling to prevent event loop starvation.
     */
    private isIndexing;
    private activeRebuildPromise;
    rebuildRegistry(onProgress?: (processed: number, total: number, currentFile: string) => void | Promise<void>, options?: RebuildRegistryOptions): Promise<void>;
    private throwIfCancelled;
    private performRegistryRebuild;
    /**
     * V20: Synchronizes the in-memory registry with the physical disk (Merkle Healing).
     * Prunes missing files and automatically re-indexes stale files based on mtime.
     */
    synchronizeRegistry(pressureMap?: Map<string, number>): Promise<void>;
    pruneDeadNodes(): void;
    clone(): SpiderEngine;
    serialize(): Buffer;
    deserialize(data: Buffer): void;
    private recalculateHazardScores;
    computeAllLayerFingerprints(): Record<string, string>;
    normalizePath(filePath: string): string;
    getBestAlias(filePath: string): string;
    resolveImportToNodeId(sourcePath: string, specifier: string): string | null;
    resolveLayer(pathOrSource: string, specifier?: string): string | null;
    forecastEntropy(files: {
        path: string;
        content: string;
    }[]): {
        predictedScore: number;
        components: SpiderEntropyReport["components"];
    };
    compareWith(snapshot: SpiderSnapshot): number;
    /**
     * V215: Incremental Cache Purge.
     * Removes all cached resolutions originating from a specific file.
     */
    clearFileFromCache(filePath: string): void;
    resolveImportLayer(sourcePath: string, specifier: string): string | null;
    isNodeLibrary(specifier: string): boolean;
    /**
     * V17: Searches the global export registry for nodes that provide a specific symbol.
     */
    findSymbolProviders(symbol: string): string[];
    computeCCI(filePath: string, anomalies: AnomalyRegistry, monitor: StabilityMonitor): number;
    toMermaid(): string;
    /**
     * V100: Predictive Ghosting.
     * Identifies symbols used in the source but neither declared nor imported locally.
     */
    predictMissingImports(filePath: string, content: string): string[];
    /**
     * V140: Industrial Naming Forensics.
     * Audits identifier casing across the module to produce a 0-1.0 integrity score.
     */
    private calculateNamingScore;
}
//# sourceMappingURL=SpiderEngine.d.ts.map