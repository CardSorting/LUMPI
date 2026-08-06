# LUMI Ecosystem & Extensibility Guide

**LUMI** is architected for maximum extensibility. The execution core (`@noorm/lumpi-agent-core`) is kept minimal, while specialized behaviors, tool integrations, model drivers, and terminal views are extended via modular packages and extensions.

---

## 🧩 Architectural Extensibility Layers

```
┌─────────────────────────────────────────────────────────────────────────────┐
## LUMI EXTENSIBILITY LAYERS
├─────────────────────────────────────────────────────────────────────────────┤
│  1. Extension Plugins  ──► Custom agent tools, lifecycle hooks, keybinds     │
│  2. Model Drivers      ──► Multi-LLM provider adaptations (@earendil/pi-ai)  │
│  3. Substrate Storage  ──► High-throughput state backends (@earendil/broc)   │
│  4. RPC / Daemon API   ──► JSON-RPC 2.0 transport socket integration       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ 1. Building Custom Agent Tools & Extensions

Extensions in LUMI allow developers to attach new tools, intercept state events, or modify environment context dynamically:

```typescript
import { createExtension } from "@noorm/lumpi-coding-agent";

export default createExtension({
  name: "custom-linter-tool",
  setup(ctx) {
    ctx.registerTool({
      name: "run_custom_linter",
      description: "Executes custom repository linter and returns violations",
      async execute(args) {
        // Custom execution logic
        return { status: "success", output: "Zero violations found" };
      },
    });
  },
});
```

To load your custom extension at runtime:
```bash
pi --extension ./path/to/extension.ts
```

For complete tutorial details, see [EXTENSIONS_GUIDE.md](EXTENSIONS_GUIDE.md).

---

## 🔌 2. RPC Daemon Protocol Integration

LUMI provides a full JSON-RPC 2.0 server daemon (`@noorm/lumpi-server`) enabling external applications (IDEs, web interfaces, Slack bots) to control agent execution headlessly.

```json
{
  "jsonrpc": "2.0",
  "method": "agent.executeTurn",
  "params": {
    "prompt": "Audit src/index.ts for type safety",
    "provider": "openai-codex",
    "model": "gpt-5.6-luna"
  },
  "id": 101
}
```

Review the full wire format specification in [RPC_PROTOCOL_SPEC.md](RPC_PROTOCOL_SPEC.md).

---

## 📦 3. Built-In Extension Showcase

LUMI includes reference extensions under `packages/coding-agent/examples/extensions/`:

- 🔒 **Gondolin Micro-VM Sandboxing**: Routes shell command execution into isolated Linux micro-VM containers.
- 🌐 **Web Search Tool**: Enables autonomous web searching and content summarization.
- 🧪 **Faux Provider Test Harness**: Mocks LLM responses for zero-cost automated regression testing.

---

## 🤝 4. Community Contribution Pathways

We welcome community extensions and integrations! To share your extension:

1. Follow the extension guidelines in [EXTENSIONS_GUIDE.md](EXTENSIONS_GUIDE.md).
2. Submit a pull request or share your extension on our [Discord Community](https://discord.com/invite/nKXTsAcmbT).
3. Tag your GitHub repository with `lumi-extension` for public indexing.

---

## 📚 Ecosystem Resources

- 🔌 [Extensions Guide](EXTENSIONS_GUIDE.md)
- 🛰️ [RPC Protocol Spec](RPC_PROTOCOL_SPEC.md)
- 🏗️ [Architecture Guide](ARCHITECTURE.md)
- 🛠️ [Developer Field Guide](../DEVELOPMENT.md)
