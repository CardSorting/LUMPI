import { HostProvider } from "../host-provider.ts";
import type { DiffServiceClientInterface, EnvServiceClientInterface, WindowServiceClientInterface, WorkspaceServiceClientInterface } from "../../generated/hosts/host-bridge-client-types.ts";
export declare class CliWorkspaceClient implements WorkspaceServiceClientInterface {
    getWorkspacePaths(): Promise<any>;
    saveOpenDocumentIfDirty(): Promise<any>;
    getDiagnostics(): Promise<any>;
    openProblemsPanel(): Promise<any>;
    openInFileExplorerPanel(): Promise<any>;
    openDietCodeSidebarPanel(): Promise<any>;
    openTerminalPanel(): Promise<any>;
    executeCommandInTerminal(): Promise<any>;
    openFolder(): Promise<any>;
}
export declare class CliEnvClient implements EnvServiceClientInterface {
    clipboardWriteText(): Promise<any>;
    clipboardReadText(): Promise<any>;
    getHostVersion(): Promise<any>;
    getIdeRedirectUri(): Promise<any>;
    getTelemetrySettings(): Promise<any>;
    subscribeToTelemetrySettings(): () => void;
    shutdown(): Promise<any>;
    debugLog(): Promise<any>;
    openExternal(): Promise<any>;
}
export declare class CliWindowClient implements WindowServiceClientInterface {
    showTextDocument(): Promise<any>;
    showOpenDialogue(): Promise<any>;
    showMessage(): Promise<any>;
    showInputBox(): Promise<any>;
    showSaveDialog(): Promise<any>;
    openFile(): Promise<any>;
    openSettings(): Promise<any>;
    getOpenTabs(): Promise<any>;
    getVisibleTabs(): Promise<any>;
    getActiveEditor(): Promise<any>;
}
export declare class CliDiffClient implements DiffServiceClientInterface {
    openDiff(): Promise<any>;
    getDocumentText(): Promise<any>;
    replaceText(): Promise<any>;
    scrollDiff(): Promise<any>;
    truncateDocument(): Promise<any>;
    saveDocument(): Promise<any>;
    closeAllDiffs(): Promise<any>;
    openMultiFileDiff(): Promise<any>;
}
export declare function initializeCliHostProvider(options?: {
    cwd?: string;
    globalStoragePath?: string;
}): HostProvider;
//# sourceMappingURL=cli-host-provider.d.ts.map