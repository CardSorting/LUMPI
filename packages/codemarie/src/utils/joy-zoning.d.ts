export type Layer = "domain" | "core" | "infrastructure" | "plumbing" | "ui";
export declare const CommentStyle: {
    readonly JSDOC: "jsdoc";
    readonly SLASH: "slash";
    readonly HASH: "hash";
    readonly DASH: "dash";
    readonly HTML: "html";
};
export type CommentStyle = (typeof CommentStyle)[keyof typeof CommentStyle];
/**
 * Determines the layer of a given file path based on Joy-Zoning conventions or spider.spec.json.
 * High-Performance: Uses an in-memory session cache to avoid redundant path math.
 * V10: Archetypal Primacy — The [LAYER: TYPE] tag in content overrides the file path.
 */
export declare function getLayer(filePath: string, content?: string): Layer;
/**
 * Determines if a file supports architectural [LAYER: TYPE] tags.
 * Only source files that support JSDoc-style comments are included.
 */
export declare function isLayerTagSupported(filePath: string, content?: string): boolean;
/**
 * Generates the appropriate layer comment for the given file and layer.
 * Detects shebangs and respects language-specific comment syntax.
 * Now performs in-place replacement if a tag already exists.
 */
export declare function generateLayerComment(filePath: string, layer: string, content?: string): string | null;
/**
 * Validates architectural smells in the given content.
 * Layer-aware: strict checks apply only to domain/infrastructure.
 */
export declare function validateSmells(filePath: string, content: string): string[];
/**
 * Validates layering constraints using AST analysis.
 */
export declare function validateLayering(filePath: string, content: string): string[];
/**
 * Parses the [LAYER: TYPE] tag from the file content.
 * Follows the Header Rule: tag must be within the first 10,000 characters.
 */
export declare function parseLayerTag(content: string): Layer | null;
/**
 * Validates the vertical depth of relative imports.
 * Limit: 3 levels of relative depth (../../..).
 */
export declare function validateImportDepth(filePath: string, content: string): string[];
/**
 * Full Joy-Zoning validation for a file.
 */
export declare function validateJoyZoning(filePath: string, content: string): {
    success: boolean;
    errors: string[];
};
/**
 * Analyzes code content and suggests which architectural layer best fits.
 * Returns the suggested layer and the reasoning behind the suggestion.
 * PRODUCTION HARDENING: Context-aware detection for reactive and orchestration patterns.
 */
export declare function suggestLayerForContent(content: string): {
    layer: Layer;
    reason: string;
} | null;
/**
 * Extracts a target file path from various common tool parameter names.
 */
export declare function getTargetPath(params: Record<string, unknown>): string | null;
//# sourceMappingURL=joy-zoning.d.ts.map