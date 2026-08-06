import { describe, expect, it } from "vitest";

interface MessagesUtilitiesBenchmarkResult {
	iterations: number;
	totalMs: number;
	avgMsPerOp: number;
	opsPerSec: number;
}

class MessagesUtilitiesBenchmark {
	private extractMessageText(messageContent: Array<{ type: string; text?: string }>): string {
		return messageContent
			.filter(
				(part): part is { type: "text"; text: string } => part.type === "text" && typeof part.text === "string",
			)
			.map((part) => part.text)
			.join("\n");
	}

	async runMessageTextExtractionBenchmark(iterations = 5000): Promise<MessagesUtilitiesBenchmarkResult> {
		const complexContent = [
			{ type: "text", text: "Line 1: Analysis of current code state." },
			{ type: "toolCall", id: "call_1", name: "read_file" },
			{ type: "text", text: "Line 2: Recommendation for structural refactoring." },
			{ type: "text", text: "Line 3: Final verification checklist." },
		];

		const start = performance.now();

		for (let i = 0; i < iterations; i++) {
			this.extractMessageText(complexContent);
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

describe("MessagesUtilitiesBenchmark", () => {
	it("benchmarks message text extraction and content parsing throughput", async () => {
		const benchmark = new MessagesUtilitiesBenchmark();
		const result = await benchmark.runMessageTextExtractionBenchmark(2000);

		expect(result.iterations).toBe(2000);
		expect(result.totalMs).toBeGreaterThan(0);
		expect(result.opsPerSec).toBeGreaterThan(0);
	});
});
