# Churn audit for the figma re-judge (2026-09-14 deepening wave).
# Policy (README/methodology): verdict changes must be backed by NEW citations; na<->none never
# flips without new evidence; no-new-citation changes can't move close races.
import json

before = json.load(open('.pa-tmp2/before-figma-verdicts.json'))
after_all = json.load(open('data/design-tools/verdicts.json'))
after = {v['storyId']: v for v in after_all if v['productId'] == 'figma'}

# evidence ids that existed before this wave: reconstruct from git HEAD
import subprocess
old_ev = json.loads(subprocess.check_output(
    ['git', 'show', 'HEAD:data/design-tools/evidence/figma.json']))
old_ids = {e['id'] for e in old_ev}

changes = []
for sid, oldv in sorted(before.items()):
    n = after.get(sid)
    if n is None:
        print('MISSING after:', sid)
        continue
    if n['verdict'] != oldv:
        new_cites = [i for i in n['evidenceIds'] if i not in old_ids]
        changes.append((sid, oldv, n['verdict'], n['quality'], new_cites))

print(f'{len(changes)} verdict changes of {len(before)} cells')
for sid, o, nv, q, nc in changes:
    flag = 'NEW-CITES' if nc else '!! NO-NEW-CITATION'
    print(f'  {sid}: {o} -> {nv} q{q} [{flag}] {nc}')
