#!/usr/bin/env python3
"""Append verified-live URLs to products' urls.extra. Args: <products.json> <map.json>."""
import json
import sys

f = sys.argv[1]
add = json.load(open(sys.argv[2]))
ps = json.loads(open(f).read())
for p in ps:
    for u in add.get(p['id'], []):
        extra = p['urls'].setdefault('extra', [])
        if u not in extra:
            extra.append(u)
            print('added', p['id'], u)
open(f, 'w').write(json.dumps(ps, indent=2, ensure_ascii=False) + '\n')
print('done')
