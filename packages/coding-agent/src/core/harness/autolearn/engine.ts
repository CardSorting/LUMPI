import { MnemopiBroccoliStore } from "../../memory/mnemopi-broccolidb.ts";
import type { Skill } from "../../skills.ts";
import { LessonManager } from "./lesson-manager.ts";
import { SkillDiscovery } from "./skill-discovery.ts";
import { SkillGenerator } from "./skill-generator.ts";
import { StoreSync } from "./store-sync.ts";
import type { AutoLearnStateSnapshot, DiscoveredSkill, LearnedLesson, SkillValidationResult } from "./types.ts";

export class AutoLearnEngine {
	#lessonManager: LessonManager;
	#storeSync: StoreSync;
	#skillGenerator: SkillGenerator;
	#skillDiscovery: SkillDiscovery;

	constructor(broccoliStore?: MnemopiBroccoliStore) {
		this.#lessonManager = new LessonManager();
		this.#storeSync = new StoreSync(broccoliStore || new MnemopiBroccoliStore());
		this.#skillGenerator = new SkillGenerator();
		this.#skillDiscovery = new SkillDiscovery();
	}

	captureLesson(
		title: string,
		context: string,
		takeaway: string,
		confidence = 0.9,
		category = "general",
		tags: string[] = [],
	): LearnedLesson {
		return this.#lessonManager.captureLesson(title, context, takeaway, confidence, category, tags);
	}

	addLessonTag(lessonId: string, tag: string): boolean {
		return this.#lessonManager.addLessonTag(lessonId, tag);
	}

	getLessonsByTag(tag: string, minConfidence = 0.0): LearnedLesson[] {
		return this.#lessonManager.getLessonsByTag(tag, minConfidence);
	}

	invalidateLesson(lessonId: string): boolean {
		return this.#lessonManager.invalidateLesson(lessonId);
	}

	decayConfidence(decayFactor = 0.1): void {
		this.#lessonManager.decayConfidence(decayFactor);
	}

	getLessons(minConfidence = 0.0): LearnedLesson[] {
		return this.#lessonManager.getLessons(minConfidence);
	}

	getLessonsByCategory(category: string, minConfidence = 0.0): LearnedLesson[] {
		return this.#lessonManager.getLessonsByCategory(category, minConfidence);
	}

	searchLessons(query: string, minConfidence = 0.0): LearnedLesson[] {
		return this.#lessonManager.searchLessons(query, minConfidence);
	}

	generateSummaryReport(): string {
		return this.#lessonManager.generateSummaryReport();
	}

	exportState(): AutoLearnStateSnapshot {
		return this.#storeSync.exportState(this.#lessonManager.lessons);
	}

	importState(snapshot: AutoLearnStateSnapshot): void {
		this.#storeSync.importState(snapshot, this.#lessonManager.lessons);
	}

	async syncToBroccoliDB(lessonId: string): Promise<boolean> {
		return this.#storeSync.syncToBroccoliDB(lessonId, this.#lessonManager.lessons);
	}

	async syncAllToBroccoliDB(minConfidence = 0.8): Promise<number> {
		return this.#storeSync.syncAllToBroccoliDB(this.#lessonManager, minConfidence);
	}

	promoteToSkillMarkdown(lessonId: string): string | null {
		return this.#skillGenerator.promoteToSkillMarkdown(lessonId, this.#lessonManager.lessons);
	}

	async writeSkillFile(lessonId: string, targetDir: string): Promise<string | null> {
		return this.#skillGenerator.writeSkillFile(lessonId, targetDir, this.#lessonManager.lessons);
	}

	async deleteSkillFile(skillName: string, targetDir: string): Promise<boolean> {
		return this.#skillGenerator.deleteSkillFile(skillName, targetDir);
	}

	async discoverWorkspaceSkills(workspaceRoot: string): Promise<DiscoveredSkill[]> {
		return this.#skillDiscovery.discoverWorkspaceSkills(workspaceRoot);
	}

	resolveSkillCollisions(skills: DiscoveredSkill[]): DiscoveredSkill[] {
		return this.#skillDiscovery.resolveSkillCollisions(skills);
	}

	matchSkillsForPrompt(prompt: string, skills: DiscoveredSkill[]): DiscoveredSkill[] {
		return this.#skillDiscovery.matchSkillsForPrompt(prompt, skills);
	}

	buildSkillsPromptSection(matchedSkills: DiscoveredSkill[]): string {
		return this.#skillDiscovery.buildSkillsPromptSection(matchedSkills);
	}

	validateSkillStructure(skillName: string, description: string): SkillValidationResult {
		return this.#skillDiscovery.validateSkillStructure(skillName, description);
	}

	async resolveSkillReferencePaths(skillFilePath: string): Promise<string[]> {
		return this.#skillDiscovery.resolveSkillReferencePaths(skillFilePath);
	}

	exportSkillSchema(skill: DiscoveredSkill): Record<string, unknown> {
		return this.#skillDiscovery.exportSkillSchema(skill);
	}

	toSkill(discovered: DiscoveredSkill): Skill {
		return this.#skillDiscovery.toSkill(discovered);
	}

	convertToSkills(discoveredList: DiscoveredSkill[]): Skill[] {
		return this.#skillDiscovery.convertToSkills(discoveredList);
	}

	mergeWithLoadedSkills(loadedSkills: Skill[], discoveredList: DiscoveredSkill[]): Skill[] {
		return this.#skillDiscovery.mergeWithLoadedSkills(loadedSkills, discoveredList);
	}

	async autoPromoteHighConfidenceLessons(targetDir: string, threshold = 0.95): Promise<string[]> {
		return this.#skillGenerator.autoPromoteHighConfidenceLessons(this.#lessonManager, targetDir, threshold);
	}
}
