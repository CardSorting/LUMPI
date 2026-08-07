/**
 * [LAYER: CORE]
 * Strict command classification for JoyRide — fail closed on unknown commands.
 */
export type JoyRideCommandTier = "safe-readonly" | "verification" | "diagnostic-store-only" | "no-store";
import type { JoyRideReasonCode } from "./JoyRideReasonCodes";
export interface JoyRideCommandClassification {
    tier: JoyRideCommandTier;
    canSkipExecution: boolean;
    canStoreDiagnostic: boolean;
    reason: string;
    reasonCode: JoyRideReasonCode;
}
export declare function normalizeCommand(command: string): string;
/** Strip quoted strings so hidden shell operators cannot bypass safety checks. */
export declare function stripQuotesForShellAnalysis(command: string): string;
export declare function isEnvAlteringCommand(command: string): boolean;
export declare function isVerificationCommand(command: string): boolean;
export declare function classifyCommand(command: string): JoyRideCommandClassification;
/** @deprecated Use classifyCommand().canSkipExecution for safe-readonly tier only. */
export declare function isReadOnlyCacheableCommand(command: string): boolean;
export declare function isCommandCacheEligible(command: string): boolean;
export declare function canCommandSkipExecution(command: string): boolean;
//# sourceMappingURL=JoyRideCommandClassifier.d.ts.map