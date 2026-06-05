#!/usr/bin/env bash
# Demo driver for the Jobber MCP server.
#
# Spawns the built server over stdio, walks through the morning-briefing
# scenario from demo-scenario.md, and prints each tool's response.
#
# Requires: node, npm install + npm run build already done.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

if [[ ! -d dist ]]; then
  echo ">> dist/ not found — running build first"
  npm run build
fi

export JOBBER_MOCK_MODE="${JOBBER_MOCK_MODE:-true}"

echo ">> Starting Jobber MCP server in mock mode"
echo ">> Run a few tool calls and pretty-print the results"
echo

# We use the MCP TypeScript SDK Client class via a tiny node script.
node "$SCRIPT_DIR/run-demo.mjs"
