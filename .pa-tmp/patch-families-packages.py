#!/usr/bin/env python3
# Two small registrations for the error-tracking/expense-management bring-up:
# 1. product-families.json: update Mercury's io-card and spend-management notes now that an
#    expense-management arena exists (Mercury stays out while Spend ships only bundled).
# 2. popularity-packages.json: registry-verified official SDK packages for the error-tracking
#    vendors (sentry already present; glitchtip has no packages of its own — it consumes
#    Sentry SDKs, which is the finding).
import json

p = 'data/product-families.json'
fams = json.load(open(p))
for f in fams:
    if f['id'] == 'mercury':
        for s in f['subProducts']:
            if s['id'] == 'spend-management':
                s['note'] = (
                    'Launched Aug 2026; still bundled with Mercury banking (standalone "coming soon"), so it stays '
                    'scored inside Mercury’s startup-banking entry — the expense-management arena ranks '
                    'standalone spend platforms and will revisit if Mercury Spend ships standalone.'
                )
                print('families: updated mercury spend-management note')
            if s['id'] == 'io-card':
                s['note'] = (
                    'Card capabilities are scored inside Mercury’s startup-banking entry; Mercury is not ranked '
                    'in the expense-management arena while its spend product ships only bundled with banking.'
                )
                print('families: updated mercury io-card note')
with open(p, 'w') as fh:
    json.dump(fams, fh, indent=2)
    fh.write('\n')

p = 'pipeline/popularity-packages.json'
d = json.load(open(p))
add = {
    'rollbar': {'npm': 'rollbar', 'pypi': 'rollbar'},
    'bugsnag': {'npm': '@bugsnag/js', 'pypi': 'bugsnag'},
    'honeybadger': {'npm': '@honeybadger-io/js', 'pypi': 'honeybadger'},
    'raygun': {'npm': 'raygun4js', 'pypi': 'raygun4py'},
}
for k, v in add.items():
    if k in d:
        print('packages: exists, skipping:', k)
    else:
        d[k] = v
        print('packages: added', k, v)
with open(p, 'w') as fh:
    json.dump(d, fh, indent=2)
    fh.write('\n')
