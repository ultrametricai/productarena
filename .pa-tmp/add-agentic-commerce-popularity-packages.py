#!/usr/bin/env python3
# Adds registry package mappings for the agentic-commerce arena products (display-only
# popularity signal). All names registry-verified 2026-09-14 via npm/PyPI JSON APIs.
import json

p = 'pipeline/popularity-packages.json'
d = json.load(open(p))
add = {
    'stripe-agentic-commerce': {'npm': 'mppx'},
    'shopify-ucp': {'npm': '@shopify/ucp-cli'},
    'paypal-agent-commerce': {'npm': '@paypal/agent-toolkit', 'pypi': 'paypal-agent-toolkit'},
    'coinbase-x402': {'npm': 'x402'},
    'visa-intelligent-commerce': {'npm': '@visaacceptance/mcp'},
    'crossmint': {'npm': '@crossmint/server-sdk'},
    'skyfire': {'npm': '@skyfire-xyz/skyfire-seller-sdk-node'},
}
for k, v in add.items():
    if k not in d:
        d[k] = v
with open(p, 'w') as f:
    json.dump(d, f, indent=2, ensure_ascii=False)
    f.write('\n')
print('added', sorted(add))
