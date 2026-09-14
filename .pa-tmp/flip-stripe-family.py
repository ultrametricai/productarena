import json
p = 'data/product-families.json'
d = json.load(open(p))
fam = [f for f in d if f['id'] == 'stripe'][0]
for sp in fam['subProducts']:
    if sp['id'] == 'billing':
        sp['arenaRef'] = {'arenaId': 'billing-subscriptions', 'productId': 'stripe-billing'}
        sp.pop('note', None)
    if sp['id'] == 'radar':
        sp['arenaRef'] = {'arenaId': 'fraud-prevention', 'productId': 'stripe-radar'}
        sp.pop('note', None)
    if sp['id'] == 'invoicing':
        sp['note'] = ('Sold as part of Billing; judged inside the Stripe Billing entry in the '
                      'billing-subscriptions arena (and hosted-invoice stories in payments).')
json.dump(d, open(p, 'w'), indent=2, ensure_ascii=False)
open(p, 'a').write('\n')
print('ok')
