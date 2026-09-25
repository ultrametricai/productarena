#!/usr/bin/env python3
"""Record honest lastRun entries in spike-queue.json for the two marketplace-payments
products whose engine passes were interrupted by the transient DNS outage and settled
manually (settle-mp-churn.ts)."""
import json, datetime

old = {p['id']: set(p['urls'].get('extra', [])) for p in json.load(open('.pa-tmp-depth/mp-products-old.json'))}
cur = json.load(open('data/marketplace-payments/products.json'))
added = {p['id']: [u for u in p['urls'].get('extra', []) if u not in old[p['id']]] for p in cur}
for k, v in added.items():
    if v:
        print(k, len(v), 'urls added')

q = json.load(open('data/spike-queue.json'))
now = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.000Z')
stats = {'mangopay': (17, 17, 11, 6), 'rainforest': (23, 25, 18, 7)}
for e in q['queue']:
    if e['arena'] == 'marketplace-payments' and e['productId'] in stats:
        ev, cells, kept, rev = stats[e['productId']]
        e['lastSpiked'] = now
        e['status'] = 'spiked'
        e['lastRun'] = {
            'at': now,
            'urlsAdded': added.get(e['productId'], []),
            'evidenceAdded': ev,
            'cellsRejudged': cells,
            'flipsKept': kept,
            'flipsReverted': rev,
            'note': 'full pass; judge interrupted twice by transient local DNS outage (ENOTFOUND api.anthropic.com); churn policy settled manually via settle-mp-churn.ts against pre-wave HEAD baseline',
        }
json.dump(q, open('data/spike-queue.json', 'w'), indent=2, ensure_ascii=False)
open('data/spike-queue.json', 'a').write('\n')
print('queue updated')
