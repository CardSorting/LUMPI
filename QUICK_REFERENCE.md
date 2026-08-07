# LUMI Developer Quick Reference & Cheatsheet

Quick copy-pasteable reference for LUMI command-line flags, interactive TUI keyboard shortcuts, provider configurations, and extension usage.

---

## ⚡ 30-Second Launch Commands

```bash
# Launch interactive TUI session with environment keys intact
./lumi-test.sh

# Launch keyless evaluation mode (unsets API keys for setup verification)
./lumi-test.sh --no-env

# Execute non-interactive single-query print mode
npx tsx packages/coding-agent/src/cli.ts -p "Explain the monorepo package structure"
```

---

## ⌨️ TUI Keyboard Navigation Shortcuts

| Key Binding | Action | Context |
| :--- | :--- | :--- |
| **`Enter`** | Submit prompt or confirm active selection | All screens |
| **`Tab`** | Switch focus between input prompt and selection panels | Interactive TUI |
| **`Esc`** | Cancel active generation or dismiss modal overlay | Interactive TUI |
| **`Ctrl + O`** | Open session manager & chat history drawer | Session view |
| **`Ctrl + C`** | Interrupt current turn or exit application | All screens |
| **`Up / Down`** | Navigate list items or command history | Selection lists |

---

## 🔌 Multi-Provider Switch Commands

LUMI supports on-the-fly AI model provider switching:

```bash
# OpenAI Codex (Default)
lumpi --provider openai-codex --model gpt-5.6-luna

# Anthropic Claude
lumpi --provider anthropic --model claude-3.7-sonnet

# Google Gemini
lumpi --provider gemini --model gemini-2.5-pro

# OpenRouter Gateway
lumpi --provider openrouter --model anthropic/claude-3.7-sonnet

# Sovereign Local LLM (Ollama)
lumpi --provider ollama --model llama3.3:70b
```

---

## 🚀 Common Command Flags

| Flag | Full Form | Description |
| :--- | :--- | :--- |
| **`-p`** | `--prompt` | Runs LUMI in non-interactive print mode with specified prompt. |
| **`--extension`** | `--extension <path>` | Loads a custom extension or tool module from path. |
| **`--provider`** | `--provider <name>` | Sets active LLM provider (`openai-codex`, `anthropic`, `gemini`, `ollama`, `openrouter`). |
| **`--model`** | `--model <name>` | Sets target model name. |
| **`--no-env`** | `--no-env` | Clears host environment API keys for isolated setup testing. |

---

## 🛡️ Sandbox & Swarm Extension Launchers

```bash
# Launch with subagent swarm delegation extension
lumpi --extension packages/coding-agent/examples/extensions/subagent

# Launch with Gondolin Micro-VM isolation extension
lumpi --extension packages/coding-agent/examples/extensions/gondolin

# Launch custom metric query tool
lumpi --extension packages/coding-agent/examples/extensions/custom-tool
```

---

## 🔬 Monorepo Quality Gate Commands

```bash
# Run full monorepo quality gate (formatting, types, relative imports, shrinkwrap)
npm run check

# Run non-e2e unit and integration test suite
./test.sh

# Run reasoning benchmark evaluations
npm run eval
```
