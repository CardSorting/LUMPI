export function formatTitleUserMessage(message: string): string {
	return `Summarize this first user message as a concise session title.\n\n${message.trim()}`;
}
