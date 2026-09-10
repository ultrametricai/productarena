#!/usr/bin/env python3
# Adds community seeds + registry-verified popularity packages for the two new arenas.
# HN item ids were verified on-topic (title + comments fetched) during research; arenas with
# thin HN footprints (Decagon/Pylon/Lorikeet/Parahelp have near-zero real threads) get only
# the genuinely on-topic items — honesty over padding.
import json

def load(p):
    with open(p) as f:
        return json.load(f)

def dump(p, d):
    with open(p, 'w') as f:
        json.dump(d, f, indent=2, ensure_ascii=False)
        f.write('\n')

seeds = load('pipeline/seeds/community.json')
if 'ai-support-agents' not in seeds:
    seeds['ai-support-agents'] = {
        'intercom-fin': [
            'https://hn.algolia.com/api/v1/items/48540126',
            'https://hn.algolia.com/api/v1/items/48128842',
            'https://hn.algolia.com/api/v1/items/43654932',
        ],
        'decagon': [
            'https://hn.algolia.com/api/v1/items/42049451',
        ],
        'sierra': [
            'https://hn.algolia.com/api/v1/items/48010266',
            'https://hn.algolia.com/api/v1/items/47520448',
            'https://hn.algolia.com/api/v1/items/39358925',
        ],
        'pylon': [
            'https://hn.algolia.com/api/v1/items/42811146',
        ],
        'lorikeet': [
            'https://hn.algolia.com/api/v1/items/47847848',
        ],
        'parahelp': [
            'https://hn.algolia.com/api/v1/items/44142610',
        ],
    }
    print('community.json: added ai-support-agents seeds')

if 'durable-workflows' not in seeds:
    seeds['durable-workflows'] = {}  # filled by the durable-workflows step
    print('community.json: placeholder for durable-workflows')

dump('pipeline/seeds/community.json', seeds)

pkgs = load('pipeline/popularity-packages.json')
added = []
for pid, entry in {
    'intercom-fin': {'npm': 'intercom-client', 'pypi': 'python-intercom'},
    'decagon': {'npm': '@decagon-ai/duet-cli'},
    'lorikeet': {'npm': '@lorikeetai/node-sdk'},
}.items():
    if pid not in pkgs:
        pkgs[pid] = entry
        added.append(pid)
dump('pipeline/popularity-packages.json', pkgs)
print('popularity-packages.json: added', added)
