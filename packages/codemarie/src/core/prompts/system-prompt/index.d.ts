import type { SystemPromptContext } from "./types";
export { DietCodeToolSet } from "./registry/DietCodeToolSet";
export { PromptBuilder } from "./registry/PromptBuilder";
export { PromptRegistry } from "./registry/PromptRegistry";
export * from "./templates/placeholders";
export { TemplateEngine } from "./templates/TemplateEngine";
export * from "./types";
export { VariantBuilder } from "./variants/variant-builder";
export { validateVariant } from "./variants/variant-validator";
/**
 * Get the system prompt by id
 */
export declare function getSystemPrompt(context: SystemPromptContext): Promise<{
    systemPrompt: any;
    tools: any;
}>;
//# sourceMappingURL=index.d.ts.map