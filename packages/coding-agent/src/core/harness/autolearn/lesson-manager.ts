import type { LearnedLesson } from "./types.ts";

export class LessonManager {
	#lessons: Map<string, LearnedLesson>;

	constructor(initialLessons?: Map<string, LearnedLesson>) {
		this.#lessons = initialLessons ?? new Map<string, LearnedLesson>();
	}

	get lessons(): Map<string, LearnedLesson> {
		return this.#lessons;
	}

	captureLesson(
		title: string,
		context: string,
		takeaway: string,
		confidence = 0.9,
		category = "general",
		tags: string[] = [],
	): LearnedLesson {
		const existing = Array.from(this.#lessons.values()).find(
			(l) => l.title.toLowerCase() === title.toLowerCase() || l.takeaway.toLowerCase() === takeaway.toLowerCase(),
		);

		if (existing) {
			existing.confidence = Math.max(existing.confidence, confidence);
			existing.context = `${existing.context}\n${context}`;
			if (tags.length > 0) {
				const mergedTags = new Set([...(existing.tags || []), ...tags]);
				existing.tags = Array.from(mergedTags);
			}
			return existing;
		}

		const id = `lesson_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
		const lesson: LearnedLesson = {
			id,
			title,
			context,
			takeaway,
			confidence,
			category,
			tags,
		};
		this.#lessons.set(id, lesson);
		return lesson;
	}

	addLessonTag(lessonId: string, tag: string): boolean {
		const lesson = this.#lessons.get(lessonId);
		if (!lesson) return false;
		const set = new Set(lesson.tags || []);
		set.add(tag.toLowerCase());
		lesson.tags = Array.from(set);
		return true;
	}

	getLessonsByTag(tag: string, minConfidence = 0.0): LearnedLesson[] {
		const lowerTag = tag.toLowerCase();
		return this.getLessons(minConfidence).filter((l) => (l.tags || []).some((t) => t.toLowerCase() === lowerTag));
	}

	invalidateLesson(lessonId: string): boolean {
		return this.#lessons.delete(lessonId);
	}

	decayConfidence(decayFactor = 0.1): void {
		for (const lesson of this.#lessons.values()) {
			lesson.confidence = Math.max(0.0, lesson.confidence - decayFactor);
		}
	}

	getLessons(minConfidence = 0.0): LearnedLesson[] {
		return Array.from(this.#lessons.values())
			.filter((l) => l.confidence >= minConfidence)
			.sort((a, b) => b.confidence - a.confidence);
	}

	getLessonsByCategory(category: string, minConfidence = 0.0): LearnedLesson[] {
		return this.getLessons(minConfidence).filter((l) => l.category.toLowerCase() === category.toLowerCase());
	}

	searchLessons(query: string, minConfidence = 0.0): LearnedLesson[] {
		const lower = query.toLowerCase();
		return this.getLessons(minConfidence).filter(
			(l) =>
				l.title.toLowerCase().includes(lower) ||
				l.takeaway.toLowerCase().includes(lower) ||
				l.context.toLowerCase().includes(lower) ||
				(l.tags || []).some((t) => t.toLowerCase().includes(lower)),
		);
	}

	generateSummaryReport(): string {
		const lessons = this.getLessons();
		if (lessons.length === 0) return "# AutoLearn Summary\n\nNo lessons recorded yet.";

		const categories = new Map<string, LearnedLesson[]>();
		for (const lesson of lessons) {
			const cat = lesson.category || "general";
			const list = categories.get(cat) || [];
			list.push(lesson);
			categories.set(cat, list);
		}

		const lines: string[] = ["# AutoLearn Summary Report", ""];
		for (const [cat, list] of categories.entries()) {
			lines.push(`## Category: ${cat}`);
			for (const l of list) {
				const tagStr = l.tags && l.tags.length > 0 ? ` [${l.tags.join(", ")}]` : "";
				lines.push(`- **${l.title}**${tagStr} (Confidence: ${(l.confidence * 100).toFixed(0)}%)`);
				lines.push(`  - Takeaway: ${l.takeaway}`);
			}
			lines.push("");
		}

		return lines.join("\n");
	}
}
