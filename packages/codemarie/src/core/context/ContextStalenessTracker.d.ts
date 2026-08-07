export interface ContextEntry {
    path: string;
    lastReadTimestamp: number;
    lastEditTimestamp: number;
    signature: string;
    content: string;
    stale: boolean;
}
/**
 * ContextStalenessTracker: Ensures "Cognitive Freshness".
 * Keeps track of which files the agent has read and warns if they have been
 * modified externally or by other tool calls, rendering the current context "Stale".
 */
export declare class ContextStalenessTracker {
    private cwd;
    private contextMap;
    constructor(cwd: string);
    /**
     * Records that a file has been read into context.
     */
    recordRead(filePath: string, content: string): Promise<void>;
    /**
     * Records that a file has been modified (usually by a tool call).
     */
    recordEdit(filePath: string): void;
    /**
     * Checks if a file in the context window is now stale.
     */
    checkStaleness(filePath: string): {
        isStale: boolean;
        reason?: string;
    };
    /**
     * Returns a warning message if the context is stale.
     * PRODUCTION HARDENING: Authoritative signaling for high-velocity synchronization.
     */
    getStaleWarning(filePath: string): string | null;
    private getMtime;
    private calculateSignature;
}
//# sourceMappingURL=ContextStalenessTracker.d.ts.map