/**
 * [LAYER: CORE]
 * Structured JoyRide diagnostic reports for maintainers and deactivate flows.
 */
import { getJoyRideCacheHitAuditTrail } from "./JoyRideAudit";
import type { JoyRideCache } from "./JoyRideCache";
import { type JoyRideOperationalConfig } from "./JoyRideConfig";
import { getJoyRideDecisionLog, getLastJoyRideDecision } from "./JoyRideDecisionLog";
import type { JoyRideCacheStats } from "./types";
export interface JoyRideDiagnosticReport {
    generatedAt: number;
    config: JoyRideOperationalConfig;
    configExplanation: string;
    degraded: boolean;
    degradedReason?: string;
    stats: JoyRideCacheStats;
    decisionLogSize: number;
    recentAuditTrail: ReturnType<typeof getJoyRideCacheHitAuditTrail>;
    recentDecisions: ReturnType<typeof getJoyRideDecisionLog>;
    lastDecision?: ReturnType<typeof getLastJoyRideDecision>;
    summary: {
        isEnabled: boolean;
        isHelping: boolean;
        activeReuseCount: number;
        auditTrailCount: number;
        unsafeRejections: number;
        lateWriteRejections: number;
        cleanupFailures: number;
        staleDiagnostics: number;
        verificationReuseCount: number;
        pressureTrimEvents: number;
        emergencyTrimEvents: number;
        decisionLogSize: number;
        lastFlushDurationMs: number;
        lastShutdownDurationMs: number;
    };
}
export declare function buildJoyRideDiagnosticReport(cache: JoyRideCache): JoyRideDiagnosticReport;
export declare function formatJoyRideDiagnosticReport(report: JoyRideDiagnosticReport): string;
export declare function dumpJoyRideDiagnostics(cache: JoyRideCache): JoyRideDiagnosticReport;
export declare function summarizeJoyRideHealth(cache: JoyRideCache): string;
export declare function createJoyRideBugReportSnapshot(cache: JoyRideCache): string;
export declare function getJoyRideStats(cache: JoyRideCache): JoyRideCacheStats;
export declare function logJoyRideDiagnostics(cache: JoyRideCache): void;
//# sourceMappingURL=JoyRideDiagnostics.d.ts.map