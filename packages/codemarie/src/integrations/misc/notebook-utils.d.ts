/**
 * Shared utilities for processing Jupyter notebooks for LLM context.
 * Used by both the context menu commands (addToDietCode, etc.) and file reading (extract-text.ts).
 */
/**
 * Sanitizes the outputs of a single notebook cell by truncating image data.
 * Keeps text outputs intact for context, only replaces binary image data with placeholders.
 *
 * @param cell A notebook cell object
 * @returns The cell with sanitized outputs
 */
export declare function sanitizeCellOutputs(cell: Record<string, unknown>): Record<string, unknown>;
/**
 * Sanitizes a Jupyter notebook JSON for LLM context.
 *
 * @param jsonString The raw notebook JSON string
 * @param stripAllOutputs If true, removes all outputs entirely. If false (default),
 *                        only truncates image data while keeping text outputs.
 *                        Use true for write responses where outputs aren't needed.
 *                        Use false for reads where text outputs provide useful context.
 * @returns Sanitized JSON string
 */
export declare function sanitizeNotebookForLLM(jsonString: string, stripAllOutputs?: boolean): string;
/**
 * Sanitizes a single notebook cell object and returns it as a JSON string.
 * Used by context menu commands that work with individual cells.
 *
 * @param cell A notebook cell object
 * @returns JSON string of the sanitized cell
 */
export declare function sanitizeCellForLLM(cell: Record<string, unknown>): string;
//# sourceMappingURL=notebook-utils.d.ts.map