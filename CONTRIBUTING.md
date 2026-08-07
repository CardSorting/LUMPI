# Contributing to LUMI

Thank you for your interest in contributing to **LUMI**! This guide exists to streamline the onboarding experience for engine contributors while maintaining high code quality and architectural integrity across the monorepo.

---

## 🧭 Philosophy & Architecture Core

First things first: **LUMI's core is minimal and extensible**.

LUMI is structured around an event-driven architecture that keeps the execution core lean while enabling rich extensibility through extensions, custom tools, and subagents:

- **Core Engine (`@noorm/lumpi-agent-core`)**: Enforces state machine transitions, CAS history tracking, and prompt assembly.
- **Host Integration (`@noorm/lumpi-codemarie`)**: Merges host workspace navigation, environment variables, window state, and diff clients.
- **Substrate Storage (`@noorm/broccolidb`)**: Provides high-throughput 16MB zero-GC slab memory allocation.
- **Multi-LLM Gateway (`@noorm/lumpi-ai`)**: Routes inference requests across OpenAI Codex, Anthropic Claude, Gemini, and local providers.
- **Terminal UI (`@noorm/lumpi-tui`)**: Renders differential terminal screen buffers at sub-16ms latencies.

If your proposed feature does not belong in the core, it should be built as an **extension**. PRs that add unneeded complexity to the core will be rejected.

---

## ⚡ Quick Contributor Onboarding

### 1. Repository Setup

```bash
# Clone the repository
git clone https://github.com/CardSorting/LUMPI.git
cd LUMPI

# Install all workspace dependencies without running untrusted post-install scripts
npm install --ignore-scripts
```

### 2. Verify Local Build & Test Harness

```bash
# Run full monorepo quality gate (formatting, types, imports, shrinkwrap)
npm run check

# Run non-e2e test suite from repository root
./test.sh
```

---

## 📜 The Golden Rule

**You must understand your code.** If you cannot explain what your changes do and how they interact with the rest of the system, your PR will be closed.

Using AI coding assistants is fine. Submitting un-reviewed AI-generated slop without understanding it is not.

If you use an agent to develop changes in this repository, run it from the workspace root directory so it automatically picks up the [`AGENTS.md`](AGENTS.md) project guidelines.

---

## 🛡️ Contribution Gate & Maintainer Triage

To protect maintainer bandwidth and prevent tracker spam, LUMI enforces an automated contribution triage workflow:

```
┌─────────────────────────────────────────────────────────────────────────────┐
## PULL REQUEST & ISSUE TRIAGE FLOWCHART
├─────────────────────────────────────────────────────────────────────────────┤
│  1. Submission by Contributor                                               │
│     └─ New issue or PR created ──► Auto-closed by Bot (Triage Buffer)       │
│                                                                             │
│  2. Maintainer Review & Triage                                              │
│     ├─ Maintainer posts `lgtmi` ──► Issues auto-approved for contributor    │
│     └─ Maintainer posts `lgtm`  ──► Issues & PRs approved for contributor   │
│                                                                             │
│  3. Quality Gate Verification                                               │
│     └─ Run `npm run check` & `./test.sh` ──► CI Green ──► Merged into main  │
└─────────────────────────────────────────────────────────────────────────────┘
```

1. **Auto-Closed by Default**: All issues and PRs from new contributors are automatically closed upon submission.
2. **Daily Triage**: Maintainers review auto-closed issues daily and reopen high-signal reports.
3. **Approval Commands**: Maintainers approve contributors via issue comments:
   - `lgtmi`: Your future issues will not be auto-closed.
   - `lgtm`: Your future issues **and PRs** will not be auto-closed.

*(Note: `lgtmi` does not grant rights to submit PRs. Only `lgtm` grants rights to submit PRs.)*

4. **Triage Taxonomy**: Review [docs/TRIAGE_AND_LABELING.md](docs/TRIAGE_AND_LABELING.md) for package label mappings (`pkg:*`).
5. **Weekend Triage**: Issues submitted Friday through Sunday are triaged on Mondays. For urgent questions, reach out on [Discord](https://discord.com/invite/3cU7Bz4UPx).

---

## 📋 Quality Bar for Issues

When opening an issue, use the official GitHub issue templates and ensure your report is concise and actionable:

- Keep it brief (must fit on a single screen).
- Explain the problem, reproduction steps, expected behavior, and actual behavior.
- Clarify why the fix or feature matters.
- If you intend to implement the fix yourself, explicitly state so in the issue description.

---

## 🛠️ Code Standards & Rules

All code contributions must adhere to the following mandatory guidelines:

1. **Erasable TypeScript Syntax**: Code must conform to Node strip-only mode (no `enum`, `namespace`, parameter properties, or non-standard TS emit features). Use explicit fields with constructor assignments.
2. **Top-Level Imports Only**: Dynamic inline imports (`await import(...)` or `import("pkg").Type`) are strictly prohibited.
3. **No `any` Types**: Avoid `any` unless strictly necessary for third-party dynamic interfaces.
4. **Zero-GC Substrate Rules**: Code paths under `packages/broccolidb` must use pre-allocated slab allocators and avoid allocating objects inside hot loops.
5. **No Editing `CHANGELOG.md`**: Maintainers manage changelog entries during release cycles. Do not add changelog edits to your PR.
6. **Regression Tests**: For bug fixes, add issue-specific regression specs under `packages/coding-agent/test/suite/regressions/` named `<issue-number>-<short-slug>.test.ts`.

---

## 🧪 Testing Guidelines

Before opening a PR, ensure all verification commands pass cleanly:

```bash
# Run complete verification gate
npm run check

# Verify native Rust crate compilation
cargo check --manifest-path crates/pi-natives/Cargo.toml

# Run single-host worker host architecture smoke probe
bun packages/coding-agent/src/cli.ts --smoke-test

# Run non-e2e test suite
./test.sh

# Run specific package tests
node node_modules/vitest/dist/cli.js --run packages/coding-agent/test/suite/harness.ts
```

For interactive TUI manual testing, run inside a `tmux` session:

```bash
tmux new-session -d -s pi-test -x 80 -y 24
tmux send-keys -t pi-test "./pi-test.sh" Enter
sleep 3 && tmux capture-pane -t pi-test -p
tmux kill-session -t pi-test
```

---

## ❓ Frequently Asked Questions

<details>
<summary><strong>Why are new issues and PRs auto-closed?</strong></summary>
<br/>
LUMI receives a high volume of issue reports. Auto-closing creates a triage buffer so maintainers can review reports systematically and reopen actionable, high-quality issues.
</details>

<details>
<summary><strong>Where can I learn about RFCs and architectural proposals?</strong></summary>
<br/>
Earendil maintains public RFC proposals at <a href="https://rfc.earendil.com/keyword/pi/">rfc.earendil.com</a>.
</details>

<details>
<summary><strong>How do I report a security vulnerability?</strong></summary>
<br/>
Do not open a public issue. Review our <a href="SECURITY.md">SECURITY.md</a> policy and email <code>security@earendil.com</code> or submit a private GitHub Security Advisory.
</details>

---

## 💬 Community & Communication

- **Discord**: Join the developer discussion on [Discord](https://discord.com/invite/nKXTsAcmbT).
- **Security**: Report vulnerabilities via `security@earendil.com`.
