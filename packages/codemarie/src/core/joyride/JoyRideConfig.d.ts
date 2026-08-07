/**
 * [LAYER: CORE]
 * Operational controls for JoyRide — kill switches and safe modes.
 */
export type JoyRideOperationalMode = "enabled" | "diagnostics-only" | "disabled";
export interface JoyRideOperationalConfig {
    mode: JoyRideOperationalMode;
    commandReuseDisabled: boolean;
    verificationCacheDisabled: boolean;
    scratchCacheDisabled: boolean;
    searchCacheDisabled: boolean;
}
/** Load config from environment. Safe to call multiple times. */
export declare function loadJoyRideConfigFromEnv(env?: NodeJS.ProcessEnv): JoyRideOperationalConfig;
export declare function getJoyRideConfig(): JoyRideOperationalConfig;
export declare function setJoyRideConfig(config: Partial<JoyRideOperationalConfig>): JoyRideOperationalConfig;
export declare function resetJoyRideConfig(): JoyRideOperationalConfig;
/** Whether active reuse (skipping expensive work) is permitted. */
export declare function canJoyRideSkipWork(): boolean;
/** Whether entries may be stored (diagnostics-only and enabled allow storage). */
export declare function canJoyRideStore(): boolean;
export declare function canJoyRideReuseCommands(): boolean;
export declare function canJoyRideReuseVerification(): boolean;
export declare function canJoyRideReuseSearch(): boolean;
export declare function canJoyRideRetainScratch(): boolean;
export declare function isJoyRideDisabled(): boolean;
export declare function isDiagnosticsOnly(): boolean;
export declare function isCommandReuseEnabled(): boolean;
export declare function isVerificationCacheEnabled(): boolean;
export declare function isSearchCacheEnabled(): boolean;
export declare function isScratchCacheEnabled(): boolean;
export declare function isJoyRideDegraded(): boolean;
export declare function markJoyRideDegraded(reason: string): void;
export declare function resetJoyRideDegraded(): void;
export declare function getJoyRideDegradedReason(): string | undefined;
export declare function explainJoyRideConfig(): string;
export declare function resetJoyRideForTest(): JoyRideOperationalConfig;
//# sourceMappingURL=JoyRideConfig.d.ts.map