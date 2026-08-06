import { join } from "node:path";
import { getDocsPath } from "../config.ts";

const UNKNOWN_PROVIDER = "unknown";

export function getProviderLoginHelp(): string {
	return [
		"Configure a provider via /login or set an API key environment variable:",
		"  • OpenRouter:       OPENROUTER_API_KEY",
		"  • Google Gemini:    GEMINI_API_KEY",
		"  • Anthropic:        ANTHROPIC_API_KEY",
		"  • OpenAI / Codex:   OPENAI_API_KEY",
		"  • Cerebras:         CEREBRAS_API_KEY",
		"  • Cloudflare AI:    CLOUDFLARE_API_KEY",
		"  • Grok / XAI:       XAI_API_KEY",
		"  • Qwen Token Plan:  QWEN_API_KEY",
		"  • Z AI (GLM):       ZAI_API_KEY",
		"  • NousResearch:     NOUSRESEARCH_API_KEY",
		"  • ClinePass:        CLINEPASS_API_KEY (or CLINE_API_KEY)",
		"  • Ollama (Local):   OLLAMA_HOST",
		"",
		"For provider & model documentation, see:",
		`  ${join(getDocsPath(), "providers.md")}`,
		`  ${join(getDocsPath(), "models.md")}`,
	].join("\n");
}

export function formatNoModelsAvailableMessage(): string {
	return `No models available. ${getProviderLoginHelp()}`;
}

export function formatNoModelSelectedMessage(): string {
	return `No model selected.\n\n${getProviderLoginHelp()}\n\nThen use /model to select a model.`;
}

export function formatNoApiKeyFoundMessage(provider: string): string {
	const providerDisplay = provider === UNKNOWN_PROVIDER ? "the selected model" : provider;
	return `No API key found for ${providerDisplay}.\n\n${getProviderLoginHelp()}`;
}
