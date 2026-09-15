#!/usr/bin/env python3
"""Scan HN (Algolia API) for qualifying community threads for the wave-2 arena products.
Prints candidate story items (>=20 points, on-topic title) for hand-curation into
pipeline/seeds/community.json. Honest zeros stay zeros."""
import json, urllib.request, urllib.parse

QUERIES = {
    'persona': ['withpersona.com'],
    'entrust-onfido': ['onfido'],
    'sumsub': ['sumsub'],
    'veriff': ['veriff'],
    'plaid-idv': ['plaid identity verification'],
    'stripe-identity': ['stripe identity'],
    'plaid': ['plaid.com', 'plaid api'],
    'mx': ['mx.com'],
    'mastercard-open-finance': ['finicity'],
    'teller': ['teller.io'],
    'truelayer': ['truelayer'],
    'yapily': ['yapily'],
    'stripe-financial-connections': ['stripe financial connections'],
    'stripe-crypto': ['stripe stablecoin', 'stripe crypto'],
    'circle': ['circle usdc'],
    'bvnk': ['bvnk'],
    'coinbase-payments': ['coinbase commerce', 'coinbase x402'],
    'moonpay': ['moonpay'],
    'paxos': ['paxos'],
}

for pid, queries in QUERIES.items():
    for q in queries:
        url = 'https://hn.algolia.com/api/v1/search?tags=story&numericFilters=points>=20&query=' + urllib.parse.quote(q)
        try:
            with urllib.request.urlopen(url, timeout=15) as r:
                hits = json.load(r).get('hits', [])[:5]
        except Exception as e:
            print(pid, q, 'FETCH FAIL', e)
            continue
        for h in hits:
            print(f"{pid} | {h['points']}pts {h.get('num_comments',0)}c | {h['objectID']} | {h['title'][:90]} | {h.get('url','')[:60]}")
