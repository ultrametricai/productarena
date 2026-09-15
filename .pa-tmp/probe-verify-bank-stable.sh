#!/bin/sh
# Live-verify probe candidates for banking-data-apis + stablecoin-payments.
INIT='{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"pa-probe","version":"1.0"}}}'
mcp() { echo "== MCP $1"; curl -s --max-time 20 -X POST "$1" -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' -d "$INIT" | head -c 300; echo; }
api() { echo "== API $*"; curl -si --max-time 20 "$@" | head -4; }
# banking
api https://production.plaid.com/accounts/balance/get -X POST -H 'Content-Type: application/json' -d '{}'
mcp https://api.dashboard.plaid.com/mcp/sse
mcp https://docs.mx.com/mcp
api https://api.mx.com/users -H 'Accept: application/vnd.mx.api.v1+json'
mcp https://docs.yapily.com/mcp
api https://api.yapily.com/accounts
api https://api.teller.io/accounts
echo "== teller llms"; curl -sL --max-time 20 https://teller.io/docs/llms.txt | head -2
api https://api.truelayer.com/data/v1/accounts
mcp https://docs.truelayer.com/mcp
echo "== truelayer llms"; curl -sL --max-time 20 https://docs.truelayer.com/llms.txt | head -2
echo "== mx llms"; curl -sL --max-time 20 https://docs.mx.com/llms.txt | head -2
echo "== yapily llms"; curl -sL --max-time 20 https://docs.yapily.com/llms.txt | head -2
echo "== mastercard llms"; curl -sL --max-time 20 https://developer.mastercard.com/llms.txt | head -2
api https://api.finicity.com/aggregation/v1/customers
echo "== yapily openapi"; curl -s --max-time 20 https://api.yapily.com/docs/v3/openapi.json | head -c 120; echo
# stablecoin
mcp https://apidocs.bridge.xyz/mcp
api https://api.bridge.xyz/v0/customers
api https://api.circle.com/v1/w3s/wallets
mcp https://developers.circle.com/mcp
echo "== circle llms"; curl -sL --max-time 20 https://developers.circle.com/llms.txt | head -2
api https://api.bvnk.com/api/wallet
echo "== bvnk llms"; curl -sL --max-time 20 https://docs.bvnk.com/llms.txt | head -2
mcp https://docs.cdp.coinbase.com/mcp
api https://api.cdp.coinbase.com/platform/v2/evm/accounts
echo "== cdp llms"; curl -sL --max-time 20 https://docs.cdp.coinbase.com/llms.txt | head -2
mcp https://dev.moonpay.com/mcp
api https://api.moonpay.com/v1/transactions
echo "== moonpay llms"; curl -sL --max-time 20 https://dev.moonpay.com/llms.txt | head -2
mcp https://docs.paxos.com/mcp
api https://api.paxos.com/v2/profiles
echo "== paxos llms"; curl -sL --max-time 20 https://docs.paxos.com/llms.txt | head -2
echo "== paxos openapi"; curl -s --max-time 20 https://developer.paxos.com/docs/paxos-v2.openapi.json | head -c 120; echo
echo "== moonpay openapi"; curl -s --max-time 20 https://api.moonpay.com/platform/openapi.json | head -c 120; echo
