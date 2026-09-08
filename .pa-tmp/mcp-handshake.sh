#!/bin/sh
# Keyless MCP initialize handshake against each URL given on stdin.
INIT='{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"productarena-probe","version":"1.0"}}}'
while read -r u; do
  [ -z "$u" ] && continue
  echo "===== $u"
  curl -s -i --max-time 20 -X POST "$u" \
    -H 'Content-Type: application/json' \
    -H 'Accept: application/json, text/event-stream' \
    -d "$INIT" | head -c 1200
  echo
done
