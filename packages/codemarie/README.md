# @earendil-works/pi-codemarie

> **Codemarie Agent Controller, Substrate Persistence & Mixture-of-Designers (MoD) Steering Engine**

`@earendil-works/pi-codemarie` provides the task lifecycle management, state persistence, governance policy enforcement, and Mixture-of-Designers (MoD) system prompt steering for the `pi` AI coding agent harness.

---

## 🏛️ Architecture & Navigation Map

```
@earendil-works/pi-codemarie
 ├── /hosts           # Host provider interfaces & CLI integration clients
 ├── /policy          # Plan mode enforcement, universal guard, & fluid policy engines
 ├── /orchestration   # Task streams, state tracking, & entropy calculators
 └── /tests           # Isolated integration test suites & test harness
```

---

## 📦 Subpath Entrypoints & Module Usage

### 1. Host Provider Integration (`@earendil-works/pi-codemarie/hosts`)
Provides workspace, environment, and window interaction bridges for headless and interactive host environments.

```ts
import { initializeCliHostProvider } from "@earendil-works/pi-codemarie/hosts";

const hostProvider = initializeCliHostProvider("/path/to/workspace");
```

### 2. Governance & Policy Guardrails (`@earendil-works/pi-codemarie/policy`)
Enforces architectural layer rules, read/write AST boundaries, and Plan Mode workflow guards.

```ts
import { UniversalGuard, PlanModeEnforcer } from "@earendil-works/pi-codemarie/policy";

const guard = new UniversalGuard("/path/to/workspace", "task-123", stateManager);
await guard.guardPreExecution(toolBlock, input);
```

### 3. Swarm & Task Orchestration (`@earendil-works/pi-codemarie/orchestration`)
Manages task stream mutations, cross-shadow conflict detection, and algorithmic entropy metrics.

```ts
import { orchestrator } from "@earendil-works/pi-codemarie/orchestration";

const entropy = orchestrator.calculateEntropy(previousContent, currentContent);
```

---

## ⚡ CLI Engine Options

When running `pi`, Codemarie features can be activated via CLI flags:

- `--mod`: Enables Mixture-of-Designers (MoD) prompt steering, injecting senior product designer instincts, design token sensing, and WCAG accessibility guardrails into session prompts.
- `--engine=codemarie`: Selects the Codemarie core task controller engine for execution.

```bash
# Run pi with MoD prompt steering
pi --mod "Audit UI component responsiveness"

# Select the codemarie engine explicitly
pi --engine=codemarie "Refactor authentication system"
```

---

## 🧪 Testing & Verification

Integration tests use the standardized `createTestHarness()` helper in `tests/harness.ts`:

```ts
import { createTestHarness } from "./tests/harness.js";

const harness = await createTestHarness({ testName: "my-feature" });
await harness.start();
// Run test operations using harness.storage, harness.dbPool, harness.workspacePath
await harness.cleanup();
```

To run monorepo typechecks and lint verification:

```bash
npm run check
```
