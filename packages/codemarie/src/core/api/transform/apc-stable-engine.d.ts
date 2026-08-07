import type OpenAI from "openai";
import type { DietCodeStorageMessage } from "../../../shared/messages/content";
import type { DietCodeTool } from "../../../shared/tools";
export interface ApcStableEngineOptions {
    maxToolOutputLength?: number;
    activeVisionWindow?: number;
}
export interface ApcTelemetryStats {
    totalRequests: number;
    totalUncachedTokens: number;
    totalCachedTokens: number;
    totalOutputTokens: number;
    totalEstSavedCost: string;
    averageCacheHitRatio: string;
}
/**
 * ApcStableIngestionEngine: Dedicated hardware Automatic Prompt Caching (APC)
 * token optimization engine for Cerebras and Gemma models.
 *
 * Designed specifically to solve prompt cache invalidation in multi-turn agent sessions:
 * 1. Guarantees 100% Prefix Invariance: Historical turn content (turn 0..N-1) NEVER mutates across turns.
 * 2. Preserves BPE Vocabulary: Cleans whitespace, ANSI color sequences, comments, URL params, base64 vision URLs,
 *    and stack frames without inserting artificial shorthand symbols (e.g. `st:`, `msg:`, `err:`, `[@diff]`)
 *    that shatter Gemma BPE tokens.
 * 3. Line-Boundary Aligned Truncation: Snaps head/tail truncation bounds to whole line breaks (\n) to prevent broken tokens.
 * 4. Token 0 Alignment: Normalizes line endings (`\r\n` -> `\n`), unwraps single-text block arrays,
 *    and sorts tool definitions deterministically.
 * 5. APC-Stable Context Ceiling: Trims oldest turns cleanly from the start when context limits are reached,
 *    preserving prefix alignment for remaining turns.
 */
export declare class ApcStableIngestionEngine {
    private options;
    private lifetimeStats;
    constructor(options?: ApcStableEngineOptions);
    /**
     * Fast heuristic token count estimator (~3.8 characters per token).
     */
    estimateTokenCount(text: string): number;
    /**
     * Normalizes line endings and whitespace to stabilize Token 0 system prompt prefixes.
     */
    normalizeSystemPrompt(systemPrompt: string): string;
    /**
     * Sanitizes assistant text content by stripping reasoning/thinking tags
     * to prevent internal reasoning leakage across follow-up turns.
     */
    sanitizeAssistantContent(content: string): string;
    /**
     * Safe, BPE-preserving text cleaner.
     * Removes extraneous whitespace, ANSI sequences, HTML comments, stack frame bloat, and repeated lines
     * WITHOUT replacing standard words with out-of-vocabulary shorthand symbols.
     */
    cleanText(text: string): string;
    /**
     * Line-boundary aligned static tool output compaction.
     * Snaps truncation bounds to whole newline characters to prevent broken tokens or split lines.
     */
    compactToolOutputContent(content: string): string;
    /**
     * Prunes raw base64 vision payloads in historical turns, replacing them with lightweight anchors.
     */
    pruneHistoricalVisionPayloads(messages: DietCodeStorageMessage[]): DietCodeStorageMessage[];
    /**
     * Deduplicates consecutive user messages with identical text content,
     * preventing redundant turn inflation.
     */
    deduplicateConsecutiveMessages<T extends {
        role?: string;
        content?: unknown;
    }>(messages: T[]): T[];
    /**
     * Enforces APC-stable context ceiling truncation when total estimated tokens exceed maxAllowedTokens.
     * Older turns are removed starting from index 0 in chronological order, preserving prefix stability for remaining turns.
     */
    enforceApcStableContextCeiling<T extends {
        role?: string;
        content?: unknown;
    }>(messages: T[], maxAllowedTokens?: number, preserveRecentTurns?: number): T[];
    /**
     * Transforms OpenAI completion messages into a static, APC-stable array.
     * 1. Tool messages are statically optimized upon ingestion so their text representation
     *    NEVER mutates across turns, guaranteeing 100% hardware KV-cache prefix matching.
     * 2. Unwraps single text-block array contents ([{ type: "text", text: "..." }]) into plain string content ("...")
     *    to maintain byte-identical APC token prefix consistency across all turns.
     * 3. Normalizes trailing whitespace on text contents.
     * 4. Deduplicates consecutive identical user messages.
     */
    processApcStableMessages(messages: OpenAI.Chat.ChatCompletionMessageParam[]): OpenAI.Chat.ChatCompletionMessageParam[];
    /**
     * Sorts tool definitions deterministically by tool name to prevent Token 0 schema drift.
     */
    alignToolSchemas(tools?: DietCodeTool[]): DietCodeTool[] | undefined;
    private getToolName;
    /**
     * Logs real-time token telemetry and prompt cache performance metrics.
     */
    logCacheTelemetry(providerName: string, modelId: string, inputTokens: number, cacheReadTokens: number, outputTokens: number, inputPricePerMillion?: number): void;
    getLifetimeTelemetryReport(): ApcTelemetryStats;
}
export declare const ApcProfiles: {
    /** Hardware Automatic Prompt Caching profile (Cerebras, Wafer-scale hardware) */
    STRICT_APC: ApcStableIngestionEngine;
    /** High density profile for long multi-turn sessions */
    HIGH_DENSITY: ApcStableIngestionEngine;
    /** Maximum retention profile for large context window models */
    MAX_RETENTION: ApcStableIngestionEngine;
};
export declare const defaultApcStableEngine: ApcStableIngestionEngine;
//# sourceMappingURL=apc-stable-engine.d.ts.map