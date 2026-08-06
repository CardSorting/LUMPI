#!/usr/bin/env bash
set -euo pipefail

# Ensure curl, tar, xz-utils, and ca-certificates are installed
if command -v apt-get &> /dev/null; then
    apt-get update && apt-get install -y curl tar xz-utils ca-certificates
elif command -v apk &> /dev/null; then
    apk add --no-cache curl tar xz ca-certificates bash
fi

# Install Node.js v22 if node is not available or < v22
if ! command -v node &> /dev/null; then
    NODE_VERSION="v22.14.0"
    ARCH=$(uname -m)
    case "$ARCH" in
        x86_64) NODE_ARCH="x64" ;;
        aarch64|arm64) NODE_ARCH="arm64" ;;
        *) NODE_ARCH="x64" ;;
    esac
    
    mkdir -p /usr/local/lib/nodejs
    curl -fsSL "https://nodejs.org/dist/${NODE_VERSION}/node-${NODE_VERSION}-linux-${NODE_ARCH}.tar.xz" | tar -xJ -C /usr/local/lib/nodejs
    ln -sf "/usr/local/lib/nodejs/node-${NODE_VERSION}-linux-${NODE_ARCH}/bin/node" /usr/local/bin/node
    ln -sf "/usr/local/lib/nodejs/node-${NODE_VERSION}-linux-${NODE_ARCH}/bin/npm" /usr/local/bin/npm
    ln -sf "/usr/local/lib/nodejs/node-${NODE_VERSION}-linux-${NODE_ARCH}/bin/npx" /usr/local/bin/npx
fi

echo "Node version: $(node -v)"
