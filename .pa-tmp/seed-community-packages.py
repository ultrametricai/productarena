#!/usr/bin/env python3
"""Wave-2: community seeds (hand-curated from the HN Algolia scan in hn-seed-scan.py) and
registry-verified popularity packages. Products absent from community seeds are honest zeros —
no qualifying on-topic HN threads >=20 points found for: persona, sumsub, veriff, plaid-idv,
entrust-onfido, mx, mastercard-open-finance, truelayer, yapily, bvnk, paxos."""
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

path = os.path.join(ROOT, 'pipeline', 'seeds', 'community.json')
c = json.load(open(path))
def hn(i): return f'https://hn.algolia.com/api/v1/items/{i}'
c.setdefault('identity-verification', {})
c['identity-verification'].setdefault('stripe-identity', [hn(27502993)])
c.setdefault('banking-data-apis', {})
c['banking-data-apis'].setdefault('stripe-financial-connections', [hn(31262361), hn(31284031)])
c['banking-data-apis'].setdefault('plaid', [hn(20040182), hn(21782196), hn(13839589)])
c['banking-data-apis'].setdefault('teller', [hn(14605342), hn(11636847)])
c.setdefault('stablecoin-payments', {})
c['stablecoin-payments'].setdefault('stripe-crypto', [hn(30628677), hn(40161378), hn(43921040), hn(32945295)])
c['stablecoin-payments'].setdefault('circle', [hn(35112336), hn(35108711)])
c['stablecoin-payments'].setdefault('coinbase-payments', [hn(16381814), hn(20697621)])
c['stablecoin-payments'].setdefault('moonpay', [hn(44546422)])
with open(path, 'w') as f:
    json.dump(c, f, indent=2, ensure_ascii=False)
    f.write('\n')
print('community.json updated')

# stripe-* lines share the family SDK already listed for payments/stripe so they are NOT
# double-listed (house rule); plaid-idv shares plaid's SDK likewise; bvnk/paxos/
# mastercard-open-finance have no single official registry SDK (verified) — omitted.
path = os.path.join(ROOT, 'pipeline', 'popularity-packages.json')
pp = json.load(open(path))
adds = {
    'persona': {'npm': 'persona'},
    'entrust-onfido': {'npm': '@onfido/api', 'pypi': 'onfido-python'},
    'sumsub': {'npm': '@sumsub/websdk'},
    'veriff': {'npm': '@veriff/js-sdk'},
    'plaid': {'npm': 'plaid', 'pypi': 'plaid-python'},
    'mx': {'npm': 'mx-platform-node', 'pypi': 'mx-platform-python'},
    'teller': {'npm': 'teller-connect-react'},
    'truelayer': {'npm': 'truelayer-signing'},
    'yapily': {'npm': '@yapily/yapily-api'},
    'circle': {'npm': '@circle-fin/developer-controlled-wallets'},
    'coinbase-payments': {'npm': '@coinbase/cdp-sdk'},
    'moonpay': {'npm': '@moonpay/moonpay-js'},
}
for k, v in adds.items():
    if k not in pp:
        pp[k] = v
        print('popularity-packages + ' + k)
with open(path, 'w') as f:
    json.dump(pp, f, indent=2, ensure_ascii=False)
    f.write('\n')
