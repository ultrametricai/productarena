#!/usr/bin/env python3
"""Repair the churn-revert/probe-replacement collision: for every verdict citing a missing
evidence id, evict its judge-cache cell so the next judge run re-judges it against CURRENT
evidence (the corrected churn rule — revert is invalid when the old citations no longer
resolve, so the fresh judgment stands). Prints the products to re-judge."""
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, 'data')
CACHE = os.path.join(ROOT, 'pipeline', 'cache', 'judge')
products = set()
for arena in sorted(os.listdir(DATA)):
    vf = os.path.join(DATA, arena, 'verdicts.json')
    ed = os.path.join(DATA, arena, 'evidence')
    if not (os.path.isfile(vf) and os.path.isdir(ed)):
        continue
    verdicts = json.load(open(vf))
    ev_ids = {f[:-5]: {e['id'] for e in json.load(open(os.path.join(ed, f)))} for f in os.listdir(ed)}
    for v in verdicts:
        known = ev_ids.get(v['productId'], set())
        if any(i not in known for i in v.get('evidenceIds', [])):
            cell = os.path.join(CACHE, arena, v['productId'], v['storyId'] + '.json')
            if os.path.exists(cell):
                os.remove(cell)
                print('evicted', arena + '/' + v['productId'] + ':' + v['storyId'])
            products.add((arena, v['productId']))
print('re-judge needed for:', sorted(products))
