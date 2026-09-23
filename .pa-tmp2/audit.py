#!/usr/bin/env python3
"""Print a product's positive verdicts with their citations. Args: <arena> <productId>."""
import json
import sys

arena, pid = sys.argv[1], sys.argv[2]
vs = [v for v in json.load(open(f'data/{arena}/verdicts.json'))
      if v['productId'] == pid and v['verdict'] in ('full', 'partial')]
ev = {e['id']: e for e in json.load(open(f'data/{arena}/evidence/{pid}.json'))}
for v in vs:
    print(v['storyId'], v['verdict'], 'q%s' % v['quality'])
    for eid in v['evidenceIds'][:3]:
        e = ev.get(eid)
        print('   ', eid, (e['url'] if e else 'MISSING'), '|', (e['excerpt'][:110] if e else ''))
