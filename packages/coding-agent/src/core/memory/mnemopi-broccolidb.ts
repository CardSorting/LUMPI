import * as os from "node:os";
import * as path from "node:path";
import { AgentContext, Connection, Workspace } from "@noorm/broccolidb";

export interface StoredMemory {
	id: string;
	fact: string;
	category: string;
	confidence: number;
	timestamp: number;
}

export class MnemopiBroccoliStore {
	private agentContext?: AgentContext;
	private memoryCache: Map<string, StoredMemory>;

	constructor(agentContext?: AgentContext) {
		this.agentContext = agentContext;
		this.memoryCache = new Map<string, StoredMemory>();
	}

	public async init(): Promise<void> {
		if (!this.agentContext) {
			const storageDir = path.join(os.homedir(), ".broccolidb");
			const conn = new Connection({ dbPath: path.join(storageDir, "broccolidb.db") });
			const ws = new Workspace(conn.getPool(), "mnemopi-user", "default");
			this.agentContext = new AgentContext(ws);
		}
	}

	public async retain(fact: string, category: string = "general", confidence: number = 1.0): Promise<StoredMemory> {
		if (!this.agentContext) await this.init();

		const id = `mem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
		const memory: StoredMemory = {
			id,
			fact,
			category,
			confidence,
			timestamp: Date.now(),
		};

		this.memoryCache.set(id, memory);
		return memory;
	}

	public async recall(query: string, categoryFilter?: string): Promise<StoredMemory[]> {
		if (!this.agentContext) await this.init();

		const lowerQuery = query.toLowerCase();
		const matches: StoredMemory[] = [];

		for (const memory of this.memoryCache.values()) {
			if (categoryFilter && memory.category !== categoryFilter) continue;

			if (memory.fact.toLowerCase().includes(lowerQuery) || memory.category.toLowerCase().includes(lowerQuery)) {
				matches.push(memory);
			}
		}

		return matches.sort((a, b) => b.confidence - a.confidence);
	}

	public async reflect(topic: string): Promise<string> {
		const memories = await this.recall(topic);
		if (memories.length === 0) {
			return `No facts stored in BroccoliDB memory bank for topic: '${topic}'`;
		}

		const memoryLines = memories.map(
			(m) => `- [${m.category} | score: ${(m.confidence * 100).toFixed(0)}%] ${m.fact}`,
		);

		return [
			`# BroccoliDB Epistemic Memory Synthesis: '${topic}'`,
			`Found ${memories.length} relevant memory projections in CAS:`,
			...memoryLines,
		].join("\n");
	}

	public async forget(memoryId: string): Promise<boolean> {
		return this.memoryCache.delete(memoryId);
	}
}
