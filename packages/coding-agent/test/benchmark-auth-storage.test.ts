import { describe, expect, it } from "vitest";
import { AuthStorage } from "../src/core/auth-storage.ts";

interface AuthStorageBenchmarkResult {
	operationsCount: number;
	totalMs: number;
	avgMsPerOp: number;
	opsPerSec: number;
}

class AuthStorageBenchmark {
	async runAuthStorageLookupBenchmark(operationsCount = 1000): Promise<AuthStorageBenchmarkResult> {
		const authStorage = AuthStorage.inMemory();

		await authStorage.modify("openai-codex", async () => ({
			type: "oauth",
			access: "test-oauth-access-token",
			refresh: "test-oauth-refresh-token",
			expires: Date.now() + 3600000,
		}));
		await authStorage.modify("openai", async () => ({ type: "api_key", key: "test-openai-key" }));

		const start = performance.now();

		for (let i = 0; i < operationsCount; i++) {
			await authStorage.read("openai-codex");
			await authStorage.read("openai");
		}

		const totalMs = performance.now() - start;
		const avgMsPerOp = totalMs / (operationsCount * 2);
		const opsPerSec = ((operationsCount * 2) / totalMs) * 1000;

		return {
			operationsCount: operationsCount * 2,
			totalMs,
			avgMsPerOp,
			opsPerSec,
		};
	}
}

describe("AuthStorageBenchmark", () => {
	it("benchmarks auth storage credential lookup and retrieval throughput", async () => {
		const benchmark = new AuthStorageBenchmark();
		const result = await benchmark.runAuthStorageLookupBenchmark(500);

		expect(result.operationsCount).toBe(1000);
		expect(result.totalMs).toBeGreaterThan(0);
		expect(result.opsPerSec).toBeGreaterThan(0);
	});
});
