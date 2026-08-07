export interface StreamRule {
	name: string;
	pattern: RegExp;
	reminder: string;
	severity: "warning" | "error" | "info";
}

export interface StreamMatch {
	rule: StreamRule;
	matchedText: string;
	index: number;
}

export class TTSRCoordinator {
	private rules: StreamRule[];
	private abortController: AbortController | null;
	private turnMessageCount: number;
	private matchHistory: StreamMatch[];

	constructor() {
		this.rules = [];
		this.abortController = null;
		this.turnMessageCount = 0;
		this.matchHistory = [];
		this.registerBuiltinRules();
	}

	public addRule(rule: StreamRule): void {
		this.rules.push(rule);
	}

	public removeRule(name: string): boolean {
		const initLen = this.rules.length;
		this.rules = this.rules.filter((r) => r.name !== name);
		return this.rules.length < initLen;
	}

	public startStream(): AbortSignal {
		this.abortController = new AbortController();
		this.turnMessageCount++;
		return this.abortController.signal;
	}

	public checkDelta(textChunk: string): StreamMatch | null {
		if (!textChunk) return null;

		for (const rule of this.rules) {
			rule.pattern.lastIndex = 0;
			const match = rule.pattern.exec(textChunk);
			if (match) {
				const streamMatch: StreamMatch = {
					rule,
					matchedText: match[0],
					index: match.index,
				};
				this.matchHistory.push(streamMatch);
				return streamMatch;
			}
		}
		return null;
	}

	public triggerAbort(reason?: string): void {
		if (this.abortController && !this.abortController.signal.aborted) {
			this.abortController.abort(reason || "TTSR stream rule violation");
		}
	}

	public buildSystemReminderPrompt(match: StreamMatch): string {
		return [
			`[TTSR RULE INTERCEPTION: ${match.rule.name}]`,
			`Warning: The assistant generation was aborted mid-stream because it violated active workspace stream rule '${match.rule.name}'.`,
			`Matched output snippet: "${match.matchedText}"`,
			`Guidance / Constraint: ${match.rule.reminder}`,
			`Please course-correct immediately and continue without violating this rule.`,
		].join("\n");
	}

	public getMatchHistory(): readonly StreamMatch[] {
		return this.matchHistory;
	}

	public clearHistory(): void {
		this.matchHistory = [];
	}

	private registerBuiltinRules(): void {
		this.rules.push({
			name: "box-leak-prevention",
			pattern: /Box::leak\(/g,
			reminder: "Do not use Box::leak in production code paths. Use Arc<T> or explicit lifetime references.",
			severity: "error",
		});
		this.rules.push({
			name: "any-type-prevention",
			pattern: /:\s*any\b/g,
			reminder: "Avoid using the explicit 'any' type in TypeScript. Provide specific interface types or generics.",
			severity: "warning",
		});
		this.rules.push({
			name: "hardcoded-secret-prevention",
			pattern: /(?:api[_-]?key|secret|password)\s*[:=]\s*["'][A-Za-z0-9_-]{16,}["']/gi,
			reminder: "Do not embed hardcoded API keys or secrets in source code. Access them via environment variables.",
			severity: "error",
		});
	}
}
