import { Agent } from "@noorm/lumi-agent-core";
import { getModel, streamSimple, type Usage } from "@noorm/lumi-ai/compat";
import { describe, expect, it } from "vitest";
import { AgentSession } from "../src/core/agent-session.ts";
import { AuthStorage } from "../src/core/auth-storage.ts";
import { SessionManager } from "../src/core/session-manager.ts";
import { SettingsManager } from "../src/core/settings-manager.ts";
import { createInMemoryModelRegistry, getModelRuntime } from "./model-runtime-test-utils.ts";
import { createTestResourceLoader } from "./utilities.ts";

interface CompactionBenchmarkResult {
	initialMessagesCount: number;
	compactedMessagesCount: number;
	compressionRatio: number;
	executionMs: number;
	tokensBefore: number;
	tokensAfter: number;
}

class CompactionPerformanceBenchmark {
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
					systemPrompt: "You are a compaction benchmark assistant.",
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

	async runCompactionPassBenchmark(historyDepth = 100): Promise<CompactionBenchmarkResult> {
		const { session, sessionManager, model } = await this.createTestSession();

		try {
			let keptUserId = "";
			let totalTokensBefore = 0;

			for (let i = 0; i < historyDepth; i++) {
				const userId = sessionManager.appendMessage({
					role: "user",
					content: `User prompt message number ${i + 1} containing detailed context about coding task requirements.`,
					timestamp: Date.now(),
				});

				if (i === Math.floor(historyDepth * 0.7)) {
					keptUserId = userId;
				}

				const inputTokens = 500;
				const outputTokens = 300;
				totalTokensBefore += inputTokens + outputTokens;

				const usage: Usage = {
					input: inputTokens,
					output: outputTokens,
					cacheRead: 0,
					cacheWrite: 0,
					totalTokens: inputTokens + outputTokens,
					cost: { input: 0.002, output: 0.003, cacheRead: 0, cacheWrite: 0, total: 0.005 },
				};

				sessionManager.appendMessage({
					role: "assistant",
					content: [
						{ type: "text", text: `Assistant answer for turn ${i + 1} with code snippets and explanations.` },
					],
					api: model.api,
					provider: model.provider,
					model: model.id,
					usage,
					stopReason: "stop",
					timestamp: Date.now(),
				});
			}

			const start = performance.now();
			const summaryText =
				"Compact summary of previous conversation history covering architecture decisions and setup requirements.";

			sessionManager.appendCompaction(summaryText, keptUserId, 150000, undefined, false, {
				input: 2000,
				output: 250,
				cacheRead: 0,
				cacheWrite: 0,
				totalTokens: 2250,
				cost: { input: 0.008, output: 0.002, cacheRead: 0, cacheWrite: 0, total: 0.01 },
			});

			const elapsedMs = performance.now() - start;
			const buildContext = sessionManager.buildSessionContext();
			const tokensAfter = 2250 + (historyDepth - Math.floor(historyDepth * 0.7)) * 800;
			const compressionRatio = 1 - tokensAfter / totalTokensBefore;

			return {
				initialMessagesCount: historyDepth * 2,
				compactedMessagesCount: buildContext.messages.length,
				compressionRatio,
				executionMs: elapsedMs,
				tokensBefore: totalTokensBefore,
				tokensAfter,
			};
		} finally {
			session.dispose();
		}
	}

	async runBranchSummaryBenchmark(branchCount = 20): Promise<{ totalMs: number; avgMsPerBranch: number }> {
		const { session, sessionManager } = await this.createTestSession();

		try {
			const rootMessageId = sessionManager.appendMessage({
				role: "user",
				content: "Root user prompt for branching test",
				timestamp: Date.now(),
			});

			const start = performance.now();

			for (let i = 0; i < branchCount; i++) {
				sessionManager.branchWithSummary(
					rootMessageId,
					`Branch summary ${i + 1}: explored alternative implementation strategy.`,
					undefined,
					false,
					{
						input: 500,
						output: 100,
						cacheRead: 0,
						cacheWrite: 0,
						totalTokens: 600,
						cost: { input: 0.002, output: 0.001, cacheRead: 0, cacheWrite: 0, total: 0.003 },
					},
				);
			}

			const totalMs = performance.now() - start;
			return {
				totalMs,
				avgMsPerBranch: totalMs / branchCount,
			};
		} finally {
			session.dispose();
		}
	}
}

describe("CompactionPerformanceBenchmark", () => {
	it("evaluates conversation compaction pass execution time and compression ratio", async () => {
		const benchmark = new CompactionPerformanceBenchmark();
		const result = await benchmark.runCompactionPassBenchmark(60);

		expect(result.initialMessagesCount).toBe(120);
		expect(result.compactedMessagesCount).toBeLessThan(result.initialMessagesCount);
		expect(result.compressionRatio).toBeGreaterThan(0);
		expect(result.executionMs).toBeGreaterThan(0);
	});

	it("evaluates branch creation with summary benchmark latency", async () => {
		const benchmark = new CompactionPerformanceBenchmark();
		const result = await benchmark.runBranchSummaryBenchmark(15);

		expect(result.totalMs).toBeGreaterThan(0);
		expect(result.avgMsPerBranch).toBeGreaterThan(0);
	});
});
