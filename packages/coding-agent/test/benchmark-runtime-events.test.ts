import { Agent } from "@noorm/lumpi-agent-core";
import { getModel, streamSimple } from "@noorm/lumpi-ai/compat";
import { describe, expect, it } from "vitest";
import { AgentSession, type AgentSessionEvent } from "../src/core/agent-session.ts";
import { AuthStorage } from "../src/core/auth-storage.ts";
import { SessionManager } from "../src/core/session-manager.ts";
import { SettingsManager } from "../src/core/settings-manager.ts";
import { createInMemoryModelRegistry, getModelRuntime } from "./model-runtime-test-utils.ts";
import { createTestResourceLoader } from "./utilities.ts";

interface RuntimeEventsBenchmarkResult {
	eventsDispatched: number;
	totalMs: number;
	avgMsPerEvent: number;
	opsPerSec: number;
	receivedCount: number;
}

class RuntimeEventsBenchmark {
	private async createTestSession() {
		const model = getModel("openai-codex", "gpt-5.6-luna");
		if (!model) {
			throw new Error("Model openai-codex/gpt-5.6-luna not found");
		}

		const settingsManager = SettingsManager.inMemory();
		const sessionManager = SessionManager.inMemory();
		const authStorage = AuthStorage.inMemory();
		await authStorage.modify("openai-codex", async () => ({
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
					systemPrompt: "You are a runtime events benchmark assistant.",
					tools: [],
				},
			}),
			sessionManager,
			settingsManager,
			cwd: process.cwd(),
			modelRuntime: getModelRuntime(await createInMemoryModelRegistry(authStorage)),
			resourceLoader: createTestResourceLoader(),
		});

		return { session };
	}

	async runEventDispatchBenchmark(eventCount = 200): Promise<RuntimeEventsBenchmarkResult> {
		const { session } = await this.createTestSession();
		let receivedCount = 0;

		const unsubscribe = session.subscribe((_event: AgentSessionEvent) => {
			receivedCount++;
		});

		try {
			const start = performance.now();

			for (let i = 0; i < eventCount; i++) {
				const level = i % 2 === 0 ? "off" : "high";
				session.setThinkingLevel(level);
			}

			const totalMs = performance.now() - start;
			const avgMsPerEvent = totalMs / eventCount;
			const opsPerSec = (eventCount / totalMs) * 1000;

			return {
				eventsDispatched: eventCount,
				totalMs,
				avgMsPerEvent,
				opsPerSec,
				receivedCount,
			};
		} finally {
			unsubscribe();
			session.dispose();
		}
	}
}

describe("RuntimeEventsBenchmark", () => {
	it("benchmarks runtime session event subscription and dispatch throughput", async () => {
		const benchmark = new RuntimeEventsBenchmark();
		const result = await benchmark.runEventDispatchBenchmark(100);

		expect(result.eventsDispatched).toBe(100);
		expect(result.receivedCount).toBeGreaterThan(0);
		expect(result.totalMs).toBeGreaterThan(0);
		expect(result.opsPerSec).toBeGreaterThan(0);
	});
});
