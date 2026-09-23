#!/usr/bin/env python3
# Wave-5 process wiring: the steps that motivated the four new arenas get optionsArenaId /
# extraOptionArenas pointing at them, and the registrar chip that meant "Cloudflare the
# registrar" is renamed to the scoped cloudflare_registrar vendor key. Idempotent.
import json

with open('data/processes.json') as f:
    tasks = json.load(f)

by_id = {t['id']: t for t in tasks}

def node(tid, nid):
    return next(n for n in by_id[tid]['dag']['nodes'] if n['id'] == nid)

changes = []

def set_arena(tid, nid, arena, opts=None):
    n = node(tid, nid)
    if n.get('optionsArenaId') != arena:
        n['optionsArenaId'] = arena
        changes.append(f'{tid}/{nid}: optionsArenaId={arena}')
    if opts and n.get('vendorOptions') != opts:
        n['vendorOptions'] = opts
        changes.append(f'{tid}/{nid}: vendorOptions={opts}')

# compliance-automation
set_arena('comp_001', 'n1', 'compliance-automation', ['vanta', 'drata', 'secureframe', 'oneleet'])
set_arena('comp_002', 'n2', 'compliance-automation')
set_arena('comp_014', 'n2', 'compliance-automation')
# comp_013 n1 (pick a pen-test firm) stays curated: only Oneleet actually sells pen tests —
# deriving the whole compliance roster as pen-test options would be dishonest.

# applicant-tracking
set_arena('hr_004', 'n1', 'applicant-tracking', ['lever', 'greenhouse', 'ashby', 'workable', 'recruitee'])
set_arena('scale_008', 'n2', 'applicant-tracking', ['lever', 'ashby'])
hr010_n4 = node('hr_010', 'n4')
if 'applicant-tracking' not in (hr010_n4.get('extraOptionArenas') or []):
    hr010_n4.setdefault('extraOptionArenas', []).append('applicant-tracking')
    changes.append('hr_010/n4: extraOptionArenas += applicant-tracking')

# domain-registrars
set_arena('prod_003', 'n1', 'domain-registrars', ['namecheap', 'porkbun', 'name_com', 'cloudflare_registrar'])
d1 = node('domain_001', 'n1')
if 'cloudflare' in (d1.get('vendorOptions') or []):
    d1['vendorOptions'] = [('cloudflare_registrar' if v == 'cloudflare' else v) for v in d1['vendorOptions']]
    changes.append('domain_001/n1: cloudflare -> cloudflare_registrar')
set_arena('domain_001', 'n1', 'domain-registrars')

# sso-identity
set_arena('scale_007', 'n1', 'sso-identity', ['okta', 'jumpcloud', 'microsoft_entra', 'google_workspace', 'rippling_it'])
opp = node('opp_007', 'n3')
if opp.get('optionsArenaId') == 'auth-platforms':
    opp['optionsArenaId'] = 'sso-identity'
    changes.append('opp_007/n3: optionsArenaId auth-platforms -> sso-identity (workforce IdP function; WorkOS/Auth0 stay as curated cross-arena extras)')

with open('data/processes.json', 'w') as f:
    json.dump(tasks, f, indent=1, ensure_ascii=False)
    f.write('\n')
print('\n'.join(changes) or 'no changes')
