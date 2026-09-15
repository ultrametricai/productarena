#!/usr/bin/env python3
# Adds Orb to the adyen family as an acquired line (Adyen closed the $335M Orb acquisition
# Jul 6, 2026 — verified via withorb.com banner + press during the marketplace-payments
# bring-up crawl) and stamps familyId on the ranked billing-subscriptions product, the same
# Metronome/Clerky precedent the stripe family uses. Idempotent.
import json


def load(p):
    with open(p) as f:
        return json.load(f)


def dump(p, d):
    with open(p, 'w') as f:
        json.dump(d, f, indent=2, ensure_ascii=False)
        f.write('\n')


fams = load('data/product-families.json')
adyen = next(f for f in fams if f['id'] == 'adyen')
if not any(sp['id'] == 'orb' for sp in adyen['subProducts']):
    plat_idx = next(i for i, sp in enumerate(adyen['subProducts']) if sp['id'] == 'platforms')
    adyen['subProducts'].insert(plat_idx + 1, {
        'id': 'orb',
        'name': 'Orb',
        'blurb': (
            'Usage-based billing and metering platform — an Adyen company since July 2026 ($335M), still sold standalone '
            'and judged as its own product in the billing-subscriptions arena.'
        ),
        'docsUrl': 'https://docs.withorb.com',
        'arenaRef': {'arenaId': 'billing-subscriptions', 'productId': 'orb'},
        'acquired': 'Acquired by Adyen (Jul 2026) — still operates and competes as its own product',
    })
    dump('data/product-families.json', fams)
    print('product-families.json: added orb line to adyen family')

prods = load('data/billing-subscriptions/products.json')
orb = next(p for p in prods if p['id'] == 'orb')
if orb.get('familyId') != 'adyen':
    orb['familyId'] = 'adyen'
    dump('data/billing-subscriptions/products.json', prods)
    print('billing-subscriptions/products.json: stamped familyId adyen on orb')
print('done')
