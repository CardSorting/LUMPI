export interface VFSTarget {
	scheme: string;
	path: string;
	params: Record<string, string>;
}

export interface VFSHandler {
	scheme: string;
	read(target: VFSTarget): Promise<string>;
	write(target: VFSTarget, content: string): Promise<boolean>;
}

export interface ConflictResolution {
	conflictId: string;
	strategy: "ours" | "theirs" | "base";
	resolvedContent?: string;
}

export class VFSRouter {
	private handlers: Map<string, VFSHandler>;
	private conflictMap: Map<string, { ours: string; theirs: string; base: string }>;
	private agentStateStore: Map<string, Record<string, unknown>>;

	constructor() {
		this.handlers = new Map<string, VFSHandler>();
		this.conflictMap = new Map<string, { ours: string; theirs: string; base: string }>();
		this.agentStateStore = new Map<string, Record<string, unknown>>();
		this.registerBuiltinHandlers();
	}

	public registerHandler(handler: VFSHandler): void {
		this.handlers.set(handler.scheme, handler);
	}

	public registerConflict(id: string, ours: string, theirs: string, base: string = ""): void {
		this.conflictMap.set(id, { ours, theirs, base });
	}

	public setAgentState(agentId: string, state: Record<string, unknown>): void {
		this.agentStateStore.set(agentId, state);
	}

	public parseURI(uri: string): VFSTarget | null {
		const match = /^([a-zA-Z0-9+\-.]+):\/\/(.*)$/.exec(uri);
		if (!match) return null;
		const scheme = match[1];
		const fullPath = match[2];
		const [pathPart, queryPart] = fullPath.split("?");
		const params: Record<string, string> = {};

		if (queryPart) {
			const pairs = queryPart.split("&");
			for (const pair of pairs) {
				const [k, v] = pair.split("=");
				if (k) params[decodeURIComponent(k)] = v ? decodeURIComponent(v) : "";
			}
		}

		return {
			scheme,
			path: pathPart || "",
			params,
		};
	}

	public isVirtualURI(uri: string): boolean {
		const target = this.parseURI(uri);
		return target !== null && this.handlers.has(target.scheme);
	}

	public async read(uri: string): Promise<string> {
		const target = this.parseURI(uri);
		if (!target) throw new Error(`Invalid URI format: '${uri}'`);
		const handler = this.handlers.get(target.scheme);
		if (!handler) throw new Error(`No VFS protocol handler registered for scheme '${target.scheme}'`);
		return handler.read(target);
	}

	public async write(uri: string, content: string): Promise<boolean> {
		const target = this.parseURI(uri);
		if (!target) throw new Error(`Invalid URI format: '${uri}'`);
		const handler = this.handlers.get(target.scheme);
		if (!handler) throw new Error(`No VFS protocol handler registered for scheme '${target.scheme}'`);
		return handler.write(target, content);
	}

	private registerBuiltinHandlers(): void {
		// Conflict resolution handler (conflict://N)
		this.handlers.set("conflict", {
			scheme: "conflict",
			read: async (target: VFSTarget): Promise<string> => {
				const conflict = this.conflictMap.get(target.path);
				if (!conflict) {
					return `[Conflict Marker ${target.path}]\nResolution state: Pending.\nWrite '@ours', '@theirs', or '@base' to resolve.`;
				}
				return [
					`<<<<<<< @ours`,
					conflict.ours,
					`||||||| @base`,
					conflict.base,
					`======= @theirs`,
					conflict.theirs,
					`>>>>>>>`,
				].join("\n");
			},
			write: async (target: VFSTarget, content: string): Promise<boolean> => {
				const trimmed = content.trim();
				const conflict = this.conflictMap.get(target.path);
				if (!conflict) return true;

				if (trimmed.includes("@ours")) {
					this.conflictMap.set(target.path, { ...conflict, base: conflict.ours });
					return true;
				}
				if (trimmed.includes("@theirs")) {
					this.conflictMap.set(target.path, { ...conflict, base: conflict.theirs });
					return true;
				}
				if (trimmed.includes("@base")) {
					return true;
				}
				return false;
			},
		});

		// Subagent state protocol (agent://<id>/<pointer>)
		this.handlers.set("agent", {
			scheme: "agent",
			read: async (target: VFSTarget): Promise<string> => {
				const parts = target.path.split("/");
				const agentId = parts[0];
				const fieldPointer = parts.slice(1).join(".");

				const state = this.agentStateStore.get(agentId) || { id: agentId, status: "active", steps: [] };

				if (!fieldPointer) {
					return JSON.stringify(state, null, 2);
				}

				const keys = fieldPointer.split(".");
				let curr: unknown = state;
				for (const k of keys) {
					if (curr && typeof curr === "object" && k in curr) {
						curr = (curr as Record<string, unknown>)[k];
					} else {
						curr = undefined;
						break;
					}
				}
				return typeof curr === "string" ? curr : JSON.stringify(curr ?? null, null, 2);
			},
			write: async (target: VFSTarget, content: string): Promise<boolean> => {
				const agentId = target.path.split("/")[0];
				let parsed: Record<string, unknown> = {};
				try {
					parsed = JSON.parse(content);
				} catch {
					parsed = { raw: content };
				}
				this.agentStateStore.set(agentId, parsed);
				return true;
			},
		});

		// GitHub Pull Request VFS protocol (pr://<owner>/<repo>/<number>)
		this.handlers.set("pr", {
			scheme: "pr",
			read: async (target: VFSTarget): Promise<string> => {
				return [
					`# Pull Request ${target.path}`,
					`State: Open`,
					`Author: contributor`,
					`---`,
					`Diff Summary: +45 -12 lines across 3 files`,
					`Files:`,
					`  - src/auth.ts [MODIFIED]`,
					`  - src/server.ts [MODIFIED]`,
				].join("\n");
			},
			write: async (): Promise<boolean> => {
				return false;
			},
		});

		// GitHub Issue VFS protocol (issue://<owner>/<repo>/<number>)
		this.handlers.set("issue", {
			scheme: "issue",
			read: async (target: VFSTarget): Promise<string> => {
				return [
					`# Issue ${target.path}`,
					`Title: Memory lock contention under heavy subagent load`,
					`Status: Open`,
					`Description: Observed lock timeout errors during parallel task execution.`,
				].join("\n");
			},
			write: async (): Promise<boolean> => {
				return false;
			},
		});

		// Virtual device and off-by-default tools protocol (xd://<device>)
		this.handlers.set("xd", {
			scheme: "xd",
			read: async (target: VFSTarget): Promise<string> => {
				if (target.path === "devices") {
					return JSON.stringify(["resolve", "inspect", "debug", "tts", "vision"], null, 2);
				}
				return `Virtual Device Endpoint: ${target.path}\nStatus: Active`;
			},
			write: async (): Promise<boolean> => {
				return true;
			},
		});
	}
}
