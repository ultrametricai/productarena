#!/usr/bin/env python3
"""Diff aiEra scores between .pa-tmp-depth/rk-old.json and data/<arena>/rankings.json."""
import json, sys
arena = sys.argv[1]
def m(p):
    r = json.load(open(p))
    lb = r.get('leaderboards') or r.get('leaderboard')
    if isinstance(lb, dict) and 'aiEra' in lb:
        lb = lb['aiEra']
    return {e.get('productId') or e.get('id'): (e.get('score') if e.get('score') is not None else e.get('aiEra')) for e in lb}
o = m('.pa-tmp-depth/rk-old.json'); n = m(f'data/{arena}/rankings.json')
moved = False
for k in n:
    if o.get(k) != n[k]:
        print(f"{k}: {o.get(k)} -> {n[k]}"); moved = True
if not moved:
    print("no score moves")
