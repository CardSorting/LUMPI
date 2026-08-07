import type { ThinkingLevel } from "@noorm/lumi-agent-core";
import type { ThinkingLevel as ApiThinkingLevel } from "@noorm/lumi-ai";

/** A persisted thinking preference may defer selection to the active model. */
export type ConfiguredThinkingLevel = ThinkingLevel | "auto";

export const AUTO_THINKING = "auto" as const;

export function concreteThinkingLevel(level: ConfiguredThinkingLevel | undefined): ThinkingLevel | undefined {
	return level === AUTO_THINKING ? undefined : level;
}

export function parseConfiguredThinkingLevel(value: unknown): ConfiguredThinkingLevel | undefined {
	if (value === AUTO_THINKING) return AUTO_THINKING;
	if (
		value === "off" ||
		value === "minimal" ||
		value === "low" ||
		value === "medium" ||
		value === "high" ||
		value === "xhigh" ||
		value === "max"
	) {
		return value;
	}
	return undefined;
}

export function toReasoningEffort(level: ThinkingLevel | undefined): ApiThinkingLevel | undefined {
	return level === undefined || level === "off" ? undefined : level;
}
