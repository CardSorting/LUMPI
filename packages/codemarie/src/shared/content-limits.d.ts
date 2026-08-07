/**
 * Content size limits to prevent massive files/responses from bricking conversations.
 * 400KB ≈ ~100,000 tokens, which is a reasonable limit for context.
 */
/** Maximum content size in bytes (400KB) */
export declare const MAX_CONTENT_SIZE_BYTES: number;
/**
 * Format bytes into a human-readable string (e.g., "1.5 MB", "400 KB").
 */
export declare function formatBytes(bytes: number): string;
/**
 * Truncate content if it exceeds the maximum size limit.
 * Shows the beginning of the content with a clear truncation notice at the very end.
 *
 * @param content The content to potentially truncate
 * @param maxSize Maximum size in bytes (defaults to MAX_CONTENT_SIZE_BYTES)
 * @returns The original content if under limit, or truncated content with message at end
 */
export declare function truncateContent(content: string, maxSize?: number): string;
//# sourceMappingURL=content-limits.d.ts.map