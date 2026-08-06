import { describe, expect, it } from "vitest";
import { withFileMutationQueue } from "../src/core/tools/file-mutation-queue.ts";

interface FileMutationQueueBenchmarkResult {
	tasksExecuted: number;
	totalMs: number;
	avgMsPerTask: number;
	opsPerSec: number;
}

class FileMutationQueueBenchmark {
	async runQueueExecutionBenchmark(taskCount = 200): Promise<FileMutationQueueBenchmarkResult> {
		let completed = 0;
		const targetFile = "/tmp/benchmark-mutation-test-file.txt";

		const start = performance.now();

		const promises: Promise<void>[] = [];
		for (let i = 0; i < taskCount; i++) {
			promises.push(
				withFileMutationQueue(targetFile, async () => {
					completed++;
				}),
			);
		}

		await Promise.all(promises);
		const totalMs = performance.now() - start;
		const avgMsPerTask = totalMs / taskCount;
		const opsPerSec = (taskCount / totalMs) * 1000;

		return {
			tasksExecuted: completed,
			totalMs,
			avgMsPerTask,
			opsPerSec,
		};
	}
}

describe("FileMutationQueueBenchmark", () => {
	it("benchmarks file mutation queue task enqueueing and execution throughput", async () => {
		const benchmark = new FileMutationQueueBenchmark();
		const result = await benchmark.runQueueExecutionBenchmark(100);

		expect(result.tasksExecuted).toBe(100);
		expect(result.totalMs).toBeGreaterThan(0);
		expect(result.opsPerSec).toBeGreaterThan(0);
	});
});
