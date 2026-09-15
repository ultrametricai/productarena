#!/bin/sh
# Keyless API/MCP surface checks for probe design. Read-only.
MCPINIT='{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"productarena-probe","version":"1.0"}}}'

echo "=== loops api keyless ==="
curl -si --max-time 15 https://app.loops.so/api/v1/contacts/find?email=probe@example.com | head -12
echo "=== loops mcp init ==="
curl -si --max-time 15 -X POST https://mcp.loops.so -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' -d "$MCPINIT" | head -14
echo "=== loops llms.txt head ==="
curl -s --max-time 15 https://loops.so/llms.txt | head -6
echo "=== customerio api keyless ==="
curl -si --max-time 15 https://api.customer.io/v1/campaigns | head -10
echo "=== customerio track keyless ==="
curl -si --max-time 15 https://track.customer.io/api/v1/customers/probe -X PUT -H 'Content-Type: application/json' -d '{}' | head -8
echo "=== customerio mcp docs page (look for endpoint/npx) ==="
curl -sL --max-time 15 https://docs.customer.io/ai/mcp/get-started/ | tr '<' '\n' | grep -i -m 8 'mcp.customer.io\|npx\|remote\|streamable\|command'
echo "=== klaviyo api keyless ==="
curl -si --max-time 15 https://a.klaviyo.com/api/accounts/ -H 'accept: application/vnd.api+json' -H 'revision: 2025-07-15' | head -12
echo "=== klaviyo mcp pypi ==="
curl -s --max-time 15 https://pypi.org/pypi/klaviyo-mcp-server/json | head -c 300
echo
echo "=== mailchimp api keyless ==="
curl -si --max-time 15 https://us1.api.mailchimp.com/3.0/ | head -10
echo "=== kit api keyless ==="
curl -si --max-time 15 https://api.kit.com/v4/subscribers | head -10
echo "=== kit mcp overview page ==="
curl -sL --max-time 15 https://developers.kit.com/mcp/overview | tr '<' '\n' | grep -i -m 10 'mcp.kit.com\|npx\|remote\|url\|docs-mcp'
echo "=== kit llms head ==="
curl -s --max-time 15 https://developers.kit.com/llms.txt | head -6
echo "=== bento api keyless ==="
curl -si --max-time 15 'https://app.bentonow.com/api/v1/fetch/subscribers?site_uuid=probe' | head -10
echo "=== bento mcp docs page ==="
curl -sL --max-time 15 https://bentonow.com/docs/integrations/mcp | tr '<' '\n' | grep -i -m 10 'mcp.bentonow\|npx\|remote\|streamable\|command\|url'
echo "=== bento llms head ==="
curl -s --max-time 15 https://bentonow.com/llms.txt | head -6
echo "=== customerio llms head ==="
curl -s --max-time 15 https://customer.io/llms.txt | head -6
echo "=== klaviyo llms head ==="
curl -s --max-time 15 https://www.klaviyo.com/llms.txt | head -6
echo "=== mailchimp llms head ==="
curl -s --max-time 15 https://mailchimp.com/llms.txt | head -6
echo "=== loops openapi ==="
curl -s -o /dev/null -w '%{http_code}\n' --max-time 15 https://loops.so/openapi.json
echo "=== klaviyo openapi (documented?) ==="
curl -s -o /dev/null -w '%{http_code}\n' --max-time 15 https://a.klaviyo.com/api/openapi
