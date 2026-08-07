import { describe, expect, it } from "vitest";
import { AutoThinkingController, StructuredRecoveryEngine, VibeModeManager } from "../src/core/index.ts";

describe("Harness Modules", () => {
	it("computes dynamic reasoning budgets with AutoThinkingController", () => {
		const controller = new AutoThinkingController({ minTokens: 1000, maxTokens: 32000 });
		expect(controller.getEffort()).toBe("medium");

		const normalBudget = controller.computeBudget("Short prompt");
		expect(normalBudget).toBe(2000);

		const ultrathinkBudget = controller.computeBudget("ultrathink complex reasoning");
		expect(ultrathinkBudget).toBe(10000);
	});

	it("generates structured recovery hints on tool failure", () => {
		const engine = new StructuredRecoveryEngine(3);
		const hint = engine.generateRecoveryHint({
			toolName: "read",
			errorType: "schema_mismatch",
			errorMessage: "Property 'path' is missing",
			attemptCount: 1,
		});

		expect(hint).toContain("STRUCTURED RECOVERY HINT");
		expect(hint).toContain("read");
	});

	it("manages director mode state and worker dispatch with VibeModeManager", () => {
		const vibe = new VibeModeManager();
		expect(vibe.isVibeModeActive()).toBe(false);

		vibe.enableVibeMode();
		expect(vibe.isVibeModeActive()).toBe(true);

		const task = vibe.dispatchWorkerTask("task-1", "Audit security vulnerabilities");
		expect(task.status).toBe("running");
		expect(vibe.getWorkerTask("task-1")?.taskId).toBe("task-1");
	});
});
