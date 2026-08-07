export interface LearnedLesson {
	id: string;
	title: string;
	context: string;
	takeaway: string;
	confidence: number;
	category: string;
	tags?: string[];
}

export interface DiscoveredSkill {
	name: string;
	description: string;
	path: string;
	content: string;
	scope?: "project" | "user" | "global";
}

export interface SkillValidationResult {
	valid: boolean;
	errors: string[];
}

export interface AutoLearnStateSnapshot {
	version: number;
	lessons: LearnedLesson[];
}
