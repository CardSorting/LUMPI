import * as fs from "fs";
import * as path from "path";
/**
 * ContextStalenessTracker: Ensures "Cognitive Freshness".
 * Keeps track of which files the agent has read and warns if they have been
 * modified externally or by other tool calls, rendering the current context "Stale".
 */
export class ContextStalenessTracker {
    cwd;
    contextMap = new Map();
    constructor(cwd) {
        this.cwd = cwd;
    }
    /**
     * Records that a file has been read into context.
     */
    async recordRead(filePath, content) {
        const absolutePath = path.resolve(this.cwd, filePath);
        const signature = this.calculateSignature(content);
        this.contextMap.set(absolutePath, {
            path: absolutePath,
            lastReadTimestamp: Date.now(),
            lastEditTimestamp: this.getMtime(absolutePath),
            signature,
            content, // Cache content for v9 Delta Analysis
            stale: false,
        });
    }
    /**
     * Records that a file has been modified (usually by a tool call).
     */
    recordEdit(filePath) {
        const absolutePath = path.resolve(this.cwd, filePath);
        const entry = this.contextMap.get(absolutePath);
        if (entry) {
            entry.stale = true;
            entry.lastEditTimestamp = Date.now();
        }
    }
    /**
     * Checks if a file in the context window is now stale.
     */
    checkStaleness(filePath) {
        const absolutePath = path.resolve(this.cwd, filePath);
        const entry = this.contextMap.get(absolutePath);
        if (!entry)
            return { isStale: false };
        // 1. Check if marked stale by previous tool action
        if (entry.stale) {
            return { isStale: true, reason: "Modified by a previous tool call." };
        }
        // 2. Check physical mtime for external changes
        const currentMtime = this.getMtime(absolutePath);
        if (currentMtime > entry.lastReadTimestamp) {
            entry.stale = true;
            return { isStale: true, reason: "Modified externally on disk." };
        }
        return { isStale: false };
    }
    /**
     * Returns a warning message if the context is stale.
     * PRODUCTION HARDENING: Authoritative signaling for high-velocity synchronization.
     */
    getStaleWarning(filePath) {
        const status = this.checkStaleness(filePath);
        if (status.isStale) {
            const absolutePath = path.resolve(this.cwd, filePath);
            const entry = this.contextMap.get(absolutePath);
            const urgency = status.reason?.includes("externally") ? "CRITICAL" : "HIGH";
            let deltaMsg = "";
            if (entry && entry.content) {
                try {
                    const currentContent = fs.readFileSync(absolutePath, "utf-8");
                    const lineDiff = currentContent.split("\n").length - entry.content.split("\n").length;
                    deltaMsg = `\n  - Delta: ${lineDiff > 0 ? "+" : ""}${lineDiff} lines since last read.`;
                }
                catch {
                    deltaMsg = "\n  - Delta: File might have been deleted or moved.";
                }
            }
            return `⚠️ COGNITIVE STALENESS [Urgency: ${urgency}]: The version of \`${path.basename(filePath)}\` in your current context window is OUTDATED. ${status.reason}${deltaMsg}\n  👉 You MUST re-read this file to prevent architectural drift and tool execution failure.`;
        }
        return null;
    }
    getMtime(p) {
        try {
            return fs.statSync(p).mtimeMs;
        }
        catch {
            return 0;
        }
    }
    calculateSignature(content) {
        // Simple length + first 100 chars hash for speed
        return `${content.length}:${content.substring(0, 100)}`;
    }
}
//# sourceMappingURL=ContextStalenessTracker.js.map