#!/usr/bin/env python3
# Registers the banking-as-a-service arena (the fourth of the stripe-lines tranche):
# categories.json entry, roadmap entry, community seeds, popularity packages, and the Stripe
# treasury family line flip. Idempotent.
import json


def load(p):
    with open(p) as f:
        return json.load(f)


def dump(p, d):
    with open(p, 'w') as f:
        json.dump(d, f, indent=2, ensure_ascii=False)
        f.write('\n')


cats = load('data/categories.json')
if not any(c['id'] == 'banking-as-a-service' for c in cats):
    cats.append({
        'id': 'banking-as-a-service',
        'name': 'Banking as a Service',
        'description': (
            'Banking-as-a-service platforms — embedded, insured deposit accounts and money movement (ACH, wires, RTP, '
            'FedNow, checks) behind a developer API — judged on account opening, FBO-structure transparency, rail coverage '
            'including the unhappy paths (returns, NOCs), KYC/KYB onboarding, the sponsor model (who actually holds the '
            'charter), ledger-to-bank reconciliation, statements and 1099s, risk controls, and agent access to banking '
            'state. This is the post-Synapse arena: the 2024 collapse froze ~$95M of end-user money behind pooled FBO '
            'accounts, and every 2026 product decision reads as a response — Increase founder Darragh Buckley bought Twin '
            'City Bank and relaunched it as Increase Bank (Jul 2026), Column N.A. was a chartered bank all along, Synctera '
            'registered its t-minus10 subsidiary as an MSB running per-fintech FBO accounts with daily reconciliation, and '
            'Treasury Prime pivoted to selling its Bank OS to sponsor banks after its 2024 layoffs. Stripe Treasury is '
            'judged with its gate on: relaunched Apr 2026 with stablecoin support and a v2 Treasury-for-Platforms API, but '
            'available only to approved Stripe Connect platforms. Modern Treasury is excluded — payment operations over '
            'your own bank accounts, not embedded banking.'
        ),
        'personas': ['developer', 'founder', 'ops', 'finance-lead', 'ai-native'],
        'themes': [
            'account-provisioning',
            'money-movement',
            'banking-onboarding',
            'sponsor-model',
            'banking-cards',
            'banking-ledger',
            'banking-risk-controls',
            'banking-agent-access',
        ],
    })
    print('categories.json: added banking-as-a-service')
    dump('data/categories.json', cats)

rm = load('data/arena-roadmap.json')
if not any(e['id'] == 'banking-as-a-service' for e in rm):
    rm.append({
        'id': 'banking-as-a-service',
        'name': 'Banking as a Service',
        'tier': 2,
        'status': 'live',
        'g2Equivalent': None,
        'candidateProducts': ['Stripe Treasury', 'Unit', 'Increase', 'Column', 'Synctera', 'Treasury Prime'],
        'rationale': (
            'Live arena: embedded accounts and money movement behind APIs, redefined by the Synapse collapse — the 2026 '
            'field splits into bank-direct (Column N.A., Increase Bank) and middleware with provable reconciliation '
            '(Synctera MSB, Unit, Treasury Prime); Stripe Treasury relaunched Apr 2026 with stablecoins, gated to Connect '
            'platforms. Modern Treasury excluded (payment ops, not embedded banking).'
        ),
        'aiEraAngle': (
            'llms.txt on all six docs hosts and raw OpenAPI specs on four, but Stripe is the only vendor with any MCP '
            'server and nobody documents agent-operated accounts — machine-readable trust (reconciliation, insurance '
            'provability) is the arena question agents will force.'
        ),
    })
    print('arena-roadmap.json: added banking-as-a-service (live)')
    dump('data/arena-roadmap.json', rm)

seeds = load('pipeline/seeds/community.json')
if 'banking-as-a-service' not in seeds:
    seeds['banking-as-a-service'] = {
        'stripe-treasury': [
            'https://hn.algolia.com/api/v1/items/25289626',
            'https://hn.algolia.com/api/v1/items/40806145',
            'https://hn.algolia.com/api/v1/items/47956190',
        ],
        'unit': [
            'https://hn.algolia.com/api/v1/items/34608079',
            'https://hn.algolia.com/api/v1/items/32488113',
            'https://hn.algolia.com/api/v1/items/28707188',
        ],
        'increase': [
            'https://hn.algolia.com/api/v1/items/32828669',
            'https://hn.algolia.com/api/v1/items/42442354',
            'https://hn.algolia.com/api/v1/items/40161794',
            'https://hn.algolia.com/api/v1/items/45302018',
        ],
        'column': [
            'https://hn.algolia.com/api/v1/items/31109170',
            'https://hn.algolia.com/api/v1/items/43976197',
            'https://hn.algolia.com/api/v1/items/45251815',
        ],
        'synctera': [
            'https://hn.algolia.com/api/v1/items/47771052',
            'https://hn.algolia.com/api/v1/items/49646495',
            'https://hn.algolia.com/api/v1/items/45726686',
        ],
        'treasury-prime': [
            'https://hn.algolia.com/api/v1/items/17298264',
            'https://hn.algolia.com/api/v1/items/26262992',
            'https://hn.algolia.com/api/v1/items/39560940',
        ],
    }
    dump('pipeline/seeds/community.json', seeds)
    print('community.json: added banking-as-a-service seeds')

pkgs = load('pipeline/popularity-packages.json')
added = []
for pid, entry in {
    'increase': {'npm': 'increase', 'pypi': 'increase'},
    'unit': {'npm': '@unit-finance/unit-node-sdk', 'pypi': 'unit-python-sdk'},
}.items():
    if pid not in pkgs:
        pkgs[pid] = entry
        added.append(pid)
if added:
    dump('pipeline/popularity-packages.json', pkgs)
    print('popularity-packages.json: added', ', '.join(added))

fams = load('data/product-families.json')
stripe = next(f for f in fams if f['id'] == 'stripe')
sp = next(s for s in stripe['subProducts'] if s['id'] == 'treasury')
if not sp.get('arenaRef'):
    sp['arenaRef'] = {'arenaId': 'banking-as-a-service', 'productId': 'stripe-treasury'}
    dump('data/product-families.json', fams)
    print('product-families.json: stripe/treasury -> banking-as-a-service/stripe-treasury')
print('done')
