import { describe, expect, it } from "vitest";

interface PromptTemplatesBenchmarkResult {
	iterations: number;
	totalMs: number;
	avgMsPerRender: number;
	opsPerSec: number;
}

class PromptTemplatesBenchmark {
	private renderTemplate(template: string, variables: Record<string, string>): string {
		let rendered = template;
		for (const [key, val] of Object.entries(variables)) {
			rendered = rendered.replaceAll(`{{${key}}}`, val);
		}
		return rendered;
	}

	async runTemplateRenderingBenchmark(iterations = 2000): Promise<PromptTemplatesBenchmarkResult> {
		const templateText =
			"You are {{agentRole}} operating in {{cwd}}. System state: {{status}}. Allowed tools: {{tools}}.";
		const variables = {
			agentRole: "senior_code_auditor",
			cwd: "/workspace/project",
			status: "active",
			tools: "read_file, write_file, execute_command",
		};

		const start = performance.now();

		for (let i = 0; i < iterations; i++) {
			this.renderTemplate(templateText, variables);
		}

		const totalMs = performance.now() - start;
		const avgMsPerRender = totalMs / iterations;
		const opsPerSec = (iterations / totalMs) * 1000;

		return {
			iterations,
			totalMs,
			avgMsPerRender,
			opsPerSec,
		};
	}
}

describe("PromptTemplatesBenchmark", () => {
	it("benchmarks system prompt template rendering performance", async () => {
		const benchmark = new PromptTemplatesBenchmark();
		const result = await benchmark.runTemplateRenderingBenchmark(1000);

		expect(result.iterations).toBe(1000);
		expect(result.totalMs).toBeGreaterThan(0);
		expect(result.opsPerSec).toBeGreaterThan(0);
	});
});
