/**
 * [LAYER: CORE]
 * Intention-revealing JoyRide hot-path APIs with typed cache decisions.
 */
import type { DietCodeToolResponseContent } from "@shared/messages/content";
import type { JoyRideCache } from "./JoyRideCache.js";
import { type JoyRideTaskScope, type JoyRideWorkspaceSnapshot } from "./JoyRideContext.js";
import { type JoyRideCommandLookupDecision, type JoyRideSearchLookupDecision } from "./JoyRideDecisions.js";
import type { JoyRideCommandCacheEntry, JoyRideSearchLookupOptions } from "./JoyRideHotPathTypes.js";
export declare function lookupSafeCommandResult(cache: JoyRideCache, command: string, scope: JoyRideTaskScope, changedFileGeneration?: number, relevantFileHashes?: Record<string, string>): Promise<JoyRideCommandLookupDecision>;
export declare function lookupVerificationProof(cache: JoyRideCache, command: string, scope: JoyRideTaskScope, snapshot?: JoyRideWorkspaceSnapshot, relevantFileHashes?: Record<string, string>): Promise<JoyRideCommandLookupDecision>;
export declare function lookupSearchResult(cache: JoyRideCache, query: string, options: JoyRideSearchLookupOptions, scope: JoyRideTaskScope, changedFileGeneration?: number): Promise<JoyRideSearchLookupDecision>;
export declare function storeReusableCommandResult(cache: JoyRideCache, command: string, result: [boolean, DietCodeToolResponseContent], scope: JoyRideTaskScope, changedFileGeneration?: number): Promise<void>;
export declare function storeCommandDiagnostic(cache: JoyRideCache, command: string, result: [boolean, DietCodeToolResponseContent], scope: JoyRideTaskScope, changedFileGeneration?: number): Promise<void>;
export declare function storeVerificationProof(cache: JoyRideCache, command: string, value: JoyRideCommandCacheEntry, scope: JoyRideTaskScope, snapshot?: JoyRideWorkspaceSnapshot, diagnosticOnly?: boolean, relevantFileHashes?: Record<string, string>): Promise<void>;
export declare function storeFailedVerificationDiagnostic(cache: JoyRideCache, command: string, result: [boolean, DietCodeToolResponseContent], scope: JoyRideTaskScope, changedFileGeneration?: number): Promise<void>;
export declare function storeSearchResult(cache: JoyRideCache, query: string, options: JoyRideSearchLookupOptions, results: string, resultCount: number, scope: JoyRideTaskScope, changedFileGeneration?: number): Promise<void>;
export declare function createJoyRideTaskScope(taskId: string, cwd: string, terminalMode: string, apiRequestCount: number): JoyRideTaskScope;
//# sourceMappingURL=JoyRideHotPath.d.ts.map