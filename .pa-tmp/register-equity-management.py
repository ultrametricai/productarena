#!/usr/bin/env python3
# Registers the equity-management arena: categories.json entry, arena icon, adjacent-arenas
# cluster, roadmap live-flip (cap-table -> equity-management), community seeds, search aliases.
# Idempotent (skips when already present).
import json

def load(p):
    with open(p) as f:
        return json.load(f)

def dump(p, d):
    with open(p, 'w') as f:
        json.dump(d, f, indent=2, ensure_ascii=False)
        f.write('\n')

# --- categories.json ---
cats = load('data/categories.json')
if not any(c['id'] == 'equity-management' for c in cats):
    cats.append({
        'id': 'equity-management',
        'name': 'Cap Table & Equity',
        'description': (
            'Cap table and equity management platforms — the ownership ledger of a startup — judged on maintaining the '
            'capitalization table as a live single source of truth (share classes, certificates, SAFEs and convertibles, option '
            'grants), issuing options with board approvals and 409A-compliant strike prices, in-platform valuations (US 409A, UK '
            'HMRC/EMI), compliance filings (Rule 701, Form 3921, ASC 718), employee equity portals and online exercising, round '
            'scenario modeling and exit waterfalls, and the AI-era heart of the arena: whether a founder — or their agent — can '
            'actually get at their own ownership data programmatically. Carta anchors with an OAuth developer platform and a '
            'documented remote MCP server; Ledgy ships a public GraphQL API; most of the rest keep equity data behind the login '
            'wall, and that gap is exactly what this arena scores. Market reality, modeled honestly: AngelList’s cap-table '
            'product closed to new customers in August 2026 and LTSE Equity completed its sunset (customers migrated to '
            'Astrella), so neither is ranked here. Vestd (UK) and Ledgy (EU) carry the international end; 409A-only valuation '
            'shops and public-company stock-plan administrators are out of scope.'
        ),
        'personas': ['founder', 'ops', 'employee', 'developer', 'ai-native'],
        'themes': [
            'cap-table-core',
            'equity-issuance',
            'fundraising-modeling',
            'valuations-409a',
            'compliance-filings',
            'stakeholder-experience',
            'governance-boardroom',
            'reporting-exports',
            'integrations-hris',
            'equity-data-access',
        ],
    })
    dump('data/categories.json', cats)
    print('categories.json: added equity-management')

# --- arena-icons.json ---
icons = load('data/arena-icons.json')
if 'equity-management' not in icons:
    icons['equity-management'] = '📊'
    dump('data/arena-icons.json', icons)
    print('arena-icons.json: added equity-management 📊')

# --- adjacent-arenas.json ---
adj = load('data/adjacent-arenas.json')
if not any('equity-management' in c for c in adj):
    adj.append(['equity-management', 'legal-ops', 'payroll', 'startup-banking', 'accounting'])
    dump('data/adjacent-arenas.json', adj)
    print('adjacent-arenas.json: added equity-management cluster')

# --- arena-roadmap.json: flip the planned cap-table entry to the live equity-management arena ---
rm = load('data/arena-roadmap.json')
for e in rm:
    if e['id'] == 'cap-table':
        e['id'] = 'equity-management'
        e['status'] = 'live'
        e['candidateProducts'] = ['Carta', 'Pulley', 'Cake Equity', 'Fidelity Private Shares', 'Ledgy', 'Vestd']
        e['rationale'] = (
            'Live arena: Carta’s trust stumbles opened the door to challengers, and the field then consolidated around '
            'them — AngelList’s cap-table product closed to new customers (Aug 2026) and LTSE Equity sunset to Astrella, '
            'so the live set is Carta, Pulley, Cake Equity, Fidelity Private Shares (ex-Shoobx), Ledgy, and Vestd.'
        )
        e['aiEraAngle'] = (
            'API and agent access to your own ownership data: Carta ships an OAuth developer platform plus a documented '
            'remote MCP server (mcp.app.carta.com), Ledgy a public GraphQL API — most challengers still login-wall everything.'
        )
        print('arena-roadmap.json: cap-table -> equity-management (live)')
dump('data/arena-roadmap.json', rm)

# --- community seeds ---
seeds = load('pipeline/seeds/community.json')
if 'equity-management' not in seeds:
    seeds['equity-management'] = {
        'carta': [
            'https://hn.algolia.com/api/v1/items/38899001',
            'https://hn.algolia.com/api/v1/items/26005161',
            'https://hn.algolia.com/api/v1/items/19515947',
        ],
        'pulley': [
            'https://hn.algolia.com/api/v1/items/36623164',
            'https://hn.algolia.com/api/v1/items/27627474',
        ],
        'ledgy': [
            'https://hn.algolia.com/api/v1/items/16621715',
            'https://hn.algolia.com/api/v1/items/21079305',
        ],
        'vestd': [
            'https://hn.algolia.com/api/v1/items/30732620',
        ],
        'fidelity-private-shares': [
            'https://hn.algolia.com/api/v1/items/34344031',
        ],
    }
    dump('pipeline/seeds/community.json', seeds)
    print('community.json: added equity-management seeds')

# --- search aliases ---
sa = load('data/search-aliases.json')
if 'equity-management' not in sa['arenas']:
    sa['arenas']['equity-management'] = [
        'cap table',
        'cap table management',
        'equity management',
        '409a valuation',
        'stock options',
        'esop',
        'share scheme',
        'carta alternatives',
    ]
    dump('data/search-aliases.json', sa)
    print('search-aliases.json: added equity-management aliases')
