#!/bin/sh
INIT='{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"productarena-probe","version":"1.0"}}}'

echo "=== pyairbyte import ==="
d=$(mktemp -d) && cd "$d" || exit 1
uv venv -q && uv pip install -q airbyte && ./.venv/bin/python -c "from importlib.metadata import version; import airbyte; print('PA_PROBE_OK pyairbyte', version('airbyte'))"
echo "--- console scripts ---"
ls ./.venv/bin | grep -iE "airbyte|mcp" | head
echo "=== airbyte-mcp stdio handshake ==="
{ printf '%s\n' "$INIT"; sleep 8; } | ./.venv/bin/airbyte-mcp 2>/dev/null | head -1 | cut -c 1-400
cd / && rm -rf "$d"

echo "=== meltano init scaffold ==="
d=$(mktemp -d) && cd "$d" || exit 1
uvx meltano init pa-probe 2>&1 | tail -8
ls pa-probe
cd / && rm -rf "$d"
