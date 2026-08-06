import { describe, expect, it } from "vitest";
import { SettingsManager } from "../src/core/settings-manager.ts";

interface SettingsManagerBenchmarkResult {
	lookupsCount: number;
	totalMs: number;
	avgMsPerLookup: number;
	opsPerSec: number;
}

class SettingsManagerBenchmark {
	async runSettingsLookupBenchmark(lookupsCount = 1000): Promise<SettingsManagerBenchmarkResult> {
		const settingsManager = SettingsManager.inMemory({
			defaultModel: "openai-codex/gpt-5.6-luna",
			extensions: [".pi/extensions"],
		});

		const start = performance.now();

		for (let i = 0; i < lookupsCount; i++) {
			settingsManager.getGlobalSettings();
			settingsManager.getCompactionSettings();
			settingsManager.getRetrySettings();
		}

		const totalMs = performance.now() - start;
		const avgMsPerLookup = totalMs / (lookupsCount * 3);
		const opsPerSec = ((lookupsCount * 3) / totalMs) * 1000;

		return {
			lookupsCount: lookupsCount * 3,
			totalMs,
			avgMsPerLookup,
			opsPerSec,
		};
	}
}

describe("SettingsManagerBenchmark", () => {
	it("benchmarks settings manager lookups and configuration retrieval speed", async () => {
		const benchmark = new SettingsManagerBenchmark();
		const result = await benchmark.runSettingsLookupBenchmark(500);

		expect(result.lookupsCount).toBe(1500);
		expect(result.totalMs).toBeGreaterThan(0);
		expect(result.opsPerSec).toBeGreaterThan(0);
	});
});
