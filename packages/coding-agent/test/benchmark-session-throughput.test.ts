import { Agent } from "@earendil-works/pi-agent-core";
import { getModel, streamSimple, type Usage } from "@earendil-works/pi-ai/compat";
import { describe, expect, it } from "vitest";
import { AgentSession } from "../src/core/agent-session.ts";
import { AuthStorage } from "../src/core/auth-storage.ts";
import { SessionManager } from "../src/core/session-manager.ts";
import { SettingsManager } from "../src/core/settings-manager.ts";
import { createInMemoryModelRegistry, getModelRuntime } from "./model-runtime-test-utils.ts";
import { createTestResourceLoader } from "./utilities.ts";

interface ThroughputBenchmarkResult {
	iterations: number;
	totalMs: number;
	avgMsPerTurn: number;
	opsPerSec: number;
	tokensProcessed: number;
	tokensPerSec: number;
}

class SessionThroughputBenchmark {
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
					systemPrompt: "You are a throughput test assistant.",
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

	async runMessageHydrationBenchmark(turnCount = 100): Promise<ThroughputBenchmarkResult> {
		const { session, sessionManager, model } = await this.createTestSession();
		let totalTokens = 0;

		try {
			const start = performance.now();

			for (let i = 0; i < turnCount; i++) {
				const promptText = `User input message turn #${i + 1} with padded content to simulate real agent dialog.`;
				const responseText = `Assistant response message turn #${i + 1} with detailed explanation and code snippets.`;
				const inputTokens = 150 + (i % 10) * 10;
				const outputTokens = 200 + (i % 5) * 20;

				sessionManager.appendMessage({
					role: "user",
					content: promptText,
					timestamp: Date.now(),
				});

				const usage: Usage = {
					input: inputTokens,
					output: outputTokens,
					cacheRead: 0,
					cacheWrite: 0,
					totalTokens: inputTokens + outputTokens,
					cost: { input: 0.001, output: 0.002, cacheRead: 0, cacheWrite: 0, total: 0.003 },
				};

				sessionManager.appendMessage({
					role: "assistant",
					content: [{ type: "text", text: responseText }],
					api: model.api,
					provider: model.provider,
					model: model.id,
					usage,
					stopReason: "stop",
					timestamp: Date.now(),
				});

				totalTokens += inputTokens + outputTokens;
			}

			const elapsedMs = performance.now() - start;
			const avgMsPerTurn = elapsedMs / turnCount;
			const opsPerSec = (turnCount / elapsedMs) * 1000;
			const tokensPerSec = (totalTokens / elapsedMs) * 1000;

			return {
				iterations: turnCount,
				totalMs: elapsedMs,
				avgMsPerTurn,
				opsPerSec,
				tokensProcessed: totalTokens,
				tokensPerSec,
			};
		} finally {
			session.dispose();
		}
	}

	async runSessionStatsBenchmark(iterationCount = 1000): Promise<ThroughputBenchmarkResult> {
		const { session, sessionManager, model } = await this.createTestSession();

		try {
			for (let i = 0; i < 50; i++) {
				sessionManager.appendMessage({
					role: "user",
					content: `User query ${i}`,
					timestamp: Date.now(),
				});
				sessionManager.appendMessage({
					role: "assistant",
					content: [{ type: "text", text: `Assistant response ${i}` }],
					api: model.api,
					provider: model.provider,
					model: model.id,
					usage: {
						input: 100,
						output: 50,
						cacheRead: 0,
						cacheWrite: 0,
						totalTokens: 150,
						cost: { input: 0.0001, output: 0.0001, cacheRead: 0, cacheWrite: 0, total: 0.0002 },
					},
					stopReason: "stop",
					timestamp: Date.now(),
				});
			}

			const start = performance.now();
			for (let i = 0; i < iterationCount; i++) {
				session.getSessionStats();
			}

			const elapsedMs = performance.now() - start;
			const avgMsPerTurn = elapsedMs / iterationCount;
			const opsPerSec = (iterationCount / elapsedMs) * 1000;

			return {
				iterations: iterationCount,
				totalMs: elapsedMs,
				avgMsPerTurn,
				opsPerSec,
				tokensProcessed: 150 * 50 * iterationCount,
				tokensPerSec: ((150 * 50 * iterationCount) / elapsedMs) * 1000,
			};
		} finally {
			session.dispose();
		}
	}
}

describe("SessionThroughputBenchmark", () => {
	it("executes message hydration throughput benchmark with valid performance metrics", async () => {
		const benchmark = new SessionThroughputBenchmark();
		const result = await benchmark.runMessageHydrationBenchmark(50);

		expect(result.iterations).toBe(50);
		expect(result.totalMs).toBeGreaterThan(0);
		expect(result.opsPerSec).toBeGreaterThan(0);
		expect(result.tokensProcessed).toBeGreaterThan(0);
		expect(result.tokensPerSec).toBeGreaterThan(0);
	});

	it("executes session stats calculation benchmark under high iteration loads", async () => {
		const benchmark = new SessionThroughputBenchmark();
		const result = await benchmark.runSessionStatsBenchmark(200);

		expect(result.iterations).toBe(200);
		expect(result.totalMs).toBeGreaterThan(0);
		expect(result.opsPerSec).toBeGreaterThan(0);
	});
});
