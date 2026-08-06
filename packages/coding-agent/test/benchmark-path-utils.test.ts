import { describe, expect, it } from "vitest";
import { normalizePath, resolvePath } from "../src/utils/paths.ts";

interface PathUtilsBenchmarkResult {
	operationsCount: number;
	totalMs: number;
	avgMsPerOp: number;
	opsPerSec: number;
}

class PathUtilsBenchmark {
	async runPathNormalizationBenchmark(operationsCount = 5000): Promise<PathUtilsBenchmarkResult> {
		const samplePaths = [
			"/workspace/project/src/components/../../utils/index.ts",
			"C:\\Users\\Developer\\AppData\\Local\\Temp\\..\\project\\src\\file.ts",
			"./relative/sub/dir/../../../target.ts",
		];

		const start = performance.now();

		for (let i = 0; i < operationsCount; i++) {
			const targetPath = samplePaths[i % samplePaths.length];
			normalizePath(targetPath);
			resolvePath(targetPath, "/workspace/project");
		}

		const totalMs = performance.now() - start;
		const totalOps = operationsCount * 2;
		const avgMsPerOp = totalMs / totalOps;
		const opsPerSec = (totalOps / totalMs) * 1000;

		return {
			operationsCount: totalOps,
			totalMs,
			avgMsPerOp,
			opsPerSec,
		};
	}
}

describe("PathUtilsBenchmark", () => {
	it("benchmarks path normalization and relative path resolution throughput", async () => {
		const benchmark = new PathUtilsBenchmark();
		const result = await benchmark.runPathNormalizationBenchmark(2000);

		expect(result.operationsCount).toBe(4000);
		expect(result.totalMs).toBeGreaterThan(0);
		expect(result.opsPerSec).toBeGreaterThan(0);
	});
});
