import { HostProvider } from "../host-provider.js";
import * as path from "node:path";
import * as os from "node:os";
export class CliWorkspaceClient {
    async getWorkspacePaths() {
        return { paths: [process.cwd()] };
    }
    async saveOpenDocumentIfDirty() {
        return {};
    }
    async getDiagnostics() {
        return { diagnostics: [] };
    }
    async openProblemsPanel() {
        return {};
    }
    async openInFileExplorerPanel() {
        return {};
    }
    async openDietCodeSidebarPanel() {
        return {};
    }
    async openTerminalPanel() {
        return {};
    }
    async executeCommandInTerminal() {
        return {};
    }
    async openFolder() {
        return {};
    }
}
export class CliEnvClient {
    async clipboardWriteText() {
        return {};
    }
    async clipboardReadText() {
        return { value: "" };
    }
    async getHostVersion() {
        return { version: "0.83.0" };
    }
    async getIdeRedirectUri() {
        return { value: "" };
    }
    async getTelemetrySettings() {
        return { enabled: false };
    }
    subscribeToTelemetrySettings() {
        return () => { };
    }
    async shutdown() {
        return {};
    }
    async debugLog() {
        return {};
    }
    async openExternal() {
        return {};
    }
}
export class CliWindowClient {
    async showTextDocument() {
        return {};
    }
    async showOpenDialogue() {
        return { paths: [] };
    }
    async showMessage() {
        return { selectedOption: "" };
    }
    async showInputBox() {
        return { value: "" };
    }
    async showSaveDialog() {
        return { path: "" };
    }
    async openFile() {
        return {};
    }
    async openSettings() {
        return {};
    }
    async getOpenTabs() {
        return { tabs: [] };
    }
    async getVisibleTabs() {
        return { tabs: [] };
    }
    async getActiveEditor() {
        return {};
    }
}
export class CliDiffClient {
    async openDiff() {
        return {};
    }
    async getDocumentText() {
        return { text: "" };
    }
    async replaceText() {
        return {};
    }
    async scrollDiff() {
        return {};
    }
    async truncateDocument() {
        return {};
    }
    async saveDocument() {
        return {};
    }
    async closeAllDiffs() {
        return {};
    }
    async openMultiFileDiff() {
        return {};
    }
}
export function initializeCliHostProvider(options) {
    if (HostProvider.isInitialized()) {
        return HostProvider.get();
    }
    const hostBridge = {
        workspaceClient: new CliWorkspaceClient(),
        envClient: new CliEnvClient(),
        windowClient: new CliWindowClient(),
        diffClient: new CliDiffClient(),
    };
    const storagePath = options?.globalStoragePath || path.join(os.homedir(), ".codemarie");
    const appPath = options?.cwd || process.cwd();
    return HostProvider.initialize(() => ({}), () => ({}), () => ({}), () => ({}), hostBridge, (msg) => {
        if (process.env.DEBUG) {
            console.log(`[Codemarie] ${msg}`);
        }
    }, async () => "", async (name) => name, appPath, storagePath);
}
//# sourceMappingURL=cli-host-provider.js.map