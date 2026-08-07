export interface SlashCommand {
    name: string;
    description?: string;
    section?: "default" | "custom" | "mcp" | "skills";
    cliCompatible?: boolean;
}
export declare const BASE_SLASH_COMMANDS: SlashCommand[];
export declare const VSCODE_ONLY_COMMANDS: SlashCommand[];
//# sourceMappingURL=slashCommands.d.ts.map