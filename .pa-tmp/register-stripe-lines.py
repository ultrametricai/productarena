#!/usr/bin/env python3
# Registers the card-issuing, tax-automation, and marketplace-payments arenas (banking-as-a-service
# is appended by register-baas.py once its crawl-verified facts land): categories.json entries,
# roadmap changes, community seeds, popularity packages, and the Stripe/Adyen family line flips
# (+ TaxJar as a Stripe acquired line — the Metronome/Clerky precedent). Idempotent.
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
ids = {c['id'] for c in cats}
if 'card-issuing' not in ids:
    cats.append({
        'id': 'card-issuing',
        'name': 'Card Issuing Platforms',
        'description': (
            'Developer-first card-issuing platforms — APIs for creating virtual and physical payment cards, deciding each '
            'authorization in real time, and running a card program without becoming a bank — judged on card lifecycle APIs, '
            'real-time authorization decisioning (every vendor names it differently: Stripe real-time authorizations, Lithic '
            'ASA, Marqeta Gateway JIT Funding, Highnote collaborative authorization, Adyen relayed authorisation), spend '
            'controls and velocity rules, program management and funding models, wallet provisioning and tokenization, '
            'disputes, settlement ledgers, and the 2026 frontier the whole arena now markets: issuing scoped cards to AI '
            'agents. Market reality, modeled honestly: Marqeta is the public pure-play (NASDAQ: MQ), Adyen Issuing is judged '
            'as its own documented product line, and the excluded tell the story — Galileo is rebranded into SoFi Tech '
            'Solutions, Bond died inside FIS, Deserve wound down into Intuit, and Rain (stablecoin cards) gates its docs '
            'behind an access code, failing the public-docs bar.'
        ),
        'personas': ['developer', 'founder', 'ops', 'finance-lead', 'ai-native'],
        'themes': [
            'card-lifecycle',
            'auth-decisioning',
            'spend-controls',
            'program-management',
            'wallets-tokenization',
            'issuing-disputes',
            'ledger-settlement',
            'issuing-compliance',
            'issuing-agent-access',
        ],
    })
    print('categories.json: added card-issuing')
if 'tax-automation' not in ids:
    cats.append({
        'id': 'tax-automation',
        'name': 'Sales Tax Automation',
        'description': (
            'Sales tax, VAT, and GST automation — calculation at checkout, economic-nexus monitoring, registrations, filing '
            'and remittance — judged on rooftop-accurate calculation APIs, threshold tracking before it becomes back taxes, '
            'product taxability (SaaS rules are the hard part), exemption certificates, global VAT with reverse charge, '
            'filing guarantees, audit-ready reporting, and agent access to tax state. The market structure is the story: '
            'Stripe owns TWO ranked products here — Stripe Tax and TaxJar (acquired 2021, still sold standalone at '
            '$39-$99/month for US-only SMBs and powering Stripe Tax’s US filing) — while Avalara (private under Vista, '
            'IPO filed but not completed, now branded "Agentic Tax and Compliance" with five hosted MCP servers) anchors the '
            'incumbent end and AI-native challengers Anrok, Numeral (YC W23, Benchmark/Mayfield-backed), and Kintsugi '
            '(Vertex holds a ~10% strategic stake) fight for the SaaS mid-market. Vertex and Sovos are excluded as '
            'enterprise compliance suites bought by tax departments, Paddle and Lemon Squeezy as merchants of record, '
            'Quaderno on compliance depth, and Sphere (YC W22, a16z-backed) sits just under the bar until its API goes '
            'self-serve.'
        ),
        'personas': ['developer', 'founder', 'ops', 'finance-lead', 'ai-native'],
        'themes': [
            'tax-calculation',
            'nexus-monitoring',
            'tax-registrations',
            'filing-remittance',
            'product-taxability',
            'exemption-certificates',
            'global-vat',
            'tax-reporting',
            'tax-agent-access',
        ],
    })
    print('categories.json: added tax-automation')
if 'marketplace-payments' not in ids:
    cats.append({
        'id': 'marketplace-payments',
        'name': 'Marketplace & Platform Payments',
        'description': (
            'Payfac-as-a-service — the infrastructure platforms and marketplaces use to onboard sellers (KYB/KYC), accept '
            'payments on their behalf, split and hold funds, run payouts, and monetize the payment flow — judged on '
            'programmatic seller onboarding, split payments and negative-balance recovery, payout scheduling and '
            'cross-border settlement, platform economics (application fees, buy rates, revenue share), the liability and '
            'compliance split, embedded seller components, sub-merchant disputes, ledger legibility, and agent access to '
            'platform operations. The 2026 consolidation is part of the story: Global Payments closed its Worldpay '
            'acquisition (Jan 2026) and retired Payrix into "Worldpay for Platforms" — no standalone brand, docs, or SDKs '
            'left to judge — and NMI absorbed Dwolla (May 2026). Stripe Connect anchors; Adyen for Platforms is judged as '
            'its own product line; Finix, Mangopay (Advent-owned EU e-money institution), Rainforest, and Tilled carry the '
            'independents. Moov (broader money movement) and PayPal multiparty (partner-gated) sit on the bench; Fortis is '
            'excluded for having no public developer docs.'
        ),
        'personas': ['developer', 'founder', 'ops', 'finance-lead', 'ai-native'],
        'themes': [
            'seller-onboarding',
            'funds-routing',
            'marketplace-payouts',
            'platform-monetization',
            'payfac-liability',
            'embedded-experience',
            'marketplace-disputes',
            'platform-ledger',
            'platform-agent-access',
        ],
    })
    print('categories.json: added marketplace-payments')
dump('data/categories.json', cats)

# --- arena-roadmap.json ---
rm = load('data/arena-roadmap.json')
rm_ids = {e['id'] for e in rm}
for e in rm:
    if e['id'] == 'tax-automation' and e['status'] != 'live':
        e['name'] = 'Sales Tax Automation'
        e['status'] = 'live'
        e['candidateProducts'] = ['Stripe Tax', 'Avalara AvaTax', 'Anrok', 'TaxJar', 'Numeral', 'Kintsugi']
        e['rationale'] = (
            'Live arena: every SaaS crossing nexus thresholds needs one, and the market split into incumbents (Avalara, '
            'private under Vista, IPO pending) and AI-native challengers (Anrok, Numeral, Kintsugi). Stripe owns two ranked '
            'products: Stripe Tax and TaxJar (still sold standalone). Vertex/Sovos excluded as enterprise suites; Sphere '
            '(YC W22) just under the bar until its API goes self-serve.'
        )
        e['aiEraAngle'] = (
            'Agent access to tax state is real here: Kintsugi’s account-data MCP completes a keyless initialize, '
            'Avalara runs five hosted MCP servers and an A2A-speaking Avi agent, Numeral ships installable Claude skills, '
            'and Stripe exposes tax tools on mcp.stripe.com. TaxJar is the pre-agent control: no MCP, no llms.txt.'
        )
        print('arena-roadmap.json: tax-automation -> live')
if 'card-issuing' not in rm_ids:
    rm.append({
        'id': 'card-issuing',
        'name': 'Card Issuing Platforms',
        'tier': 2,
        'status': 'live',
        'g2Equivalent': None,
        'candidateProducts': ['Stripe Issuing', 'Lithic', 'Marqeta', 'Highnote', 'Adyen Issuing'],
        'rationale': (
            'Live arena: issuer processing became developer infrastructure (Marqeta is the public pure-play, NASDAQ: MQ), '
            'and 2026 attrition proves the bar — Galileo rebranded into SoFi Tech Solutions, Bond died inside FIS, Deserve '
            'wound down into Intuit, Rain gates its docs.'
        ),
        'aiEraAngle': (
            'Issuing scoped cards to AI agents is the arena’s new product line: Stripe ships "Issuing for agents", '
            'Lithic an agentic-commerce solution plus a docs MCP that completes a keyless initialize, Highnote a Visa '
            'Intelligent Commerce partnership; Marqeta’s MCP is beta npm tooling.'
        ),
    })
    print('arena-roadmap.json: added card-issuing (live)')
if 'marketplace-payments' not in rm_ids:
    rm.append({
        'id': 'marketplace-payments',
        'name': 'Marketplace & Platform Payments',
        'tier': 2,
        'status': 'live',
        'g2Equivalent': 'Payment Processing Software',
        'candidateProducts': ['Stripe Connect', 'Adyen for Platforms', 'Finix', 'Mangopay', 'Rainforest', 'Tilled'],
        'rationale': (
            'Live arena: payfac-as-a-service is how software platforms became payment companies. 2026 consolidation frames '
            'it — Global Payments retired Payrix into Worldpay for Platforms, NMI absorbed Dwolla; Finix, Rainforest, and '
            'Tilled carry the independents against Stripe Connect and Adyen for Platforms.'
        ),
        'aiEraAngle': (
            'Finix and Mangopay run docs MCP servers that complete keyless initializes; Stripe’s remote MCP scopes '
            'per connected account; nobody yet ships agent-driven seller onboarding — the gap is the story.'
        ),
    })
    print('arena-roadmap.json: added marketplace-payments (live)')
dump('data/arena-roadmap.json', rm)

# --- community seeds ---
seeds = load('pipeline/seeds/community.json')
if 'card-issuing' not in seeds:
    seeds['card-issuing'] = {
        'stripe-issuing': [
            'https://hn.algolia.com/api/v1/items/17619352',
            'https://hn.algolia.com/api/v1/items/22965048',
            'https://hn.algolia.com/api/v1/items/36164052',
        ],
        'lithic': [
            'https://hn.algolia.com/api/v1/items/11356461',
            'https://hn.algolia.com/api/v1/items/29432683',
            'https://hn.algolia.com/api/v1/items/33068114',
            'https://hn.algolia.com/api/v1/items/28157577',
        ],
        'marqeta': [
            'https://hn.algolia.com/api/v1/items/28750357',
            'https://hn.algolia.com/api/v1/items/27160565',
        ],
        'adyen-issuing': [
            'https://hn.algolia.com/api/v1/items/28231567',
            'https://hn.algolia.com/api/v1/items/48415217',
        ],
    }
    print('community.json: added card-issuing seeds (highnote honestly has zero HN stories)')
if 'tax-automation' not in seeds:
    seeds['tax-automation'] = {
        'stripe-tax': [
            'https://hn.algolia.com/api/v1/items/27459712',
            'https://hn.algolia.com/api/v1/items/30535572',
            'https://hn.algolia.com/api/v1/items/32558191',
            'https://hn.algolia.com/api/v1/items/41080773',
        ],
        'avalara': [
            'https://hn.algolia.com/api/v1/items/32388454',
            'https://hn.algolia.com/api/v1/items/31950790',
        ],
        'anrok': [
            'https://hn.algolia.com/api/v1/items/27504415',
            'https://hn.algolia.com/api/v1/items/37779211',
        ],
        'taxjar': [
            'https://hn.algolia.com/api/v1/items/26959599',
            'https://hn.algolia.com/api/v1/items/32532553',
            'https://hn.algolia.com/api/v1/items/18865522',
        ],
    }
    print('community.json: added tax-automation seeds (numeral and kintsugi honestly have zero HN stories)')
if 'marketplace-payments' not in seeds:
    seeds['marketplace-payments'] = {
        'stripe-connect': [
            'https://hn.algolia.com/api/v1/items/4636894',
            'https://hn.algolia.com/api/v1/items/9251735',
            'https://hn.algolia.com/api/v1/items/49375244',
        ],
        'adyen-for-platforms': [
            'https://hn.algolia.com/api/v1/items/16279017',
            'https://hn.algolia.com/api/v1/items/48415217',
        ],
        'finix': [
            'https://hn.algolia.com/api/v1/items/22527943',
            'https://hn.algolia.com/api/v1/items/41944833',
        ],
        'mangopay': [
            'https://hn.algolia.com/api/v1/items/5613604',
            'https://hn.algolia.com/api/v1/items/6449835',
        ],
        'rainforest': [
            'https://hn.algolia.com/api/v1/items/40876807',
        ],
    }
    print('community.json: added marketplace-payments seeds (tilled honestly has zero HN stories)')
dump('pipeline/seeds/community.json', seeds)

# --- popularity packages (registry-verified official SDKs only; stripe-* and adyen-* lines share
# the family SDKs already registered under `stripe` / `adyen`, so no double-listing) ---
pkgs = load('pipeline/popularity-packages.json')
added = []
for pid, entry in {
    'lithic': {'npm': 'lithic', 'pypi': 'lithic'},
    'finix': {'npm': '@finix-payments/finix', 'pypi': 'finix'},
    'mangopay': {'npm': 'mangopay4-nodejs-sdk', 'pypi': 'mangopay4-python-sdk'},
    'tilled': {'npm': 'tilled-node'},
    'avalara': {'npm': 'avatax', 'pypi': 'Avalara'},
    'taxjar': {'npm': 'taxjar', 'pypi': 'taxjar'},
    'numeral': {'npm': 'numeral-tax', 'pypi': 'numeral-tax'},
    'kintsugi': {'npm': '@kintsugi-tax/tax-platform-sdk', 'pypi': 'kintsugi-tax-platform-sdk'},
}.items():
    if pid not in pkgs:
        pkgs[pid] = entry
        added.append(pid)
if added:
    dump('pipeline/popularity-packages.json', pkgs)
    print('popularity-packages.json: added', ', '.join(added))

# --- family flips: stripe issuing/tax/connect lines page-only -> judged; TaxJar added as an
# acquired line (Clerky/Metronome precedent); adyen issuing/platforms lines flipped ---
fams = load('data/product-families.json')
stripe = next(f for f in fams if f['id'] == 'stripe')
for sub_id, ref in {
    'issuing': {'arenaId': 'card-issuing', 'productId': 'stripe-issuing'},
    'tax': {'arenaId': 'tax-automation', 'productId': 'stripe-tax'},
    'connect': {'arenaId': 'marketplace-payments', 'productId': 'stripe-connect'},
}.items():
    sp = next(s for s in stripe['subProducts'] if s['id'] == sub_id)
    if not sp.get('arenaRef'):
        sp['arenaRef'] = ref
        print(f'product-families.json: stripe/{sub_id} -> {ref["arenaId"]}/{ref["productId"]}')
if not any(sp['id'] == 'taxjar' for sp in stripe['subProducts']):
    tax_idx = next(i for i, sp in enumerate(stripe['subProducts']) if sp['id'] == 'tax')
    stripe['subProducts'].insert(tax_idx + 1, {
        'id': 'taxjar',
        'name': 'TaxJar',
        'blurb': (
            'US sales tax calculation, nexus tracking, and AutoFile for SMBs — a Stripe company since 2021, still sold '
            'standalone ($39-$99/month) and judged as its own product in the same arena as Stripe Tax, whose US filing it '
            'powers.'
        ),
        'docsUrl': 'https://developers.taxjar.com',
        'arenaRef': {'arenaId': 'tax-automation', 'productId': 'taxjar'},
        'acquired': 'Acquired by Stripe (Apr 2021) — still operates and competes as its own product',
    })
    print('product-families.json: added taxjar line to stripe family')
adyen = next(f for f in fams if f['id'] == 'adyen')
for sub_id, ref in {
    'issuing': {'arenaId': 'card-issuing', 'productId': 'adyen-issuing'},
    'platforms': {'arenaId': 'marketplace-payments', 'productId': 'adyen-for-platforms'},
}.items():
    sp = next(s for s in adyen['subProducts'] if s['id'] == sub_id)
    if not sp.get('arenaRef'):
        sp['arenaRef'] = ref
        print(f'product-families.json: adyen/{sub_id} -> {ref["arenaId"]}/{ref["productId"]}')
dump('data/product-families.json', fams)
print('done')
