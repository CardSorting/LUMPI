import { describe, expect, it } from "vitest";
import { createMermaidMarkdownTransformer } from "../src/modes/interactive/components/mermaid.ts";

interface MermaidBenchmarkResult {
	iterations: number;
	totalMs: number;
	avgMsPerOp: number;
	opsPerSec: number;
}

class MermaidBenchmark {
	async runMermaidBenchmark(iterations = 1000): Promise<MermaidBenchmarkResult> {
		const transformer = createMermaidMarkdownTransformer({
			getMode: () => "streaming",
		});

		const sampleMarkdown = "Before\n\n```mermaid\nflowchart LR\n  A[Start] --> B[Done]\n```\nAfter";

		const start = performance.now();

		for (let i = 0; i < iterations; i++) {
			transformer(sampleMarkdown, {
				availableWidth: 100,
				isStreaming: false,
				messageType: "assistant",
			});
		}

		const totalMs = performance.now() - start;
		const avgMsPerOp = totalMs / iterations;
		const opsPerSec = (iterations / totalMs) * 1000;

		return {
			iterations,
			totalMs,
			avgMsPerOp,
			opsPerSec,
		};
	}
}

describe("MermaidBenchmark", () => {
	it("benchmarks Mermaid diagram block transformation performance", async () => {
		const benchmark = new MermaidBenchmark();
		const result = await benchmark.runMermaidBenchmark(500);

		expect(result.iterations).toBe(500);
		expect(result.totalMs).toBeGreaterThan(0);
		expect(result.opsPerSec).toBeGreaterThan(0);
	});
});
