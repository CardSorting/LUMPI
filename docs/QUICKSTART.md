# Detailed Developer Quickstart Guide

This guide walks you through setting up and running **LUMI** across various operating environments (Node.js, Bun, Docker, devcontainers).

---

## 📋 System Prerequisites

Ensure your host environment meets the minimum requirements:

- **Node.js**: `>= 22.19.0`
- **npm**: `>= 10.0.0`
- **Git**: `>= 2.30.0`
- *(Optional)* **Bun**: `>= 1.1.0` (for Bun binary execution)
- *(Optional)* **Docker**: `>= 24.0.0` (for container sandboxing)

---

## 🖥️ Platform Compatibility Matrix

| Operating System | Recommended Setup | Terminal Shell | Script Launcher |
| :--- | :--- | :--- | :--- |
| **macOS (Apple Silicon / Intel)** | Native Node.js / Bun | `zsh` / `bash` | `./lumi-test.sh` |
| **Linux (Ubuntu / Debian / RHEL)** | Native Node.js / Docker | `bash` | `./lumi-test.sh` |
| **Windows (WSL2)** | Native Node.js in WSL | `bash` | `./lumi-test.sh` |
| **Windows (Native PowerShell)** | Native Node.js | PowerShell | `.\pi-test.ps1` or `.\pi-test.bat` |

---

## ⚡ Option 1: Native Node.js Setup (Recommended)

### 1. Clone the Repository

```bash
git clone https://github.com/CardSorting/LUMPI.git
cd LUMPI
```

### 2. Install Dependencies

Always install dependencies with `--ignore-scripts` to prevent running untrusted post-install scripts:

```bash
npm install --ignore-scripts
```

### 3. Verify Quality Gate & Native Worker Probe

Run the monorepo verification gate and native worker probe:

```bash
# 1. Run typescript, linter, and shrinkwrap quality check
npm run check

# 2. Verify native Rust crate compilation
cargo check --manifest-path crates/pi-natives/Cargo.toml

# 3. Run single-host worker host architecture smoke probe
bun packages/coding-agent/src/cli.ts --smoke-test
```

### 4. Configure Provider API Keys

Export your provider API key in your terminal shell:

```bash
# macOS / Linux (bash/zsh)
export OPENAI_API_KEY="sk-proj-..."
export ANTHROPIC_API_KEY="sk-ant-..."
export GEMINI_API_KEY="AIzaSy..."

# Windows (PowerShell)
$env:OPENAI_API_KEY="sk-proj-..."
$env:ANTHROPIC_API_KEY="sk-ant-..."
$env:GEMINI_API_KEY="AIzaSy..."
```

### 5. Launch Interactive LUMI TUI

```bash
# macOS / Linux / WSL
./lumi-test.sh

# Windows PowerShell
.\pi-test.ps1
```

---

## ⚡ Option 2: Bun Binary Execution & Worker Host

If you prefer using Bun for fast startup execution:

```bash
# Verify worker host probe
bun packages/coding-agent/src/cli.ts --smoke-test

# Launch CLI directly via Bun
bun run packages/coding-agent/src/cli.ts
```

---

## ⚡ Option 3: Local Sovereign Execution with Ollama

Run fully offline agent turns without sending data to external APIs:

```bash
# 1. Install & start Ollama locally
ollama pull llama3.3:70b

# 2. Launch LUMI using Ollama provider
npx tsx packages/coding-agent/src/cli.ts --provider ollama --model llama3.3:70b -p "Explain the monorepo structure"
```

---

## ⚡ Option 4: Isolated Micro-VM Sandboxing (Gondolin)

To run tool execution inside a local Linux micro-VM container:

```bash
# Launch LUMI with Gondolin extension
npx tsx packages/coding-agent/src/cli.ts --extension packages/coding-agent/examples/extensions/gondolin
```

---

## ⚡ Option 5: Agentic Git Commit & Conventional Changelog Engine

To analyze staged changes, topographically isolate dependencies, and auto-generate conventional commits with changelogs:

```bash
# Run multi-phase agentic commit pipeline
npx tsx packages/coding-agent/src/commit/cli.ts --agentic
```

---

## ⚡ Option 6: Autonomous Auto-Learning & Dynamic Skill Discovery

Enable continuous agent self-improvement to discover workspace skills, record lessons from code modifications, and synthesize reusable agent playbooks:

```bash
# Launch interactive turn with autolearn harness enabled
npx tsx packages/coding-agent/src/cli.ts --autolearn -p "Audit codebase and synthesize lessons"
```

---

## 🔍 Troubleshooting & Onboarding Resources

If you encounter setup issues:

1. Refer to [FAQ & Friction Resolution Guide](FAQ.md) for quick solutions.
2. Review [Enterprise Adoption Guide](ADOPTION_GUIDE.md) for rollout playbooks.
3. Check [TROUBLESHOOTING.md](../TROUBLESHOOTING.md) for detailed error resolutions.
4. Run non-e2e test suite:
   ```bash
   ./test.sh
   ```
5. Join the developer community on [Discord](https://discord.com/invite/nKXTsAcmbT) for support.
