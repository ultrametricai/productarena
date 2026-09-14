#!/usr/bin/env python3
# Registers the error-tracking and expense-management arenas: categories.json entries, arena
# icons, adjacent-arenas clusters, roadmap live-flips (error-tracking planned->live,
# spend-management -> expense-management live), community seeds, search aliases (including
# moving "corporate cards"/"spend management" from startup-banking to their honest new home).
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
if not any(c['id'] == 'error-tracking' for c in cats):
    cats.append({
        'id': 'error-tracking',
        'name': 'Error Tracking',
        'description': (
            'Error tracking and crash reporting platforms — the pager for your production bugs — judged on capturing errors '
            'across web, backend, and mobile SDKs, grouping thousands of duplicate events into one issue (and letting you fix '
            'the fingerprint when it guesses wrong), un-minifying stack traces with sourcemaps and native symbol uploads, tying '
            'errors to releases and suspect commits with crash-free release health, routing alerts to Slack/PagerDuty without '
            'paging the whole team on one bad deploy, syncing issues to Jira/GitHub/Linear, and the AI-era heart of the arena: '
            'whether an agent can pull your top production issues over a real API or MCP server and whether the platform’s own '
            'AI can find the root cause and draft the fix. Sentry anchors with Seer (root-cause → PR) and a remote MCP server; '
            'Rollbar answers with Resolve; Raygun’s AI Error Resolution is bring-your-own OpenAI key; Honeybadger counters with '
            'a hosted MCP server and an agent-first docs surface; GlitchTip is the MIT-licensed, Sentry-SDK-compatible '
            'self-host option against Sentry’s FSL. Market reality: BugSnag spent 2025 rebranded as SmartBear “Insight Hub” '
            'and is BugSnag again; Airbrake still answers API calls but its site and blog have been frozen since mid-2024, and '
            'TrackJS is frontend-JavaScript-only — neither is ranked. Sentry also competes in observability; this arena judges '
            'the error-tracking job with its own fresh verdicts. Metrics, logs, and traces stay in the observability arena; '
            'on-call scheduling and status pages stay in incident-management.'
        ),
        'personas': ['developer', 'sre', 'engineering-leader', 'ai-native'],
        'themes': [
            'sdk-instrumentation',
            'grouping-triage',
            'sourcemaps-symbolication',
            'releases-regressions',
            'alerting-noise',
            'workflow-integrations',
            'error-data-access',
            'ai-debugging',
            'impact-analytics',
            'search-analytics',
            'quotas-cost',
            'data-scrubbing',
        ],
    })
    print('categories.json: added error-tracking')
if not any(c['id'] == 'expense-management' for c in cats):
    cats.append({
        'id': 'expense-management',
        'name': 'Expense Management',
        'description': (
            'Expense management and corporate-card platforms — who controls a startup’s spend — judged on issuing physical and '
            'virtual cards with per-card limits and merchant controls, receipt capture with OCR and automatic matching, '
            'codified expense policies that auto-approve the routine and escalate the exceptions, reimbursements at home and '
            'abroad, accounting sync into QuickBooks/NetSuite/Xero for a continuous close, in-policy travel booking, bill pay, '
            'budgets with real-time visibility, and the AI-era heart of the arena: whether an agent can pull transactions, code '
            'expenses, and enforce policy through real APIs and MCP servers. Ramp anchors with a hosted MCP server, an '
            'open-source CLI built for agents, and llms.txt developer docs; Brex answers with OAuth-gated MCP and published '
            'OpenAPI specs; Navan ships a hosted MCP alongside its Ava assistant; Expensify’s Integration Server API predates '
            'the agent era and shows it. Market reality, modeled honestly: Brex has been a Capital One company since April 2026 '
            'but is still sold standalone; Divvy is now BILL Spend & Expense; Airbase was absorbed into Paylocity and is no '
            'longer an independent player (not ranked); Mercury Spend (Aug 2026) ships only bundled with Mercury banking, so it '
            'stays judged in startup-banking. Ramp and Brex also compete in startup-banking — this arena judges the expense '
            'workflow with its own fresh verdicts.'
        ),
        'personas': ['founder', 'finance-lead', 'employee', 'developer', 'ai-native'],
        'themes': [
            'cards-controls',
            'receipts-capture',
            'policy-approvals',
            'reimbursements',
            'accounting-close',
            'travel',
            'spend-visibility',
            'bills-ap',
            'expense-data-access',
            'ai-automation',
        ],
    })
    print('categories.json: added expense-management')
dump('data/categories.json', cats)

# --- arena-icons.json ---
icons = load('data/arena-icons.json')
changed = False
if 'error-tracking' not in icons:
    icons['error-tracking'] = '🐛'
    changed = True
    print('arena-icons.json: added error-tracking 🐛')
if 'expense-management' not in icons:
    icons['expense-management'] = '💳'
    changed = True
    print('arena-icons.json: added expense-management 💳')
if changed:
    dump('data/arena-icons.json', icons)

# --- adjacent-arenas.json ---
adj = load('data/adjacent-arenas.json')
if not any('error-tracking' in c for c in adj):
    adj.append(['error-tracking', 'observability', 'incident-management', 'security-scanners'])
    print('adjacent-arenas.json: added error-tracking cluster')
if not any('expense-management' in c for c in adj):
    adj.append(['expense-management', 'startup-banking', 'accounting', 'payroll'])
    print('adjacent-arenas.json: added expense-management cluster')
dump('data/adjacent-arenas.json', adj)

# --- arena-roadmap.json ---
rm = load('data/arena-roadmap.json')
for e in rm:
    if e['id'] == 'error-tracking' and e.get('status') != 'live':
        e['status'] = 'live'
        e['candidateProducts'] = ['Sentry', 'BugSnag', 'Rollbar', 'Honeybadger', 'GlitchTip', 'Raygun']
        e['rationale'] = (
            'Live arena: the field consolidated around Sentry, whose FSL license and AI push (Seer) reset the terms of the '
            'category — BugSnag went through a SmartBear "Insight Hub" rebrand and back, Airbrake has been frozen since '
            'mid-2024 under LogicMonitor, and GlitchTip carries the MIT-licensed Sentry-compatible self-host flag.'
        )
        e['aiEraAngle'] = (
            'Agent access to production errors: Sentry and Honeybadger run hosted OAuth-gated MCP servers, GlitchTip ships MCP '
            'built into the product, Rollbar and Raygun publish stdio MCP servers — and Sentry Seer/Rollbar Resolve turn an '
            'issue into a reviewed pull request.'
        )
        print('arena-roadmap.json: error-tracking -> live')
    if e['id'] == 'spend-management':
        e['id'] = 'expense-management'
        e['status'] = 'live'
        e['candidateProducts'] = ['Ramp', 'Brex', 'Expensify', 'Navan', 'BILL Spend & Expense']
        e['rationale'] = (
            'Live arena: Ramp and Brex made spend management the fastest-moving corner of founder-ops — Brex sold to Capital '
            'One (April 2026) but still competes standalone, Divvy became BILL Spend & Expense, Airbase disappeared into '
            'Paylocity, and Navan took the travel+expense model public (Nasdaq: NAVN, Oct 2025).'
        )
        e['aiEraAngle'] = (
            'Ramp, Brex, and Navan all run hosted MCP servers over live spend data, and Ramp ships an open-source CLI with an '
            '--agent mode — expense coding, policy enforcement, and receipt chasing are becoming agent jobs.'
        )
        print('arena-roadmap.json: spend-management -> expense-management (live)')
dump('data/arena-roadmap.json', rm)

# --- community seeds ---
seeds = load('pipeline/seeds/community.json')
if 'error-tracking' not in seeds:
    seeds['error-tracking'] = {
        'sentry': [
            'https://hn.algolia.com/api/v1/items/21466967',
            'https://hn.algolia.com/api/v1/items/43725815',
            'https://hn.algolia.com/api/v1/items/38096955',
        ],
        'bugsnag': [
            'https://hn.algolia.com/api/v1/items/4179341',
            'https://hn.algolia.com/api/v1/items/6247545',
            'https://hn.algolia.com/api/v1/items/13822502',
        ],
        'rollbar': [
            'https://hn.algolia.com/api/v1/items/37439926',
            'https://hn.algolia.com/api/v1/items/36360195',
        ],
        'honeybadger': [
            'https://hn.algolia.com/api/v1/items/3404330',
            'https://hn.algolia.com/api/v1/items/6052335',
        ],
        'glitchtip': [
            'https://hn.algolia.com/api/v1/items/36008564',
            'https://hn.algolia.com/api/v1/items/23859519',
        ],
        'raygun': [
            'https://hn.algolia.com/api/v1/items/14416867',
            'https://hn.algolia.com/api/v1/items/5211350',
        ],
    }
    print('community.json: added error-tracking seeds')
if 'expense-management' not in seeds:
    seeds['expense-management'] = {
        'ramp': [
            'https://hn.algolia.com/api/v1/items/46588972',
            'https://hn.algolia.com/api/v1/items/38404835',
            'https://hn.algolia.com/api/v1/items/45170244',
        ],
        'brex': [
            'https://hn.algolia.com/api/v1/items/46725288',
            'https://hn.algolia.com/api/v1/items/35942583',
            'https://hn.algolia.com/api/v1/items/31772211',
        ],
        'expensify': [
            'https://hn.algolia.com/api/v1/items/15796189',
            'https://hn.algolia.com/api/v1/items/28909502',
            'https://hn.algolia.com/api/v1/items/12096597',
        ],
        'navan': [
            'https://hn.algolia.com/api/v1/items/45770893',
            'https://hn.algolia.com/api/v1/items/34694045',
        ],
        'bill-spend-expense': [
            'https://hn.algolia.com/api/v1/items/30997123',
            'https://hn.algolia.com/api/v1/items/21549760',
        ],
    }
    print('community.json: added expense-management seeds')
dump('pipeline/seeds/community.json', seeds)

# --- search aliases ---
sa = load('data/search-aliases.json')
if 'error-tracking' not in sa['arenas']:
    sa['arenas']['error-tracking'] = [
        'error tracking',
        'crash reporting',
        'error monitoring',
        'exception tracking',
        'bug tracking',
        'sentry alternatives',
        'crash analytics',
    ]
    print('search-aliases.json: added error-tracking aliases')
if 'expense-management' not in sa['arenas']:
    sa['arenas']['expense-management'] = [
        'expense management',
        'expense reports',
        'corporate cards',
        'spend management',
        'receipt scanning',
        'travel and expense',
        'reimbursements',
    ]
    # These two now have an honest dedicated home; startup-banking keeps its banking aliases.
    sb = sa['arenas']['startup-banking']
    sa['arenas']['startup-banking'] = [a for a in sb if a not in ('corporate cards', 'spend management')]
    print('search-aliases.json: added expense-management aliases; moved corporate cards/spend management off startup-banking')
dump('data/search-aliases.json', sa)
