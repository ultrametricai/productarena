#!/usr/bin/env python3
"""List every verdict cell whose evidenceIds cite an id absent from the product's evidence
file (fleet-wide integrity sweep)."""
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, 'data')
for arena in sorted(os.listdir(DATA)):
    vf = os.path.join(DATA, arena, 'verdicts.json')
    ed = os.path.join(DATA, arena, 'evidence')
    if not (os.path.isfile(vf) and os.path.isdir(ed)):
        continue
    verdicts = json.load(open(vf))
    ev_ids = {}
    for f in os.listdir(ed):
        pid = f[:-5]
        ev_ids[pid] = {e['id'] for e in json.load(open(os.path.join(ed, f)))}
    for v in verdicts:
        known = ev_ids.get(v['productId'], set())
        missing = [i for i in v.get('evidenceIds', []) if i not in known]
        if missing:
            print(f"{arena}/{v['productId']}:{v['storyId']} -> missing {missing}")
