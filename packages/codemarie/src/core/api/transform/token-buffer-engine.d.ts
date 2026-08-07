import type { DietCodeStorageMessage } from "@/shared/messages/content";
import type { DietCodeTool } from "@/shared/tools";
export interface TokenBufferOptions {
    activeVisionWindow?: number;
    keepFullToolTurns?: number;
    enableDslCompression?: boolean;
    maxToolOutputLength?: number;
}
/**
 * TokenIngestionBufferEngine: A centralized context and token optimization engine
 * shared across all LLM providers (Cerebras, Anthropic, OpenRouter, OpenAI, Gemini, Bedrock, etc.).
 *
 * Responsibilities:
 * 1. Single-Turn Vision Payload Eviction (pruneHistoricalVisionPayloads)
 * 2. Epistemic Tool Result Compaction (compactHistoricalToolOutputs)
 * 3. 10-Stage Domain-Specific Language (DSL) Token Compression (compressDslText)
 * 4. Deterministic Tool Schema Alignment (alignToolSchemas)
 * 5. System Prompt Normalization (normalizeSystemPrompt)
 * 6. Observability & Cache Telemetry Analytics (logCacheTelemetry)
 */
export declare class TokenIngestionBufferEngine {
    private options;
    constructor(options?: TokenBufferOptions);
    /**
     * Normalizes line endings and whitespace to stabilize Token 0 prompt prefixes across providers.
     */
    normalizeSystemPrompt(systemPrompt: string): string;
    /**
     * Keeps raw visual base64 payloads ONLY on active turns (most recent N turns).
     * Replaces historical base64 images with lightweight semantic anchors across any provider.
     */
    pruneHistoricalVisionPayloads(messages: DietCodeStorageMessage[]): DietCodeStorageMessage[];
    /**
     * Sanitizes assistant text content by stripping reasoning/thinking tags
     * across DeepSeek R1, Qwen R1, Claude, and Gemma models.
     */
    sanitizeAssistantContent(content: string): string;
    /**
     * Applies 10-Stage Domain-Specific Language (DSL) Token Compression to reduce payload size.
     */
    compressDslText(text: string): string;
    /**
     * Compacts historical tool outputs in older turns to eliminate O(N^2) quadratic context growth.
     */
    compactHistoricalToolOutputs<T extends {
        role?: string;
        content?: unknown;
    }>(messages: T[]): T[];
    /**
     * Sorts tool definitions deterministically by tool name across OpenAI, Anthropic, or Gemini schemas.
     */
    alignToolSchemas(tools?: DietCodeTool[]): DietCodeTool[] | undefined;
    /**
     * Extracts tool name across heterogeneous tool definitions.
     */
    private getToolName;
    /**
     * Deduplicates consecutive user or environment payload messages with identical content,
     * collapsing redundant turns to conserve token context.
     */
    deduplicateConsecutiveMessages<T extends {
        role?: string;
        content?: unknown;
    }>(messages: T[]): T[];
    /**
     * Fast heuristic token count estimator (~4 characters per token).
     */
    estimateTokenCount(text: string): number;
    /**
     * Automatically applies ephemeral prompt cache control markers ({ cache_control: { type: "ephemeral" } })
     * to the last two user messages for providers supporting explicit prompt caching (Anthropic, OpenRouter, MiniMax).
     */
    applyEphemeralCacheControl<T extends {
        role?: string;
        content?: unknown;
    }>(messages: T[]): T[];
    /**
     * Computes a detailed compression report detailing character reduction,
     * estimated tokens saved, and financial savings.
     */
    generateCompressionReport(originalText: string, compressedText: string, inputPricePerMillion?: number): CompressionReport;
    /**
     * Enforces an adaptive context window ceiling guard.
     * If estimated message tokens exceed maxAllowedTokens, older turns are trimmed to prevent context window overflow.
     */
    enforceContextCeiling<T extends {
        role?: string;
        content?: unknown;
    }>(messages: T[], maxAllowedTokens?: number, preserveRecentTurns?: number): T[];
    /**
     * Single-call full optimization pipeline that executes system prompt normalization,
     * vision payload pruning, tool compaction, turn deduplication, tool alignment,
     * context ceiling guards, and savings report generation in one unified pass.
     */
    optimizeMessagesPipeline(options: OptimizationPipelineOptions): OptimizationPipelineResult;
    private lifetimeStats;
    /**
     * Returns lifetime aggregate telemetry stats across all agent session turns.
     */
    getLifetimeTelemetryReport(): LifetimeTelemetryStats;
    /**
     * Logs real-time token telemetry and prompt cache performance metrics.
     */
    logCacheTelemetry(providerName: string, modelId: string, inputTokens: number, cacheReadTokens: number, outputTokens: number, inputPricePerMillion?: number): void;
}
export interface LifetimeTelemetryStats {
    totalRequests: number;
    totalUncachedTokens: number;
    totalCachedTokens: number;
    totalOutputTokens: number;
    totalEstDollarsSaved: string;
    averageCacheHitRatio: string;
}
export interface CompressionReport {
    originalLength: number;
    compressedLength: number;
    reductionPercentage: string;
    estimatedTokensSaved: number;
    estimatedDollarsSaved: string;
}
export interface OptimizationPipelineOptions {
    systemPrompt: string;
    messages: DietCodeStorageMessage[];
    tools?: DietCodeTool[];
    applyEphemeralTags?: boolean;
    maxAllowedTokens?: number;
}
export interface OptimizationPipelineResult {
    normalizedSystemPrompt: string;
    optimizedMessages: DietCodeStorageMessage[];
    alignedTools?: DietCodeTool[];
    compressionReport: CompressionReport;
}
export declare const TokenBufferProfiles: {
    /** Profile optimized for automatic hardware prompt caching (Cerebras, OpenAI, DeepSeek) */
    STRICT_CACHE_STABILITY: TokenIngestionBufferEngine;
    /** Profile optimized for explicit ephemeral prompt caching (Anthropic, OpenRouter, MiniMax) */
    EPHEMERAL_PROMPT_CACHE: TokenIngestionBufferEngine;
    /** High compression profile for long context sessions */
    HIGH_COMPRESSION: TokenIngestionBufferEngine;
};
/** Default singleton instance for general provider use */
export declare const defaultTokenBufferEngine: TokenIngestionBufferEngine;
//# sourceMappingURL=token-buffer-engine.d.ts.map