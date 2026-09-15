#!/usr/bin/env python3
"""Part A dispositions: flip Identity / Financial Connections / Crypto from page-only to
judged (their new arenas), and refresh the honest notes on the ten lines that stay
page-only. Idempotent."""
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
path = os.path.join(ROOT, 'data', 'product-families.json')
fams = json.load(open(path))
stripe = next(f for f in fams if f['id'] == 'stripe')
subs = {s['id']: s for s in stripe['subProducts']}

# --- judged flips -----------------------------------------------------------
flips = {
    'identity': ('identity-verification', 'stripe-identity'),
    'financial-connections': ('banking-data-apis', 'stripe-financial-connections'),
    'crypto': ('stablecoin-payments', 'stripe-crypto'),
}
for sid, (arena, pid) in flips.items():
    s = subs[sid]
    if s.get('arenaRef') is None:
        s['arenaRef'] = {'arenaId': arena, 'productId': pid}
        s.pop('note', None)
        print(f'flip {sid} -> {arena}/{pid}')

# --- refreshed honest notes on the stay-page-only lines ---------------------
notes = {
    'invoicing': "Sold as part of Billing — the invoicing stories are judged inside Stripe Billing's billing-subscriptions entry; a second row would double-list one product.",
    'capital': "Revenue-based financing offers gated on Stripe processing history — no public product surface to evidence and no merchant-financing arena, so honestly not judgeable.",
    'revenue-recognition': "A revenue subledger over Stripe data sold with Billing, not general-purpose accounting — the accounting arena (QuickBooks, Xero) isn't an honest fit; its automation stories are judged inside the billing-subscriptions entry.",
    'sigma': "Queries only your Stripe data — not a general warehouse, so the data-warehouses arena isn't an honest fit; its agent surface (stripe_analytics MCP tool) is evidenced inside Stripe's payments entry.",
    'data-pipeline': "A single-source export of Stripe's own data — the data-pipelines arena ranks general ELT platforms, so no honest fit.",
    'managed-payments': "A merchant-of-record configuration of Payments (waitlist, 35+ countries — quoted from its docs) — judged inside Stripe's payments entry, not as a separate competitor.",
    'climate': "Carbon-removal purchasing via Frontier. A neighboring carbon-API set exists (Patch, Lune, Cloverly — watchlist bring-up), but they broker many projects while Climate buys Frontier offtake — a different job, so no honest arena today.",
}
for sid, note in notes.items():
    if sid in subs and subs[sid].get('arenaRef') is None:
        subs[sid]['note'] = note

with open(path, 'w') as f:
    json.dump(fams, f, indent=2, ensure_ascii=False)
    f.write('\n')
print('product-families.json updated')
