import { describe, expect, it } from "vitest";
import { parseFrontmatter } from "../src/utils/frontmatter.ts";

interface FrontmatterBenchmarkResult {
	iterations: number;
	totalMs: number;
	avgMsPerParse: number;
	opsPerSec: number;
}

class FrontmatterBenchmark {
	async runFrontmatterParseBenchmark(iterations = 3000): Promise<FrontmatterBenchmarkResult> {
		const sampleMarkdown = `---
title: "Benchmark Test Skill"
name: "benchmark_skill"
description: "A comprehensive benchmark test skill for frontmatter parsing."
tags: ["benchmark", "performance", "testing"]
version: 1.0
---

# Benchmark Skill Instructions

This is the main markdown body of the skill document containing execution steps.`;

		const start = performance.now();

		for (let i = 0; i < iterations; i++) {
			parseFrontmatter(sampleMarkdown);
		}

		const totalMs = performance.now() - start;
		const avgMsPerParse = totalMs / iterations;
		const opsPerSec = (iterations / totalMs) * 1000;

		return {
			iterations,
			totalMs,
			avgMsPerParse,
			opsPerSec,
		};
	}
}

describe("FrontmatterBenchmark", () => {
	it("benchmarks markdown YAML frontmatter parsing and extraction throughput", async () => {
		const benchmark = new FrontmatterBenchmark();
		const result = await benchmark.runFrontmatterParseBenchmark(1500);

		expect(result.iterations).toBe(1500);
		expect(result.totalMs).toBeGreaterThan(0);
		expect(result.opsPerSec).toBeGreaterThan(0);
	});
});
