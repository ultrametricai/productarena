#!/usr/bin/env python3
# Registers the billing-subscriptions and fraud-prevention arenas: categories.json entries,
# roadmap flips (billing-metering -> billing-subscriptions live; fraud-prevention -> live),
# the new compliance-screening roadmap entry (ComplyAdvantage decision), community seeds,
# popularity packages, and the Metronome line on the Stripe family. Idempotent.
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
if not any(c['id'] == 'billing-subscriptions' for c in cats):
    cats.append({
        'id': 'billing-subscriptions',
        'name': 'Billing & Subscriptions',
        'description': (
            'Subscription management and usage-based billing platforms — the system of record for what customers owe — '
            'judged on running the full subscription lifecycle through an API (create, upgrade, pause, cancel), metering '
            'high-volume usage events into tiered and hybrid prices, getting proration math right to the penny, recovering '
            'failed payments with smart retries and dunning, compliant invoicing with tax and multi-currency, entitlements '
            'your application can check at runtime, ASC 606 revenue recognition, and the AI-era heart of the arena: whether '
            'an agent can read and operate your billing state. The 2026 consolidation is part of the story — Stripe acquired '
            'Metronome (Dec 2025) and Adyen acquired Orb (Jul 2026), both still sold standalone and judged on their own '
            'docs; Chargebee and Lago (AGPLv3, the open-source flag) are the remaining independents, and Recurly '
            '(Accel-KKR-owned) carries the subscriptions-first end. Zuora (private under Silver Lake since 2025, absorbed '
            'Togai) sells an enterprise finance suite, Paddle is a merchant of record, and Maxio is a finance-office '
            'roll-up — different jobs, so none are ranked here.'
        ),
        'personas': ['founder', 'finance-lead', 'ops', 'developer', 'ai-native'],
        'themes': [
            'subscription-lifecycle',
            'usage-metering',
            'billing-math',
            'dunning-recovery',
            'invoicing-tax',
            'entitlements',
            'revenue-recognition',
            'migration-portability',
            'billing-agent-access',
        ],
    })
    print('categories.json: added billing-subscriptions')
if not any(c['id'] == 'fraud-prevention' for c in cats):
    cats.append({
        'id': 'fraud-prevention',
        'name': 'Payment Fraud Prevention',
        'description': (
            'Payment fraud prevention platforms — real-time machine-learning risk scoring on card-not-present '
            'transactions — judged on synchronous scoring APIs, rules engines with backtesting, manual-review queues and '
            'team workflows, chargeback and dispute automation, score explainability, data residency, and the 2026 '
            'frontier: telling malicious bots from legitimate AI buying agents. Two business models collide here: '
            'liability-shift vendors (Signifyd, Forter, Riskified — paid as a share of approved orders, they eat the '
            'chargebacks) versus score-only vendors (Stripe Radar, Sift) where the merchant keeps the risk. Stripe Radar '
            'anchors as a judged product of its own — repriced Oct 2026 into monthly tiers and now explicitly positioned '
            'to work whether or not you process on Stripe. Market reality, modeled honestly: Kount is absorbed into '
            "Equifax's identity suite and Ravelin's post-Worldpay ownership is unclear, so neither is ranked; "
            'ComplyAdvantage, Sardine, and Unit21 sell AML/sanctions screening and transaction monitoring to banks and '
            'fintechs — a compliance-officer job, not merchant order decisioning — and seed the future '
            'compliance-screening arena instead.'
        ),
        'personas': ['developer', 'risk-analyst', 'ops', 'finance-lead', 'ai-native'],
        'themes': [
            'risk-scoring',
            'rules-engine',
            'review-queues',
            'chargeback-disputes',
            'model-transparency',
            'residency-compliance',
            'fraud-surfaces',
            'agentic-commerce',
            'fraud-agent-access',
        ],
    })
    print('categories.json: added fraud-prevention')
dump('data/categories.json', cats)

# --- arena-roadmap.json ---
rm = load('data/arena-roadmap.json')
for e in rm:
    if e['id'] == 'billing-metering':
        e['id'] = 'billing-subscriptions'
        e['name'] = 'Billing & Subscriptions'
        e['status'] = 'live'
        e['candidateProducts'] = ['Stripe Billing', 'Chargebee', 'Recurly', 'Lago', 'Orb', 'Metronome']
        e['rationale'] = (
            'Live arena: usage-based and hybrid pricing made billing hard again, and the market consolidated around it — '
            'Stripe bought Metronome (Dec 2025), Adyen bought Orb (Jul 2026); Chargebee and Lago (AGPLv3) are the '
            'independents, Recurly the PE-owned subscriptions specialist.'
        )
        e['aiEraAngle'] = (
            'Metering per-token/per-agent-action workloads, and agent access to billing state: Lago answers a keyless MCP '
            'initialize, Stripe/Chargebee/Recurly ship OAuth-gated MCP servers, and every serious vendor now serves '
            'llms.txt and .md doc twins.'
        )
        print('arena-roadmap.json: billing-metering -> billing-subscriptions (live)')
    if e['id'] == 'fraud-prevention' and e['status'] != 'live':
        e['name'] = 'Payment Fraud Prevention'
        e['status'] = 'live'
        e['candidateProducts'] = ['Stripe Radar', 'Sift', 'Signifyd', 'Forter', 'Riskified']
        e['rationale'] = (
            'Live arena: card-testing bots vs ML defenses with measurable outcomes, split between chargeback-guarantee '
            'vendors (Signifyd, Forter, Riskified) and score-only vendors (Stripe Radar, Sift). Kount (absorbed into '
            'Equifax) and Ravelin (post-Worldpay ownership unclear) excluded.'
        )
        e['aiEraAngle'] = (
            'Distinguishing malicious bots from legitimate buying agents is the new frontier: Forter ships an '
            'orderType=AI_AGENT API with an OpenAI/Google/Perplexity platform enum and a live MCP server; Stripe pairs '
            'Radar with its agentic-commerce stack.'
        )
        print('arena-roadmap.json: fraud-prevention -> live')
if not any(e['id'] == 'compliance-screening' for e in rm):
    rm.append({
        'id': 'compliance-screening',
        'name': 'Compliance Screening & AML',
        'tier': 3,
        'status': 'planned',
        'g2Equivalent': 'Anti Money Laundering Software',
        'candidateProducts': ['ComplyAdvantage', 'Unit21', 'Sardine', 'Alloy', 'Hummingbird', 'Salv', 'Flagright'],
        'rationale': (
            'AML/sanctions/PEP screening and transaction monitoring for regulated fintechs and banks — the '
            'compliance-officer twin of the merchant fraud-prevention arena. ComplyAdvantage anchors: evaluated for '
            'fraud-prevention and honestly excluded — its Fraud Detection product is AML-adjacent monitoring on bank '
            'payment rails (ACH/wire/FedNow/RTP), not merchant card-fraud scoring with chargeback economics.'
        ),
        'aiEraAngle': (
            'Every vendor here now leads with agentic AI for compliance ops (ComplyAdvantage: "AI-native financial crime '
            'platform with embedded agents"; Unit21 and Sardine both title themselves agentic platforms). The arena '
            'question: can agents safely auto-clear the alert and SAR queues regulators require humans to own?'
        ),
    })
    print('arena-roadmap.json: added compliance-screening (planned)')
dump('data/arena-roadmap.json', rm)

# --- community seeds ---
seeds = load('pipeline/seeds/community.json')
if 'billing-subscriptions' not in seeds:
    seeds['billing-subscriptions'] = {
        'stripe-billing': [
            'https://hn.algolia.com/api/v1/items/16766846',
            'https://hn.algolia.com/api/v1/items/33191307',
            'https://hn.algolia.com/api/v1/items/25072783',
            'https://hn.algolia.com/api/v1/items/40931486',
        ],
        'chargebee': [
            'https://hn.algolia.com/api/v1/items/3852049',
            'https://hn.algolia.com/api/v1/items/25715496',
        ],
        'recurly': [
            'https://hn.algolia.com/api/v1/items/4478872',
            'https://hn.algolia.com/api/v1/items/2914591',
            'https://hn.algolia.com/api/v1/items/3487751',
        ],
        'lago': [
            'https://hn.algolia.com/api/v1/items/34773442',
            'https://hn.algolia.com/api/v1/items/33191307',
        ],
        'orb': [
            'https://hn.algolia.com/api/v1/items/39943302',
        ],
        'metronome': [
            'https://hn.algolia.com/api/v1/items/46126065',
            'https://hn.algolia.com/api/v1/items/41985410',
            'https://hn.algolia.com/api/v1/items/30167399',
        ],
    }
    print('community.json: added billing-subscriptions seeds')
if 'fraud-prevention' not in seeds:
    seeds['fraud-prevention'] = {
        'stripe-radar': [
            'https://hn.algolia.com/api/v1/items/13939674',
            'https://hn.algolia.com/api/v1/items/12745802',
            'https://hn.algolia.com/api/v1/items/49110548',
        ],
        'sift': [
            'https://hn.algolia.com/api/v1/items/5401878',
            'https://hn.algolia.com/api/v1/items/5400007',
            'https://hn.algolia.com/api/v1/items/7744861',
        ],
        'signifyd': [
            'https://hn.algolia.com/api/v1/items/5301872',
        ],
        'forter': [
            'https://hn.algolia.com/api/v1/items/10463563',
            'https://hn.algolia.com/api/v1/items/42620983',
        ],
        'riskified': [
            'https://hn.algolia.com/api/v1/items/27731879',
        ],
    }
    print('community.json: added fraud-prevention seeds')
dump('pipeline/seeds/community.json', seeds)

# --- popularity packages (registry-verified official SDKs only) ---
pkgs = load('pipeline/popularity-packages.json')
added = []
for pid, entry in {
    'chargebee': {'npm': 'chargebee', 'pypi': 'chargebee'},
    'recurly': {'npm': 'recurly', 'pypi': 'recurly'},
    'lago': {'npm': 'lago-javascript-client', 'pypi': 'lago-python-client'},
    'orb': {'npm': 'orb-billing', 'pypi': 'orb-billing'},
    'metronome': {'npm': '@metronome/sdk', 'pypi': 'metronome-sdk'},
    'sift': {'pypi': 'sift'},
}.items():
    if pid not in pkgs:
        pkgs[pid] = entry
        added.append(pid)
if added:
    dump('pipeline/popularity-packages.json', pkgs)
    print('popularity-packages.json: added', ', '.join(added))

# --- stripe family: Metronome line (Clerky precedent: acquired, still competes standalone) ---
fams = load('data/product-families.json')
stripe = next(f for f in fams if f['id'] == 'stripe')
if not any(sp['id'] == 'metronome' for sp in stripe['subProducts']):
    billing_idx = next(i for i, sp in enumerate(stripe['subProducts']) if sp['id'] == 'billing')
    stripe['subProducts'].insert(billing_idx + 1, {
        'id': 'metronome',
        'name': 'Metronome',
        'blurb': (
            'Usage-based billing and contracts platform (billable metrics, commits/credits, marketplace invoicing) — '
            'a Stripe company, judged as its own product in the same arena as Stripe Billing.'
        ),
        'docsUrl': 'https://docs.metronome.com',
        'arenaRef': {'arenaId': 'billing-subscriptions', 'productId': 'metronome'},
        'acquired': 'Acquired by Stripe (Dec 2025) — still operates and competes as its own product',
    })
    dump('data/product-families.json', fams)
    print('product-families.json: added metronome line to stripe family')
print('done')
