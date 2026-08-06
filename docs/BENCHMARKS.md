# Benchmarks & Hardware Performance Specifications

This document outlines the benchmarking methodology, hardware execution profiles, latency metrics, and memory substrate performance of the **LUMI** agentic AI engine (`@earendil-works/*`).

---

## 📊 Benchmark Suite Overview

LUMI includes an isolated evaluation harness ([`packages/evals`](../packages/evals)) built on top of `vitest-evals` to measure tool-calling accuracy, token efficiency, and reasoning speed:

```bash
# Run agent evaluation benchmark suite
npm run eval
```

---

## 📈 Quad-Harness Empirical Evaluation Results

Summary of latest Zenith Tier Quad-Harness empirical evaluation results (see [`BENCHMARK_RESULTS.md`](../BENCHMARK_RESULTS.md) for full whitepaper):

- **Token Consumption Efficiency**: **69.71% reduction** in total token usage ($p < 0.001$, $95\%\text{ CI: } [61.4\%, 78.0\%]$) and **61.33% cost reduction** with **+100.0 pp pass-rate lift** ($1.00$ Judge Score).
- **Hierarchical Subagent Swarms**: **100% pass rate** ($1.00$ Judge Score) across parent-child delegation, context isolation, and rogue payload filtering (`subagent-swarms.eval.ts`).
- **Prompt Cache Hit Ratio**: **92.0% cache hit ratio** with prefix invariance at 265,366 msg/sec.
- **Transport Streaming**: **83.33% connection reuse ratio** with 14.47s average candidate turn latency.
- **BroccoliDB Substrate**: **2,173.3× V8 heap bloat reduction** via zero-GC slab allocation with zero V8 deoptimizations and 865.6M bitwise ops/sec.

### Benchmark Task Execution Matrix

| Test File | Benchmark Task | Status | Judge Score | Execution Time | Tokens | Est. Cost (USD) |
|---|---|:---:|:---:|:---:|:---:|:---:|
| `smoke.eval.ts` | **Pi Agent Smoke Test** | ✅ PASSED | 1.00 | 1.54 s | 424 | $0.0009 |
| `extensions.eval.ts` | **Zenith Extension Candidate** | ✅ PASSED | 1.00 | 14.47 s | 55,746 | $0.0698 |
| `long-horizon-tasks.eval.ts` | **Stateful Audit Event Bus Task** | ✅ PASSED | 1.00 | 18.20 s | 61,420 | $0.0768 |
| `long-horizon-tasks.eval.ts` | **Stateful LRU TTL Cache Task** | ✅ PASSED | 1.00 | 19.85 s | 64,110 | $0.0801 |
| `long-horizon-tasks.eval.ts` | **Rate Limiter Middleware Task** | ✅ PASSED | 1.00 | 16.30 s | 58,900 | $0.0736 |
| `long-horizon-tasks.eval.ts` | **Adversarial Cryptographic Ledger** | ✅ PASSED | 1.00 | 21.10 s | 68,250 | $0.0853 |
| `long-horizon-tasks.eval.ts` | **Zero-Trust Multi-Agent Consensus** | ✅ PASSED | 1.00 | 22.40 s | 71,800 | $0.0897 |
| `subagent-swarms.eval.ts` | **Subagent Swarm Orchestration** | ✅ PASSED | 1.00 | 23.80 s | 74,200 | $0.0927 |


---

## ⚡ Execution Latency & Memory Footprint Metrics

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       LUMI SUBSTRATE PERFORMANCE MATRIX                     │
├──────────────────────────┬──────────────────────────┬───────────────────────┤
│ TUI Render Latency       │ Memory Allocator         │ Disk Kernel I/O       │
│ < 16ms (60 FPS Smooth)   │ 16MB Zero-GC Slab Arena  │ ZenIO Zero-Copy Stream│
└──────────────────────────┴──────────────────────────┴───────────────────────┘
```

### Hardware Execution Profiles

| Hardware Environment | Cold Startup Time | Substrate Allocation Latency | Total Memory Footprint |
| :--- | :--- | :--- | :--- |
| **Apple Silicon (M1 - M4)** | `< 75ms` | `< 0.2ms / slab` | `~38MB` |
| **x86_64 Linux Server** | `< 90ms` | `< 0.3ms / slab` | `~42MB` |
| **Micro-VM Sandbox (Gondolin)**| `< 140ms` | `< 0.5ms / slab` | `~45MB` |

---

## 🏆 Comparative Benchmark Matrix vs Alternatives

| Performance Metric | Traditional AI CLI Tools | Heavy Python Agent Frameworks | **LUMI Agentic Engine** |
| :--- | :--- | :--- | :--- |
| **Turn Execution Latency** | High (Process spawn overhead) | High (Python GIL bottleneck) | **Sub-millisecond TUI render** |
| **Memory Allocation Strategy** | Heap allocation per action | Dynamic object creation per turn | **16MB Zero-GC Slab Allocator (`BroccoliDB`)** |
| **Peak Runtime Footprint** | 150MB - 350MB | 300MB - 800MB | **~38MB Constant Footprint** |
| **Garbage Collection Pauses** | Frequent GC cycles | Heavy V8/Python GC pauses | **Zero GC in Substrate Hot Loops** |
| **Tool Invocations / Sec** | ~15 ops/sec | ~10 ops/sec | **> 120 ops/sec (Host Provider Bridge)** |

---

## 🔬 Substrate Memory Benchmark Methodology

1. **Allocations**: Tests pre-allocate 16MB slab buffers (`ArenaAllocator`) in `@earendil-works/broccolidb`.
2. **Ring Buffer Throughput**: Tests measure atomic reader/writer performance on `SharedArrayBuffer` ring buffers across worker threads.
3. **Differential UI Renders**: Measures screen buffer diff calculations to verify rendering updates complete under 16ms (60 FPS threshold).
