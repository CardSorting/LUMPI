import type { Anthropic } from "@anthropic-ai/sdk";
export declare const formatResponse: {
    duplicateFileReadNotice: () => string;
    contextTruncationNotice: () => string;
    processFirstUserMessageForTruncation: () => string;
    condense: () => string;
    toolDenied: () => string;
    toolError: (error?: string | undefined) => string;
    architecturalCorrection: (error: string) => string;
    postExecutionSummary: (telemetry: {
        layer: string;
        pressure?: number | undefined;
        resonance?: number | undefined;
        tokens?: number | undefined;
        health?: number | undefined;
        vitalityPulse?: number | undefined;
        healthTrend?: number | undefined;
        neuralFocus?: string[] | undefined;
    }, violations?: string[] | undefined) => string;
    dietcodeIgnoreError: (path: string) => string;
    permissionDeniedError: (reason: string) => string;
    noToolsUsed: (usingNativeToolCalls: boolean) => string;
    tooManyMistakes: (feedback?: string | undefined) => string;
    missingToolParameterError: (paramName: string) => string;
    /**
     * Specialized error for write_to_file when the 'content' parameter is missing.
     * Provides progressive guidance based on how many times this has happened consecutively,
     * and includes token budget awareness to help the model understand output constraints.
     */
    writeToFileMissingContentError: (relPath: string, consecutiveFailures: number, contextUsagePercent?: number | undefined) => string;
    invalidMcpToolArgumentError: (serverName: string, toolName: string) => string;
    toolResult: (text: string, images?: string[] | undefined, fileString?: string | undefined) => string | (Anthropic.ImageBlockParam | Anthropic.TextBlockParam)[];
    imageBlocks: (images?: string[] | undefined) => Anthropic.ImageBlockParam[];
    formatFilesList: (absolutePath: string, files: string[], didHitLimit: boolean, dietcodeIgnoreController?: any) => string;
    createPrettyPatch: (filename?: string, oldStr?: string | undefined, newStr?: string | undefined) => string;
    taskResumption: (mode: Mode, agoText: string, cwd: string, wasRecent: 0 | boolean | undefined, responseText?: string | undefined, hasPendingFileContextWarnings?: boolean | undefined) => [string, string];
    planModeInstructions: () => string;
    actModeInstructions: () => string;
    fileEditWithUserChanges: (relPath: string, userEdits: string, autoFormattingEdits: string | undefined, finalContent: string | undefined, newProblemsMessage: string | undefined) => string;
    fileEditWithoutUserChanges: (relPath: string, autoFormattingEdits: string | undefined, finalContent: string | undefined, newProblemsMessage: string | undefined) => string;
    diffError: (relPath: string, originalContent: string | undefined) => string;
    toolAlreadyUsed: (toolName: string) => string;
    dietcodeIgnoreInstructions: (content: string) => string;
    dietcodeRulesGlobalDirectoryInstructions: (globalDietCodeRulesFilePath: string, content: string) => string;
    dietcodeRulesLocalDirectoryInstructions: (cwd: string, content: string) => string;
    dietcodeRulesLocalFileInstructions: (cwd: string, content: string) => string;
    windsurfRulesLocalFileInstructions: (cwd: string, content: string) => string;
    cursorRulesLocalFileInstructions: (cwd: string, content: string) => string;
    cursorRulesLocalDirectoryInstructions: (cwd: string, content: string) => string;
    agentsRulesLocalFileInstructions: (cwd: string, content: string) => string;
    fileContextWarning: (editedFiles: string[]) => string;
};
//# sourceMappingURL=responses.d.ts.map