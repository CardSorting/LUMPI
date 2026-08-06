# Handoff Transfer

> **What is this?** A volatile transfer brief containing current implementation, documentation, validation, and workspace-state facts.
> **When do I use it?** At an agent handoff boundary before changing coordination, scheduling, or completion behavior.
> **What is the source of truth?** The current working tree and the implementation paths linked below.

Last updated: 2026-08-06

## Current Task

The 11 Wide-Sweeping Backend Engine Fusion Passes are complete. All major Codemarie subsystems have been re-exported from `@earendil-works/pi-codemarie` and wired to `CodemarieBridge` in `packages/coding-agent`:

1. **Workspace Intelligence Engine**: `WorkspaceIntelligenceEngine`
2. **Spider Engine & AST Forensic Audit**: `SpiderEngine`
3. **Persistent Subscription Hub**: `PersistentSubscriptionHub`, `disposeAllPersistentSubscriptionHubs`
4. **Terminal Orchestrator & Executor**: `CommandExecutor`, `orchestrateCommandExecution`
5. **Context Staleness Tracker**: `ContextStalenessTracker`
6. **Command Safety Sanitizer**: `validateCommand`, `splitCommand`, `getSanitizerMode`
7. **DietCode Temp Manager**: `DietCodeTempManager`
8. **Swarm Mutex Service**: `SwarmMutexService`
9. **Roadmap Gate Catalog**: `buildGateStateFromInputs`, `collectGateInputs`, `evaluateGateChecks`
10. **Telemetry & Document Extraction**: `TelemetryService`, `telemetryService`, `callTextExtractionFunctions`, `processFilesIntoText`, `sanitizeNotebookForLLM`
11. **Code Safety & Review**: `detectCodeOmission`, `showOmissionWarning`, `CommentReviewController`, `MAX_CONTENT_SIZE_BYTES`, `readBroccoliFence`, `AUTO_GOVERNANCE`

## Implementation State

| Surface | Current behavior | Primary files |
|---------|------------------|---------------|
| Zero-GC Slab Allocator | 16MB contiguous `ArrayBuffer` slab with $O(1)$ pointer resets | `broccolidb/core/policy/spider/ArenaAllocator.ts` |
| Lock-Free IPC | `SharedArrayBuffer` ring buffer over `Atomics` with spin-yield protocol | `broccolidb/core/policy/spider/IPCBuffer.ts`, `FastIPC.ts` |
| Work-Stealing Scheduler | Dual-ended `WorkStealingDeque` preventing worker thread stalls | `broccolidb/core/policy/spider/TaskScheduler.ts` |
| Zero-Copy Kernel Direct I/O | Direct file descriptor streaming directly into `ArenaAllocator` slabs | `broccolidb/core/policy/spider/ZenIOEngine.ts` |
| V8 Monomorphic Bitwise Execution | TurboFan deopt-free Smi bitwise masking over typed arrays | `broccolidb/core/policy/spider/AgentDigest.ts` |
| Forensic $O(1)$ Lazy Indexing | Lazy snapshot node index Map for $O(1)$ hotspot heat calculation | `broccolidb/core/policy/spider/ForensicEngine.ts` |
| Single-Pass Online Variance | Single-pass Welford online mean and variance algorithm | `broccolidb/core/policy/spider/MetricsEngine.ts` |
| High-Velocity String Slicing | Fast $O(1)$ `.endsWith("/*")` slicing and static `EXTENSIONS` array | `broccolidb/core/policy/spider/PathResolver.ts` |
| Compiler Monomorphism | Monomorphic `TypeMirrorDiagnosticEntry` for V8 shape stability | `broccolidb/core/policy/spider/TypeMirrorEngine.ts` |
| DCE-Hardened Benchmark Suite | Volatile `GLOBAL_BENCH_SINK` accumulators, 5-sample median timing, JIT warmups | `broccolidb/tests/pass8_zenith_benchmark.ts` |
| Fast-Path Sensitive Masker | `QUICK_CHECK_REGEX` pre-filter bypassing 7 regex passes on normal inputs | `src/shared/utils/SensitiveDataMasker.ts` |
| Monomorphic Audit Logging | Monomorphic key layout (`ts`, `command`, `args`, `duration`, `exitCode`, `error`, `metadata`) | `src/services/logging/AuditLogService.ts` |

## Documentation Updated

The following technical documentation and architectural reports have been created/updated:

- `broccolidb/docs/PASS12_ARCHITECTURAL_REPORT.md` (Comprehensive 12-Pass Technical Report)
- `broccolidb/docs/PASS8_BENCHMARK_REPORT.md` (Empirical Benchmark Verification)
- `broccolidb/docs/README.md` (Start Here Matrix)
- `AGENT_PLAYBOOK.md` (Agent Operations Brief & Evidence)
- `HANDOFF.md` (Volatile Transfer Brief)

## Validation Evidence

| Command/suite | Result |
|---------------|--------|
| `npm run bench` (`broccolidb`) | All DCE sinks live and verified (`DCE Sink Verified: ✅ VERIFIED LIVE`) |
| `npm test` (`broccolidb`) | 75/75 test suites passing (100% compliance) |
| `npm run build` (`broccolidb`) | Passed with 0 TypeScript compilation errors |
| `npm run check:handler-imports` | Passed |
| `npm run check:task-lifecycle-boundary` | Passed |

Use `--no-config` for focused Mocha commands. `.mocharc.json` otherwise adds the entire recursive test suite. Do not run broad suites concurrently because governed tests share process-global authority state.

## Durable Constraints

- Never fall back from SQLite authority to memory/filesystem state in production.
- Never compare fencing identity through JavaScript `number`.
- Never unlink a malformed projection automatically.
- Never expose administrative force cleanup through `LockAuthority` or normal orchestration.
- Never classify a cycle as deadlock until all typed escape transitions are checked.
- Never apply scheduler recovery after either snapshot version changes.
- Never publish terminal in-memory state before the durable completion transaction commits.
- Keep the Electron `better-sqlite3` build restored after Node-native database testing.

## Recommended Next Actions

1. If implementation changes further, rerun the three focused hardening suites before broad validation.
2. Resolve the unrelated Mintlify broken-link backlog only in a separately scoped documentation pass.
3. Commit only after separating this pass from any unrelated pre-existing workspace changes according to maintainer preference.

## Final Review Checklist

- [x] Production authority and failure behavior documented.
- [x] Exact lease/projection identity and precision rules documented.
- [x] Normal reconciliation and administrative override separated.
- [x] Typed deadlock graph and snapshot consistency documented.
- [x] Durable completion identity, CAS, idempotency, and conflict behavior documented.
- [x] ACT execution-state prompt contract documented.
- [x] Agent playbook, memory, findings, troubleshooting, pitfalls, patterns, and index updated.
- [x] Documentation/link checks rerun after this documentation pass; unrelated baseline failures recorded above.
