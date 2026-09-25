#!/usr/bin/env python3
"""List foreloop verdict changes vs the pre-wave snapshot, flagging favorable flips."""
import json

RANK = {'na': 0, 'none': 0, 'disputed': 1, 'partial': 2, 'full': 3}
old = {v['storyId']: v for v in json.load(open('.pa-tmp-depth/pf-verdicts-old.json')) if v['productId'] == 'foreloop'}
new = [v for v in json.load(open('data/product-feedback/verdicts.json')) if v['productId'] == 'foreloop']
oldev = {e['id'] for e in json.load(open('.pa-tmp-depth/pf-evidence-old.json'))}
for v in new:
    o = old.get(v['storyId'])
    if not o:
        print(f"NEW-CELL {v['storyId']}: {v['verdict']}/q{v['quality']}")
        continue
    if o['verdict'] == v['verdict'] and o['quality'] == v['quality']:
        continue
    up = (RANK[v['verdict']], v['quality']) > (RANK[o['verdict']], o['quality'])
    newids = [i for i in v['evidenceIds'] if i not in oldev]
    print(f"{'FAVORABLE' if up else 'down/neutral'} {v['storyId']}: {o['verdict']}/q{o['quality']} -> {v['verdict']}/q{v['quality']} | new-ids: {newids}")
