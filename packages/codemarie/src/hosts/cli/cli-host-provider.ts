import { HostProvider } from "../host-provider.ts";
import type { HostBridgeClientProvider } from "../host-provider-types.ts";
import type {
	DiffServiceClientInterface,
	EnvServiceClientInterface,
	WindowServiceClientInterface,
	WorkspaceServiceClientInterface,
} from "../../generated/hosts/host-bridge-client-types.ts";
import * as path from "node:path";
import * as os from "node:os";

export class CliWorkspaceClient implements WorkspaceServiceClientInterface {
	async getWorkspacePaths(): Promise<any> {
		return { paths: [process.cwd()] };
	}
	async saveOpenDocumentIfDirty(): Promise<any> {
		return {};
	}
	async getDiagnostics(): Promise<any> {
		return { diagnostics: [] };
	}
	async openProblemsPanel(): Promise<any> {
		return {};
	}
	async openInFileExplorerPanel(): Promise<any> {
		return {};
	}
	async openDietCodeSidebarPanel(): Promise<any> {
		return {};
	}
	async openTerminalPanel(): Promise<any> {
		return {};
	}
	async executeCommandInTerminal(): Promise<any> {
		return {};
	}
	async openFolder(): Promise<any> {
		return {};
	}
}

export class CliEnvClient implements EnvServiceClientInterface {
	async clipboardWriteText(): Promise<any> {
		return {};
	}
	async clipboardReadText(): Promise<any> {
		return { value: "" };
	}
	async getHostVersion(): Promise<any> {
		return { version: "0.83.0" };
	}
	async getIdeRedirectUri(): Promise<any> {
		return { value: "" };
	}
	async getTelemetrySettings(): Promise<any> {
		return { enabled: false };
	}
	subscribeToTelemetrySettings(): () => void {
		return () => {};
	}
	async shutdown(): Promise<any> {
		return {};
	}
	async debugLog(): Promise<any> {
		return {};
	}
	async openExternal(): Promise<any> {
		return {};
	}
}

export class CliWindowClient implements WindowServiceClientInterface {
	async showTextDocument(): Promise<any> {
		return {};
	}
	async showOpenDialogue(): Promise<any> {
		return { paths: [] };
	}
	async showMessage(): Promise<any> {
		return { selectedOption: "" };
	}
	async showInputBox(): Promise<any> {
		return { value: "" };
	}
	async showSaveDialog(): Promise<any> {
		return { path: "" };
	}
	async openFile(): Promise<any> {
		return {};
	}
	async openSettings(): Promise<any> {
		return {};
	}
	async getOpenTabs(): Promise<any> {
		return { tabs: [] };
	}
	async getVisibleTabs(): Promise<any> {
		return { tabs: [] };
	}
	async getActiveEditor(): Promise<any> {
		return {};
	}
}

export class CliDiffClient implements DiffServiceClientInterface {
	async openDiff(): Promise<any> {
		return {};
	}
	async getDocumentText(): Promise<any> {
		return { text: "" };
	}
	async replaceText(): Promise<any> {
		return {};
	}
	async scrollDiff(): Promise<any> {
		return {};
	}
	async truncateDocument(): Promise<any> {
		return {};
	}
	async saveDocument(): Promise<any> {
		return {};
	}
	async closeAllDiffs(): Promise<any> {
		return {};
	}
	async openMultiFileDiff(): Promise<any> {
		return {};
	}
}

export function initializeCliHostProvider(options?: {
	cwd?: string;
	globalStoragePath?: string;
}): HostProvider {
	if (HostProvider.isInitialized()) {
		return HostProvider.get();
	}

	const hostBridge: HostBridgeClientProvider = {
		workspaceClient: new CliWorkspaceClient(),
		envClient: new CliEnvClient(),
		windowClient: new CliWindowClient(),
		diffClient: new CliDiffClient(),
	};

	const storagePath = options?.globalStoragePath || path.join(os.homedir(), ".codemarie");
	const appPath = options?.cwd || process.cwd();

	return HostProvider.initialize(
		() => ({}) as any,
		() => ({}) as any,
		() => ({}) as any,
		() => ({}) as any,
		hostBridge,
		(msg: string) => {
			if (process.env.DEBUG) {
				console.log(`[Codemarie] ${msg}`);
			}
		},
		async () => "",
		async (name: string) => name,
		appPath,
		storagePath,
	);
}
