#!/usr/bin/env python3
"""Remove GAIA-derived evidence and the GAIA URL from amd-ryzen-9-9950x3d (not Ryzen AI hardware)."""
import json

GAIA = 'https://raw.githubusercontent.com/amd/gaia/HEAD/README.md'

ef = 'data/processors/evidence/amd-ryzen-9-9950x3d.json'
ev = json.load(open(ef))
kept = [e for e in ev if e['url'] != GAIA]
removed = [e['id'] for e in ev if e['url'] == GAIA]
open(ef, 'w').write(json.dumps(kept, indent=2, ensure_ascii=False) + '\n')
print('removed evidence:', removed)

pf = 'data/processors/products.json'
ps = json.load(open(pf))
for p in ps:
    if p['id'] == 'amd-ryzen-9-9950x3d':
        extra = p['urls'].get('extra', [])
        if GAIA in extra:
            extra.remove(GAIA)
            print('removed url from products.json')
open(pf, 'w').write(json.dumps(ps, indent=2, ensure_ascii=False) + '\n')
