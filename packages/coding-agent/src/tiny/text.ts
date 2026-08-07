const LOW_SIGNAL_INPUTS = new Set(["hi", "hello", "hey", "thanks", "thank you", "ok", "okay"]);

export function isLowSignalTitleInput(input: string): boolean {
	const normalized = input
		.trim()
		.toLowerCase()
		.replace(/[.!?]+$/u, "");
	return normalized.length === 0 || LOW_SIGNAL_INPUTS.has(normalized);
}

export function normalizeGeneratedTitle(title: string, fallbackInput: string): string | null {
	const normalized = title
		.replace(/<title>|<\/title>/gi, "")
		.replace(/\s+/gu, " ")
		.trim()
		.replace(/[.!?]+$/u, "");
	if (normalized.length > 0) return normalized.slice(0, 120);
	const fallback = fallbackInput.trim().replace(/\s+/gu, " ");
	return fallback.length > 0 ? fallback.slice(0, 120) : null;
}
