# Frequently Asked Questions (FAQ) & Friction Resolution Guide

This document resolves common operational, architectural, and security questions regarding **LUMI**.

---

## ⚡ Quick Navigation

- [1. Installation & Environment](#1-installation--environment)
- [2. Model Providers & API Keys](#2-model-providers--api-keys)
- [3. Terminal UI & Navigation Keybindings](#3-terminal-ui--navigation-keybindings)
- [4. Security, Isolation & Telemetry](#4-security-isolation--telemetry)
- [5. Substrate Memory & Architecture](#5-substrate-memory--architecture)
- [6. Headless Automation & CI/CD](#6-headless-automation--cicd)
- [7. Zenith Engines, Auto-Learning & Commit Subsystem](#7-zenith-engines-auto-learning--commit-subsystem)

---

## 1. Installation & Environment

### Q: Why is `npm install --ignore-scripts` required?
To enforce enterprise supply-chain security. Lifecycle post-install scripts can execute arbitrary binaries on the developer host. Running `--ignore-scripts` ensures external dependencies are installed as inert data without executing un-audited code.

### Q: Can I run LUMI using Bun instead of Node.js?
Yes. LUMI supports Bun execution out of the box:
```bash
bun run packages/coding-agent/src/cli.ts
```

### Q: What operating systems are supported?
LUMI natively supports macOS, Linux, and Windows (via WSL2 or PowerShell).

---

## 2. Model Providers & API Keys

### Q: Which LLM providers are supported natively?
LUMI supports over 12 native providers, including:
- **OpenAI** (`gpt-4o`, `gpt-5.6-luna`, `codex`)
- **Anthropic** (`claude-3-5-sonnet`, `claude-3-7-sonnet`)
- **Google Gemini** (`gemini-2.5-pro`, `gemini-3.6-flash`)
- **Ollama / vLLM** (Local open-weights: `llama3.3:70b`, `qwen2.5-coder`)
- Custom OpenAI-compatible enterprise gateways.

### Q: How do I test setup without setting API keys?
Launch LUMI in keyless evaluation mode:
```bash
./pi-test.sh --no-env
```

---

## 3. Terminal UI & Navigation Keybindings

### Q: How do I change default keyboard shortcuts?
Keybindings are fully configurable via default binding registries (`DEFAULT_EDITOR_KEYBINDINGS` and `DEFAULT_APP_KEYBINDINGS`). Never hardcode key checks in code; update registry defaults instead.

### Q: Common Interactive TUI Keyboard Shortcuts:

| Action | Keyboard Shortcut |
| :--- | :--- |
| **Submit Prompt** | `Enter` |
| **Multiline Line Break** | `Shift + Enter` or `Alt + Enter` |
| **Switch Active UI Panel** | `Tab` |
| **Cancel Turn / Close Modal** | `Esc` |
| **Open Session Manager** | `Ctrl + O` |
| **Scroll Buffer Up / Down** | `PageUp` / `PageDown` |

---

## 4. Security, Isolation & Telemetry

### Q: Does LUMI send telemetry or code snippets to remote servers?
No. LUMI operates with zero default telemetry. Code snippets, tool actions, and repository metadata remain local to your process unless explicitly routed to your configured provider endpoint.

### Q: How do I isolate tool execution from my local filesystem?
Enable the Gondolin Micro-VM extension to execute shell tools inside a lightweight Linux micro-VM container:
```bash
pi --extension packages/coding-agent/examples/extensions/gondolin
```

---

## 5. Substrate Memory & Architecture

### Q: What is BroccoliDB and why is it zero-GC?
`BroccoliDB` (`@noorm/broccolidb`) is an in-memory high-throughput state substrate that allocates memory in pre-sized 16MB slab arenas. By reusing pre-allocated slab blocks instead of creating transient JS objects during execution turns, BroccoliDB eliminates Garbage Collection (GC) pauses during active TUI streaming.

### Q: What are the native Rust crate bindings (`crates/pi-natives`)?
`crates/pi-natives` is a Rust 1.99 Nightly native crate compiled into the N-API addon `pi_natives.darwin-arm64.node`. It provides parallel directory walking (`pi-walker`), sub-millisecond Ripgrep text search, `ast-grep`, Sixel image encoding, POSIX advisory `file_lock`, and transcript compaction (`snapcompact`).

### Q: How do I test the single-host worker host architecture?
Run the built-in worker host smoke probe:
```bash
bun packages/coding-agent/src/cli.ts --smoke-test
```
This tests `installWorkerInbox()` and `consumeWorkerInbox()` to verify 0% message-drop rates during Bun worker thread initialization.

### Q: How are reasoning thinking effort levels managed?
`@oh-my-pi/pi-catalog` pre-clamps thinking budgets across Anthropic adaptive, Gemini 3, OpenAI o-series, Kimi K3, and GLM-5.2 to eliminate un-clamped thinking effort API payload rejections.

---

## 6. Headless Automation & CI/CD

### Q: How do I run LUMI headlessly inside GitHub Actions or CI/CD?
Use non-interactive print mode (`-p` flag):
```bash
npx tsx packages/coding-agent/src/cli.ts -p "Audit repository for security vulnerabilities and format results as Markdown"
```

---

## 7. Zenith Engines, Auto-Learning & Commit Subsystem

### Q: What is the `autolearn` continuous self-improvement harness?
The `autolearn` module (`src/core/harness/autolearn`) continuously monitors code edits during agent turns, discovers workspace conventions, logs lessons learned, synthesizes skill modules, and persists knowledge into `.agents/skills` across sessions.

### Q: How does `@oh-my-pi/hashline` prevent file patching errors?
`@oh-my-pi/hashline` computes xxHash line-level checksums for every line in modified files. Instead of relying on ambiguous fuzzy line matches or search-and-replace strings, Hashes verify line anchors before applying edits, ensuring zero line-drift corruption.

### Q: How does the agentic git commit pipeline analyze diffs?
The agentic commit pipeline (`src/commit/agentic`) uses a multi-phase map-reduce model to inspect staged hunks, topographically sort file dependencies, categorize conventional commit scopes, and auto-generate changelog entries (`packages/coding-agent/src/commit/cli.ts --agentic`).

---

## 📚 Related Guides

- 💼 [Executive Brief](EXECUTIVE_BRIEF.md)
- 🚀 [Quickstart Guide](QUICKSTART.md)
- 🛡️ [Security & Air-Gap Guide](SECURITY_AND_AIRGAP.md)
- 🔌 [Extensions Tutorial](EXTENSIONS_GUIDE.md)
