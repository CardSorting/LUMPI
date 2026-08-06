import type { SessionEntry } from "@earendil-works/pi-coding-agent";
import { describe, expect, it } from "vitest";
import { getUsageCostBreakdown } from "../src/core/usage-totals.ts";

interface UsageTotalsBenchmarkResult {
	iterations: number;
	totalMs: number;
	avgMsPerCalculation: number;
	opsPerSec: number;
}

class UsageTotalsBenchmark {
	async runUsageTotalsBenchmark(entryCount = 200, iterations = 500): Promise<UsageTotalsBenchmarkResult> {
		const sampleEntries: SessionEntry[] = [];

		for (let i = 0; i < entryCount; i++) {
			sampleEntries.push({
				type: "message",
				id: `msg_${i}`,
				parentId: i > 0 ? `msg_${i - 1}` : null,
				timestamp: new Date().toISOString(),
				message: {
					role: "assistant",
					content: [{ type: "text", text: `Response ${i}` }],
					api: "openai-codex-responses",
					provider: "openai-codex",
					model: "gpt-5.6-luna",
					usage: {
						input: 500,
						output: 200,
						cacheRead: 100,
						cacheWrite: 50,
						totalTokens: 850,
						cost: { input: 0.0001, output: 0.00024, cacheRead: 0.00001, cacheWrite: 0.000125, total: 0.000475 },
					},
					stopReason: "stop",
					timestamp: Date.now(),
				},
			});
		}

		const start = performance.now();

		for (let it = 0; it < iterations; it++) {
			getUsageCostBreakdown(sampleEntries);
		}

		const totalMs = performance.now() - start;
		const avgMsPerCalculation = totalMs / iterations;
		const opsPerSec = (iterations / totalMs) * 1000;

		return {
			iterations,
			totalMs,
			avgMsPerCalculation,
			opsPerSec,
		};
	}
}

describe("UsageTotalsBenchmark", () => {
	it("benchmarks session usage cost breakdown calculations over multi-turn entries", async () => {
		const benchmark = new UsageTotalsBenchmark();
		const result = await benchmark.runUsageTotalsBenchmark(100, 300);

		expect(result.iterations).toBe(300);
		expect(result.totalMs).toBeGreaterThan(0);
		expect(result.opsPerSec).toBeGreaterThan(0);
	});
});
