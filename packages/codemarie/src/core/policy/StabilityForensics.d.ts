import type { StabilityMonitor } from "../integrity/StabilityMonitor";
import type { SpiderEngine } from "./spider/SpiderEngine";
export interface ForensicMessage {
    role: string;
    content: string | Array<{
        text?: string;
        input?: Record<string, unknown>;
    }>;
}
/**
 * StabilityForensics: Verifies the integrity of architectural evidence.
 * Ensures that an assistant has actually "observed" the files and symbols they cite.
 */
export declare class StabilityForensics {
    private cwd;
    private stabilityMonitor;
    private spiderEngine?;
    constructor(cwd: string, stabilityMonitor: StabilityMonitor, spiderEngine?: SpiderEngine);
    /**
     * Verifies that all file paths and symbols cited in the strategic review have a clear observation history.
     * V30: Now includes Structural Sync Detection for synchronization.
     * V31: Uses Structural Hashing to ignore aesthetic changes (comments, whitespace).
     * V33: Uses Identity Persistence to verify citations via project history.
     */
    verifyEvidenceVerification(content: string, history?: ForensicMessage[]): Promise<{
        errors: string[];
        warnings: string[];
    }>;
    /**
     * V235: Multivariate Hazard Sensing.
     * Returns the hazard score for a specific file from the structural substrate.
     */
    getHazardLevel(filePath: string): number;
    /**
     * V31: Computes an aesthetically-normalized hashing of the content.
     */
    computeStructuralHash(content: string): string;
    /**
     * Generates a helpful Investigation Trace for the strategic review.
     */
    generateInvestigationTrace(): string;
    /**
     * Extracts file paths from the last N assistant turns in conversation history.
     * V34: Expanded Conversational Grounding (Lookback 5).
     */
    extractPathsFromHistory(history: ForensicMessage[]): Set<string>;
    /**
     * V34: Range-aware Drift Detection.
     * Checks if a specific edit block matches the observed structural identity,
     * even if other parts of the file have drifted.
     */
    verifyBlockStability(currentContent: string, targetContent: string): boolean;
    /**
     * V220: Industrial Hygiene (Disposal).
     * Releases retained service references during policy-engine teardown.
     */
    dispose(): void;
}
//# sourceMappingURL=StabilityForensics.d.ts.map