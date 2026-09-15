#!/bin/sh
# Live-verify probe candidates for identity-verification before authoring pipeline/probes/.
INIT='{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"pa-probe","version":"1.0"}}}'
echo "== stripe identity api keyless"
curl -si --max-time 20 https://api.stripe.com/v1/identity/verification_sessions | head -4
echo "== persona docs mcp initialize"
curl -s --max-time 20 -X POST https://docs.withpersona.com/mcp -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' -d "$INIT" | head -c 400; echo
echo "== persona api keyless"
curl -si --max-time 20 https://api.withpersona.com/api/v1/inquiries | head -6
curl -si --max-time 20 "https://withpersona.com/api/v1/inquiries" | head -4
echo "== persona llms.txt"
curl -sL --max-time 20 https://docs.withpersona.com/llms.txt | head -3
echo "== sumsub mcp initialize"
curl -s --max-time 20 -X POST https://docs.sumsub.com/mcp -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' -d "$INIT" | head -c 300; echo
echo "== sumsub api keyless"
curl -si --max-time 20 https://api.sumsub.com/resources/applicants/-;externalUserId=x/one | head -4
echo "== sumsub llms.txt"
curl -sL --max-time 20 https://docs.sumsub.com/llms.txt | head -2
echo "== veriff llms.txt"
curl -sL --max-time 20 https://devdocs.veriff.com/llms.txt | head -2
echo "== veriff api keyless"
curl -si --max-time 20 -X POST https://stationapi.veriff.com/v1/sessions -H 'Content-Type: application/json' -d '{}' | head -4
echo "== onfido api keyless"
curl -si --max-time 20 https://api.eu.onfido.com/v3.6/applicants | head -4
echo "== entrust docs llms.txt"
curl -sL --max-time 20 https://documentation.identity.entrust.com/llms.txt | head -2
echo "== plaid api keyless"
curl -si --max-time 20 -X POST https://production.plaid.com/identity_verification/list -H 'Content-Type: application/json' -d '{}' | head -8
echo "== plaid docs llms.txt"
curl -sL --max-time 20 https://plaid.com/docs/llms.txt | head -2
echo "== stripe llms.txt"
curl -sL --max-time 20 https://docs.stripe.com/llms.txt | head -2
