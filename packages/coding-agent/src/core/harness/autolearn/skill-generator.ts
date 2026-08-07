import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { LessonManager } from "./lesson-manager.ts";
import type { LearnedLesson } from "./types.ts";

export class SkillGenerator {
	promoteToSkillMarkdown(lessonId: string, lessons: Map<string, LearnedLesson>): string | null {
		const lesson = lessons.get(lessonId);
		if (!lesson) return null;
		const slug = lesson.title
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-+|-+$/g, "");
		return [
			`---`,
			`name: ${slug}`,
			`description: ${lesson.takeaway}`,
			`---`,
			`# ${lesson.title}`,
			``,
			`## Context`,
			`${lesson.context}`,
			``,
			`## Lesson & Guidelines`,
			`${lesson.takeaway}`,
		].join("\n");
	}

	async writeSkillFile(
		lessonId: string,
		targetDir: string,
		lessons: Map<string, LearnedLesson>,
	): Promise<string | null> {
		const markdown = this.promoteToSkillMarkdown(lessonId, lessons);
		const lesson = lessons.get(lessonId);
		if (!markdown || !lesson) return null;

		const slug = lesson.title
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-+|-+$/g, "");
		const skillFolder = path.join(targetDir, "skills", slug);
		const skillFile = path.join(skillFolder, "SKILL.md");

		await fs.mkdir(skillFolder, { recursive: true });
		await fs.writeFile(skillFile, markdown, "utf-8");
		return skillFile;
	}

	async deleteSkillFile(skillName: string, targetDir: string): Promise<boolean> {
		const slug = skillName
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-+|-+$/g, "");
		const skillFolder = path.join(targetDir, "skills", slug);
		try {
			await fs.rm(skillFolder, { recursive: true, force: true });
			return true;
		} catch {
			return false;
		}
	}

	async autoPromoteHighConfidenceLessons(
		lessonManager: LessonManager,
		targetDir: string,
		threshold = 0.95,
	): Promise<string[]> {
		const highConfLessons = lessonManager.getLessons(threshold);
		const promotedFiles: string[] = [];

		for (const lesson of highConfLessons) {
			const file = await this.writeSkillFile(lesson.id, targetDir, lessonManager.lessons);
			if (file) {
				promotedFiles.push(file);
			}
		}

		return promotedFiles;
	}
}
