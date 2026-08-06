import { describe, expect, it } from "vitest";
import { stripAnsi } from "../src/utils/ansi.ts";

interface AnsiUtilsBenchmarkResult {
	iterations: number;
	totalMs: number;
	avgMsPerStrip: number;
	opsPerSec: number;
}

class AnsiUtilsBenchmark {
	async runAnsiStripBenchmark(iterations = 10000): Promise<AnsiUtilsBenchmarkResult> {
		const ansiText =
			"\u001b[31mError:\u001b[0m \u001b[32m[LAYER: CORE]\u001b[0m Process failed at \u001b[4m/src/index.ts:42\u001b[0m (code 1)";

		const start = performance.now();

		for (let i = 0; i < iterations; i++) {
			stripAnsi(ansiText);
		}

		const totalMs = performance.now() - start;
		const avgMsPerStrip = totalMs / iterations;
		const opsPerSec = (iterations / totalMs) * 1000;

		return {
			iterations,
			totalMs,
			avgMsPerStrip,
			opsPerSec,
		};
	}
}

describe("AnsiUtilsBenchmark", () => {
	it("benchmarks ANSI strip formatting throughput", async () => {
		const benchmark = new AnsiUtilsBenchmark();
		const result = await benchmark.runAnsiStripBenchmark(5000);

		expect(result.iterations).toBe(5000);
		expect(result.totalMs).toBeGreaterThan(0);
		expect(result.opsPerSec).toBeGreaterThan(0);
	});
});
