import type { ToolUse } from "../assistant-message";
import { type EnvironmentLease } from "../integrity/EnvironmentIntegrity";
import type { StateManager } from "../storage/StateManager";
import { type ForensicDiagnostic } from "../task/tools/RefactorHealer";
import { StabilityForensics } from "./StabilityForensics";
import { SpiderEngine } from "./spider/SpiderEngine";
export interface PolicyResult {
    success: boolean;
    error?: string;
    warning?: string;
    isAlarmed?: boolean;
    violations?: string[];
    buildErrors?: string[];
    entropyScore?: number;
    correctionHint?: string;
}
/**
 * FluidPolicyEngine: The single point of enforcement for architectural (Stability),
 * concurrency (Collision), and structural (Entropy) rules.
 *
 * Progressive Enforcement Strategy:
 * - Strike 1 (domain only): Hard block — the write is rejected with correction hints.
 * - Strike 2+: Graceful degradation — the write proceeds with a strong warning injected.
 * - Core layer: Always warning-only (never hard-blocked).
 * - Other layers: Warning-only.
 * This prevents infinite deadlock while still educating the agent.
 */
export declare class FluidPolicyEngine {
    private cwd;
    private streamId?;
    private stateManager?;
    private virtualResolver?;
    private readonly tspPlugin;
    private readonly spiderEngine;
    private mode;
    private commitSeal;
    private sealReason;
    private layerCache;
    private sessionFiles;
    private auditRecorder;
    private simulationEngine;
    private stalenessTracker;
    private dashboardGenerator;
    private axiomEngine;
    private stabilityMonitor;
    private optimizer;
    private anomalies;
    private buildAlarmActive;
    private isChecking;
    private alarmViolations;
    private stateRestored;
    private lastBuildHealth;
    private lastViolationCount;
    private telemetrics;
    private verification;
    private refactorTurnsRemaining;
    private lastEntropyScore;
    private restorationTokens;
    private gracePeriods;
    private scratchpadSnapshot?;
    private scratchpadVirtualResolved;
    private refactorHealer;
    private forensics;
    private garbageCollector;
    private readonly envIntegrity;
    private karma;
    /** Last logged velocity — avoids per-tool info spam on guarded pre-exec hot path. */
    private lastLoggedActivityVelocity?;
    constructor(cwd: string, streamId?: string | undefined, stateManager?: StateManager, virtualResolver?: ((path: string) => string | undefined) | undefined);
    /**
     * Clears architectural alarms and activity alerts.
     * Explicitly used by orchestrator during a Cognitive Reflection Nudge to grant a clean slate.
     */
    resetSystemPressure(): void;
    getSystemDiagnostics(): string;
    /**
     * Explicitly triggers environmental validation.
     */
    validateEnvironment(): Promise<EnvironmentLease>;
    /**
     * Revokes the current environmental lease.
     */
    revokeLease(): void;
    /**
     * V200: Industrial Hygiene (Disposal).
     * Shuts down all engines and releases persistence buffers to prevent memory leaks.
     */
    dispose(): void;
    private incrementStrikes;
    private resetStrikes;
    setMode(mode: "plan" | "act"): void;
    setStreamId(streamId: string): void;
    setCommitSeal(seal: string, reason: string): void;
    getFileLayerContext(filePath: string): string;
    private usesCanonicalJoyZoning;
    getCorrectionHint(errors: string[], filePath?: string): string;
    computeBuildHealth(violations: string[]): number;
    /**
     * Records the current scan results to history.
     */
    recordScanHistory(violations: string[]): Promise<void>;
    private triggerBuildAlarm;
    private clearBuildAlarm;
    /** Cache-aside scratchpad reads — mtime invalidation avoids per-tool disk I/O on guarded calls. */
    invalidateScratchpadCache(): void;
    private resolveScratchpadContext;
    /**
     * Validates a tool block before execution.
     * Uses progressive enforcement: first domain violation blocks, subsequent ones degrade to warnings.
     */
    validatePreExecution(block: ToolUse): Promise<PolicyResult>;
    execute(block: ToolUse): Promise<PolicyResult>;
    /**
     * Resolves the architectural layer for a file with in-memory caching.
     * Tier 3 optimization for high-volume file batches.
     */
    private getCachedLayer;
    /**
     * Inspects and enriches tool results with proactive layer context.
     * V300: Shadow Documentation & Strategic Guidance.
     */
    observeToolOutcome(toolName: string, output: any): Promise<{
        hint?: string;
    }>;
    /** I/O authority fast path — minimal substrate tracking, no advisory header bloat. */
    onReadIoAuthority(filePath: string, content: string): string;
    onRead(filePath: string, content: string, totalReadCount?: number, perFileReadCount?: number, globalFileReadCount?: number): Promise<string>;
    /**
     * Validates the outcome of a tool execution.
     */
    validatePostExecution(block: ToolUse, toolOutput: unknown, prevResultHash?: string): Promise<PolicyResult>;
    /**
     * Performs a final stability audit on a set of changes before they are committed.
     * Only domain-layer changes with violations block the commit; others produce warnings.
     */
    validateCommit(affectedFiles: Set<string>, ops: import("../../infrastructure/db/BufferedDbPool").WriteOp[]): Promise<{
        success: boolean;
        errors: string[];
    }>;
    private normalize;
    getForensics(): StabilityForensics;
    getStabilityStats(): any;
    getViolations(): any;
    getEntropy(): any;
    getNodes(): any;
    /** Warm session spider graph — reuse instead of loadRegistry on parent I/O-adjacent tools. */
    getSpiderEngine(): SpiderEngine;
    /**
     * V110: Substrate Stability Telemetry Proxy.
     */
    getStabilityTelemetry(filePath: string): any;
    private persistStabilitySubstrate;
    private restoreStabilitySubstrate;
    getLayerForPath(filePath: string): string;
    private ensureScratchpadIntegrity;
    private detectConcurrentDrift;
    /**
     * V202: Manual Trigger for Sovereign Sweep.
     */
    runGarbageCollectorSweep(files: string[]): Promise<{
        fixedCount: number;
        remainingErrors: string[];
        repairLog: string[];
    }>;
    /**
     * V202: Manual Trigger for AST Repair.
     */
    applyDiagnosticFix(diag: ForensicDiagnostic): Promise<boolean>;
    /**
     * V226: Forensic Impact Analysis.
     * Returns a summary of all files modified in the current session.
     */
    getSessionImpactSummary(): string;
    /**
     * V202-B: Generates a passive integrity advisor hint.
     * Removed raw XML to prevent agentic spiraling.
     */
    private generateIntegrityAdvisor;
    /**
     * V225: Sovereign Forensic Gate (PASSIVE).
     * Verifies if the Knowledge Ledger has been updated. Returns an advisory instead of blocking.
     */
    checkForensicCompliance(): Promise<{
        compliant: boolean;
        reason?: string;
        advisory?: string;
    }>;
}
//# sourceMappingURL=FluidPolicyEngine.d.ts.map