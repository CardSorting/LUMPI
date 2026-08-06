import * as os from "node:os";
import * as path from "node:path";
import { type HostProvider, initializeCliHostProvider } from "@earendil-works/pi-codemarie";
import { URI } from "vscode-uri";

export interface CodemarieBridgeOptions {
	cwd?: string;
	modEnabled?: boolean;
}

export class CodemarieBridge {
	private options: CodemarieBridgeOptions;
	private controller?: any;
	private hostProvider?: HostProvider;

	constructor(options: CodemarieBridgeOptions = {}) {
		this.options = options;
	}

	public initialize(): any {
		const cwd = this.options.cwd || process.cwd();
		this.hostProvider = initializeCliHostProvider({ cwd });

		const storageDir = path.join(os.homedir(), ".codemarie");
		const context: any = {
			subscriptions: [],
			extensionUri: URI.file(cwd),
			extensionPath: cwd,
			environmentVariableCollection: {},
			asAbsolutePath: (rel: string) => path.join(cwd, rel),
			storageUri: URI.file(path.join(storageDir, "workspace")),
			storagePath: path.join(storageDir, "workspace"),
			globalStorageUri: URI.file(storageDir),
			globalStoragePath: storageDir,
			logUri: URI.file(path.join(storageDir, "logs")),
			logPath: path.join(storageDir, "logs"),
			extensionMode: 1,
			extension: {
				id: "pi.codemarie",
				extensionUri: URI.file(cwd),
				extensionPath: cwd,
				isActive: true,
				packageJSON: { name: "pi-codemarie", version: "0.83.0" },
				extensionKind: 1,
				exports: {},
				activate: async () => ({}),
			},
		};

		return context;
	}

	public getController(): any {
		if (!this.controller) {
			return this.initialize();
		}
		return this.controller;
	}

	public async createTask(prompt: string, images?: string[], files?: string[]): Promise<string> {
		const controller = this.getController();
		if (controller && typeof controller.initTask === "function") {
			return controller.initTask(prompt, images, files);
		}
		return "task-cli";
	}
}
