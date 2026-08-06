import * as os from "node:os";
import * as path from "node:path";
import { AgentContext, Connection, Workspace } from "@noorm/broccolidb";

export interface BroccoliBridgeOptions {
	cwd?: string;
}

export class BroccoliBridge {
	private options: BroccoliBridgeOptions;
	private context?: AgentContext;

	constructor(options: BroccoliBridgeOptions = {}) {
		this.options = options;
	}

	public getAgentContext(): AgentContext {
		if (!this.context) {
			const storageDir = path.join(os.homedir(), ".broccolidb");
			const conn = new Connection({ dbPath: path.join(storageDir, "broccolidb.db") });
			const ws = new Workspace(conn.getPool(), "cli-user", "default");
			this.context = new AgentContext(ws);
		}
		return this.context;
	}
}
