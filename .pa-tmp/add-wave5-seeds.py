#!/usr/bin/env python3
# Adds curated HN seeds (every id live-verified by the wave-5 research pass, 2026-09-22) and
# registry-verified popularity packages for the wave-5 arenas. Idempotent.
import json

def load(p):
    with open(p) as f:
        return json.load(f)

def dump(p, d):
    with open(p, 'w') as f:
        json.dump(d, f, indent=1, ensure_ascii=False)
        f.write('\n')

HN = 'https://hn.algolia.com/api/v1/items/'

SEEDS = {
    'applicant-tracking': {
        'greenhouse': ['32673164', '18159679'],
        'lever': ['37383717'],
        'ashby': ['48399528', '30713567', '30299800'],
    },
    'domain-registrars': {
        'porkbun': ['43358581', '47110362'],
        'name-com': ['5299534', '5676311'],
        'cloudflare-registrar': ['18083641', '19452391'],
        'godaddy': ['24506303', '18894792'],
        'namecheap': ['30504812', '11479422'],
    },
    'sso-identity': {
        'okta': ['30762520', '42955176', '37959904'],
        'microsoft-entra': ['44850681', '45282497'],
        'google-workspace': ['47255881', '46989217', '48600345'],
        'rippling-it': ['43388133', '35102454'],
        'jumpcloud': ['36706216'],
    },
}

seeds = load('pipeline/seeds/community.json')
for arena, products in SEEDS.items():
    arena_seeds = seeds.setdefault(arena, {})
    for pid, ids in products.items():
        if pid not in arena_seeds:
            arena_seeds[pid] = [HN + i for i in ids]
            print(f'community.json: {arena}/{pid} {len(ids)} seeds')
dump('pipeline/seeds/community.json', seeds)

PKGS = {
    'porkbun': {'npm': '@porkbunllc/mcp-server'},
    'name-com': {'npm': 'namecom-mcp'},
    'okta': {'npm': '@okta/okta-sdk-nodejs'},
    'microsoft-entra': {'npm': '@microsoft/microsoft-graph-client'},
    'google-workspace': {'npm': 'googleapis'},
    'rippling-it': {'npm': '@rippling/rippling-sdk'},
}
pkgs = load('pipeline/popularity-packages.json')
for pid, entry in PKGS.items():
    if pid not in pkgs:
        pkgs[pid] = entry
        print(f'popularity-packages.json: {pid} {entry}')
with open('pipeline/popularity-packages.json', 'w') as f:
    json.dump(pkgs, f, indent=2, ensure_ascii=False)
    f.write('\n')
print('done')
