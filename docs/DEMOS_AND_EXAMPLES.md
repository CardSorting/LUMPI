# LUMI Demos & Example Recipes Gallery

This document provides a comprehensive gallery of copy-pasteable execution recipes demonstrating **LUMI** across common engineering tasks, enterprise workflows, and developer scenarios.

---

## ⚡ Quick Recipe Directory

- [Recipe 1: Non-Interactive Codebase Audit](#recipe-1-non-interactive-codebase-audit)
- [Recipe 2: Autonomous Unit Test Generation](#recipe-2-autonomous-unit-test-generation)
- [Recipe 3: Local Sovereign Execution with Ollama](#recipe-3-local-sovereign-execution-with-ollama)
- [Recipe 4: Subagent Swarm Delegation](#recipe-4-subagent-swarm-delegation)
- [Recipe 5: Isolated Micro-VM Tool Execution (Gondolin)](#recipe-5-isolated-micro-vm-tool-execution-gondolin)
- [Recipe 6: Keyless Evaluation Setup Testing](#recipe-6-keyless-evaluation-setup-testing)
- [Recipe 7: Custom Model Gateway Override](#recipe-7-custom-model-gateway-override)
- [Recipe 8: Headless JSON-RPC Daemon Server](#recipe-8-headless-json-rpc-daemon-server)
- [Recipe 9: Custom Extension Tool Registration](#recipe-9-custom-extension-tool-registration)
- [Recipe 10: Monorepo Quality Gate Verification](#recipe-10-monorepo-quality-gate-verification)
- [Recipe 11: Agentic Commit & Conventional Changelog Pipeline](#recipe-11-agentic-commit--conventional-changelog-pipeline)
- [Recipe 12: Autonomous Auto-Learning & Workspace Skill Discovery](#recipe-12-autonomous-auto-learning--workspace-skill-discovery)
- [Recipe 13: High-Precision Line Delta Patching](#recipe-13-high-precision-line-delta-patching)

---

## Recipe 1: Non-Interactive Codebase Audit

Execute a non-interactive audit pass over workspace packages and save findings to a Markdown report:

```bash
# Execute print mode audit turn
npx tsx packages/coding-agent/src/cli.ts \
  -p "Audit packages/broccolidb for memory allocation hotspots and summarize findings" \
  > audit-report.md
```

---

## Recipe 2: Autonomous Unit Test Generation

Generate regression unit test suites conforming to erasable TypeScript syntax:

```bash
# Run test generation command
npx tsx packages/coding-agent/src/cli.ts \
  -p "Create unit tests for packages/agent/src/cas.ts covering content-addressable storage hashing and store failures"
```

---

## Recipe 3: Local Sovereign Execution with Ollama

Run fully offline agent turns without transmitting code to third-party endpoints:

```bash
# 1. Start local Ollama model instance
ollama pull llama3.3:70b

# 2. Execute LUMI turn using local provider gateway
npx tsx packages/coding-agent/src/cli.ts \
  --provider ollama \
  --model llama3.3:70b \
  -p "Refactor packages/protocol/src/codecs.ts to optimize JSON-RPC serialization"
```

---

## Recipe 4: Subagent Swarm Delegation

Delegate complex multi-file engineering tasks to subagent swarms with isolated context windows:

```bash
# Execute subagent delegation extension
npx tsx packages/coding-agent/src/cli.ts \
  --extension packages/coding-agent/examples/extensions/subagent \
  -p "Decompose monorepo package graph and audit dependency cycles"
```

---

## Recipe 5: Isolated Micro-VM Tool Execution (Gondolin)

Isolate shell command and tool execution inside a local Linux micro-VM container:

```bash
# Run with Gondolin micro-VM extension enabled
npx tsx packages/coding-agent/src/cli.ts \
  --extension packages/coding-agent/examples/extensions/gondolin
```

---

## Recipe 6: Keyless Evaluation Setup Testing

Test local terminal rendering and CLI interaction without exporting API provider keys:

```bash
# Launch keyless evaluation environment
./pi-test.sh --no-env
```

---

## Recipe 7: Custom Model Gateway Override

Route inference requests to alternative model provider gateways:

```bash
# Export alternative provider API key
export ANTHROPIC_API_KEY="sk-ant-..."

# Launch LUMI targeting Anthropic Claude 3.7 Sonnet
npx tsx packages/coding-agent/src/cli.ts \
  --provider anthropic \
  --model claude-3.7-sonnet
```

---

## Recipe 8: Headless JSON-RPC Daemon Server

Start LUMI in multi-tenant RPC daemon mode for IDE or web integrations:

```bash
# Start JSON-RPC 2.0 daemon on localhost IPC socket
npx tsx packages/server/src/index.ts --port 8080
```

---

## Recipe 9: Custom Extension Tool Registration

Register custom tools dynamically via TypeScript extension modules:

```typescript
// example-extension.ts
import { createExtension } from "@noorm/lumpi-coding-agent";

export default createExtension({
  name: "workspace-health-checker",
  setup(ctx) {
    ctx.registerTool({
      name: "check_health",
      description: "Checks local workspace health metrics",
      async execute() {
        return { status: "healthy", timestamp: Date.now() };
      },
    });
  },
});
```

Execute LUMI with the extension loaded:
```bash
npx tsx packages/coding-agent/src/cli.ts --extension ./example-extension.ts
```

---

## Recipe 10: Monorepo Quality Gate Verification

Validate code quality, style, types, pinned dependencies, and shrinkwrap integrity:

```bash
# Execute full quality gate
npm run check

# Run non-e2e test suite
./test.sh
```

---

## Recipe 11: Agentic Commit & Conventional Changelog Pipeline

Analyze staged diffs using a multi-phase map-reduce pipeline, sort hunk dependencies topographically, and auto-generate conventional commits with changelog updates:

```bash
# Execute agentic commit analysis and conventional commit generation
npx tsx packages/coding-agent/src/commit/cli.ts --agentic
```

---

## Recipe 12: Autonomous Auto-Learning & Workspace Skill Discovery

Enable continuous agent self-improvement to discover project skills, manage lessons from code modifications, and synthesize reusable workspace skill modules:

```bash
# Launch interactive turn with autolearn harness enabled
npx tsx packages/coding-agent/src/cli.ts --autolearn -p "Audit error handlers and log workspace lessons"
```

---

## Recipe 13: High-Precision Line Delta Patching

Apply precise, line-anchored checksum edits using xxHash line deltas (`@oh-my-pi/hashline`) to guarantee zero-drift file patching:

```bash
# Execute exact hashline tool patch on a target codebase file
npx tsx packages/coding-agent/src/cli.ts -p "Update server request validator using exact hashline deltas"
```

---

## 📚 Related Documentation

- ⚡ [Quickstart Guide](QUICKSTART.md)
- 🏢 [Enterprise Adoption Guide](ADOPTION_GUIDE.md)
- 🔌 [Extensions Tutorial](EXTENSIONS_GUIDE.md)
- ⌨️ [CLI & TUI Cheatsheet](../QUICK_REFERENCE.md)
