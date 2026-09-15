#!/usr/bin/env python3
# Follow-up to the enrichment crawl (2026-09-14): the sandbox and REST-overview pages were
# crawled (extra-18/extra-19) but the extraction quota kept none of their content, leaving
# api-sandbox a false zero. Quotes are verbatim from the crawled cache.
import datetime
import json

NOW = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.000Z')
ITEMS = [
    {
        'id': 'paypal-ac-supp-sandbox',
        'tier': 'claimed-docs',
        'url': 'https://developer.paypal.com/tools/sandbox/',
        'excerpt': 'The PayPal sandbox "is a self-contained, virtual testing environment that simulates the live PayPal production environment" — "a shielded space where you can initiate and watch while your apps process PayPal API requests without touching any live PayPal acc[ounts]"; "the sandbox mirrors the features on the PayPal production servers", with sandbox accounts and "their associated authentication credentials" used "in your PayPal API calls" so "you can test and debug your apps" before going live. Agent-commerce flows (cart API, agent toolkit tools) run against the same REST surface.',
        'fetchedAt': NOW,
    },
    {
        'id': 'paypal-ac-supp-rest-overview',
        'tier': 'claimed-docs',
        'url': 'https://developer.paypal.com/api/rest/',
        'excerpt': 'The developer portal\'s REST API getting-started page anchors the agent surface: "REST APIs, including orders, payments, subscriptions, invoicing, and disputes", authenticated with OAuth 2 access tokens, alongside Server SDKs, API response Codes, and Webhook events references — the same rails the Agent Toolkit\'s tools call.',
        'fetchedAt': NOW,
    },
]

path = 'data/agentic-commerce/evidence/paypal-agent-commerce.json'
ev = json.load(open(path))
have = {e['id'] for e in ev}
for item in ITEMS:
    if item['id'] not in have:
        ev.append(item)
with open(path, 'w') as f:
    json.dump(ev, f, indent=2, ensure_ascii=False)
    f.write('\n')
print(f'paypal-agent-commerce: {len(ev)} evidence items')
