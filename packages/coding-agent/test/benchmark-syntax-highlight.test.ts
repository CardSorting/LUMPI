import { describe, expect, it } from "vitest";
import { highlightCode } from "../src/modes/interactive/theme/theme.ts";

interface SyntaxHighlightBenchmarkResult {
	iterations: number;
	totalMs: number;
	avgMsPerHighlight: number;
	opsPerSec: number;
}

class SyntaxHighlightBenchmark {
	async runSyntaxHighlightBenchmark(iterations = 500): Promise<SyntaxHighlightBenchmarkResult> {
		const sampleCode = `
export class CoreProcessor {
	private count = 0;
	async process(data: string[]): Promise<number> {
		for (const item of data) {
			if (item.length > 0) this.count++;
		}
		return this.count;
	}
}
`;

		const start = performance.now();

		for (let i = 0; i < iterations; i++) {
			highlightCode(sampleCode, "typescript");
		}

		const totalMs = performance.now() - start;
		const avgMsPerHighlight = totalMs / iterations;
		const opsPerSec = (iterations / totalMs) * 1000;

		return {
			iterations,
			totalMs,
			avgMsPerHighlight,
			opsPerSec,
		};
	}
}

describe("SyntaxHighlightBenchmark", () => {
	it("benchmarks code snippet syntax highlighting performance", async () => {
		const benchmark = new SyntaxHighlightBenchmark();
		const result = await benchmark.runSyntaxHighlightBenchmark(200);

		expect(result.iterations).toBe(200);
		expect(result.totalMs).toBeGreaterThan(0);
		expect(result.opsPerSec).toBeGreaterThan(0);
	});
});
