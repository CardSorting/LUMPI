import type { MnemopiBroccoliStore } from "../../memory/mnemopi-broccolidb.ts";
import type { LessonManager } from "./lesson-manager.ts";
import type { AutoLearnStateSnapshot, LearnedLesson } from "./types.ts";

export class StoreSync {
	#store: MnemopiBroccoliStore;

	constructor(store: MnemopiBroccoliStore) {
		this.#store = store;
	}

	exportState(lessons: Map<string, LearnedLesson>): AutoLearnStateSnapshot {
		return {
			version: 1,
			lessons: Array.from(lessons.values()),
		};
	}

	importState(snapshot: AutoLearnStateSnapshot, lessons: Map<string, LearnedLesson>): void {
		if (snapshot && Array.isArray(snapshot.lessons)) {
			for (const lesson of snapshot.lessons) {
				lessons.set(lesson.id, lesson);
			}
		}
	}

	async syncToBroccoliDB(lessonId: string, lessons: Map<string, LearnedLesson>): Promise<boolean> {
		const lesson = lessons.get(lessonId);
		if (!lesson) return false;
		await this.#store.retain(`[AutoLearn: ${lesson.title}] ${lesson.takeaway}`, lesson.category, lesson.confidence);
		return true;
	}

	async syncAllToBroccoliDB(lessonManager: LessonManager, minConfidence = 0.8): Promise<number> {
		const eligible = lessonManager.getLessons(minConfidence);
		let count = 0;
		for (const lesson of eligible) {
			await this.#store.retain(
				`[AutoLearn: ${lesson.title}] ${lesson.takeaway}`,
				lesson.category,
				lesson.confidence,
			);
			count++;
		}
		return count;
	}
}
