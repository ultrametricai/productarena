#!/usr/bin/env python3
# durable-workflows community seeds + registry-verified popularity packages. All HN item ids
# verified on-topic with comments during research; all packages verified against npm/pypistats.
import json

def load(p):
    with open(p) as f:
        return json.load(f)

def dump(p, d):
    with open(p, 'w') as f:
        json.dump(d, f, indent=2, ensure_ascii=False)
        f.write('\n')

seeds = load('pipeline/seeds/community.json')
if not seeds.get('durable-workflows'):
    seeds['durable-workflows'] = {
        'temporal': [
            'https://hn.algolia.com/api/v1/items/24815640',
            'https://hn.algolia.com/api/v1/items/40287341',
            'https://hn.algolia.com/api/v1/items/35804220',
        ],
        'inngest': [
            'https://hn.algolia.com/api/v1/items/41604042',
            'https://hn.algolia.com/api/v1/items/36403014',
            'https://hn.algolia.com/api/v1/items/36696800',
        ],
        'trigger-dev': [
            'https://hn.algolia.com/api/v1/items/34610686',
            'https://hn.algolia.com/api/v1/items/37750763',
            'https://hn.algolia.com/api/v1/items/45250720',
        ],
        'restate': [
            'https://hn.algolia.com/api/v1/items/40659160',
            'https://hn.algolia.com/api/v1/items/43294756',
            'https://hn.algolia.com/api/v1/items/39627851',
        ],
        'hatchet': [
            'https://hn.algolia.com/api/v1/items/39643136',
            'https://hn.algolia.com/api/v1/items/40810986',
            'https://hn.algolia.com/api/v1/items/43572733',
        ],
        'dbos': [
            'https://hn.algolia.com/api/v1/items/42379974',
            'https://hn.algolia.com/api/v1/items/45920156',
            'https://hn.algolia.com/api/v1/items/41502094',
        ],
    }
    print('community.json: added durable-workflows seeds')
dump('pipeline/seeds/community.json', seeds)

pkgs = load('pipeline/popularity-packages.json')
print('existing temporal entry:', pkgs.get('temporal'))
added = []
for pid, entry in {
    'temporal': {'npm': '@temporalio/worker', 'pypi': 'temporalio'},
    'inngest': {'npm': 'inngest', 'pypi': 'inngest'},
    'trigger-dev': {'npm': '@trigger.dev/sdk'},
    'restate': {'npm': '@restatedev/restate-sdk', 'pypi': 'restate-sdk'},
    'hatchet': {'pypi': 'hatchet-sdk', 'npm': '@hatchet-dev/typescript-sdk'},
    'dbos': {'pypi': 'dbos', 'npm': '@dbos-inc/dbos-sdk'},
}.items():
    if pid not in pkgs:
        pkgs[pid] = entry
        added.append(pid)
dump('pipeline/popularity-packages.json', pkgs)
print('popularity-packages.json: added', added)
