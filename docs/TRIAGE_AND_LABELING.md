# Contributor Triage & Issue Labeling Taxonomy

This document outlines the issue classification taxonomy, labeling conventions, maintainer triage commands, and issue lifecycles used in the **LUMI** repository.

---

## 🏷️ Issue Label Taxonomy

To maintain clarity across our 12 monorepo packages, issues are categorized using explicit label prefixes:

### 1. Package Labels (`pkg:*`)

| Label | Affected Scope | Description |
| :--- | :--- | :--- |
| **`pkg:agent`** | [`packages/agent`](../packages/agent) | Core CAS state machine, prompt assembly, turn transitions. |
| **`pkg:ai`** | [`packages/ai`](../packages/ai) | Multi-provider LLM API router, model definitions, provider connectors. |
| **`pkg:broccolidb`** | [`packages/broccolidb`](../packages/broccolidb) | Substrate storage, 16MB zero-GC slab arena allocators. |
| **`pkg:codemarie`** | [`packages/codemarie`](../packages/codemarie) | Merged HostProvider bridge, workspace/env/diff clients. |
| **`pkg:coding-agent`** | [`packages/coding-agent`](../packages/coding-agent) | Primary CLI binary, TUI host runner, extension loaders. |
| **`pkg:tui`** | [`packages/tui`](../packages/tui) | Differential terminal screen rendering library. |
| **`pkg:telemetry`** | [`packages/telemetry`](../packages/telemetry) | Metrics aggregators and telemetry schema validation. |
| **`pkg:evals`** | [`packages/evals`](../packages/evals) | Evaluation benchmarks and tool-calling accuracy harness. |

### 2. Type Labels (`type:*`)

- **`type:bug`**: Confirmed defect or unexpected behavior.
- **`type:feature`**: Proposed feature or enhancement.
- **`type:docs`**: Documentation, quickstarts, or specification improvements.
- **`type:security`**: Security-sensitive issues or dependency advisories.

---

## ⚙️ Maintainer Triage Commands (`lgtmi` / `lgtm`)

Maintainers triage auto-closed community issues using specific approval commands in issue replies:

- **`lgtmi`** (*Looks Good To Me - Issue*): Grants the issue author approval to open future issues without triggering automatic auto-close filters.
- **`lgtm`** (*Looks Good To Me*): Grants the author approval to open both future issues **and pull requests**.

*(Note: The command string `lgtmi` or `lgtm` must appear at the start of the maintainer reply, optionally following `@username` mentions, or at the end.)*

---

## 🚀 Guidance for First-Time Contributors

If you are a first-time contributor looking to resolve your first issue:
1. Review [`CONTRIBUTING.md`](../CONTRIBUTING.md) and [`DEVELOPMENT.md`](../DEVELOPMENT.md).
2. Filter open issues for `type:docs` or `type:bug` labeled with `lgtm`.
3. Comment on the issue expressing your interest before submitting a pull request.
4. Ensure your PR passes `npm run check` and `./test.sh` cleanly.
