# Engine Developer Field Guide

This document provides a comprehensive reference for core developers working directly on the **LUMI** engine codebase (`@earendil-works/*`).

---

## 🏗️ Monorepo Structure & Workspace Graph

LUMI is structured as an npm monorepo (`packages/*`):

```
packages/
├── agent/              # @earendil-works/pi-agent-core (State machine, prompt assembly, CAS history)
├── ai/                 # @earendil-works/pi-ai (Multi-provider LLM gateway router)
├── broccolidb/         # @earendil-works/broccolidb (Zero-GC 16MB slab arena memory engine)
├── client/             # @earendil-works/pi-client (RPC client bindings)
├── codemarie/          # @earendil-works/pi-codemarie (Merged CodeMarie host bridge provider)
├── coding-agent/       # @earendil-works/pi-coding-agent (CLI binary, session CAS, TUI host)
├── evals/              # @earendil-works/pi-evals (Benchmarking framework)
├── protocol/           # @earendil-works/pi-protocol (Shared RPC protocol codecs & schemas)
├── server/             # @earendil-works/pi-server (Multi-tenant IPC server broker)
├── session-backends/   # @earendil-works/pi-session-backends (Persistence backends & SQLite wrappers)
├── telemetry/          # @earendil-works/pi-telemetry (Vendor-neutral telemetry metrics)
└── tui/                # @earendil-works/pi-tui (Differential terminal UI library)
```

---

## ⚡ Local Developer Inner-Loop

```
┌─────────────────────────────────────────────────────────────────────────────┐
## LOCAL DEVELOPER INNER-LOOP FLOWCHART
├─────────────────────────────────────────────────────────────────────────────┤
│  1. Code Modification                                                       │
│     └─ Edit source files in packages/* (strictly erasable TypeScript syntax) │
│                                                                             │
│  2. Local Interactive TUI Verification                                      │
│     └─ Run `./pi-test.sh` or `./pi-test.sh --no-env` to test changes         │
│                                                                             │
│  3. Quality Verification Gate                                               │
│     ├─ Run `npm run check` (Biome, pinned deps, imports, shrinkwrap)        │
│     └─ Run `./test.sh` (non-e2e test suite execution)                        │
│                                                                             │
│  4. Commit & PR Submission                                                  │
│     └─ Stage specific files (`git add <files>`) and follow commit rules     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Initial Hydration

To install monorepo dependencies without triggering untrusted post-install lifecycle scripts:

```bash
npm install --ignore-scripts
```

### Full Quality Gate (`npm run check`)

`npm run check` is the mandatory quality gate that runs before any code submission:

```bash
npm run check
```

It executes the following verifications in sequence:
1. **Biome Linter & Formatter**: Validates style and code rules.
2. **Pinned External Dependencies**: Ensures direct dependencies remain pinned to exact versions.
3. **TypeScript Relative Imports**: Verifies top-level relative import paths.
4. **Shrinkwrap Consistency**: Verifies `npm-shrinkwrap.json` for `@earendil-works/pi-coding-agent`.
5. **Browser & Package Smoke Tests**: Validates compilation targets.

### Running Non-E2E Unit & Integration Tests

Always use the root test script to avoid triggering environment-sensitive e2e tests:

```bash
# Run non-e2e test suite across packages
./test.sh

# Run targeted test files using vitest cli directly
node node_modules/vitest/dist/cli.js --run packages/coding-agent/test/suite/harness.ts
```

---

## 🖥️ Interactive TUI Testing & Debugging

### Direct Local Execution

To test changes to the CLI or TUI in real time from source:

```bash
# Launch interactive TUI session with environment keys intact
./pi-test.sh

# Launch keyless evaluation mode
./pi-test.sh --no-env
```

### Automated TUI Headless Testing via `tmux`

When debugging terminal UI behaviors or key bindings headlessly:

```bash
# Create isolated tmux session
tmux new-session -d -s pi-test -x 80 -y 24

# Launch pi-test script inside tmux
tmux send-keys -t pi-test "./pi-test.sh" Enter

# Wait for startup and capture rendered terminal pane
sleep 3 && tmux capture-pane -t pi-test -p

# Send user prompt input or keyboard shortcuts
tmux send-keys -t pi-test "Refactor src/index.ts" Enter
tmux send-keys -t pi-test Escape

# Clean up test session
tmux kill-session -t pi-test
```

---

## 🔄 AI Model Definition Generation

AI provider specifications, model metadata, and context limits are maintained in `@earendil-works/pi-ai`:

> [!WARNING]
> Do **NOT** edit `packages/ai/src/models.generated.ts` directly.

To add or update AI provider models:
1. Edit `packages/ai/scripts/generate-models.ts`.
2. Run model definition generator:
   ```bash
   npm run generate:models
   ```
3. Commit both `generate-models.ts` and the resulting `models.generated.ts` changes.

---

## 🔐 Lockfile & Dependency Management

- **Lockfile Changes**: Pushing changes to `package-lock.json` requires explicit approval via environment variable `PI_ALLOW_LOCKFILE_CHANGE=1`.
- **Shrinkwrap Regeneration**: If new packages or dependencies are added to `@earendil-works/pi-coding-agent`, update shrinkwrap:
  ```bash
  node scripts/generate-coding-agent-shrinkwrap.mjs
  ```
- **Clean Lockfile Updates**: To refresh metadata cleanly without running lifecycle scripts:
  ```bash
  npm install --package-lock-only --ignore-scripts
  ```

---

## 🎯 Adding Issue Regression Tests

When fixing bugs, create issue-specific regression specs under `packages/coding-agent/test/suite/regressions/`:

- Naming convention: `<issue-number>-<short-slug>.test.ts`
- Use the faux provider harness in `packages/coding-agent/test/suite/harness.ts` to mock model responses without making real network calls or burning API tokens.
