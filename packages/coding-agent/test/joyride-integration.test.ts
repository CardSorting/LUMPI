import { describe, expect, it } from "vitest";
import { type BashResult, executeBashWithOperations } from "../src/core/bash-executor.ts";
import { CodemarieBridge } from "../src/core/codemarie-bridge.ts";
import type { BashOperations } from "../src/core/tools/bash.ts";

describe("JoyRide Execution Caching Integration", () => {
	it("exposes JoyRide API methods on CodemarieBridge", async () => {
		const bridge = new CodemarieBridge({ cwd: process.cwd() });
		const cache = bridge.getJoyRideCache();
		expect(cache).toBeDefined();

		const scope = bridge.createJoyRideTaskScope("test-task-1", process.cwd());
		expect(scope.taskId).toBe("test-task-1");

		const classification = bridge.classifyCommand("pwd");
		expect(classification.tier).toBe("safe-readonly");

		const envCheck = bridge.isEnvAlteringCommand("git checkout main");
		expect(envCheck).toBe(true);

		const readOnlyCheck = bridge.isReadOnlyCacheableCommand("git status");
		expect(readOnlyCheck).toBe(true);
	});

	it("memoizes safe read-only bash commands via CodemarieBridge", async () => {
		const bridge = new CodemarieBridge({ cwd: process.cwd() });
		let executionCount = 0;

		const mockOperations: BashOperations = {
			exec: async (_cmd, _cwd, options) => {
				executionCount++;
				options?.onData?.(Buffer.from("mock output path /workspace\n"));
				return { exitCode: 0 };
			},
		};

		// First execution - Cache Miss
		const result1: BashResult = await executeBashWithOperations("pwd", process.cwd(), mockOperations, {
			codemarieBridge: bridge,
			taskId: "test-task-cache",
		});

		expect(result1.output).toBe("mock output path /workspace\n");
		expect(result1.exitCode).toBe(0);
		// Second execution - Cache Hit (should skip mockOperations.exec)

		const result2: BashResult = await executeBashWithOperations("pwd", process.cwd(), mockOperations, {
			codemarieBridge: bridge,
			taskId: "test-task-cache",
		});

		expect(result2.output).toBe("mock output path /workspace\n");
		expect(result2.exitCode).toBe(0);
		expect(executionCount).toBe(1); // Not incremented because JoyRide hit!
	});

	it("invalidates cache on environment-altering commands", async () => {
		const bridge = new CodemarieBridge({ cwd: process.cwd() });
		let executionCount = 0;

		const mockOperations: BashOperations = {
			exec: async (cmd, _cwd, options) => {
				executionCount++;
				if (cmd.includes("git checkout")) {
					options?.onData?.(Buffer.from("Switched to branch 'main'\n"));
				} else {
					options?.onData?.(Buffer.from("mock output path /workspace\n"));
				}
				return { exitCode: 0 };
			},
		};

		// 1. Initial read-only execution -> Count = 1
		await executeBashWithOperations("pwd", process.cwd(), mockOperations, {
			codemarieBridge: bridge,
			taskId: "test-task-env",
		});
		expect(executionCount).toBe(1);

		// 2. Execute environment altering command -> Count = 2
		await executeBashWithOperations("git checkout main", process.cwd(), mockOperations, {
			codemarieBridge: bridge,
			taskId: "test-task-env",
		});
		expect(executionCount).toBe(2);

		// 3. Repeat read-only command after env invalidation -> Count = 3 (due to workspace invalidation)
		await executeBashWithOperations("pwd", process.cwd(), mockOperations, {
			codemarieBridge: bridge,
			taskId: "test-task-env",
		});
		expect(executionCount).toBe(3);
	});
});
