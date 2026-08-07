# CISO & Security Architect Evaluation Sheet: LUMI

This document provides Chief Information Security Officers (CISOs), Security Architects, and Enterprise Risk Auditors with a formal evaluation rubric and technical threat model for **LUMI**.

---

## 🛡️ Security Architecture & Data Flow Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
## LUMI ENTERPRISE DATA FLOW ARCHITECTURE
├─────────────────────────────────────────────────────────────────────────────┤
│  [Local Workstation]                                                        │
│  ├─ Developer Workspace Filesystem                                          │
│  ├─ BroccoliDB 16MB Zero-GC In-Memory Slab Arena (Local RAM)                │
│  └─ Gondolin Micro-VM Sandboxed Sub-Shell                                    │
│                                                                             │
│  [Network Boundary Options]                                                 │
│  ├─ Option A: Sovereign Local Execution (Ollama/vLLM) ──► Zero Network Calls │
│  ├─ Option B: Enterprise Proxy Gateway ──► Internal TLS Proxy (Custom CA)  │
│  └─ Option C: Direct Provider API ──► Encrypted TLS Stream to OpenAI/Claude │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔍 Threat Model & Security Controls Matrix

| Threat Category | Potential Risk | LUMI Mitigation Control | Verification Standard |
| :--- | :--- | :--- | :--- |
| **Data Leakage / Telemetry** | Codebase transmission to telemetry aggregators | Zero default telemetry. All code execution stays strictly within local process context. | Network traffic inspection shows zero background outbound telemetry endpoints. |
| **Native Memory Safety** | Buffer overflow or memory corruption in native extensions | Safe Rust 1.99 Nightly native crate (`crates/pi-natives`) compiled into N-API addon. | Rust compiler borrow checker guarantees 100% memory safety. |
| **Concurrent File Tampering** | Race conditions during parallel agent file edits | POSIX advisory `file_lock` and xxHash line delta verification (`@oh-my-pi/hashline`). | Atomic lock acquiring prevents overlapping concurrent file writes. |
| **Untrusted Code Execution** | Malicious shell commands executed by agent turns | Gondolin Micro-VM isolation routes command execution into lightweight Linux micro-VMs. | Host process isolation verified; host kernel filesystem protected. |
| **Supply Chain Poisoning** | Malicious post-install lifecycle scripts | Strict installation policy: `npm install --ignore-scripts`. | Dependency installation executes zero binary lifecycle hooks. |
| **Lockfile Drift** | Un-audited transitive dependency updates | Pre-commit lockfile gate requiring `PI_ALLOW_LOCKFILE_CHANGE=1`. | Lockfile mutations blocked by default. |
| **Code Tampering / JS Emit** | Transpiler vulnerabilities or non-standard syntax | Node strip-only erasable TypeScript syntax (no custom emit transformers). | `tsconfig.json` enforces erasable TS syntax. |

---

## 📋 Sovereign Air-Gap Verification Protocol

For ultra-secure air-gapped environments (defense, financial systems, medical infrastructure):

1. **Air-Gap Provider Setup**: Direct API calls to local Ollama or vLLM instances:
   ```bash
   export OLLAMA_BASE_URL="http://127.0.0.1:11434"
   ```
2. **Disable Telemetry Explicitly**:
   ```bash
   export PI_TELEMETRY_DISABLED="1"
   ```
3. **Verify Zero Outbound Traffic**:
   Execute agent turns under packet capture inspection (`tcpdump` / `Wireshark`) to confirm zero external egress calls.

---

## 📄 SBOM & Supply Chain Inspection

LUMI maintains explicit pinned dependencies and a verified shrinkwrap file (`packages/coding-agent/npm-shrinkwrap.json`).

To generate a Software Bill of Materials (SBOM) for compliance audit:

```bash
# Verify shrinkwrap consistency
npm run check:shrinkwrap

# Generate CycloneDX JSON SBOM (if cyclonedx CLI is installed)
npx @cyclonedx/cyclonedx-npm --output-file sbom.json
```

---

## 📚 Related Compliance Artifacts

- 🛡️ [Security Compliance Matrix](COMPLIANCE.md)
- 🔒 [Enterprise Security & Air-Gap Guide](SECURITY_AND_AIRGAP.md)
- 💼 [Executive Brief](EXECUTIVE_BRIEF.md)
- 🏢 [Enterprise Adoption Guide](ADOPTION_GUIDE.md)
