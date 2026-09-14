# Stripe: an agentic roadmap

**Status: draft — requires founder sign-off before any part is sent anywhere.**
Prepared 2026-09-14 from ProductArena's payments-arena evidence pass of the same date (branch
`stripe-agentic-spike`). Every claim below traces to `data/payments/evidence/stripe.json`
(128 items, 44 crawled vendor pages + 7 live keyless probes) and the judged verdicts in
`data/payments/verdicts.json`. The gap ranking is the site's own Opportunities engine
(`lib/opportunities.ts`: impact = story weight × (10 − quality) × 1.5 boost for cells that feed
a headline index), extended past its 8-item display cap to the full list. Quoted "Missing"
clauses are the judge's own `missing for 10:` text, verbatim.

Post-refresh scores (before → after this evidence pass): PA Score 50.3 → 61.9,
agent-ready 77.2 → 88.9, AI-native 22.7 → 26.7, API quality 58.6 → 68.9, AI-era 42.0 → 55.3.
Stripe leads the payments arena on every headline index. The pass RAISED scores — the gaps
below are what's left after crediting everything Stripe actually ships.

---

## 1. What Stripe already ships (2026 agent-surface inventory)

The baseline this roadmap builds on — the most complete agent surface of any payments product
we track, live-verified 2026-09-14:

**Developer-tool layer**
- **Hosted MCP server** (`mcp.stripe.com`): OAuth-gated per the MCP authorization spec
  (keyless initialize → HTTP 401 + `www-authenticate` resource metadata naming
  `access.stripe.com/mcp` — probe `stripe-probe-6`). Generic `stripe_api_search/details/read/
  write` tools expose ~150 documented API methods (customers → payouts → Issuing → v2
  money-management previews) plus task tools: `stripe_implementation_planner`,
  `search_stripe_documentation`, `stripe_analytics`, `stripe_report`, `get_balance_summary`,
  `send_stripe_mcp_feedback`.
- **Human-confirmation gate**: sensitive `stripe_api_write` actions (refunds, outbound
  payments) require a click-to-approve URL producing a 24-hour approval token.
- **Governance**: per-user OAuth session list with revoke, admin bulk revoke, MCP access
  toggles separate for live mode vs sandboxes, MCP tool-call logs in Workbench, connected-
  account calls via restricted key + `Stripe-Account` header.
- **Agent plugins** (Claude Code / Codex / Cursor / Grok) bundling MCP + skills with
  auto-update; `stripe agent setup` auto-detects installed harnesses.
- **Skills catalog**: 8 Stripe-maintained skills at a keyless well-known URL
  (`docs.stripe.com/.well-known/skills/index.json` — probe `stripe-probe-7`):
  connect-recommend, connect-required-verification-information, stripe-apps,
  stripe-best-practices, stripe-directory, stripe-docs, stripe-projects, upgrade-stripe.
- **Agent-legible docs**: `llms.txt` with an "Instructions for Large Language Model Agents"
  section; every docs page mirrors to Markdown via `.md` suffix.
- **SDK layer**: `@stripe/agent-toolkit` (LangChain/Vercel AI SDK function calling),
  `@stripe/ai-sdk`, `@stripe/token-meter`, the `stripe/ai` monorepo, official OpenAPI spec
  repo (`stripe/openapi`).
- **CLI + Workbench**: `stripe resources`/`listen`/`trigger`, CLI-created sandboxes with no
  account, browser Shell + API Explorer with autocompletion (read-only in live mode).
- **Scoped auth**: restricted API keys with per-resource Read/Write/None across ALL Stripe
  APIs, documented explicitly as the credential to hand an AI agent; org-level keys.
- **Events**: webhook endpoints + Amazon EventBridge + Azure Event Grid destinations;
  versioned snapshot events and unversioned thin events (v1 thin events in private preview).

**Commerce layer (both sides of the agent transaction)**
- **Sell through agents**: Agentic Commerce Suite — CSV catalog feeds (product/inventory/
  pricing/promotions) via the v2 ProductCatalogImport API (4 GB presigned uploads, upsert/
  replace, per-row error files, `v2.commerce.product_catalog.imports.*` webhooks), syndicated
  over **UCP or ACP**; orchestrated commerce agreements (OCAs) with agents; orders tagged with
  the originating agent (`PaymentIntent.agent_details`, Dashboard filter by agent).
- **Machine payments**: **MPP** (open protocol co-authored with Tempo; HTTP 402 challenge →
  credential → settle) and **x402**; cards via Shared Payment Tokens (scoped grants with usage
  + expiration limits, $0.50 min) and stablecoins (USDC/USDC.e on Tempo/Solana/Base, $0.01
  min); `mppx` SDK with `npx mppx validate` and a one-prompt coding-agent integration path.
- **Agent wallet**: Link Agent Wallet + **Link CLI** (`link-cli --llms-full`, per-command
  `--schema`), one-time-use virtual cards, customer-approved spend requests, permissioned
  financial insights via Financial Connections; UCP commerce flows.
- **Discovery**: **Stripe Directory** (`stripe directory search --format json`) indexing
  Stripe Apps, Projects providers, MPP pay-per-call endpoints, and the business network;
  businesses become "discoverable and payable by agents" via public Stripe profiles.
- **Provisioning**: **Stripe Projects** — 60+ third-party services provisioned from the CLI
  or by a coding agent, credentials vaulted and synced to `.env`, billing through Stripe.

**Monetization + analytics layer**
- **Token billing** via Metronome: per-token metering segmented by model and token type
  (input/output/cached), synced OpenAI/Anthropic/Google prices, AI credit packs, hybrid plans.
- **Analyze with AI**: `stripe_analytics` (Stripe-defined metrics: MRR, churn; template runs;
  Sigma SQL over reporting tables) and `stripe_report` (balance/payout/activity/tax/RevRec
  report runs → CSV), scoped by Analytics:Read + Reporting:Read permissions.

---

## 2. The gap list — what Stripe can ship to be more agentic

Ranked by the Opportunities engine (impact desc). For each: what exists today, what the judge
found missing, and the concrete artifact that closes it.

### #1 · Built-in AI assistant in the Dashboard — impact 45 (AI-native lever) — `agentic-builtin-assistant`, none/q0
- **Today:** everything is externalized: Stripe gives Claude/Codex/Cursor superb tools (MCP,
  skills, plugins), and `stripe_implementation_planner` + "analyze with AI" exist — but only
  through a third-party agent the user brings.
- **Missing (judge):** any documented in-product assistant embedded in the Dashboard that a
  user converses with to delegate tasks.
- **Artifact:** a first-party Dashboard assistant ("Ask Stripe") that fronts the exact same
  MCP tool surface Stripe already ships — `stripe_analytics`, `stripe_report`,
  `stripe_api_read/write` with the existing human-confirmation gate — plus a public docs page
  describing its capabilities and permission model. Stripe has already built 100% of the
  backend for this; the gap is a chat surface and a docs page. This is the single
  highest-impact cell in Stripe's matrix (weight-3 story, currently zero).

### #2 · Full data export / leave-ability — impact 21 — `openness-full-export`, partial/q3
- **Today:** report runs export CSVs of specific financial reports; Data Pipeline ships Stripe
  data to Snowflake/BigQuery/etc. (not in the judged evidence pass); Sigma queries are
  exportable.
- **Missing (judge):** "a documented full account/data export tool (customers, charges,
  subscriptions, full transaction history) in open/portable formats, and any explicit
  data-portability or account-closure export workflow."
- **Artifact:** a documented one-call "export my account" endpoint (or a docs page assembling
  the existing pieces — Data Pipeline, Sigma exports, PAN data portability via
  `docs.stripe.com` migration flow — into an explicit portability guide). Agents managing a
  merchant's stack need a documented exit path; today it must be reverse-engineered.

### #3 · Open-source the core? — impact 20 — `openness-open-license`, none/q0
- **Today:** MIT-licensed SDKs, CLI, `stripe/ai`, OpenAPI spec — the periphery is open; the
  platform is proprietary SaaS.
- **Missing (judge):** a license for the product source itself.
- **Artifact:** realistically not happening for the processing core — but the *agent-protocol*
  layer is where openness is cheap and compounding: publish MPP conformance test suites, the
  ACS feed spec, and reference implementations under open licenses (MPP/x402 already lean
  this way). Honest note: this cell will likely stay `none`; it's listed because the engine
  ranks it, not because we expect Stripe to open-source Stripe.

### #4 · Data residency controls — impact 20 — `privacy-data-residency`, none/q0
- **Missing (judge):** any public docs on regional storage/residency choices.
- **Artifact:** a `docs.stripe.com/privacy/data-residency` page (even one stating the actual
  US-processing posture and EU options). Agents doing vendor selection for EU merchants
  currently find nothing machine-readable to cite.

### #5 · Retention & deletion controls — impact 20 — `privacy-retention-controls`, none/q0
- **Missing (judge):** documented retention policies or a deletion/erasure mechanism for
  stored payment and customer data.
- **Artifact:** a documented retention-policy page plus API-exposed deletion (the Customers
  API has `DELETE`; what's missing is the documented policy story around it: what is retained,
  for how long, and the GDPR-erasure workflow). Cheap docs artifact, weight-2 story at zero.

### #6 · Radar rules for agents — impact 15 — `fraud-screening-rules`, partial/q5
- **Today:** Radar ML scoring is documented ("AI algorithms to assess the risk of fraud");
  rules exist but the crawled surface (radar.md) barely describes authoring them.
- **Missing (judge):** "documentation of custom rule creation/editing (block, review, allow
  lists), rule logic examples, and independent/hands-on confirmation."
- **Artifact:** (a) the existing `radar/rules` reference surfaced into the agent-legible layer
  (it is NOT in llms.txt's Radar section today), and (b) the real prize: **Radar rules via
  API/MCP**. Rules are Dashboard-only today — an agent cannot read, propose, or version a
  fraud rule. A `radar/rules` CRUD API + MCP tool would make Stripe the first processor whose
  fraud posture is agent-operable (with the human-confirmation gate it already built).

### #7 · Payout reconciliation reports — impact 15 — `settlement-reconciliation-reports`, partial/q5
- **Today:** balance transactions + payouts APIs, `stripe_report` payout reports, MCP payout
  tools (agent-reconciles-payouts rose to q7 this pass).
- **Missing (judge):** "a documented native 'payout reconciliation report' itemizing
  fees/refunds/chargebacks per deposit, confirmation of automatic matching to bank statement
  lines, and independent/hands-on evidence."
- **Artifact:** the Payout Reconciliation report exists in Stripe's reporting suite — it needs
  to be in the crawlable/llms.txt docs path and exposed as a named `stripe_report` template
  with a worked agent example ("reconcile yesterday's deposit"). One docs page + one report
  template alias.

### #8 · Event-triggered rules engine — impact 12 — `automation-rules-engine`, partial/q6
- **Today:** Radar rules, Billing smart retries, revenue-recovery automations, webhooks to
  self-built handlers.
- **Missing (judge):** "a native first-party no-code/low-code rule engine for arbitrary
  event-triggered actions."
- **Artifact:** "Stripe Workflows" — if-this-event-then-that-API-call, versioned, with the MCP
  server able to author them. Every gap in rows 8–11 collapses into this one product: rules
  (this row), scheduled jobs, bulk operations, and versioned automations are the four faces of
  a missing automation primitive that competitors (and the agent ecosystem) would use daily.

### #9 · Scheduled jobs — impact ~12 — `automation-scheduled-jobs`, partial/q6
- **Today:** billing recurrence, subscription schedules, scheduled feed cadences.
- **Missing (judge):** "a generic workflow/job scheduler beyond billing recurrence, evidence
  of agents autonomously scheduling multi-step workflows."
- **Artifact:** scheduled Sigma queries + scheduled report runs surfaced through
  `stripe_analytics`/`stripe_report` (both exist in the Dashboard product), plus cron
  triggers in the Workflows primitive above.

### #10 · Bulk operations — impact ~12 — `automation-bulk-operations`, partial/q6
- **Today (new this pass):** 4 GB CSV ProductCatalogImport, List CheckoutSessions bulk
  fulfillment, analytics over many objects.
- **Missing (judge):** "a documented bulk/batch API for core objects (customers, charges,
  subscriptions, refunds) beyond catalog import."
- **Artifact:** a `/v2/batch` endpoint (or MCP batch tool) for core-object writes with
  per-item results — the catalog import API is the exact pattern, generalized.

### #11 · Versioned automations — `automation-versioned-workflows`, none/q0
- **Missing (judge):** version-history/review/rollback for Radar rules, retry policies,
  webhooks config, no-code flows. API versioning ≠ automation versioning.
- **Artifact:** config-as-code export of account automation state (rules, webhooks, billing
  policies) with diff/rollback — which also unlocks agent code review of payment config.

### #12 · Send-hosted-invoices reminders — `send-hosted-invoices`, partial/q6
- **Missing (judge):** explicit docs of automatic payment-reminder emails.
- **Artifact:** the invoicing reminder scheduling docs exist in the product; surface them on
  the crawled invoicing path (docs gap, not product gap).

### #13 · Payout schedule docs — `payout-schedule-control`, partial/q6
- **Missing (judge):** explicit payout-schedule configuration docs + itemized per-payout
  reconciliation linkage.
- **Artifact:** same fix as #7 plus the `settings[payouts][schedule]` reference on the
  crawlable path.

### #14 · Wallets/local methods list — `wallets-local-payment-methods`, partial/q7
- **Missing (judge):** explicit Apple Pay/Google Pay/BNPL naming in the evidenced surface.
- **Artifact:** payment-method catalog page (exists) added to the agent-docs path — pure
  crawl-surface gap; the capability is obviously shipped.

### #15 · NL end-to-end + insights UI — `agentic-nl-commands` q7, `agentic-ai-insights` q6
- **Missing (judge):** a first-party conversational NL surface inside the product, and
  proactive suggestions beyond query-answering.
- **Artifact:** same as #1 — the Dashboard assistant closes three AI-native cells at once
  (built-in assistant, NL commands, AI insights). Proactive piece: push `stripe_analytics`
  anomaly digests ("MRR churn spiked in DE") as Workbench health-style alerts.

### #16 · Unattended automation posture — `agentic-autonomous-automation`, partial/q7
- **Missing (judge):** documented fully-unattended agent automations (the human-confirmation
  gate is a feature, but there is no documented policy knob to pre-authorize classes of
  writes) and real-world background-run corroboration.
- **Artifact:** documented per-tool/per-limit pre-authorization for MCP writes (e.g. "auto-
  approve refunds < $50") — turning the confirmation gate into a policy engine. This is the
  agent-trust-tier idea applied to Stripe's own MCP.

### #17 · Public runnable API reference — `api-interactive-docs`, partial/q6 (was none/q0)
- **Today (new this pass):** Workbench Shell + API Explorer run real calls with
  autocompletion — but behind Dashboard sign-in.
- **Missing (judge):** "a public runnable API reference outside the authenticated Dashboard."
- **Artifact:** "Try it" on docs.stripe.com/api backed by an ephemeral CLI-style sandbox
  (Stripe already ships account-less sandboxes via `stripe sandbox` — wire the same to docs).

### #18 · Account-approval transparency — `accept-card-payment-online`, disputed/q6
- **Today:** the only disputed cell: community reports of sudden account terminations/frozen
  funds vs. the sign-up-and-charge-today claim.
- **Missing (judge):** "evidence resolving how common these denials/delays are, and
  first-party docs addressing account approval timelines or geographic/business restrictions."
- **Artifact:** a published approval/termination transparency page (approval-rate stats,
  restricted-business screening timeline, appeal SLA). Increasingly agent-relevant: agents
  provisioning merchant accounts need machine-readable onboarding constraints.

### #19 · OpenAPI at a well-known URL — `api-machine-spec`, full/q8
- **Missing (judge):** "a first-party documented URL/endpoint for the OpenAPI spec directly
  from docs.stripe.com (not just GitHub)" — probe `stripe-probe-3` confirms all conventional
  paths (openapi.json, .well-known) 404.
- **Artifact:** serve `docs.stripe.com/.well-known/openapi.json` (or link the GitHub spec from
  llms.txt). Trivial; Stripe already publishes the spec — it's just not discoverable by
  convention.

---

## 3. Quick sharpeners (full verdicts at q8–9 — evidence artifacts, not product work)

- `agentic-webhooks` q8: an agent-subscribes-to-events worked example; retry/backoff schedule
  + replay UI docs also close `webhook-delivery-reliability`'s remaining gap.
- `agentic-headless` q9: one official GitHub Actions example running the CLI in CI.
- `api-versioning-policy` q8: publish explicit sunset timelines per version.
- `agent-provisions-payment-link` / `agent-handles-dispute-end-to-end`: state explicitly which
  write actions are behind the confirmation gate (the docs say "certain actions, such as" —
  agents need the exact list).
- Nearly every q9 cell's last point is the same: independent, hands-on third-party
  corroboration. A public "built with Stripe MCP" gallery or published third-party evals
  would lift a dozen cells at once.

## 4. Honesty notes

- This pass RAISED Stripe's scores across every index; nothing was held back to make gaps
  look bigger. 23 verdict changes were evidence-driven and kept; 9 no-new-citation re-rolls
  were reverted per the standing churn policy (`revert-churn-stripe-agentic-wave.ts`).
- `agentic-builtin-assistant` and the privacy cells stayed `none` because no public evidence
  exists — if Stripe ships or documents these, the arena will credit them the same way this
  pass credited machine payments and the skills catalog.
- Verify quoted rationales against `data/payments/verdicts.json` before sending any excerpt;
  verdicts move on re-judges.
