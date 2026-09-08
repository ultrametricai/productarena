#!/bin/sh
INIT='{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"productarena-probe","version":"1.0"}}}'

echo "=== 1. dlt init scaffold ==="
d=$(mktemp -d) && cd "$d" || exit 1
uvx --with 'dlt[duckdb]' dlt init chess duckdb 2>&1 | tail -8
echo "--- files ---"
ls -a | head -12
head -6 chess_pipeline.py 2>/dev/null || head -6 ./*.py 2>/dev/null | head -8
cd / && rm -rf "$d"

echo "=== 2. dlt-mcp stdio handshake ==="
{ printf '%s\n' "$INIT"; sleep 10; } | uv run --with 'dlt-mcp[duckdb]' dlt-mcp 2>/dev/null | head -1 | cut -c 1-400

echo "=== 3. dlt --version ==="
uvx dlt --version 2>&1 | tail -1
