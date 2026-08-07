/**
 * [LAYER: CORE]
 * Operational controls for JoyRide — kill switches and safe modes.
 */
const DEFAULT_CONFIG = {
    mode: "enabled",
    commandReuseDisabled: false,
    verificationCacheDisabled: false,
    scratchCacheDisabled: false,
    searchCacheDisabled: false,
};
let activeConfig = { ...DEFAULT_CONFIG };
let degradedMode = false;
let degradedReason;
function parseBoolEnv(value) {
    if (value === undefined) {
        return undefined;
    }
    const normalized = value.trim().toLowerCase();
    if (["0", "false", "no", "off"].includes(normalized)) {
        return false;
    }
    if (["1", "true", "yes", "on"].includes(normalized)) {
        return true;
    }
    return undefined;
}
function parseModeEnv(value) {
    if (!value) {
        return undefined;
    }
    const normalized = value.trim().toLowerCase();
    if (normalized === "enabled" || normalized === "on") {
        return "enabled";
    }
    if (normalized === "diagnostics-only" || normalized === "diagnostics" || normalized === "observe") {
        return "diagnostics-only";
    }
    if (normalized === "disabled" || normalized === "off") {
        return "disabled";
    }
    return undefined;
}
function envDisablesFeature(primary, explicit) {
    const primaryVal = parseBoolEnv(primary);
    if (primaryVal === false) {
        return true;
    }
    return parseBoolEnv(explicit);
}
/** Load config from environment. Safe to call multiple times. */
export function loadJoyRideConfigFromEnv(env = process.env) {
    const mode = parseModeEnv(env.JOYRIDE_MODE) ?? activeConfig.mode;
    const commandReuseDisabled = envDisablesFeature(env.JOYRIDE_COMMAND_REUSE, env.JOYRIDE_COMMAND_REUSE_DISABLED) ??
        activeConfig.commandReuseDisabled;
    const verificationCacheDisabled = envDisablesFeature(env.JOYRIDE_VERIFICATION_CACHE, env.JOYRIDE_VERIFICATION_CACHE_DISABLED) ??
        activeConfig.verificationCacheDisabled;
    const scratchCacheDisabled = envDisablesFeature(env.JOYRIDE_SCRATCH_CACHE, env.JOYRIDE_SCRATCH_CACHE_DISABLED) ??
        activeConfig.scratchCacheDisabled;
    const searchCacheDisabled = envDisablesFeature(env.JOYRIDE_SEARCH_CACHE, env.JOYRIDE_SEARCH_CACHE_DISABLED) ??
        activeConfig.searchCacheDisabled;
    return {
        mode,
        commandReuseDisabled: mode === "disabled" ? true : commandReuseDisabled,
        verificationCacheDisabled: mode === "disabled" ? true : verificationCacheDisabled,
        scratchCacheDisabled: mode === "disabled" ? true : scratchCacheDisabled,
        searchCacheDisabled: mode === "disabled" ? true : searchCacheDisabled,
    };
}
export function getJoyRideConfig() {
    return activeConfig;
}
export function setJoyRideConfig(config) {
    activeConfig = {
        ...activeConfig,
        ...config,
    };
    if (activeConfig.mode === "disabled") {
        activeConfig.commandReuseDisabled = true;
        activeConfig.verificationCacheDisabled = true;
        activeConfig.scratchCacheDisabled = true;
        activeConfig.searchCacheDisabled = true;
    }
    return activeConfig;
}
export function resetJoyRideConfig() {
    activeConfig = { ...DEFAULT_CONFIG };
    resetJoyRideDegraded();
    return activeConfig;
}
/** Whether active reuse (skipping expensive work) is permitted. */
export function canJoyRideSkipWork() {
    return activeConfig.mode === "enabled" && !degradedMode;
}
/** Whether entries may be stored (diagnostics-only and enabled allow storage). */
export function canJoyRideStore() {
    return activeConfig.mode !== "disabled";
}
export function canJoyRideReuseCommands() {
    return canJoyRideSkipWork() && !activeConfig.commandReuseDisabled;
}
export function canJoyRideReuseVerification() {
    return canJoyRideSkipWork() && !activeConfig.verificationCacheDisabled;
}
export function canJoyRideReuseSearch() {
    return canJoyRideSkipWork() && !activeConfig.searchCacheDisabled;
}
export function canJoyRideRetainScratch() {
    return canJoyRideStore() && !activeConfig.scratchCacheDisabled;
}
// Initialize from environment on module load
activeConfig = loadJoyRideConfigFromEnv();
export function isJoyRideDisabled() {
    return activeConfig.mode === "disabled";
}
export function isDiagnosticsOnly() {
    return activeConfig.mode === "diagnostics-only";
}
export function isCommandReuseEnabled() {
    return canJoyRideReuseCommands();
}
export function isVerificationCacheEnabled() {
    return canJoyRideReuseVerification();
}
export function isSearchCacheEnabled() {
    return canJoyRideReuseSearch();
}
export function isScratchCacheEnabled() {
    return canJoyRideRetainScratch();
}
export function isJoyRideDegraded() {
    return degradedMode;
}
export function markJoyRideDegraded(reason) {
    degradedMode = true;
    degradedReason = reason;
}
export function resetJoyRideDegraded() {
    degradedMode = false;
    degradedReason = undefined;
}
export function getJoyRideDegradedReason() {
    return degradedReason;
}
export function explainJoyRideConfig() {
    const c = getJoyRideConfig();
    const lines = [
        `mode=${c.mode}`,
        `commandReuse=${!c.commandReuseDisabled}`,
        `verificationCache=${!c.verificationCacheDisabled}`,
        `searchCache=${!c.searchCacheDisabled}`,
        `scratchCache=${!c.scratchCacheDisabled}`,
        `degraded=${degradedMode}${degradedReason ? ` reason=${degradedReason}` : ""}`,
    ];
    return lines.join(" ");
}
export function resetJoyRideForTest() {
    resetJoyRideDegraded();
    return resetJoyRideConfig();
}
//# sourceMappingURL=JoyRideConfig.js.map