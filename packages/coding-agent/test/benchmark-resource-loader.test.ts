import { describe, expect, it } from "vitest";
import { createTestResourceLoader } from "./utilities.ts";

interface ResourceLoaderBenchmarkResult {
	iterations: number;
	totalMs: number;
	avgMsPerLoad: number;
	opsPerSec: number;
}

class ResourceLoaderBenchmark {
	async runResourceLoadingBenchmark(iterations = 100): Promise<ResourceLoaderBenchmarkResult> {
		const resourceLoader = createTestResourceLoader();

		await resourceLoader.reload();
		const start = performance.now();

		for (let i = 0; i < iterations; i++) {
			resourceLoader.getSystemPrompt();
			resourceLoader.getExtensions();
			resourceLoader.getSkills();
			resourceLoader.getPrompts();
		}

		const totalMs = performance.now() - start;
		const avgMsPerLoad = totalMs / iterations;
		const opsPerSec = (iterations / totalMs) * 1000;

		return {
			iterations,
			totalMs,
			avgMsPerLoad,
			opsPerSec,
		};
	}
}

describe("ResourceLoaderBenchmark", () => {
	it("benchmarks resource loader query performance and extension retrieval speed", async () => {
		const benchmark = new ResourceLoaderBenchmark();
		const result = await benchmark.runResourceLoadingBenchmark(150);

		expect(result.iterations).toBe(150);
		expect(result.totalMs).toBeGreaterThan(0);
		expect(result.opsPerSec).toBeGreaterThan(0);
	});
});
