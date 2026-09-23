#!/usr/bin/env python3
# Curated HN community seeds + popularity packages for the launch-day arenas. Every HN item id
# was verified live via the hn.algolia items API by the corpus pass; every package name was
# verified on its registry. Idempotent. Usage: python3 .pa-tmp/add-cloud-seeds-packages.py <arena>
import json
import sys

SEEDS = {
    'cloud-platforms': {
        'aws': [
            'https://hn.algolia.com/api/v1/items/27044371',
            'https://hn.algolia.com/api/v1/items/29332207',
        ],
        'google-cloud': [
            'https://hn.algolia.com/api/v1/items/32547912',
            'https://hn.algolia.com/api/v1/items/44260810',
        ],
        'azure': [
            'https://hn.algolia.com/api/v1/items/45748661',
        ],
        'oracle-cloud': [
            'https://hn.algolia.com/api/v1/items/42901897',
            'https://hn.algolia.com/api/v1/items/36570158',
            'https://hn.algolia.com/api/v1/items/26418492',
        ],
    },
    'cloud-storage': {},  # filled by the cloud-storage corpus pass
}

PACKAGES = {
    'cloud-platforms': {
        'aws': {'npm': '@aws-sdk/client-s3', 'pypi': 'boto3'},
        'google-cloud': {'npm': '@google-cloud/storage', 'pypi': 'google-cloud-storage'},
        'azure': {'npm': '@azure/identity', 'pypi': 'azure-identity'},
        'oracle-cloud': {'npm': 'oci-sdk', 'pypi': 'oci'},
    },
    'cloud-storage': {},
}

arena = sys.argv[1]

p = 'pipeline/seeds/community.json'
seeds = json.load(open(p))
if arena not in seeds and SEEDS[arena]:
    seeds[arena] = SEEDS[arena]
    print(f'community.json: added {arena} ({sum(len(v) for v in SEEDS[arena].values())} items)')
with open(p, 'w') as f:
    json.dump(seeds, f, indent=2, ensure_ascii=False)
    f.write('\n')

p = 'pipeline/popularity-packages.json'
pkgs = json.load(open(p))
for pid, entry in PACKAGES[arena].items():
    if pid not in pkgs:
        pkgs[pid] = entry
        print(f'popularity-packages.json: added {pid} {entry}')
with open(p, 'w') as f:
    json.dump(pkgs, f, indent=2, ensure_ascii=False)
    f.write('\n')
print('done')
