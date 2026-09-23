#!/usr/bin/env python3
# Compliance-automation seeds + popularity packages, and family/sub-product wiring for the
# wave-5 scoped products (cloudflare-registrar, google-workspace, microsoft-entra). Idempotent.
import json

def load(p):
    with open(p) as f:
        return json.load(f)

def dump(p, d, indent=2):
    with open(p, 'w') as f:
        json.dump(d, f, indent=indent, ensure_ascii=False)
        f.write('\n')

HN = 'https://hn.algolia.com/api/v1/items/'
seeds = load('pipeline/seeds/community.json')
ca = seeds.setdefault('compliance-automation', {})
for pid, ids in {
    'vanta': ['27042887', '43014712'],
    'drata': ['29588054'],
    'oneleet': ['35905927'],
    'secureframe': ['24849984'],
    'sprinto': ['46170713'],
}.items():
    if pid not in ca:
        ca[pid] = [HN + i for i in ids]
        print(f'community.json: compliance-automation/{pid} {len(ids)} seeds')
dump('pipeline/seeds/community.json', seeds)

pkgs = load('pipeline/popularity-packages.json')
if 'vanta' not in pkgs:
    pkgs['vanta'] = {'npm': 'vanta-auditor-api-sdk'}
    print('popularity-packages.json: vanta')
dump('pipeline/popularity-packages.json', pkgs)

fams = load('data/product-families.json')
for f in fams:
    if f['id'] == 'cloudflare' and not any(s['id'] == 'registrar' for s in f['subProducts']):
        f['subProducts'].append({
            'id': 'registrar',
            'name': 'Registrar',
            'blurb': 'At-cost domain registration — registry wholesale plus the ICANN fee, no markup — for domains served by Cloudflare nameservers.',
            'docsUrl': 'https://developers.cloudflare.com/registrar/',
            'arenaRef': {'arenaId': 'domain-registrars', 'productId': 'cloudflare-registrar'},
        })
        print('families: cloudflare += registrar')
    if f['id'] == 'google' and not any(s['id'] == 'workspace' for s in f['subProducts']):
        f['subProducts'].append({
            'id': 'workspace',
            'name': 'Google Workspace',
            'blurb': 'Gmail/Docs/Meet productivity suite that doubles as a workforce IdP: Cloud Identity directory, SAML app catalog, provisioning, and the Admin SDK.',
            'docsUrl': 'https://developers.google.com/workspace/admin',
            'arenaRef': {'arenaId': 'sso-identity', 'productId': 'google-workspace'},
        })
        print('families: google += workspace')
    if f['id'] == 'microsoft' and not any(s['id'] == 'entra-id' for s in f['subProducts']):
        f['subProducts'].append({
            'id': 'entra-id',
            'name': 'Microsoft Entra ID',
            'blurb': 'The cloud IdP formerly Azure AD: enterprise app gallery, SCIM provisioning, Conditional Access, and Microsoft Graph as the directory API.',
            'docsUrl': 'https://learn.microsoft.com/en-us/entra/identity/',
            'arenaRef': {'arenaId': 'sso-identity', 'productId': 'microsoft-entra'},
        })
        print('families: microsoft += entra-id')
dump('data/product-families.json', fams)

# familyId back-references on the new products.
for path, pid, fam in [
    ('data/domain-registrars/products.json', 'cloudflare-registrar', 'cloudflare'),
    ('data/sso-identity/products.json', 'google-workspace', 'google'),
    ('data/sso-identity/products.json', 'microsoft-entra', 'microsoft'),
]:
    prods = load(path)
    for p in prods:
        if p['id'] == pid and 'familyId' not in p:
            p['familyId'] = fam
            print(f'{path}: {pid} familyId={fam}')
    dump(path, prods, indent=1)
print('done')
