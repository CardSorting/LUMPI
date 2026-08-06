export interface CodemariePromptSteeringOptions {
	modEnabled?: boolean;
	cwd?: string;
}

export function getCodemarieSystemPromptOverlay(options: CodemariePromptSteeringOptions = {}): string {
	const lines: string[] = [];

	if (options.modEnabled) {
		lines.push(
			"## Mixture of Designers (MoD) Steering Active",
			"- Enforce rich aesthetics, curated color palettes, dark modes, glassmorphism, and micro-animations.",
			"- Deliver state-of-the-art UI/UX, responsive layouts, and zero placeholders.",
		);
	}

	return lines.join("\n");
}
