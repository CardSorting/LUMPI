export interface ThinkingBudgetConfig {
	minTokens: number;
	maxTokens: number;
	ultrathinkMultiplier: number;
}

export type ThinkingEffort = "low" | "medium" | "high" | "ultrathink";

export class AutoThinkingController {
	private config: ThinkingBudgetConfig;
	private currentEffort: ThinkingEffort;

	constructor(config?: Partial<ThinkingBudgetConfig>) {
		this.config = {
			minTokens: 1024,
			maxTokens: 32768,
			ultrathinkMultiplier: 2.5,
			...config,
		};
		this.currentEffort = "medium";
	}

	public getEffort(): ThinkingEffort {
		return this.currentEffort;
	}

	public setEffort(effort: ThinkingEffort): void {
		this.currentEffort = effort;
	}

	public computeBudget(promptText: string, isErrorRecovery: boolean = false): number {
		let baseTokens = this.config.minTokens;

		if (promptText.includes("ultrathink") || this.currentEffort === "ultrathink") {
			return Math.min(this.config.maxTokens, Math.round(baseTokens * 4 * this.config.ultrathinkMultiplier));
		}

		if (promptText.length > 2000 || isErrorRecovery || this.currentEffort === "high") {
			baseTokens *= 3;
		} else if (promptText.length > 500 || this.currentEffort === "medium") {
			baseTokens *= 2;
		}

		return Math.min(this.config.maxTokens, baseTokens);
	}
}
