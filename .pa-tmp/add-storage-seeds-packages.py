#!/usr/bin/env python3
# Curated HN seeds + registry-verified SDK packages for cloud-storage (see
# .pa-tmp/cloud-storage-notes.md — every item id and package verified live). Idempotent.
import json

p = 'pipeline/seeds/community.json'
seeds = json.load(open(p))
if 'cloud-storage' not in seeds:
    seeds['cloud-storage'] = {
        'dropbox': ['https://hn.algolia.com/api/v1/items/7566069', 'https://hn.algolia.com/api/v1/items/12463338'],
        'google-drive': ['https://hn.algolia.com/api/v1/items/3884720', 'https://hn.algolia.com/api/v1/items/38427864', 'https://hn.algolia.com/api/v1/items/27858032'],
        'box': ['https://hn.algolia.com/api/v1/items/7461452', 'https://hn.algolia.com/api/v1/items/5208009'],
        'onedrive': ['https://hn.algolia.com/api/v1/items/13932226', 'https://hn.algolia.com/api/v1/items/40781048', 'https://hn.algolia.com/api/v1/items/46526376'],
    }
    print('community.json: added cloud-storage (10 items)')
with open(p, 'w') as f:
    json.dump(seeds, f, indent=2, ensure_ascii=False)
    f.write('\n')

p = 'pipeline/popularity-packages.json'
pkgs = json.load(open(p))
new = {
    'dropbox': {'npm': 'dropbox', 'pypi': 'dropbox'},
    'google-drive': {'npm': '@googleapis/drive', 'pypi': 'google-api-python-client'},
    'box': {'npm': 'box-node-sdk', 'pypi': 'boxsdk'},
    'onedrive': {'npm': '@microsoft/microsoft-graph-client', 'pypi': 'msgraph-sdk'},
}
for k, v in new.items():
    if k not in pkgs:
        pkgs[k] = v
        print('popularity-packages.json: added', k, v)
with open(p, 'w') as f:
    json.dump(pkgs, f, indent=2, ensure_ascii=False)
    f.write('\n')
print('done')
