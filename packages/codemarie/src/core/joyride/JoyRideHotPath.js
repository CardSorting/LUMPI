/**
 * [LAYER: CORE]
 * Intention-revealing JoyRide hot-path APIs with typed cache decisions.
 */
import { Logger } from "@shared/services/Logger";
import { recordJoyRideCacheHit } from "./JoyRideAudit.js";
import { classifyCommand, isEnvAlteringCommand, isVerificationCommand } from "./JoyRideCommandClassifier.js";
import { canJoyRideReuseCommands, canJoyRideReuseSearch, canJoyRideReuseVerification, canJoyRideSkipWork, canJoyRideStore, explainJoyRideConfig, isDiagnosticsOnly, isJoyRideDegraded, isJoyRideDisabled, markJoyRideDegraded, } from "./JoyRideConfig.js";
import { buildApprovalBoundaryId, buildJoyRideWorkspaceSnapshot, } from "./JoyRideContext.js";
import { recordJoyRideDecision } from "./JoyRideDecisionLog.js";
import { degradedDecision, diagnosticOnlyDecision, disabledDecision, hitDecision, missDecision, } from "./JoyRideDecisions.js";
import { JOYRIDE_REASON } from "./JoyRideReasonCodes.js";
import { createCommandResultCacheKey, createGrepResultCacheKey, createJoyRideFingerprint, createVerificationCacheKey, } from "./keys.js";
import { summarizeJoyRideCommandOutput } from "./summaries.js";
const SEARCH_IMPLEMENTATION_VERSION = "ripgrep-v1";
function recordAndReturn(decision) {
    recordJoyRideDecision(decision);
    return decision;
}
function scopeContext(scope, changedFileGeneration) {
    return {
        ownerTaskId: scope.taskId,
        approvalBoundaryId: scope.approvalBoundaryId,
        scope: scope.taskId,
        workspaceGeneration: changedFileGeneration ?? scope.generation,
        configExplanation: explainJoyRideConfig(),
        degraded: isJoyRideDegraded(),
    };
}
function configDisabledDecision(cacheKind, scope) {
    const ctx = scope
        ? scopeContext(scope)
        : { configExplanation: explainJoyRideConfig(), degraded: isJoyRideDegraded() };
    if (isJoyRideDisabled()) {
        return recordAndReturn(disabledDecision(JOYRIDE_REASON.MISS_CONFIG_DISABLED, "JoyRide disabled via config", { cacheKind, ...ctx }));
    }
    if (isDiagnosticsOnly()) {
        return recordAndReturn(disabledDecision(JOYRIDE_REASON.MISS_CONFIG_DIAGNOSTICS_ONLY, "JoyRide diagnostics-only mode", {
            cacheKind,
            ...ctx,
        }));
    }
    if (isJoyRideDegraded()) {
        return recordAndReturn(degradedDecision(JOYRIDE_REASON.MISS_CACHE_DEGRADED, "JoyRide degraded — active reuse suspended", {
            cacheKind,
            ...ctx,
        }));
    }
    return recordAndReturn(missDecision(JOYRIDE_REASON.MISS_NO_ENTRY, "JoyRide skip work unavailable", { cacheKind, ...ctx }));
}
function handleInternalError(operation, error, cacheKind, scope) {
    Logger.warn(`[JoyRide] ${operation} failed:`, error);
    markJoyRideDegraded(`${operation}: ${error instanceof Error ? error.message : String(error)}`);
    return recordAndReturn(degradedDecision(JOYRIDE_REASON.DEGRADED_INTERNAL_FAILURE, `Internal error — falling back to normal execution (${operation})`, {
        cacheKind,
        operationType: operation,
        reuseBlockReason: JOYRIDE_REASON.FALLBACK_NORMAL_EXECUTION,
        ...(scope ? scopeContext(scope) : {}),
    }));
}
function baseSetMetadata(scope, snapshot, cacheKind, ttlMs, admissionReason, extra) {
    return {
        cacheKind,
        scope: { type: "task", id: scope.taskId },
        ownerTaskId: scope.taskId,
        ttlMs,
        fingerprint: "",
        workspaceFingerprint: snapshot.workspaceFingerprint,
        approvalBoundaryId: scope.approvalBoundaryId,
        durability: "memoryOnly",
        invalidationReason: [
            "ttl_expired",
            "task_completed",
            "task_cancelled",
            "workspace_drift",
            "approval_boundary_changed",
            "command_environment_changed",
            "file_hash_changed",
            "git_head_changed",
            "dependency_fingerprint_changed",
            "lockfile_fingerprint_changed",
        ],
        admissionReason,
        safetyClassification: "taskLocal",
        generation: scope.generation,
        environmentFingerprint: snapshot.environmentFingerprint,
        gitHead: snapshot.gitHead,
        dependencyFingerprint: snapshot.dependencyFingerprint,
        lockfileFingerprint: snapshot.lockfileFingerprint,
        runtimeVersion: process.version,
        ...extra,
    };
}
function buildCommandValidation(snapshot, scope, fingerprint) {
    return {
        fingerprint,
        workspaceFingerprint: snapshot.workspaceFingerprint,
        approvalBoundaryId: scope.approvalBoundaryId,
        generation: scope.generation,
        environmentFingerprint: snapshot.environmentFingerprint,
        gitHead: snapshot.gitHead,
        dependencyFingerprint: snapshot.dependencyFingerprint,
        lockfileFingerprint: snapshot.lockfileFingerprint,
        runtimeVersion: process.version,
    };
}
function buildVerificationValidation(snapshot, scope, fingerprint, relevantFileHashes) {
    return {
        ...buildCommandValidation(snapshot, scope, fingerprint),
        relevantFileHashes,
        toolVersion: "lumi-verification-v1",
    };
}
function hasCompleteVerificationProof(relevantFileHashes) {
    return Object.keys(relevantFileHashes).length > 0;
}
function extractExitCode(outputText) {
    const match = outputText.match(/(?:exit code|exit status|Exit code)[:\s]+(\d+)/i);
    if (match) {
        return Number.parseInt(match[1], 10);
    }
    return undefined;
}
function toolResponseToText(toolResponse) {
    return typeof toolResponse === "string" ? toolResponse : JSON.stringify(toolResponse);
}
function recordHit(cache, key, cacheKind, operationType, scope, reuseReason, hitSource, fingerprintSummary) {
    const explanation = cache.explain(key);
    recordJoyRideCacheHit({
        key,
        cacheKind,
        operationType,
        ownerTaskId: scope.taskId,
        validationFingerprintSummary: fingerprintSummary,
        reuseReason,
        entryAgeMs: explanation.ageMs ?? 0,
        hitSource,
    });
}
export async function lookupSafeCommandResult(cache, command, scope, changedFileGeneration = 0, relevantFileHashes = {}) {
    if (!canJoyRideSkipWork()) {
        return configDisabledDecision("hotExecution", scope);
    }
    const classification = classifyCommand(command);
    try {
        const snapshot = await buildJoyRideWorkspaceSnapshot(scope.cwd, scope.terminalMode, changedFileGeneration);
        if (isVerificationCommand(command)) {
            return lookupVerificationProof(cache, command, scope, snapshot, relevantFileHashes);
        }
        if (!canJoyRideReuseCommands()) {
            return recordAndReturn(missDecision(JOYRIDE_REASON.MISS_CONFIG_COMMAND_REUSE_DISABLED, "Command reuse disabled via config", {
                cacheKind: "hotExecution",
                operationType: command,
                reuseBlockReason: explainJoyRideConfig(),
                ...scopeContext(scope, changedFileGeneration),
            }));
        }
        if (!classification.canSkipExecution) {
            return recordAndReturn(diagnosticOnlyDecision(classification.reasonCode, classification.reason, {
                cacheKind: "hotExecution",
                operationType: command,
                reuseBlockReason: classification.reasonCode,
                ...scopeContext(scope, changedFileGeneration),
            }));
        }
        const key = createCommandResultCacheKey({
            command,
            cwd: scope.cwd,
            environmentFingerprint: snapshot.environmentFingerprint,
            dependencyFingerprint: snapshot.dependencyFingerprint,
            gitHead: snapshot.gitHead,
            runtimeVersion: process.version,
        });
        const validation = buildCommandValidation(snapshot, scope, key.fingerprint);
        const cached = cache.get(key.key, validation);
        if (!cached) {
            return recordAndReturn(missDecision(JOYRIDE_REASON.MISS_NO_ENTRY, "No cached command result", {
                cacheKind: "hotExecution",
                keySummary: key.key.slice(0, 48),
                proofSummary: createJoyRideFingerprint(validation).slice(0, 16),
            }));
        }
        if (cached.userRejected || cached.diagnosticOnly) {
            return recordAndReturn(diagnosticOnlyDecision(JOYRIDE_REASON.MISS_COMMAND_DIAGNOSTIC_ONLY, "Cached entry is diagnostic-only", {
                cacheKind: "hotExecution",
                keySummary: key.key.slice(0, 48),
                reuseBlockReason: cached.classificationReason ?? "diagnostic_only",
            }));
        }
        const explanation = cache.explain(key.key);
        recordHit(cache, key.key, "hotExecution", command, scope, classification.reason, "command", createJoyRideFingerprint(validation).slice(0, 16));
        const value = [false, cached.outputSummary.text];
        return recordAndReturn(hitDecision(JOYRIDE_REASON.HIT_COMMAND_SAFE_ALLOWLISTED, classification.reason, value, {
            cacheKind: "hotExecution",
            keySummary: key.key.slice(0, 48),
            proofSummary: createJoyRideFingerprint(validation).slice(0, 16),
            entryAgeMs: explanation.ageMs,
            ttlRemainingMs: explanation.expiresAt ? explanation.expiresAt - Date.now() : undefined,
        }));
    }
    catch (error) {
        return handleInternalError("lookupSafeCommandResult", error, "hotExecution", scope);
    }
}
export async function lookupVerificationProof(cache, command, scope, snapshot, relevantFileHashes = {}) {
    if (!canJoyRideSkipWork()) {
        return configDisabledDecision("verification", scope);
    }
    if (!canJoyRideReuseVerification()) {
        return recordAndReturn(missDecision(JOYRIDE_REASON.MISS_CONFIG_VERIFICATION_CACHE_DISABLED, "Verification cache disabled via config", {
            cacheKind: "verification",
        }));
    }
    if (!hasCompleteVerificationProof(relevantFileHashes)) {
        return recordAndReturn(missDecision(JOYRIDE_REASON.MISS_VERIFICATION_MISSING_FILE_HASHES, "Verification requires complete file-hash proof", {
            cacheKind: "verification",
            reuseBlockReason: JOYRIDE_REASON.MISS_VERIFICATION_INCOMPLETE_PROOF,
        }));
    }
    try {
        const ws = snapshot ?? (await buildJoyRideWorkspaceSnapshot(scope.cwd, scope.terminalMode));
        const verifyKey = createVerificationCacheKey({
            command,
            cwd: scope.cwd,
            dependencyFingerprint: ws.dependencyFingerprint,
            lockfileFingerprint: ws.lockfileFingerprint,
            relevantFileHashes,
            environmentFingerprint: ws.environmentFingerprint,
            approvalBoundaryId: scope.approvalBoundaryId,
            gitHead: ws.gitHead,
            runtimeVersion: process.version,
            toolVersion: "lumi-verification-v1",
        });
        const validation = buildVerificationValidation(ws, scope, verifyKey.fingerprint, relevantFileHashes);
        const cached = cache.get(verifyKey.key, validation);
        if (!cached) {
            return recordAndReturn(missDecision(JOYRIDE_REASON.MISS_NO_ENTRY, "No cached verification proof", {
                cacheKind: "verification",
                keySummary: verifyKey.key.slice(0, 48),
                proofSummary: createJoyRideFingerprint(validation).slice(0, 16),
            }));
        }
        if (cached.userRejected || cached.diagnosticOnly) {
            return recordAndReturn(diagnosticOnlyDecision(JOYRIDE_REASON.MISS_COMMAND_DIAGNOSTIC_ONLY, "Verification entry is diagnostic-only", {
                cacheKind: "verification",
                keySummary: verifyKey.key.slice(0, 48),
                reuseBlockReason: cached.classificationReason ?? "failed_or_rejected",
            }));
        }
        const explanation = cache.explain(verifyKey.key);
        recordHit(cache, verifyKey.key, "verification", command, scope, "verification_proof_complete", "verification", createJoyRideFingerprint(validation).slice(0, 16));
        const value = [false, cached.outputSummary.text];
        return recordAndReturn(hitDecision(JOYRIDE_REASON.HIT_VERIFICATION_COMPLETE_PROOF, "Verification proof matched", value, {
            cacheKind: "verification",
            keySummary: verifyKey.key.slice(0, 48),
            proofSummary: createJoyRideFingerprint(validation).slice(0, 16),
            entryAgeMs: explanation.ageMs,
        }));
    }
    catch (error) {
        return handleInternalError("lookupVerificationProof", error, "verification", scope);
    }
}
export async function lookupSearchResult(cache, query, options, scope, changedFileGeneration = 0) {
    if (!canJoyRideSkipWork()) {
        return configDisabledDecision("workspaceIndex", scope);
    }
    if (!canJoyRideReuseSearch()) {
        return recordAndReturn(missDecision(JOYRIDE_REASON.MISS_CONFIG_SEARCH_CACHE_DISABLED, "Search cache disabled via config", {
            cacheKind: "workspaceIndex",
        }));
    }
    try {
        const snapshot = await buildJoyRideWorkspaceSnapshot(scope.cwd, scope.terminalMode, changedFileGeneration);
        const key = createGrepResultCacheKey({
            query,
            cwd: options.cwd,
            includeGlobs: options.includeGlobs,
            excludeGlobs: options.excludeGlobs,
            workspaceFingerprint: snapshot.workspaceFingerprint,
            changedFileGeneration,
            caseSensitive: options.caseSensitive ?? true,
            searchImplementationVersion: SEARCH_IMPLEMENTATION_VERSION,
        });
        const validation = buildCommandValidation(snapshot, scope, key.fingerprint);
        const cached = cache.get(key.key, validation);
        if (!cached) {
            return recordAndReturn(missDecision(JOYRIDE_REASON.MISS_SEARCH_NO_ENTRY, "No cached search result", {
                cacheKind: "workspaceIndex",
                keySummary: key.key.slice(0, 48),
                proofSummary: createJoyRideFingerprint(validation).slice(0, 16),
            }));
        }
        const explanation = cache.explain(key.key);
        recordHit(cache, key.key, "workspaceIndex", query, scope, "grep_workspace_fingerprint_match", "grep", createJoyRideFingerprint(validation).slice(0, 16));
        return recordAndReturn(hitDecision(JOYRIDE_REASON.HIT_SEARCH_WORKSPACE_FINGERPRINT, "Search workspace fingerprint matched", cached.results, {
            cacheKind: "workspaceIndex",
            keySummary: key.key.slice(0, 48),
            proofSummary: createJoyRideFingerprint(validation).slice(0, 16),
            entryAgeMs: explanation.ageMs,
        }));
    }
    catch (error) {
        return handleInternalError("lookupSearchResult", error, "workspaceIndex", scope);
    }
}
export async function storeReusableCommandResult(cache, command, result, scope, changedFileGeneration = 0) {
    if (!canJoyRideStore()) {
        return;
    }
    const classification = classifyCommand(command);
    if (!classification.canStoreDiagnostic) {
        return;
    }
    try {
        const [userRejected, toolResponse] = result;
        const outputText = toolResponseToText(toolResponse);
        const summary = summarizeJoyRideCommandOutput(outputText);
        const snapshot = await buildJoyRideWorkspaceSnapshot(scope.cwd, scope.terminalMode, changedFileGeneration);
        const exitCode = extractExitCode(outputText);
        const failed = exitCode !== undefined && exitCode !== 0;
        const diagnosticOnly = userRejected || failed || isEnvAlteringCommand(command) || !classification.canSkipExecution;
        const value = {
            command,
            cwd: scope.cwd,
            userRejected,
            exitCode,
            outputSummary: summary,
            capturedAt: Date.now(),
            diagnosticOnly,
            classificationReason: classification.reason,
        };
        if (isVerificationCommand(command)) {
            await storeVerificationProof(cache, command, value, scope, snapshot, diagnosticOnly);
            return;
        }
        const key = createCommandResultCacheKey({
            command,
            cwd: scope.cwd,
            environmentFingerprint: snapshot.environmentFingerprint,
            dependencyFingerprint: snapshot.dependencyFingerprint,
            gitHead: snapshot.gitHead,
            runtimeVersion: process.version,
        });
        const metadata = baseSetMetadata(scope, snapshot, "hotExecution", 5 * 60 * 1000, "recent command output summary", {
            fingerprint: key.fingerprint,
        });
        cache.trySet(key.key, value, metadata);
    }
    catch (error) {
        Logger.warn("[JoyRide] Command result cache admission skipped:", error);
    }
}
export async function storeCommandDiagnostic(cache, command, result, scope, changedFileGeneration = 0) {
    await storeReusableCommandResult(cache, command, result, scope, changedFileGeneration);
}
export async function storeVerificationProof(cache, command, value, scope, snapshot, diagnosticOnly = value.diagnosticOnly, relevantFileHashes = {}) {
    if (!canJoyRideStore()) {
        return;
    }
    try {
        const ws = snapshot ?? (await buildJoyRideWorkspaceSnapshot(scope.cwd, scope.terminalMode));
        const verifyKey = createVerificationCacheKey({
            command,
            cwd: scope.cwd,
            dependencyFingerprint: ws.dependencyFingerprint,
            lockfileFingerprint: ws.lockfileFingerprint,
            relevantFileHashes,
            environmentFingerprint: ws.environmentFingerprint,
            approvalBoundaryId: scope.approvalBoundaryId,
            gitHead: ws.gitHead,
            runtimeVersion: process.version,
            toolVersion: "lumi-verification-v1",
        });
        const metadata = baseSetMetadata(scope, ws, "verification", 10 * 60 * 1000, "verification command output", {
            fingerprint: verifyKey.fingerprint,
            scope: { type: "verification", id: scope.taskId },
            relevantFileHashes,
            toolVersion: "lumi-verification-v1",
        });
        cache.trySet(verifyKey.key, { ...value, diagnosticOnly }, metadata);
    }
    catch (error) {
        Logger.warn("[JoyRide] Verification proof admission skipped:", error);
    }
}
export async function storeFailedVerificationDiagnostic(cache, command, result, scope, changedFileGeneration = 0) {
    await storeReusableCommandResult(cache, command, result, scope, changedFileGeneration);
}
export async function storeSearchResult(cache, query, options, results, resultCount, scope, changedFileGeneration = 0) {
    if (!canJoyRideStore()) {
        return;
    }
    try {
        const snapshot = await buildJoyRideWorkspaceSnapshot(scope.cwd, scope.terminalMode, changedFileGeneration);
        const key = createGrepResultCacheKey({
            query,
            cwd: options.cwd,
            includeGlobs: options.includeGlobs,
            excludeGlobs: options.excludeGlobs,
            workspaceFingerprint: snapshot.workspaceFingerprint,
            changedFileGeneration,
            caseSensitive: options.caseSensitive ?? true,
            searchImplementationVersion: SEARCH_IMPLEMENTATION_VERSION,
        });
        const value = { results, resultCount, capturedAt: Date.now() };
        const metadata = baseSetMetadata(scope, snapshot, "workspaceIndex", 3 * 60 * 1000, "grep/search result reuse", {
            fingerprint: key.fingerprint,
            scope: { type: "workspace", id: scope.cwd },
        });
        cache.trySet(key.key, value, { ...metadata, estimatedBytes: Math.min(results.length * 2 + 256, 512 * 1024) });
    }
    catch (error) {
        Logger.warn("[JoyRide] Search cache admission skipped:", error);
    }
}
export function createJoyRideTaskScope(taskId, cwd, terminalMode, apiRequestCount) {
    return {
        taskId,
        cwd,
        terminalMode,
        generation: apiRequestCount,
        approvalBoundaryId: buildApprovalBoundaryId(taskId, apiRequestCount),
    };
}
//# sourceMappingURL=JoyRideHotPath.js.map