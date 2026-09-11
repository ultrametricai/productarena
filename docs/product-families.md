# Product families — spike findings and decision log

**Date:** 2026-09-11. **Scope:** break multi-product vendors down product by product
(`data/product-families.json`, rendered at `/family/[id]` — see `lib/families.ts` for the data
contract), judge sub-products into existing arenas where one genuinely fits, and stay honest
everywhere else. No new arenas were created for this work.

## How the Stripe surface was mapped

We crawled docs.stripe.com (products index, per-line docs pages, `llms.txt`), stripe.com/pricing,
and stripe.com in September 2026. Every line below is active and sold today; none of the lines we
checked (Identity, Sigma, Atlas, Treasury, Financial Connections, Data Pipeline, Issuing, Capital,
Climate) is deprecated. New since our payments bring-up: **Managed Payments** (merchant of record)
and the **Agentic Commerce** suite (shared payment tokens, UCP/ACP protocol support, machine
payments — several pieces still in preview).

## Stripe decision table

| Product line | Arena fit | Decision | Why |
| --- | --- | --- | --- |
| Payments (incl. Checkout, Payment Links, Elements, Link) | payments | **judged** (existing `stripe` entry) | This IS the parent entry; the checkout/links/elements stories are its story rows. |
| Terminal | mobile-payments | **judged** (existing `stripe-terminal`) | Already brought up before this spike — the precedent this work generalizes. |
| Atlas | legal-ops | **judged — NEW bring-up (`stripe-atlas`)** | legal-ops already ranks incorporation services (Clerky, Firstbase, LegalZoom); its incorporation / compliance / equity-paperwork themes are exactly Atlas's job. Full pipeline run 2026-09-11. |
| Billing | none / payments | page-only | No subscriptions/billing arena. The payments arena has a billing-invoicing theme, but those stories are already judged inside the parent `stripe` entry from the same docs.stripe.com/billing evidence — a standalone `stripe-billing` row would share ~90% of its evidence with the parent and double-list the same rails in one arena. |
| Invoicing | none | page-only | Sub-feature of Billing; `send-hosted-invoices` already judged under the parent. |
| Connect | none | page-only | No platform-payments arena; `marketplace-split-payments` judged under the parent. |
| Radar | none | page-only | No fraud-prevention arena (per instruction: don't create one); `fraud-screening-rules` judged under the parent. |
| Tax | none | page-only | No tax-compliance arena; `automatic-tax-calculation` judged under the parent. |
| Identity | auth-platforms? **No.** | page-only | Identity is KYC document/selfie verification. auth-platforms (Auth0, Clerk, WorkOS, Keycloak, Better Auth) is developer *login* infrastructure — none of its stories genuinely apply. Forcing it in would be the kind of vendor favor we don't do. |
| Treasury | startup-banking? **No.** | page-only | Treasury is an embedded-finance API for platforms; you cannot open a Treasury account as a startup. startup-banking ranks banks you sign up for (Mercury, Brex, Ramp, Wise, Relay). |
| Issuing | none | page-only | No card-issuing arena. |
| Capital | none | page-only | No merchant-financing arena. |
| Financial Connections | none | page-only | No bank-data-aggregation (Plaid-like) arena. |
| Revenue Recognition | accounting? **No.** | page-only | A revenue subledger over Stripe transactions, not general accounting (QuickBooks/Xero/Puzzle/Pilot's job). |
| Sigma | data-warehouses? **No.** | page-only | SQL over your own Stripe data only — not a warehouse. |
| Data Pipeline | data-pipelines? **No.** | page-only | Single-source export of Stripe's own data; that arena ranks general ELT platforms. |
| Managed Payments | payments | page-only | A merchant-of-record *configuration* of Payments, judged inside the parent entry. |
| Crypto / Stablecoins | none | page-only | No stablecoin-rails arena; several pieces in preview. |
| Agentic Commerce | none | page-only | No agentic-commerce arena yet; Stripe's agent surface (MCP server, agents.md) already scores inside the parent's agenticness stories. Watchlist: if an agentic-commerce arena ever exists, this is the first bring-up. |
| Climate | none | page-only | Carbon-removal purchasing — not a software category we rank. |
| Clerky | legal-ops | **judged** (existing `clerky`) | Already in legal-ops; per its vendor field it is a Stripe company, so it appears on the family page as an acquired line — which makes Atlas vs Clerky an all-Stripe battle. |

**Outcome of the "no cap" re-audit:** removing the 3-bring-up cap changed nothing — the honest
audit still yields exactly one new judged product (Atlas). Every other line either has no arena,
or forcing it into a near-miss arena (Identity→auth-platforms, Treasury→startup-banking,
Sigma→data-warehouses, Data Pipeline→data-pipelines, RevRec→accounting) would misrepresent what
the product is. Billing is the closest call and is documented above.

**Atlas result (same stories, no special treatment):** rank #4 of 6 in legal-ops, PA Score 11.3,
20/54 stories applicable (it na's out of e-signature and contract-lifecycle themes exactly like
the other incorporation specialists). It **loses its head-to-head with Clerky 4–5 (11 draws)** —
Stripe's own acquired company beats Stripe's product in our arena. That neutrality is the product.

## Fleet family sweep (data-only — no non-Stripe bring-ups)

Every family below maps sub-experiences to already-judged products where they exist, and honest
page-only cards (with a `note` explaining why) where they don't. Page-only lines were verified
against the vendor's own product pages/nav in September 2026 (all `docsUrl`s fetched HTTP 200).

| Family | Judged refs | Page-only lines (why) |
| --- | --- | --- |
| stripe | payments/stripe, mobile-payments/stripe-terminal, legal-ops/stripe-atlas, legal-ops/clerky | 17 lines — see table above |
| adyen | payments/adyen, mobile-payments/adyen-pos | Platforms, Risk Management, Issuing (no fitting arenas; platform/fraud stories judged under parent) |
| block | payments/square, mobile-payments/square, team-chat/buzz | Cash App, Afterpay (consumer/BNPL — no arenas) |
| mercury | startup-banking/mercury | IO Card, Treasury, Invoicing, Bill Pay, Personal Banking, Venture Debt, Command (mostly scored inside the banking entry's own stories; consumer/lending lines have no arena). Mercury Raise excluded — discontinued Sept 2025. |
| notion | project-management/notion | Calendar (a client, not booking infra — scheduling arena is a different job), AI & Agents (features of the judged workspace). **Notion Mail excluded — shutting down 2026-09-22.** |
| atlassian | project-management/jira, code-hosting/bitbucket | Confluence (no wiki arena), Trello (genuine PM competitor — bring-up candidate, out of this sweep's scope), Jira Service Management (no ITSM arena), Rovo (cross-product AI layer) |
| intercom | ai-support-agents/intercom-fin | Helpdesk, Proactive Support (human-agent tooling — no arenas) |
| shopify | ecommerce-platforms/shopify | POS (genuine mobile-payments competitor — bring-up candidate, out of scope here), Payments (not sold standalone), Shop app (consumer) |
| google | 6 refs: gemini, gemini-cli, google-adk, firebase, angular, jules | — |
| microsoft | 4 refs: copilot, windows, ms-teams, autogen | VS Code (no code-editor arena) |
| github | 3 refs: github, github-copilot, github-mobile | Actions (CI judged inside the code-hosting entry) |
| openai | 4 refs: chatgpt, codex, openai-agents, codex-plugins | API Platform (model APIs aren't an arena). **Sora excluded — consumer app shut down April 2026, API sunset Sept 2026.** |
| anthropic | 4 refs: claude, claude-code, claude-agent-sdk, anthropic-skills | Claude Developer Platform (same reason as OpenAI's) |
| vercel | 5 refs: vercel, v0, vercel-sandbox, vercel-ai-gateway, skills-cli | — |
| cloudflare | 3 refs: cloudflare, cloudflare-sandbox, cloudflare-ai-gateway | — |
| langchain | langgraph, langsmith | — |
| browserbase | browserbase, stagehand | — |
| pipedream | pipedream, pipedream-mcp | — |
| cursor | cursor, cursor-bugbot | — |
| perplexity | perplexity, perplexity-sonar | Comet (a consumer browser — browser-agents ranks automation frameworks) |

**Deliberately NOT families:** Devin (ai-coding + software-factory), Temporal (durable-workflows +
workflow-automation), and cubic (ai-code-review + ai-coding) are the *same product* judged in two
arenas, not separate experiences — a family page would fabricate a distinction the vendor doesn't
sell. Conglomerate-by-acquisition trees (Salesforce owning Slack + Intercom + Salesforce CRM;
Microsoft owning GitHub) are also not merged into one family: families follow product-line
branding, not cap tables — GitHub and Microsoft stay separate families, and Intercom is its own
family with its Salesforce ownership stated in the vendor field.

## Mechanics (for the next person)

- `lib/schemas.ts`: `Product.familyId` (optional, display-only, never in the judge's cellHash —
  stamping it busts no caches). `lib/__tests__/families.test.ts` keeps stamps and family
  structure in sync both directions and every ref resolving.
- `/family/[id]` pulls rank + PA Score live from each ref's `rankings.json` at build time and
  links each judged line's `/vs/` battles; page-only lines render their honest `note`, never a
  score. `components/FamilySection.tsx` renders the "Product lines" block on every member
  product's page (generic — no vendor special-casing). Both are in the sitemap via
  `loadFamilies()`.
- Stripe Atlas bring-up: keyless recorded probes live in `pipeline/probes/legal-ops.ts`
  (EXPECTED_TOTAL_PROBES 413 → 415); evidence is 12 claimed-docs + 20 community + 3 probe items;
  confidence intervals recomputed for legal-ops.
