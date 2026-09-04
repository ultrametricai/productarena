#!/usr/bin/env bash
# Post-deploy smoke test for the remote MCP endpoint (see README.md in this directory).
# Usage: ./smoke-mcp.sh [endpoint]   (default: https://ultrametric.ai/productarena/mcp)
set -euo pipefail

ENDPOINT="${1:-https://ultrametric.ai/productarena/mcp}"

post() {
  curl -sS --fail-with-body -m 30 -X POST "$ENDPOINT" \
    -H 'content-type: application/json' \
    -H 'accept: application/json' \
    -d "$1"
}

fail() { echo "SMOKE FAIL: $1" >&2; exit 1; }

echo "== initialize =="
INIT=$(post '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"smoke","version":"0"}}}')
echo "$INIT"
echo "$INIT" | grep -q '"productarena-mcp"' || fail "initialize: serverInfo missing"
echo "$INIT" | grep -q '"protocolVersion"' || fail "initialize: no protocolVersion"

echo "== tools/list =="
LIST=$(post '{"jsonrpc":"2.0","id":2,"method":"tools/list"}')
echo "$LIST" | head -c 600; echo
for tool in list_arenas get_rankings get_product get_verdict search_products compare get_stacks top_products; do
  echo "$LIST" | grep -q "\"$tool\"" || fail "tools/list: missing $tool"
done

echo "== tools/call list_arenas =="
CALL=$(post '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"list_arenas","arguments":{}}}')
echo "$CALL" | head -c 400; echo
echo "$CALL" | grep -q '"desktop-os"' || fail "tools/call list_arenas: no desktop-os in result"
echo "$CALL" | grep -q '"isError": *true' && fail "tools/call list_arenas: isError"

echo "== tools/call top_products (agentReady, 3) =="
TOP=$(post '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"top_products","arguments":{"metric":"agentReady","limit":3}}}')
echo "$TOP" | head -c 400; echo
echo "$TOP" | grep -q '"value"' || fail "tools/call top_products: no values"

echo "== unknown method is a clean -32601 =="
ERR=$(post '{"jsonrpc":"2.0","id":5,"method":"resources/list"}')
echo "$ERR"
echo "$ERR" | grep -q '\-32601' || fail "unknown method: expected -32601"

echo "SMOKE OK: $ENDPOINT"
