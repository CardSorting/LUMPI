# Autonomous AI Agent & Subagent Onboarding Guide

> **Target Audience**: Autonomous Coding Agents, Subagents, LLM Pair Programmers, and Automated Tool Callers operating within the **LUMI** (`@noorm/lumpi`) codebase.

---

## 🎯 Purpose & Core Directives

This document provides a deterministic, zero-ambiguity operational protocol for AI agents inspecting, modifying, testing, or contributing to the LUMI engine.

As an AI agent operating in this codebase, you MUST adhere to the structural invariants and quality gates documented below.

---

## ⚡ 60-Second Agent Scoping Checklist

Before executing code modifications or making architectural decisions, perform this fast discovery sequence:

```
┌─────────────────────────────────────────────────────────────────────────────┐
## 60-SECOND AGENT DISCOVERY & VERIFICATION PROTOCOL
├─────────────────────────────────────────────────────────────────────────────┤
│  Step 1: Read Workspace Rules       --> Inspect `.agents/AGENTS.md`         │
│  Step 2: Check Active Skills        --> View `.agents/skills/*/SKILL.md`   │
│  Step 3: Run Baseline Quality Gate  --> Execute `npm run check`             │
│  Step 4: Verify Native Rust Engine  --> Run `cargo check` in `crates/pi-natives`│
│  Step 5: Verify Single-Host Worker  --> Run `bun .../cli.ts --smoke-test`   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🛡️ Structural Invariants & Code Standards

Every agent turn MUST enforce the following constraints without exception:

### 1. Erasable TypeScript Syntax (Node Strip-Only Mode)
- **NO `enum` declarations**: Use union of string literals (`type Mode = "fast" | "full";`) or `as const` object maps.
- **NO `namespace` or `module` blocks**: Use standard ES module exports.
- **NO parameter properties in constructors**: Explicitly declare fields and assign them inside constructors.
- **NO `import =` or `export =` syntax**: Use standard ES module `import`/`export`.

### 2. Import Rules & Module Integrity
- **Top-Level Imports Only**: Dynamic inline imports (`await import(...)`, `import("pkg").Type`) are **strictly prohibited**.
- **Relative Node16 Imports**: Explicitly specify relative import specifiers with appropriate extensions where required by root config.

### 3. Substrate & Memory Invariants (`packages/broccolidb`)
- **Zero-GC Compliance**: All hot execution paths in `broccolidb` and `mnemopi-broccolidb` MUST use pre-allocated slab arenas (`ArenaAllocator`).
- **NO Heap Bloat**: Avoid instantiating dynamic object allocations or closures inside hot loop turns.

### 4. Supply Chain & Dependency Protection
- **Lockfile Enforcement**: Never modify lockfiles directly unless `PI_ALLOW_LOCKFILE_CHANGE=1` is explicitly set.
- **Ignore Lifecycle Scripts**: Always run package installations using `npm install --ignore-scripts`.

---

## 🔍 Native Search & High-Precision Editing Tools

When navigating or modifying code, prioritize LUMI's Zenith Tier native tools:

| Task / Operation | Legacy Approach | **Recommended Agent Tool / Crate** |
| :--- | :--- | :--- |
| **Workspace File Walking** | V8 JS recursive `fs.readdir` | **Rust `pi-walker` (`crates/pi-natives`)** |
| **High-Velocity Text Search** | JS regex scanning | **Rust `Ripgrep` (`crates/pi-natives`)** |
| **Structural AST Search** | String substring match | **Rust `ast-grep` (`crates/pi-natives`)** |
| **Line-Anchored File Patching**| Search/replace string replace | **`@oh-my-pi/hashline` (xxHash line deltas)** |
| **Cross-Session Memory** | Context window repetition | **`mnemopi-broccolidb` Memory Substrate** |
| **Continuous Learning** | Static system prompt | **`autolearn` Harness & Skill Discovery** |

---

## 🧪 Mandatory Verification Commands

After making code changes (not documentation edits), you MUST run the verification suite:

```bash
# 1. Full Monorepo Quality Gate (Biome check, types, shrinkwrap, imports)
npm run check

# 2. Native Rust Crate Compilation Check
cargo check --manifest-path crates/pi-natives/Cargo.toml

# 3. Single-Host Worker Inbox Smoke Probe
bun packages/coding-agent/src/cli.ts --smoke-test

# 4. Non-e2e Test Suite
./test.sh
```

---

## 🤖 Agentic Git Commit & Swarm Workflows

### 1. Agentic Git Commit Generation
When tasked with committing code changes, execute the multi-phase map-reduce commit pipeline:

```bash
npx tsx packages/coding-agent/src/commit/cli.ts --agentic
```

### 2. Updating Workspace Playbooks & Lessons
### 3. Parent Agent & Host Orchestration
If you are a parent agent or external orchestrator invoking LUMI as a subagent or worker daemon, refer to the [Agent-to-Agent Host Integration & Interoperability Protocol](AGENT_HOST_INTEROPERABILITY.md) for JSON-RPC 2.0 frames, streaming callbacks, and subagent swarm topologies.

---

## 📚 Related References

- 🛰️ [Agent-to-Agent Host Interoperability Protocol](AGENT_HOST_INTEROPERABILITY.md)
- 🛰️ [RPC Protocol Specification](RPC_PROTOCOL_SPEC.md)
- 🛠️ [Developer Field Guide](../DEVELOPMENT.md)
- 📜 [Contributor Quality Standards](../CONTRIBUTING.md)
- 🏢 [Enterprise Adoption Guide](ADOPTION_GUIDE.md)
- 🗺️ [Architecture & Topology Catalog](DIAGRAMS.md)
