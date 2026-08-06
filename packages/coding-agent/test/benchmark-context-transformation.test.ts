import { Agent } from "@earendil-works/pi-agent-core";
import { getModel, streamSimple } from "@earendil-works/pi-ai/compat";
import { describe, expect, it } from "vitest";
import { AgentSession } from "../src/core/agent-session.ts";
import { AuthStorage } from "../src/core/auth-storage.ts";
import { convertToLlm } from "../src/core/messages.ts";
import { SessionManager } from "../src/core/session-manager.ts";
import { SettingsManager } from "../src/core/settings-manager.ts";
import { createInMemoryModelRegistry, getModelRuntime } from "./model-runtime-test-utils.ts";
import { createTestResourceLoader } from "./utilities.ts";

interface ContextTransformationBenchmarkResult {
	messagesCount: number;
	conversionMs: number;
	opsPerSec: number;
	convertedLlmMessagesCount: number;
}

class ContextTransformationBenchmark {
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
					systemPrompt: "You are a context transformation benchmark assistant.",
					tools: [],
				},
				convertToLlm,
			}),
			sessionManager,
			settingsManager,
			cwd: process.cwd(),
			modelRuntime: getModelRuntime(await createInMemoryModelRegistry(authStorage)),
			resourceLoader: createTestResourceLoader(),
		});

		return { session, sessionManager, model };
	}

	async runMessageConversionBenchmark(
		messageCount = 200,
		iterations = 50,
	): Promise<ContextTransformationBenchmarkResult> {
		const { session, sessionManager, model } = await this.createTestSession();

		try {
			for (let i = 0; i < messageCount; i++) {
				if (i % 2 === 0) {
					sessionManager.appendMessage({
						role: "user",
						content: `User query ${i}: Please analyze architectural layer dependencies for module ${i}.`,
						timestamp: Date.now(),
					});
				} else {
					sessionManager.appendMessage({
						role: "assistant",
						content: [
							{ type: "text", text: `Assistant response ${i}: Analyzed dependency graph for module ${i}.` },
							{
								type: "toolCall",
								id: `tool_call_${i}`,
								name: "read_file",
								arguments: { path: `/src/module_${i}.ts` },
							},
						],
						api: model.api,
						provider: model.provider,
						model: model.id,
						usage: {
							input: 200,
							output: 100,
							cacheRead: 0,
							cacheWrite: 0,
							totalTokens: 300,
							cost: { input: 0.001, output: 0.001, cacheRead: 0, cacheWrite: 0, total: 0.002 },
						},
						stopReason: "toolUse",
						timestamp: Date.now(),
					});
				}
			}

			const context = sessionManager.buildSessionContext();
			const start = performance.now();

			let lastConvertedCount = 0;
			for (let it = 0; it < iterations; it++) {
				const converted = convertToLlm(context.messages);
				lastConvertedCount = converted.length;
			}

			const elapsedMs = performance.now() - start;
			const opsPerSec = (iterations / elapsedMs) * 1000;

			return {
				messagesCount: messageCount,
				conversionMs: elapsedMs,
				opsPerSec,
				convertedLlmMessagesCount: lastConvertedCount,
			};
		} finally {
			session.dispose();
		}
	}
}

describe("ContextTransformationBenchmark", () => {
	it("benchmarks message-to-LLM schema conversion speed and structure integrity", async () => {
		const benchmark = new ContextTransformationBenchmark();
		const result = await benchmark.runMessageConversionBenchmark(100, 30);

		expect(result.messagesCount).toBe(100);
		expect(result.convertedLlmMessagesCount).toBeGreaterThan(0);
		expect(result.conversionMs).toBeGreaterThan(0);
		expect(result.opsPerSec).toBeGreaterThan(0);
	});
});
