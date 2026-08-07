import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { describe, expect, it } from "vitest";
import { AutoLearnEngine } from "../src/core/index.ts";

describe("AutoLearn Harness Engine", () => {
	it("captures lessons, tags lessons, batch syncs to BroccoliDB, and filters by tag", async () => {
		const autolearn = new AutoLearnEngine();

		const lesson = autolearn.captureLesson(
			"Strict Type Assertions",
			"Avoid any types in tool definitions",
			"Always map parameters using TypeBox schemas",
			0.98,
			"architecture",
			["ts", "types"],
		);

		expect(lesson.tags).toContain("ts");

		autolearn.addLessonTag(lesson.id, "typebox");
		const taggedLessons = autolearn.getLessonsByTag("typebox");
		expect(taggedLessons.length).toBe(1);
		expect(taggedLessons[0].title).toBe("Strict Type Assertions");

		const syncedCount = await autolearn.syncAllToBroccoliDB(0.9);
		expect(syncedCount).toBe(1);

		const tmpDir = path.join(os.tmpdir(), `pi-autolearn-test-${Date.now()}`);
		const promotedFiles = await autolearn.autoPromoteHighConfidenceLessons(tmpDir, 0.95);

		expect(promotedFiles.length).toBe(1);
		await fs.rm(tmpDir, { recursive: true, force: true });
	});
});
