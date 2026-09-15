#!/usr/bin/env python3
# Registers the agentic-commerce arena: categories.json entry, arena icon, adjacent-arenas
# cluster, roadmap live-flip (agent-payments -> agentic-commerce), arena section placement,
# community seeds, search aliases. Idempotent (skips when already present).
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
if not any(c['id'] == 'agentic-commerce' for c in cats):
    cats.append({
        'id': 'agentic-commerce',
        'name': 'Agentic Commerce',
        'description': (
            'Platforms and protocol stacks that let AI agents transact — the arena where the product IS agent access: '
            'discovering catalogs and payable services programmatically, creating carts and completing checkout through a '
            'protocol, handing agents scoped payment credentials and wallets instead of raw card numbers, human-approval '
            'gates before money moves, verifiable agent identity and trust tiers, merchant onboarding to agent traffic, '
            'order webhooks, refunds and disputes via API, and whether the protocol each vendor speaks is genuinely open. '
            'The 2026 protocol landscape, judged on live evidence: UCP (ucp.dev, Google/Shopify and 20+ co-developers — '
            'Shopify’s Global Catalog and per-storefront MCP endpoints answer keyless handshakes and create real carts), '
            'ACP (agenticcommerce.dev, OpenAI + Stripe, Apache-2.0), MPP (mpp.dev, Stripe + Tempo’s HTTP 402 rail) and '
            'x402 (x402 Foundation under the Linux Foundation, Coinbase as flagship facilitator), plus Visa’s Intelligent '
            'Commerce program with its published Trusted Agent Protocol. Judged here: Stripe Agentic Commerce, Shopify '
            'Agentic Commerce (UCP), PayPal Agentic Commerce, Visa Intelligent Commerce, Coinbase x402, Crossmint, and '
            'Skyfire. Excluded honestly: Mastercard Agent Pay (announcement-tier — its developer-portal docs route is a JS '
            'shell that returns 200 for any URL, the product is absent from Mastercard’s own llms.txt catalog, and no '
            'public spec, sandbox, or SDK exists; Mastercard’s real open surface, the Developers Agent Toolkit MCP, is a '
            'docs-access tool, not Agent Pay) and Google AP2 (a published specification with samples, not a product — its '
            'productization is UCP, judged here through Shopify’s implementation). OpenAI’s Instant Checkout is the '
            'buyer-side surface of ACP; its merchant rails are judged through the processors that implement them.'
        ),
        'personas': ['merchant', 'developer', 'ai-native'],
        'themes': [
            'agent-discovery',
            'agent-checkout',
            'payment-credentials',
            'trust-safety',
            'merchant-enablement',
            'order-lifecycle',
            'refunds-disputes',
            'protocol-openness',
            'fees-economics',
        ],
    })
    dump('data/categories.json', cats)
    print('categories.json: added agentic-commerce')

# --- arena-icons.json ---
icons = load('data/arena-icons.json')
if 'agentic-commerce' not in icons:
    icons['agentic-commerce'] = '🛍️'
    dump('data/arena-icons.json', icons)
    print('arena-icons.json: added agentic-commerce 🛍️')

# --- adjacent-arenas.json ---
adj = load('data/adjacent-arenas.json')
if not any('agentic-commerce' in c for c in adj):
    adj.append(['agentic-commerce', 'payments', 'ecommerce-platforms', 'mobile-payments'])
    dump('data/adjacent-arenas.json', adj)
    print('adjacent-arenas.json: added agentic-commerce cluster')

# --- arena-sections.json: place in Commerce & Customers ---
sec = load('data/arena-sections.json')
for s in sec['sections']:
    if s['id'] == 'commerce-customers' and 'agentic-commerce' not in s['arenaIds']:
        s['arenaIds'].insert(1, 'agentic-commerce')
        dump('data/arena-sections.json', sec)
        print('arena-sections.json: added agentic-commerce to commerce-customers')

# --- arena-roadmap.json: flip the planned agent-payments entry to the live arena ---
rm = load('data/arena-roadmap.json')
changed = False
for e in rm:
    if e['id'] == 'agent-payments':
        e['id'] = 'agentic-commerce'
        e['name'] = 'Agentic Commerce'
        e['status'] = 'live'
        e['candidateProducts'] = [
            'Stripe Agentic Commerce', 'Shopify Agentic Commerce', 'PayPal Agentic Commerce',
            'Visa Intelligent Commerce', 'Coinbase x402', 'Crossmint', 'Skyfire',
        ]
        e['rationale'] = (
            'Live arena: agents buying things stopped being a demo in 2026 — UCP, ACP, MPP, and x402 all shipped with real '
            'developer surfaces, and the processors, platforms, and one card network productized them. Mastercard Agent Pay '
            'stayed announcement-tier (no public spec, sandbox, or SDK) and Google AP2 is a spec with samples, not a '
            'product — both excluded with notes in the arena description.'
        )
        e['aiEraAngle'] = (
            'The category is agent-native by definition: keyless UCP handshakes and real cart creation on Shopify, '
            'Stripe’s MPP/x402 machine payments and Link agent wallet, PayPal’s remote MCP and Agentic Commerce Cart '
            'API, Visa’s published Trusted Agent Protocol, Coinbase’s keyless x402 Bazaar, Crossmint’s agent cards '
            'and checkouts, Skyfire’s KYA identity tokens — all probed live.'
        )
        changed = True
        print('arena-roadmap.json: agent-payments -> agentic-commerce (live)')
if changed:
    dump('data/arena-roadmap.json', rm)

# --- community seeds ---
seeds = load('pipeline/seeds/community.json')
if 'agentic-commerce' not in seeds:
    seeds['agentic-commerce'] = {
        'stripe-agentic-commerce': [
            'https://hn.algolia.com/api/v1/items/45416080',
            'https://hn.algolia.com/api/v1/items/45416150',
            'https://hn.algolia.com/api/v1/items/47426936',
            'https://hn.algolia.com/api/v1/items/46973825',
        ],
        'shopify-ucp': [
            'https://hn.algolia.com/api/v1/items/46586413',
            'https://hn.algolia.com/api/v1/items/46279798',
            'https://hn.algolia.com/api/v1/items/48661529',
        ],
        'paypal-agent-commerce': [
            'https://hn.algolia.com/api/v1/items/43558777',
        ],
        'visa-intelligent-commerce': [
            'https://hn.algolia.com/api/v1/items/48480998',
            'https://hn.algolia.com/api/v1/items/44035608',
            'https://hn.algolia.com/api/v1/items/43852222',
        ],
        'coinbase-x402': [
            'https://hn.algolia.com/api/v1/items/45347335',
            'https://hn.algolia.com/api/v1/items/48746914',
            'https://hn.algolia.com/api/v1/items/45271711',
        ],
        'skyfire': [
            'https://hn.algolia.com/api/v1/items/41310236',
        ],
    }
    dump('pipeline/seeds/community.json', seeds)
    print('community.json: added agentic-commerce seeds')

# --- search aliases ---
sa = load('data/search-aliases.json')
if 'agentic-commerce' not in sa['arenas']:
    sa['arenas']['agentic-commerce'] = [
        'agentic commerce',
        'agent commerce',
        'agent payments',
        'ai shopping agents',
        'agent checkout',
        'machine payments',
        'ucp',
        'acp',
        'x402',
        'mpp',
    ]
    dump('data/search-aliases.json', sa)
    print('search-aliases.json: added agentic-commerce aliases')
