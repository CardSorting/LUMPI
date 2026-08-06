import { describe, expect, it } from "vitest";
import { AuthStorage } from "../src/core/auth-storage.ts";
import { createInMemoryModelRegistry, getModelRuntime } from "./model-runtime-test-utils.ts";

interface ModelResolutionBenchmarkResult {
	lookups: number;
	totalMs: number;
	avgMsPerLookup: number;
	opsPerSec: number;
}

class ModelResolutionBenchmark {
	async runModelLookupBenchmark(lookupsCount = 1000): Promise<ModelResolutionBenchmarkResult> {
		const authStorage = AuthStorage.inMemory();
		await authStorage.modify("openai-codex", async () => ({
			type: "oauth",
			access: "test-oauth-access-token",
			refresh: "test-oauth-refresh-token",
			expires: Date.now() + 3600000,
		}));
		const registry = await createInMemoryModelRegistry(authStorage);
		const runtime = getModelRuntime(registry);

		const start = performance.now();

		for (let i = 0; i < lookupsCount; i++) {
			runtime.getModel("openai-codex", "gpt-5.6-luna");
			runtime.getModels("openai-codex");
			runtime.getProvider("openai-codex");
		}

		const totalMs = performance.now() - start;
		const avgMsPerLookup = totalMs / lookupsCount;
		const opsPerSec = (lookupsCount / totalMs) * 1000;

		return {
			lookups: lookupsCount,
			totalMs,
			avgMsPerLookup,
			opsPerSec,
		};
	}
}

describe("ModelResolutionBenchmark", () => {
	it("benchmarks model registry lookups and resolution ops per second", async () => {
		const benchmark = new ModelResolutionBenchmark();
		const result = await benchmark.runModelLookupBenchmark(500);

		expect(result.lookups).toBe(500);
		expect(result.totalMs).toBeGreaterThan(0);
		expect(result.opsPerSec).toBeGreaterThan(0);
	});
});
