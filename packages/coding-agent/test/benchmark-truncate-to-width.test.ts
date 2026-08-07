import { truncateToWidth } from "@noorm/lumi-tui";
import { describe, expect, it } from "vitest";

interface TruncateToWidthBenchmarkResult {
	iterations: number;
	totalMs: number;
	avgMsPerTruncate: number;
	opsPerSec: number;
}

class TruncateToWidthBenchmark {
	async runTruncateBenchmark(iterations = 5000): Promise<TruncateToWidthBenchmarkResult> {
		const complexString =
			"\u001b[31m[HEADER]\u001b[0m High throughput log entry containing wide characters like 日本語 and Unicode symbols 🔥 across long lines.";

		const start = performance.now();

		for (let i = 0; i < iterations; i++) {
			truncateToWidth(complexString, 40);
			truncateToWidth(complexString, 80);
		}

		const totalMs = performance.now() - start;
		const totalOps = iterations * 2;
		const avgMsPerTruncate = totalMs / totalOps;
		const opsPerSec = (totalOps / totalMs) * 1000;

		return {
			iterations: totalOps,
			totalMs,
			avgMsPerTruncate,
			opsPerSec,
		};
	}
}

describe("TruncateToWidthBenchmark", () => {
	it("benchmarks terminal text truncation to width with ANSI and multi-byte character handling", async () => {
		const benchmark = new TruncateToWidthBenchmark();
		const result = await benchmark.runTruncateBenchmark(2000);

		expect(result.iterations).toBe(4000);
		expect(result.totalMs).toBeGreaterThan(0);
		expect(result.opsPerSec).toBeGreaterThan(0);
	});
});
