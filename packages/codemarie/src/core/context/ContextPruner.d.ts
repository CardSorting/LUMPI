import type { DietCodeContent } from "@/shared/messages/content";
import type { CodeSkeletonResult, CommandOutputCompressionResult, ContextCheckpointLedger, HierarchicalLedger } from "./context-management/ContextCompactionTypes";
/**
 * Deterministic, bounded projection helpers used by the context manager.
 * Originals are not mutated; callers retain them in durable conversation
 * history and project these smaller representations into model context.
 */
export interface PrunerConfig {
    maxLines: number;
    maxSourceCharacters: number;
    maxMaterializedLines: number;
    maxPatternCharactersPerLine: number;
    headRatio: number;
    tailRatio: number;
    enabled: boolean;
}
export declare class ContextPruner {
    private readonly config;
    constructor(config?: Partial<PrunerConfig>);
    prune(content: DietCodeContent[]): DietCodeContent[];
    /**
     * Produces a language-aware structural outline. This is not a parser AST and
     * the result is explicitly non-authoritative: folded markers may make the
     * projected snippet syntactically invalid. Pattern input is capped per line,
     * and patterns avoid unbounded wildcards and nested quantifiers.
     */
    skeletonizeCode(code: string, maxLinesOverride?: number): CodeSkeletonResult;
    /**
     * Compresses command/test/search output while retaining a bounded sample of
     * failures, stack frames, summaries, and the beginning/end of the stream.
     */
    compressCommandOutput(output: string, maxLinesOverride?: number): CommandOutputCompressionResult;
    createHierarchicalLedgerSummary(ledger: HierarchicalLedger | ContextCheckpointLedger): string;
    /**
     * A compact pointer contains no raw objective text, preventing prompt/XML
     * injection through ledger values while still allowing exact correlation.
     */
    createSilentInlineLedgerPointer(ledger: HierarchicalLedger | ContextCheckpointLedger): string;
    private pruneTextBlock;
    private collectStructuralAnchors;
    private collectCommandEvidence;
    private selectBoundedLines;
    private renderSelectedLines;
    private pushBoundedCandidate;
    private serializeLedger;
    private normalizeLedgerText;
    private normalizeLineBudget;
    private normalizeSourceCharacterBudget;
    private normalizeMaterializedLineBudget;
    private normalizePatternCharacterBudget;
    private getPatternInput;
    private normalizeRatio;
    private hash;
    /**
     * Prevents pathological tool outputs from creating an unbounded line array.
     * The sample spans the full source rather than taking only head/tail bytes.
     * Full-source hashing and line counting remain exact for recovery checks.
     */
    private createBoundedSource;
    private countLines;
}
//# sourceMappingURL=ContextPruner.d.ts.map