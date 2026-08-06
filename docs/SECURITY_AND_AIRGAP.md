# Enterprise Security & Air-Gapped Deployment Guide

This guide details configuring **LUMI** for enterprise security compliance, corporate proxy environments, and fully air-gapped sovereign operations.

---

## 🔒 Zero-Trust Security Architecture

LUMI operates under a zero-trust supply chain model:

1. **Zero External Telemetry**: LUMI makes zero call-home telemetric ping requests. Code context is sent strictly to the user-configured LLM provider API.
2. **Lifecycle Script Suppression**: Dependencies are installed using `--ignore-scripts` to block post-install scripts.
3. **Lockfile Immutability**: Production dependency changes require explicit override approval (`PI_ALLOW_LOCKFILE_CHANGE=1`).
4. **Erasable TypeScript**: Engine sources use Node strip-only mode (no JS code transformers or un-audited transpilation passes).

---

## 🌐 Enterprise Proxy Configuration

When running LUMI behind an enterprise HTTP/HTTPS proxy:

Export proxy environment variables in your terminal profile:

```bash
export HTTP_PROXY="http://proxy.enterprise.internal:8080"
export HTTPS_PROXY="http://proxy.enterprise.internal:8080"
export NO_PROXY="localhost,127.0.0.1,.internal"
```

LUMI's multi-provider router (`@noorm/lumpi-ai`) will automatically route HTTPS provider calls through your configured enterprise proxy.

---

## 🛡️ Sovereign Air-Gapped Deployments (Ollama & Local LLMs)

For environments with strict data loss prevention (DLP) requirements prohibiting external cloud API connections:

### 1. Local Ollama Integration

Start your local Ollama server on your local machine or internal network:

```bash
# Pull sovereign model locally
ollama pull llama3.3:70b
```

### 2. Configure LUMI for Local Gateway Routing

```bash
# Point LUMI to local Ollama base URL
export OLLAMA_BASE_URL="http://localhost:11434"

# Execute agent turn with zero outbound internet calls
pi --provider ollama --model llama3.3:70b -p "Audit packages/agent for thread safety"
```

---

## 📦 Micro-VM Sandboxing with Gondolin

For untrusted codebases or untrusted subagent workflows, enable Gondolin Micro-VM isolation:

```bash
# Enable Gondolin micro-VM sandbox extension
pi --extension packages/coding-agent/examples/extensions/gondolin
```

This isolates tool execution (file editing, shell commands, build scripts) inside a lightweight local Linux virtual machine container, preventing unauthorized access to host filesystem paths outside the workspace.
