#!/bin/sh
MCPINIT='{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"productarena-probe","version":"1.0"}}}'
echo "=== kit-mcp.md (hosted endpoint?) ==="
curl -s --max-time 15 https://developers.kit.com/mcp/kit-mcp.md | head -40
echo "=== bento mcp page raw (hosted endpoint) ==="
curl -s --max-time 15 https://bentonow.com/docs/integrations/mcp | tr '>' '\n' | grep -i -m 6 'mcp.bentonow\|hosted\|https://.*mcp'
echo "=== mailchimp llms.txt first 400 chars ==="
curl -s --max-time 15 https://mailchimp.com/llms.txt | head -c 400
echo
echo "=== loops mcp oauth metadata ==="
curl -s --max-time 15 https://mcp.loops.so/.well-known/oauth-protected-resource | head -c 400
echo
echo "=== customer.io hosted mcp init ==="
curl -si --max-time 15 -X POST https://mcp.customer.io/mcp -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' -d "$MCPINIT" | head -14
echo "=== loops agents page mentions skills? ==="
curl -s --max-time 15 https://loops.so/llms.txt | grep -i -m 6 'mcp\|agent\|skill'
echo "=== klaviyo llms mentions mcp ==="
curl -s --max-time 15 https://www.klaviyo.com/llms.txt | grep -i -m 4 'mcp'
echo "=== kit api unauthorized body ==="
curl -s --max-time 15 https://api.kit.com/v4/subscribers | head -c 200
echo
echo "=== bento 401 body ==="
curl -s --max-time 15 'https://app.bentonow.com/api/v1/fetch/subscribers?site_uuid=probe' | head -c 200
echo
echo "=== mailchimp 401 body ==="
curl -s --max-time 15 https://us1.api.mailchimp.com/3.0/ | head -c 300
echo
echo "=== loops docs llms variant ==="
curl -s -o /dev/null -w '%{http_code}\n' --max-time 15 https://loops.so/docs/llms.txt
