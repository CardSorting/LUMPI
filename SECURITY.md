# Security Policy & Enterprise Threat Model

This document outlines the security architecture, trust boundaries, vulnerability disclosure guidelines, and sandboxing isolation models for the **LUMI** agentic AI coding engine (`@noorm/*`).

---

## 🛡️ Security Model & Trust Boundaries

By default, LUMI runs locally within the security boundary of the host user account executing the CLI or TUI session:

- **Host Trust Boundary**: LUMI treats the local user account, environment variables, shell startup files, and writable files inside the user's workspace as inside the same trust boundary as the LUMI process itself.
- **Local Write Access**: Reports that rely on prior local write access to the user's home directory (`~/.pi`), shell configuration, or local workspace files are not security vulnerabilities unless they demonstrate how LUMI grants unauthenticated write access or crosses an OS privilege boundary.
- **Trusted Repositories & Extensions**: LUMI relies on users loading trustworthy extensions, skills, and working inside trusted repositories. Repository files like `AGENTS.md` or code instructions can cause prompt injections, which is an inherent property of local AI agents.

---

## 🔒 Security Sandboxing Layers

For untrusted codebases or enterprise environments requiring isolated execution, LUMI supports three containerized sandboxing models:

1. **Gondolin Micro-VM**: Routes tool execution into a lightweight, local Linux micro-VM while keeping host authentication intact.
2. **Docker Containerization**: Runs the entire LUMI engine inside an isolated Docker container context.
3. **OpenShell Policy Guard**: Enforces fine-grained OS syscall and network policy sandbox boundaries.

---

## 🚨 Reporting a Vulnerability

If you discover a potential security vulnerability in LUMI or any package in this repository, please report it privately:

- **Email**: `security@earendil.com`
- **GitHub Advisory**: Open a private report through GitHub Security Advisories for this repository.

### What to Include in Your Report
- A clear description of the issue and its security impact.
- Reproducible steps, proof of concept script, or relevant diagnostic logs.
- Affected package name (`@noorm/*`), version, or commit SHA.
- Any known mitigations or workarounds.

> [!CAUTION]
> Do **NOT** open public GitHub issues or public Discord posts for security-sensitive reports. Maintainers will review reports and coordinate disclosure privately.

---

## 🎯 Scope

### In Scope
- Vulnerabilities in distributed npm packages (`@noorm/*`), CLI binary tools, RPC protocol codecs, and core engine execution paths.
- Earendil-operated cloud infrastructure on `pi.dev`.

### Out of Scope
- Local code execution or shell tool invocation performed on behalf of the user within host permissions.
- Behavior of third-party user-installed extensions or skills.
- Direct prompt injection attacks via repository files (`AGENTS.md`, source code comments).
- Compromised third-party credentials or API keys managed by the user.
- Security issues resulting from intentionally weakened user configuration or compromised local user accounts.

---

## 📜 Enterprise Governance & Security Controls

| Security Control | Implementation Mechanism | Enforcement Standard |
| :--- | :--- | :--- |
| **Zero External Telemetry** | Default local execution | No code snippets transmitted to 3rd party servers |
| **Native Memory Safety** | Rust 1.99 Nightly compiler borrow-checker (`crates/pi-natives`) | Borrow-checker guaranteed zero-buffer-overflow C-ABI addon |
| **Atomic File Locking** | POSIX advisory `file_lock` & xxHash line deltas (`@oh-my-pi/hashline`) | Prevents overlapping multi-agent file mutation race conditions |
| **Lifecycle Script Block** | `--ignore-scripts` installation | Blocks dynamic post-install script execution |
| **Lockfile Immutability** | `PI_ALLOW_LOCKFILE_CHANGE` pre-commit gate | Prevents un-audited transitive dependency drift |
| **Strip-Only TypeScript** | Erasable Node syntax | No un-audited JS emit transformers |
