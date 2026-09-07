#!/bin/sh
# Test a stdio MCP server keylessly: pipe initialize, capture first output lines, kill after window.
# usage: test-mcp-stdio.sh <seconds> <cmd...>
SECS=$1; shift
INIT='{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"pa","version":"1.0"}}}'
OUT=$(mktemp)
( printf '%s\n' "$INIT"; sleep "$SECS" ) | "$@" > "$OUT" 2>&1 &
PID=$!
sleep "$SECS"; sleep 2
kill "$PID" 2>/dev/null
head -c 1200 "$OUT"
rm -f "$OUT"
