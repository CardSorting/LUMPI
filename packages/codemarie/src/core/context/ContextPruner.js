import { createHash } from "node:crypto";
export class ContextPruner {
    config;
    constructor(config = {}) {
        const requestedHeadRatio = this.normalizeRatio(config.headRatio, 0.45);
        const requestedTailRatio = this.normalizeRatio(config.tailRatio, 0.25);
        const ratioScale = requestedHeadRatio + requestedTailRatio > 0.8 ? 0.8 / (requestedHeadRatio + requestedTailRatio) : 1;
        this.config = {
            maxLines: this.normalizeLineBudget(config.maxLines ?? 200),
            maxSourceCharacters: this.normalizeSourceCharacterBudget(config.maxSourceCharacters ?? 2_000_000),
            maxMaterializedLines: this.normalizeMaterializedLineBudget(config.maxMaterializedLines ?? 20_000),
            maxPatternCharactersPerLine: this.normalizePatternCharacterBudget(config.maxPatternCharactersPerLine ?? 4_096),
            headRatio: requestedHeadRatio * ratioScale,
            tailRatio: requestedTailRatio * ratioScale,
            enabled: config.enabled ?? true,
        };
    }
    prune(content) {
        if (!this.config.enabled)
            return content;
        return content.map((block) => {
            if (block.type === "text") {
                return this.pruneTextBlock(block);
            }
            return block;
        });
    }
    /**
     * Produces a language-aware structural outline. This is not a parser AST and
     * the result is explicitly non-authoritative: folded markers may make the
     * projected snippet syntactically invalid. Pattern input is capped per line,
     * and patterns avoid unbounded wildcards and nested quantifiers.
     */
    skeletonizeCode(code, maxLinesOverride) {
        const maxLines = this.normalizeLineBudget(maxLinesOverride ?? this.config.maxLines);
        const source = this.createBoundedSource(code);
        const lines = source.text.split("\n");
        const sha256 = this.hash(code);
        if (!source.wasSampled && lines.length <= maxLines) {
            return {
                skeletonText: code,
                foldedLines: 0,
                anchorsPreserved: lines.length,
                originalLines: lines.length,
                originalCharacters: code.length,
                projectedLines: lines.length,
                sourceWasSampled: false,
                sha256,
            };
        }
        const rankedAnchors = this.collectStructuralAnchors(lines, maxLines);
        const { text, selectedCount, projectedLines } = this.selectBoundedLines(lines, maxLines, this.config.headRatio, this.config.tailRatio, rankedAnchors, (start, end) => source.wasSampled
            ? `/* ... [NON-AUTHORITATIVE STRUCTURAL PROJECTION: sampled lines ${start + 1}-${end + 1} folded; syntax may be invalid; full-sha256:${sha256.slice(0, 12)}] ... */`
            : `/* ... [NON-AUTHORITATIVE STRUCTURAL PROJECTION: original lines ${start + 1}-${end + 1} folded; syntax may be invalid; sha256:${sha256.slice(0, 12)}] ... */`);
        return {
            skeletonText: text,
            foldedLines: source.wasSampled
                ? Math.max(1, source.originalLines - selectedCount)
                : Math.max(0, source.originalLines - selectedCount),
            anchorsPreserved: selectedCount,
            originalLines: source.originalLines,
            originalCharacters: code.length,
            projectedLines,
            sourceWasSampled: source.wasSampled,
            sha256,
        };
    }
    /**
     * Compresses command/test/search output while retaining a bounded sample of
     * failures, stack frames, summaries, and the beginning/end of the stream.
     */
    compressCommandOutput(output, maxLinesOverride = 150) {
        const maxLines = this.normalizeLineBudget(maxLinesOverride);
        const source = this.createBoundedSource(output);
        const lines = source.text.split("\n");
        const sha256 = this.hash(output);
        const rankedEvidence = this.collectCommandEvidence(lines, maxLines);
        const hasError = /\b(ERROR|FAIL(?:ED|URE)?|FATAL|PANIC|Exception|TypeError|ReferenceError|SyntaxError|AssertionError|ERR_[A-Z_]+)\b/i.test(source.text);
        if (!source.wasSampled && lines.length <= maxLines) {
            return {
                compressedText: output,
                foldedLines: 0,
                hasError,
                originalLines: lines.length,
                originalCharacters: output.length,
                projectedLines: lines.length,
                sourceWasSampled: false,
                sha256,
            };
        }
        const { text, selectedCount, projectedLines } = this.selectBoundedLines(lines, maxLines, 0.22, 0.22, rankedEvidence, (start, end) => source.wasSampled
            ? `... [COMMAND OUTPUT COMPACTED: sampled projection lines ${start + 1}-${end + 1} folded; full-sha256:${sha256.slice(0, 12)}] ...`
            : `... [COMMAND OUTPUT COMPACTED: original lines ${start + 1}-${end + 1} folded; sha256:${sha256.slice(0, 12)}] ...`);
        return {
            compressedText: text,
            foldedLines: source.wasSampled
                ? Math.max(1, source.originalLines - selectedCount)
                : Math.max(0, source.originalLines - selectedCount),
            hasError,
            originalLines: source.originalLines,
            originalCharacters: output.length,
            projectedLines,
            sourceWasSampled: source.wasSampled,
            sha256,
        };
    }
    createHierarchicalLedgerSummary(ledger) {
        const renderList = (items, empty) => items.length ? items.map((item) => `- ${this.normalizeLedgerText(item)}`).join("\n") : `- ${empty}`;
        return `[RECOVERABLE CONTEXT CHECKPOINT]
Reference: sha256:${this.hash(this.serializeLedger(ledger))}
Primary Objective: ${this.normalizeLedgerText(ledger.primaryObjective)}

Architectural Discoveries:
${renderList(ledger.architecturalDiscoveries, "None recorded")}

Modified & Verified Files:
${renderList(ledger.modifiedAndVerifiedFiles, "None")}

Active State & Errors:
${renderList(ledger.activeStateAndErrors, "No active errors")}

Pending Actions:
${renderList(ledger.pendingActions, "Proceeding with current phase")}`;
    }
    /**
     * A compact pointer contains no raw objective text, preventing prompt/XML
     * injection through ledger values while still allowing exact correlation.
     */
    createSilentInlineLedgerPointer(ledger) {
        const digest = this.hash(this.serializeLedger(ledger));
        return `<context_ledger ref="sha256:${digest}" discoveries="${ledger.architecturalDiscoveries.length}" modified_files="${ledger.modifiedAndVerifiedFiles.length}" active_errors="${ledger.activeStateAndErrors.length}"/>`;
    }
    pruneTextBlock(block) {
        const skeleton = this.skeletonizeCode(block.text, this.config.maxLines);
        if (skeleton.foldedLines <= 0)
            return block;
        return {
            ...block,
            text: skeleton.skeletonText,
            // @ts-expect-error Internal projection metadata is stripped before provider serialization.
            _folded: {
                originalLineCount: skeleton.originalLines,
                foldedCount: skeleton.foldedLines,
                sha256: skeleton.sha256,
            },
        };
    }
    collectStructuralAnchors(lines, maxLines) {
        const patterns = [
            { pattern: /\[LAYER:\s*[^\]]+\]/i, priority: 0 },
            {
                pattern: /^\s*(?:export\s+(?:default\s+)?)?(?:interface|class|type|enum|namespace|module|struct|trait)\s+\w+/,
                priority: 0,
            },
            { pattern: /^\s*(?:pub\s+)?(?:struct|enum|trait|impl)\b/, priority: 0 },
            { pattern: /^\s*(?:class|def|async\s+def)\s+\w+/, priority: 0 },
            { pattern: /^\s*type\s+\w+\s+(?:struct|interface)\b/, priority: 0 },
            {
                pattern: /^\s*(?:export\s+)?(?:default\s+)?(?:async\s+)?(?:function|const|let|var)\s+\w+|^\s*(?:pub\s+)?(?:async\s+)?fn\s+\w+/,
                priority: 1,
            },
            { pattern: /^\s*func\s+(?:\([^)\r\n]{0,1024}\)\s*)?[\w$]{1,256}\s*\(/, priority: 1 },
            {
                pattern: /^[ \t]{0,256}(?:(?:public|private|protected|static|async|readonly)[ \t]+){0,8}[\w$]{1,256}[ \t]*\([^)\r\n]{0,2048}\)/,
                priority: 1,
            },
            { pattern: /^\s*(?:import|from|use|package)\b/, priority: 2 },
            { pattern: /SOURCE SAMPLE OMITTED/, priority: 2 },
            { pattern: /^\s*(?:#\[|@\w+|\/\*\*|\/\/\/)/, priority: 3 },
        ];
        const candidates = [];
        const candidatePositions = new Map();
        const candidateLimit = maxLines * 16;
        for (let index = 0; index < lines.length; index++) {
            const patternInput = this.getPatternInput(lines[index]);
            const match = patterns.find(({ pattern }) => pattern.test(patternInput));
            if (!match)
                continue;
            this.pushBoundedCandidate(candidates, candidatePositions, { index, priority: match.priority }, candidateLimit);
        }
        return candidates.sort((a, b) => a.priority - b.priority || a.index - b.index);
    }
    collectCommandEvidence(lines, maxLines) {
        const errorPattern = /\b(ERROR|FAIL(?:ED|URE)?|FATAL|PANIC|Exception|TypeError|ReferenceError|SyntaxError|AssertionError|ERR_[A-Z_]+)\b/i;
        const stackPattern = /^\s*(?:at\s+|File\s+".*",\s+line\s+\d+|Caused by:|goroutine\s+\d+)/;
        const summaryPattern = /\b(\d+\s+(?:passing|passed|failed|skipped|tests?|suites?)|Tests?:|Test Suites?:|Ran\s+\d+|Finished in|Duration:|Time:|exit code|Process exited)\b/i;
        const candidates = [];
        const candidatePositions = new Map();
        const candidateLimit = maxLines * 20;
        for (let index = 0; index < lines.length; index++) {
            const patternInput = this.getPatternInput(lines[index]);
            if (errorPattern.test(patternInput)) {
                for (let surrounding = Math.max(0, index - 2); surrounding <= Math.min(lines.length - 1, index + 3); surrounding++) {
                    this.pushBoundedCandidate(candidates, candidatePositions, { index: surrounding, priority: surrounding === index ? 0 : 1 }, candidateLimit);
                }
            }
            else if (stackPattern.test(patternInput)) {
                this.pushBoundedCandidate(candidates, candidatePositions, { index, priority: 1 }, candidateLimit);
            }
            else if (summaryPattern.test(patternInput)) {
                this.pushBoundedCandidate(candidates, candidatePositions, { index, priority: 2 }, candidateLimit);
            }
            else if (lines[index].includes("SOURCE SAMPLE OMITTED")) {
                this.pushBoundedCandidate(candidates, candidatePositions, { index, priority: 3 }, candidateLimit);
            }
        }
        return candidates.sort((a, b) => a.priority - b.priority || a.index - b.index);
    }
    selectBoundedLines(lines, maxLines, headRatio, tailRatio, rankedCandidates, marker) {
        const contentBudget = Math.max(2, maxLines - 1);
        const headCount = Math.max(1, Math.floor(contentBudget * headRatio));
        const tailCount = Math.max(1, Math.floor(contentBudget * tailRatio));
        const selected = new Set();
        for (let index = 0; index < Math.min(headCount, lines.length); index++)
            selected.add(index);
        for (let index = Math.max(0, lines.length - tailCount); index < lines.length; index++)
            selected.add(index);
        for (const candidate of rankedCandidates) {
            if (selected.has(candidate.index))
                continue;
            selected.add(candidate.index);
            if (this.renderSelectedLines(lines, selected, marker).length > maxLines) {
                selected.delete(candidate.index);
            }
        }
        const rendered = this.renderSelectedLines(lines, selected, marker);
        return {
            text: rendered.join("\n"),
            selectedCount: selected.size,
            projectedLines: rendered.length,
        };
    }
    renderSelectedLines(lines, selected, marker) {
        const indices = Array.from(selected).sort((a, b) => a - b);
        const rendered = [];
        let previous = -1;
        for (const index of indices) {
            if (index > previous + 1)
                rendered.push(marker(previous + 1, index - 1));
            rendered.push(lines[index]);
            previous = index;
        }
        if (previous < lines.length - 1)
            rendered.push(marker(previous + 1, lines.length - 1));
        return rendered;
    }
    pushBoundedCandidate(candidates, candidatePositions, candidate, limit) {
        const duplicatePosition = candidatePositions.get(candidate.index);
        if (duplicatePosition !== undefined) {
            candidates[duplicatePosition].priority = Math.min(candidates[duplicatePosition].priority, candidate.priority);
            return;
        }
        if (candidates.length < limit) {
            candidatePositions.set(candidate.index, candidates.length);
            candidates.push(candidate);
            return;
        }
        // Keep the highest-value evidence while deterministically sampling later
        // lines so enormous outputs do not bias exclusively toward their prefix.
        const replaceAt = (Math.imul(candidate.index + 1, 2_654_435_761) >>> 0) % limit;
        if (candidate.priority <= candidates[replaceAt].priority) {
            candidatePositions.delete(candidates[replaceAt].index);
            candidates[replaceAt] = candidate;
            candidatePositions.set(candidate.index, replaceAt);
        }
    }
    serializeLedger(ledger) {
        return JSON.stringify({
            primaryObjective: ledger.primaryObjective,
            architecturalDiscoveries: ledger.architecturalDiscoveries,
            modifiedAndVerifiedFiles: ledger.modifiedAndVerifiedFiles,
            activeStateAndErrors: ledger.activeStateAndErrors,
            pendingActions: ledger.pendingActions,
            timestamp: ledger.timestamp,
            ...("fileHashRegistry" in ledger
                ? { fileHashRegistry: ledger.fileHashRegistry, turnCount: ledger.turnCount }
                : {}),
        });
    }
    normalizeLedgerText(value) {
        return String(value).replace(/\0/g, "").trim().slice(0, 2_000);
    }
    normalizeLineBudget(value) {
        return Math.min(2_000, Math.max(4, Math.floor(Number.isFinite(value) ? value : 200)));
    }
    normalizeSourceCharacterBudget(value) {
        return Math.min(8_000_000, Math.max(4_096, Math.floor(Number.isFinite(value) ? value : 2_000_000)));
    }
    normalizeMaterializedLineBudget(value) {
        return Math.min(100_000, Math.max(1_000, Math.floor(Number.isFinite(value) ? value : 20_000)));
    }
    normalizePatternCharacterBudget(value) {
        return Math.min(16_384, Math.max(256, Math.floor(Number.isFinite(value) ? value : 4_096)));
    }
    getPatternInput(line) {
        return line.length <= this.config.maxPatternCharactersPerLine
            ? line
            : line.slice(0, this.config.maxPatternCharactersPerLine);
    }
    normalizeRatio(value, fallback) {
        return Math.min(0.75, Math.max(0.05, Number.isFinite(value) ? value : fallback));
    }
    hash(value) {
        return createHash("sha256").update(value).digest("hex");
    }
    /**
     * Prevents pathological tool outputs from creating an unbounded line array.
     * The sample spans the full source rather than taking only head/tail bytes.
     * Full-source hashing and line counting remain exact for recovery checks.
     */
    createBoundedSource(value) {
        const originalLines = this.countLines(value);
        if (value.length <= this.config.maxSourceCharacters && originalLines <= this.config.maxMaterializedLines) {
            return { text: value, originalLines, wasSampled: false };
        }
        const windowCount = 8;
        const markerAllowance = (windowCount - 1) * 96;
        const densitySafeCharacterBudget = originalLines > this.config.maxMaterializedLines
            ? Math.min(this.config.maxSourceCharacters, this.config.maxMaterializedLines)
            : this.config.maxSourceCharacters;
        const payloadBudget = Math.max(1_024, densitySafeCharacterBudget - markerAllowance);
        const windowSize = Math.max(128, Math.floor(payloadBudget / windowCount));
        const lastStart = Math.max(0, value.length - windowSize);
        const chunks = [];
        let previousEnd = 0;
        for (let index = 0; index < windowCount; index++) {
            const start = index === windowCount - 1 ? lastStart : Math.floor((lastStart * index) / (windowCount - 1));
            const end = Math.min(value.length, start + windowSize);
            if (start > previousEnd) {
                chunks.push(`\n... [SOURCE SAMPLE OMITTED characters ${previousEnd}-${start - 1}] ...\n`);
            }
            chunks.push(value.slice(start, end));
            previousEnd = end;
        }
        return {
            text: chunks.join(""),
            originalLines,
            wasSampled: true,
        };
    }
    countLines(value) {
        let lines = 1;
        for (let index = 0; index < value.length; index++) {
            if (value.charCodeAt(index) === 10)
                lines++;
        }
        return lines;
    }
}
//# sourceMappingURL=ContextPruner.js.map