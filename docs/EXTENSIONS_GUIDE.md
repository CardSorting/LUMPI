# Authoring Extensions & Custom Tools

LUMI features an event-driven extension architecture supporting custom tools, dynamic prompt modifiers, subagent swarms, and custom AI provider endpoints.

Over 70 reference implementations are available in [`packages/coding-agent/examples/extensions`](../packages/coding-agent/examples/extensions).

---

## 🛠️ Registering a Custom Extension Tool

To build a custom tool, export a default module created via `defineTool`:

```typescript
import { defineTool } from "@noorm/lumpi-coding-agent";

export default defineTool({
  name: "query_substrate_metrics",
  description: "Retrieve real-time memory and allocator statistics from BroccoliDB",
  parameters: {
    type: "object",
    properties: {
      includeAllocatedSlabs: {
        type: "boolean",
        description: "Whether to detail active slab buffer allocations",
      },
    },
    required: [],
  },
  async execute(params, { workspace }) {
    const metrics = await workspace.substrate.getMetrics();
    return {
      activeSlabs: params.includeAllocatedSlabs ? metrics.allocatedSlabs : undefined,
      freeMemoryBytes: metrics.freeMemory,
      totalSlabCount: metrics.totalSlabs,
    };
  },
});
```

---

## ⚡ Native Rust & Line Delta Extension Tools

Extensions can also invoke native Rust bindings (`@oh-my-pi/pi-natives`) for ultra-fast Ripgrep and directory walking, or line delta engines (`@oh-my-pi/hashline`) for fuzzy patch validation:

```typescript
import { defineTool } from "@noorm/lumpi-coding-agent";
import { nativeRipgrepSearch } from "@oh-my-pi/pi-natives";
import { computeLineHashes } from "@oh-my-pi/hashline";

export default defineTool({
  name: "fast_native_search",
  description: "Perform sub-millisecond text search via native Rust Ripgrep engine",
  async execute({ query, cwd }) {
    const results = await nativeRipgrepSearch(cwd, query);
    return { matches: results.length, matchesList: results.slice(0, 50) };
  },
});
```

---

## 🤖 Authoring Subagent Extensions

Subagents allow delegating tasks to isolated sub-turns with separate context windows:

```typescript
import { defineExtension } from "@noorm/lumpi-coding-agent";

export default defineExtension({
  name: "subagent-auditor",
  setup({ onPrompt }) {
    onPrompt(async ({ prompt, delegate }) => {
      if (prompt.includes("audit subagent")) {
        const result = await delegate({
          prompt: "Audit security boundaries in packages/ai/src/",
          executionMode: "read_only",
        });
        return `Subagent audit complete: ${result.summary}`;
      }
    });
  },
});
```

---

## 🔌 Writing Custom AI Provider Extensions

LUMI allows adding custom internal or enterprise AI model endpoints (such as internal LLM proxies or custom model routers).

See reference implementations in the monorepo:
- **Custom Anthropic Provider**: [`packages/coding-agent/examples/extensions/custom-provider-anthropic`](../packages/coding-agent/examples/extensions/custom-provider-anthropic)
- **Custom GitLab Duo Provider**: [`packages/coding-agent/examples/extensions/custom-provider-gitlab-duo`](../packages/coding-agent/examples/extensions/custom-provider-gitlab-duo)

---

## 🚀 Loading Extensions at Runtime

To load a custom extension when running LUMI:

```bash
pi --extension ./path/to/my-extension
```
