import { Container, getKeybindings, Spacer, Text } from "@earendil-works/pi-tui";
import { APP_NAME } from "../../../config.ts";
import { type TerminalTheme, theme } from "../theme/theme.ts";
import { DynamicBorder } from "./dynamic-border.ts";
import { keyHint, rawKeyHint } from "./keybinding-hints.ts";

export interface FirstTimeSetupResult {
	theme: TerminalTheme;
	defaultProvider?: string;
	shareAnalytics: boolean;
}

export interface FirstTimeSetupOptions {
	detectedTheme: TerminalTheme;
	onThemePreview: (themeName: TerminalTheme) => void;
	onSubmit: (result: FirstTimeSetupResult) => void;
	onCancel: () => void;
}

const PROVIDER_OPTIONS: Array<{ value: string; label: string; envVar: string }> = [
	{
		value: "openai-codex",
		label: "ChatGPT Subscription / OpenAI Codex (gpt-5.6-luna) - Default",
		envVar: "OPENAI_API_KEY",
	},
	{ value: "openrouter", label: "OpenRouter", envVar: "OPENROUTER_API_KEY" },
	{ value: "google", label: "Google Gemini", envVar: "GEMINI_API_KEY" },
	{ value: "anthropic", label: "Anthropic Claude", envVar: "ANTHROPIC_API_KEY" },
	{ value: "cerebras", label: "Cerebras", envVar: "CEREBRAS_API_KEY" },
	{ value: "cloudflare-workers-ai", label: "Cloudflare Workers AI", envVar: "CLOUDFLARE_API_KEY" },
	{ value: "xai", label: "Grok / XAI", envVar: "XAI_API_KEY" },
	{ value: "qwen-token-plan", label: "Qwen Token Plan", envVar: "QWEN_API_KEY" },
	{ value: "zai", label: "Z AI (GLM)", envVar: "ZAI_API_KEY" },
	{ value: "nousResearch", label: "NousResearch", envVar: "NOUSRESEARCH_API_KEY" },
	{ value: "cline-pass", label: "ClinePass", envVar: "CLINEPASS_API_KEY" },
	{ value: "ollama", label: "Ollama (Local Server)", envVar: "OLLAMA_HOST" },
];

const SETUP_LOGO_LINES = [
	"██╗      ██╗   ██╗ ███╗   ███╗ ██╗",
	"██║      ██║   ██║ ████╗ ████║ ██║",
	"██║      ██║   ██║ ██╔████╔██║ ██║",
	"██║      ██║   ██║ ██║╚██╔╝██║ ██║",
	"███████╗ ╚██████╔╝ ██║ ╚═╝ ██║ ██║",
	"╚══════╝  ╚═════╝  ╚═╝     ╚═╝ ╚═╝",
];

function detectDefaultProviderIndex(): number {
	for (let i = 0; i < PROVIDER_OPTIONS.length; i++) {
		if (process.env[PROVIDER_OPTIONS[i].envVar]) {
			return i;
		}
	}
	return 0; // Default: openai-codex
}

/** Single-screen quick setup dialog. */
export class FirstTimeSetupComponent extends Container {
	private themeValue: TerminalTheme;
	private providerIndex: number;
	private readonly options: FirstTimeSetupOptions;

	constructor(options: FirstTimeSetupOptions) {
		super();
		this.options = options;
		this.themeValue = options.detectedTheme;
		this.providerIndex = detectDefaultProviderIndex();
		this.update();
	}

	private update(): void {
		this.clear();
		this.addChild(new DynamicBorder());
		this.addChild(new Spacer(1));
		this.addChild(new Text(theme.fg("accent", SETUP_LOGO_LINES.join("\n")), 1, 0));
		this.addChild(new Spacer(1));
		this.addChild(
			new Text(theme.fg("accent", theme.bold(`Welcome to ${APP_NAME}, the high-velocity agentic AI engine.`)), 1, 0),
		);
		this.addChild(new Spacer(1));

		const activeProvider = PROVIDER_OPTIONS[this.providerIndex];
		const hasKey = Boolean(process.env[activeProvider.envVar]);
		const statusText = hasKey ? "Environment Key Detected ✓" : "Ready (OAuth / Env Setup)";

		// Render Active Selection Status Box
		this.addChild(new Text(theme.fg("accent", "┌── Active Selection ──────────────────────────────────────┐"), 1, 0));
		this.addChild(new Text(theme.fg("text", `│ Provider: ${activeProvider.label.padEnd(44)} │`), 1, 0));
		this.addChild(new Text(theme.fg("muted", `│ Status:   ${statusText.padEnd(44)} │`), 1, 0));
		this.addChild(new Text(theme.fg("accent", "└──────────────────────────────────────────────────────────┘"), 1, 0));
		this.addChild(new Spacer(1));

		this.addChild(new Text(theme.fg("text", theme.bold("Select Primary AI Provider:")), 1, 0));
		this.addChild(new Spacer(1));

		for (let i = 0; i < PROVIDER_OPTIONS.length; i++) {
			const isSelected = i === this.providerIndex;
			const keyBadge = process.env[PROVIDER_OPTIONS[i].envVar] ? theme.fg("accent", " [Key Set ✓]") : "";
			const prefix = isSelected ? theme.fg("accent", "→ ") : "  ";
			const label = isSelected
				? theme.fg("accent", `${PROVIDER_OPTIONS[i].label}${keyBadge}`)
				: theme.fg("text", `${PROVIDER_OPTIONS[i].label}${keyBadge}`);
			this.addChild(new Text(`${prefix}${label}`, 1, 0));
		}

		this.addChild(new Spacer(1));

		// Render Engine Capabilities Badge Box
		this.addChild(new Text(theme.fg("accent", "┌── Engine Capabilities ───────────────────────────────────┐"), 1, 0));
		this.addChild(new Text(theme.fg("muted", "│  Work-Stealing Swarm Engine   SQLite Policy Guard        │"), 1, 0));
		this.addChild(new Text(theme.fg("muted", "│  Zero-GC Slab Arena Memory    MoD Steering & Compaction  │"), 1, 0));
		this.addChild(new Text(theme.fg("accent", "└──────────────────────────────────────────────────────────┘"), 1, 0));

		this.addChild(new Spacer(1));
		this.addChild(
			new Text(
				rawKeyHint("↑↓", "navigate") +
					"  " +
					keyHint("tui.select.confirm", "Start Coding (Enter)") +
					"  " +
					keyHint("tui.select.cancel", "Skip"),
				1,
				0,
			),
		);
		this.addChild(new Spacer(1));
		this.addChild(new DynamicBorder());
	}

	private moveSelection(delta: number): void {
		this.providerIndex = (this.providerIndex + delta + PROVIDER_OPTIONS.length) % PROVIDER_OPTIONS.length;
		this.update();
	}

	handleInput(keyData: string): void {
		const kb = getKeybindings();
		if (kb.matches(keyData, "tui.select.up") || keyData === "k") {
			this.moveSelection(-1);
		} else if (kb.matches(keyData, "tui.select.down") || keyData === "j") {
			this.moveSelection(1);
		} else if (kb.matches(keyData, "tui.select.confirm") || keyData === "\n") {
			this.options.onSubmit({
				theme: this.themeValue,
				defaultProvider: PROVIDER_OPTIONS[this.providerIndex].value,
				shareAnalytics: false,
			});
		} else if (kb.matches(keyData, "tui.select.cancel")) {
			this.options.onCancel();
		}
	}
}
