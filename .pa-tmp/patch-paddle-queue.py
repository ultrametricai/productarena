#!/usr/bin/env python3
"""Patch the paddle spike-queue entry: its pass was interrupted by a transient LLM failure,
then completed from the judge cache and settled by .pa-tmp/revert-churn-paddle.ts
(15 kept / 10 reverted). Recorded here so the /queue page tells the true story."""
import json, os, subprocess, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
qp = os.path.join(ROOT, 'data', 'spike-queue.json')
q = json.load(open(qp))
e = next(x for x in q['queue'] if x['arena'] == 'payments' and x['productId'] == 'paddle')

old_ev = json.loads(subprocess.check_output(
    ['git', 'show', 'HEAD:data/payments/evidence/paddle.json'], cwd=ROOT))
old_ids = {x['id'] for x in old_ev}
new_ev = json.load(open(os.path.join(ROOT, 'data', 'payments', 'evidence', 'paddle.json')))
added = [x['id'] for x in new_ev if x['id'] not in old_ids]

now = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.000Z')
e['status'] = 'spiked'
e['lastSpiked'] = now
e['lastRun'] = {
    'at': now,
    'urlsAdded': [],
    'evidenceAdded': len(added),
    'cellsRejudged': 25,
    'flipsKept': 15,
    'flipsReverted': 10,
    'note': 'pass interrupted by a transient LLM parse failure, completed from the judge cache; churn settled by .pa-tmp/revert-churn-paddle.ts (llms.txt live; no new same-domain URLs beyond the crawled surface)',
}
json.dump(q, open(qp, 'w'), indent=2, ensure_ascii=False)
open(qp, 'a').write('\n')
print(f'paddle queue entry patched: +{len(added)} evidence, 15 kept / 10 reverted')
