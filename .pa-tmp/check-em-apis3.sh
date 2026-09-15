#!/bin/sh
MCPINIT='{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"productarena-probe","version":"1.0"}}}'
echo "=== bento hosted endpoint context ==="
curl -s --max-time 15 https://bentonow.com/docs/integrations/mcp | tr '<' '\n' | grep -A2 -B2 -i 'hosted' | head -30
echo "=== bento docs page: any mcp url ==="
curl -s --max-time 15 https://bentonow.com/docs/integrations/mcp | grep -o 'https://[a-z0-9.-]*bentonow[a-z0-9./-]*' | sort -u | head -20
echo "=== kit hosted mcp init ==="
curl -si --max-time 15 -X POST https://app.kit.com/mcp -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' -d "$MCPINIT" | head -12
echo "=== loops openapi spec ==="
curl -s -o /dev/null -w '%{http_code}\n' --max-time 15 https://loops.so/agents/api
curl -s --max-time 15 https://loops.so/agents/api | head -c 200
echo
echo "=== loops llms.txt line count ==="
curl -s --max-time 15 https://loops.so/llms.txt | wc -l
echo "=== kit developer docs mcp md ==="
curl -s --max-time 15 https://developers.kit.com/mcp/kit-developer-docs-mcp.md | grep -o 'https://[a-z0-9./-]*' | sort -u | head
