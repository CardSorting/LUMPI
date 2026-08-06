import { Agent } from "@noorm/lumpi-agent-core";
import { getModel, streamSimple } from "@noorm/lumpi-ai/compat";
import { describe, expect, it } from "vitest";
import { AgentSession } from "../src/core/agent-session.ts";
import { AuthStorage } from "../src/core/auth-storage.ts";
import { SessionManager } from "../src/core/session-manager.ts";
import { SettingsManager } from "../src/core/settings-manager.ts";
import { createInMemoryModelRegistry, getModelRuntime } from "./model-runtime-test-utils.ts";
import { createTestResourceLoader } from "./utilities.ts";

interface BranchingBenchmarkResult {
	branchCount: number;
	totalMs: number;
	avgMsPerTurn: number;
	opsPerSec: number;
	treeDepth: number;
}

class SessionBranchingBenchmark {
	private modelName: string;
	private providerName: string;

	constructor(providerName = "openai-codex", modelName = "gpt-5.6-luna") {
		this.providerName = providerName;
		this.modelName = modelName;
	}

	private async createTestSession() {
		const model = getModel("openai-codex", this.modelName as "gpt-5.6-luna");
		if (!model) {
			throw new Error(`Model ${this.providerName}/${this.modelName} not found`);
		}

		const settingsManager = SettingsManager.inMemory();
		const sessionManager = SessionManager.inMemory();
		const authStorage = AuthStorage.inMemory();
		await authStorage.modify(this.providerName, async () => ({
			type: "oauth",
			access: "test-oauth-access-token",
			refresh: "test-oauth-refresh-token",
			expires: Date.now() + 3600000,
		}));

		const session = new AgentSession({
			agent: new Agent({
				getApiKey: () => "test-oauth-access-token",
				streamFn: streamSimple,
				initialState: {
					model,
					systemPrompt: "You are a session branching benchmark assistant.",
					tools: [],
				},
			}),
			sessionManager,
			settingsManager,
			cwd: process.cwd(),
			modelRuntime: getModelRuntime(await createInMemoryModelRegistry(authStorage)),
			resourceLoader: createTestResourceLoader(),
		});

		return { session, sessionManager, model };
	}

	async runBranchCreationAndSwitchBenchmark(branchDepth = 30): Promise<BranchingBenchmarkResult> {
		const { session, sessionManager } = await this.createTestSession();

		try {
			const rootId = sessionManager.appendMessage({
				role: "user",
				content: "Initial user query for branching tree benchmark",
				timestamp: Date.now(),
			});

			const start = performance.now();
			const entryIds: string[] = [rootId];

			for (let i = 0; i < branchDepth; i++) {
				const currentParentId = entryIds[Math.floor(i / 2)];
				const newId = sessionManager.appendMessage({
					role: "user",
					content: `Branched query turn #${i + 1}`,
					timestamp: Date.now(),
				});
				entryIds.push(newId);
				sessionManager.branch(currentParentId);
			}

			const elapsedMs = performance.now() - start;
			const opsPerSec = (branchDepth / elapsedMs) * 1000;

			return {
				branchCount: branchDepth,
				totalMs: elapsedMs,
				avgMsPerTurn: elapsedMs / branchDepth,
				opsPerSec,
				treeDepth: entryIds.length,
			};
		} finally {
			session.dispose();
		}
	}
}

describe("SessionBranchingBenchmark", () => {
	it("benchmarks session conversation tree branching and navigation latency", async () => {
		const benchmark = new SessionBranchingBenchmark();
		const result = await benchmark.runBranchCreationAndSwitchBenchmark(40);

		expect(result.branchCount).toBe(40);
		expect(result.totalMs).toBeGreaterThan(0);
		expect(result.opsPerSec).toBeGreaterThan(0);
	});
});
