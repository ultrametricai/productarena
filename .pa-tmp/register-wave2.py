#!/usr/bin/env python3
"""Register the three Stripe-wave-2 arenas (identity-verification, banking-data-apis,
stablecoin-payments) across every registration surface except data/<arena>/products.json
(hand-authored) and the TS files (edited directly). Idempotent: safe to re-run."""
import json, io, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def p(*parts): return os.path.join(ROOT, *parts)
def load(path):
    with open(path, encoding='utf-8') as f: return json.load(f)
def save(path, val):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(val, f, indent=2, ensure_ascii=False)
        f.write('\n')

# ---------------------------------------------------------------- categories.json
CATS = [
  {
    "id": "identity-verification",
    "name": "Identity Verification & KYC",
    "description": "Identity-verification and KYC platforms — APIs and hosted flows that verify a real person is behind a signup with document scans, selfie liveness, database checks, and watchlist screening — judged on verification flows, global document coverage, deepfake-era biometric defense, AML screening and monitoring, no-code orchestration and review, data checks (SSN, KYB, phone/email risk), integration DX, and privacy machinery (retention, redaction, biometric consent). Market reality, modeled honestly: Onfido stopped being a brand buyers can choose — Entrust closed its $650M acquisition in April 2024 and onfido.com now redirects to Entrust Identity Verification, judged here under its real name. Persona (free Starter tier, $200M Series D at $2B), Sumsub ($1.35/verification published), and Veriff ($0.80 published, Tallinn, acquired KYB firm Vespia in Feb 2026) stay independent; Stripe Identity is GA at $1.50 per verification; Plaid IDV ships full docs but gates production behind a product-access request — judged with the gate quoted. Jumio and Trulioo benched: enterprise IDV suites with sales-led onboarding and no public pricing; watch.",
    "personas": ["developer", "ops", "risk-analyst", "founder", "ai-native"],
    "themes": [
      "verification-flows", "document-coverage", "biometric-liveness", "watchlist-screening",
      "verification-orchestration", "data-checks", "integration-dx", "privacy-retention",
      "idv-agent-access"
    ]
  },
  {
    "id": "banking-data-apis",
    "name": "Banking Data APIs",
    "description": "Bank-data aggregation and open-banking platforms — permissioned APIs over consumers' bank accounts for linking, balances, ownership, transactions, and pay-by-bank — judged on account linking and repair, transaction data and enrichment, balance and ownership checks, payment initiation, institution coverage stated honestly by geography, data freshness, integration DX, and consent machinery. Market reality, modeled honestly: Finicity now sells as Mastercard Open Finance US ('provided by Finicity, a Mastercard company') with a self-serve Test Drive sandbox and gated production; Stripe Financial Connections is GA with published per-call pricing but connects US bank accounts only; Plaid publishes tiers without numbers; Teller publishes real prices on its homepage with Payments and Institutions still marked BETA; TrueLayer (UK/EU, acquired Zimpler and in3 in 2025-26) and Yapily (2000+ UK/EU institutions) carry the European side. Excluded: Yodlee (sold by Envestnet to STG in 2025 — enterprise aggregation suite), Flinks (Canada-centric, National Bank-backed), MX judged with its demo-gated sales motion on the record.",
    "personas": ["developer", "ops", "finance-lead", "founder", "ai-native"],
    "themes": [
      "account-linking", "transactions-enrichment", "balance-ownership", "payment-initiation",
      "institution-coverage", "data-freshness", "integration-dx", "consent-security",
      "banking-agent-access"
    ]
  },
  {
    "id": "stablecoin-payments",
    "name": "Stablecoin Payments",
    "description": "Stablecoin payment and money-movement platforms — APIs to accept stablecoins at checkout, hold balances, send payouts and off-ramp to fiat, onramp, and issue — judged on acceptance with fiat settlement, payouts and disbursements, conversion, wallets and virtual accounts, issuance and reserve transparency, compliance machinery (KYC, sanctions, travel rule, licensing), integration DX that hides chains entirely, settlement legibility, and the agent frontier (x402, MPP, agent wallets). Market reality, modeled honestly: Stripe's stablecoin payments are GA for US businesses at a published 1.5% (EU/HK/MX/CH in private preview — quoted), with Bridge operating as its stablecoin-orchestration and Open Issuance arm; BVNK became part of Mastercard in August 2026 (~$1.8B, after the $2B Coinbase deal collapsed in December 2025); Coinbase sunset Commerce into Coinbase Business checkout APIs on CDP; MoonPay Enterprise is the former Iron stablecoin API; Circle (post-IPO) and Paxos (USDG/PYUSD issuer, institutional onboarding) are the issuer-side rails. Excluded: Transak (consumer onramp widget — a different job), Fireblocks (custody infrastructure), Zero Hash (sales-gated sandbox; watch).",
    "personas": ["developer", "ops", "finance-lead", "founder", "ai-native"],
    "themes": [
      "stablecoin-acceptance", "payouts-offramp", "onramp-conversion", "wallets-balances",
      "stablecoin-issuance", "compliance-risk", "integration-dx", "settlement-treasury",
      "stablecoin-agent-access"
    ]
  }
]

cats_path = p('data', 'categories.json')
cats = load(cats_path)
have = {c['id'] for c in cats}
for c in CATS:
    if c['id'] not in have:
        cats.append(c)
        print('categories.json + ' + c['id'])
save(cats_path, cats)

# ---------------------------------------------------------------- arena-roadmap.json
rm_path = p('data', 'arena-roadmap.json')
roadmap = load(rm_path)
by_id = {e['id']: e for e in roadmap}

idv = by_id.get('identity-verification')
if idv and idv['status'] != 'live':
    idv['status'] = 'live'
    idv['candidateProducts'] = ["Stripe Identity", "Persona", "Entrust Identity Verification (Onfido)", "Sumsub", "Veriff", "Plaid IDV"]
    idv['rationale'] = "Live arena: fintech onboarding staple where deepfakes raised the stakes — and the market consolidated (Entrust closed the $650M Onfido acquisition in 2024; Veriff bought Vespia in 2026). Alloy excluded: an orchestration layer over IDV vendors, not a verifier."
    idv['aiEraAngle'] = "Liveness vs AI-generated faces is now a named product line arena-wide; Sumsub ships an OAuth account MCP plus an agent-skills repo, Persona a keyless docs MCP, Plaid an OAuth Dashboard MCP — Entrust and Veriff have none, and the probes record both sides."
    print('roadmap: identity-verification -> live')

bdb = by_id.get('banking-data-apis')
if bdb and bdb['status'] != 'live':
    bdb['status'] = 'live'
    bdb['candidateProducts'] = ["Plaid", "Stripe Financial Connections", "MX", "Mastercard Open Finance (Finicity)", "Teller", "TrueLayer", "Yapily"]
    bdb['rationale'] = "Live arena: the post-1033 aggregation stack — Finicity rebranded to Mastercard Open Finance US, Yodlee left Envestnet for STG, and Europe consolidated around TrueLayer (Zimpler, in3) — while Stripe and Teller publish real per-call prices."
    bdb['aiEraAngle'] = "Bank data is the substrate agent finance workflows read: MX, Yapily, and Flinks run keyless docs MCPs, Plaid ships an OAuth Dashboard MCP plus an AI coding toolkit, and Teller has no agent surface at all — recorded, not assumed."
    print('roadmap: banking-data-apis -> live')

if 'stablecoin-payments' not in by_id:
    idx = next((i for i, e in enumerate(roadmap) if e['id'] == 'crypto-infra'), len(roadmap))
    roadmap.insert(idx, {
        "id": "stablecoin-payments",
        "name": "Stablecoin Payments",
        "tier": 2,
        "status": "live",
        "g2Equivalent": None,
        "candidateProducts": ["Stripe Crypto & Stablecoins", "Circle", "BVNK (Mastercard)", "Coinbase Payments (CDP)", "MoonPay Enterprise", "Paxos"],
        "rationale": "Live arena: stablecoin rails became acquirable infrastructure in 2025-26 — Stripe runs its lines on Bridge, Mastercard bought BVNK (~$1.8B) after Coinbase's $2B bid collapsed, Coinbase folded Commerce into Business checkouts, and MoonPay turned Iron into MoonPay Enterprise.",
        "aiEraAngle": "The machine-payments frontier lives here: Coinbase x402 and agent wallets, Stripe MPP and Link agent rails, Circle's Agent Stack with a CLI and skills repo — the arena where agents paying agents stops being a demo."
    })
    print('roadmap: + stablecoin-payments (live)')
save(rm_path, roadmap)

# ---------------------------------------------------------------- arena-sections.json
sec_path = p('data', 'arena-sections.json')
secs = load(sec_path)
fint = next(s for s in secs['sections'] if s['id'] == 'fintech-ops')
for aid in ['identity-verification', 'banking-data-apis', 'stablecoin-payments']:
    if aid not in fint['arenaIds']:
        fint['arenaIds'].insert(fint['arenaIds'].index('marketplace-payments') + 1, aid)
        print('arena-sections + ' + aid)
save(sec_path, secs)

# ---------------------------------------------------------------- adjacent-arenas.json
adj_path = p('data', 'adjacent-arenas.json')
adj = load(adj_path)
anchors = {row[0] for row in adj}
for row in [
    ["identity-verification", "fraud-prevention", "auth-platforms", "payments"],
    ["banking-data-apis", "startup-banking", "payments", "banking-as-a-service"],
    ["stablecoin-payments", "payments", "agentic-commerce", "banking-as-a-service"],
]:
    if row[0] not in anchors:
        adj.append(row)
        print('adjacent-arenas + ' + row[0])
save(adj_path, adj)

# ---------------------------------------------------------------- arena-icons.json
ic_path = p('data', 'arena-icons.json')
icons = load(ic_path)
for aid, emoji in [("identity-verification", "🛂"), ("banking-data-apis", "🔗"), ("stablecoin-payments", "🪙")]:
    if aid not in icons:
        icons[aid] = emoji
        print('arena-icons + ' + aid)
save(ic_path, icons)

# ---------------------------------------------------------------- search-aliases.json
sa_path = p('data', 'search-aliases.json')
sa = load(sa_path)
NEW_ALIASES = {
    "identity-verification": ["identity verification", "kyc", "id verification", "document verification", "selfie verification", "identity checks", "kyc api"],
    "banking-data-apis": ["open banking", "bank data api", "bank account linking", "financial data api", "account aggregation", "plaid alternatives", "pay by bank"],
    "stablecoin-payments": ["stablecoin payments", "stablecoin api", "crypto payments", "usdc payments", "stablecoin payouts", "crypto onramp", "stablecoin infrastructure"],
}
for aid, aliases in NEW_ALIASES.items():
    if aid not in sa['arenas']:
        sa['arenas'][aid] = aliases
        print('search-aliases + ' + aid)
save(sa_path, sa)

print('register-wave2: done')
