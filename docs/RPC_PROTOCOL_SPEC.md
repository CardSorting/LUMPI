# RPC Protocol & IPC Specification

This document details the communication schemas, IPC transport protocols, and RPC codecs defined in `@noorm/lumpi-protocol` and implemented by `@noorm/lumpi-server` and `@noorm/lumpi-client`.

---

## 🛰️ Transport Architecture

LUMI supports multi-tenant remote agent communication via two IPC transport layers:

1. **Unix Domain Sockets (IPC)**: Local high-throughput communication between CLI processes and local background server daemons.
2. **WebSocket (WSS)**: Encrypted remote communication for cloud container environments.

---

## 📜 Message Format & Codecs

All RPC messages use JSON-RPC 2.0 compatible structured payloads typed by `@noorm/lumpi-protocol`:

### 1. Request Message Frame

```json
{
  "jsonrpc": "2.0",
  "id": "req_01h8x9a2b",
  "method": "agent.executeTurn",
  "params": {
    "sessionId": "sess_99a81c",
    "prompt": "Audit src/index.ts for memory leaks",
    "provider": "openai-codex",
    "model": "gpt-5.6-luna",
    "executionMode": "read_only"
  }
}
```

### 2. Stream Response Delta Frame

```json
{
  "jsonrpc": "2.0",
  "id": "req_01h8x9a2b",
  "result": {
    "type": "token_delta",
    "sessionId": "sess_99a81c",
    "delta": "Checking memory allocations in BroccoliDB...",
    "finishReason": null
  }
}
```

### 3. Tool Execution Notification Frame

```json
{
  "jsonrpc": "2.0",
  "method": "agent.onToolExecution",
  "params": {
    "sessionId": "sess_99a81c",
    "toolName": "read_file",
    "arguments": {
      "path": "packages/broccolidb/src/allocator.ts"
    },
    "status": "running"
  }
}
```

---

## 🔑 Session State Sync Handshake

When a client connects to `@noorm/lumpi-server`:

1. **`client.hello`**: Client sends protocol version (`v1`) and active client capabilities.
2. **`server.ack`**: Server responds with active sessions, registered tools, and supported provider gateways.
3. **`session.resync`**: Client requests CAS transaction history to restore local TUI view.
