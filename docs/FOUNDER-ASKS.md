# Founder asks — running tracker

Every founder request gets a row when made and a status update when merged+deployed.
Statuses: `open` · `in-lane (<topic>)` · `shipped YYYY-MM-DD` · `blocked (<on what>)`.
The orchestrator updates this file at every merge; anything `open` for >1 session is a bug.

## Open / in flight (2026-09-14)

| Ask | Status |
|---|---|
| Front-page scope dropdown: "All products" → "All arenas" | open — inline now |
| Arena icons in the front-page arena dropdown (same as top bar) | open — UI lane |
| Pulley possibly shut down — verify, mark closed, keep data | open — inline now |
| "⚿ auth 1 auth-gated probe" not useful above the fold | open — inline now |
| Vendor pills: "Built-in AI XX/100", "Agent-ready XX/100" + click through to evidence log | in-lane (transparency) |
| PA Score above fold → per-vendor transparent calculation page (not just generic methodology) | in-lane (transparency) |
| Flag/Badge/Try demoted from top of vendor page; Try marked "Experimental" | open — inline now |
| "For agents" above-fold cell → bottom of vendor page | open — inline now (supersedes startup-sim/page-order row) |
| Compare head-to-head uses vendor logos | open — inline now |
| Stripe "Not yet judged (13)" products: find/create arenas and judge all | in-lane (stripe-engine) |
| Deep spikes on Stripe's nearest competitors — build an engine if multi-day | in-lane (stripe-engine) |
| Microterminal: actually live + sandboxed, not a replay | in-lane (live-terminal) |
| Score trend → bottom of vendor page | open — inline now |
| User story table: filter by user type | open — inline now |
| Deep spike on Mercury and Rippling | in-lane (stripe-engine) |
| Business-model tags in user story table (free vs enterprise-only stories) | shipped 2026-09-15 (tier chips + tier filter — pricing-tier lane; coverage grows as evidence states gating) |
| Arena for YubiKey-type hardware keys + arena for authenticator apps | in-lane (new-arenas) |
| Game-engines arena (Unity vs three.js agenticness) | in-lane (new-arenas) |
| Always-running probe/spike engine over top companies + visible queue | in-lane (stripe-engine — /queue page) |
| Gifts URL + read rejection notes, fix gifts that will fail again | in-lane (gift-quality) — URL: /gifts (unlinked) |
| Submit PA to directories for traffic; PA-specific Terms + Privacy building on ultrametric.ai TOS | in-lane (growth-legal) |
| WhatsApp preview sometimes shows old image — diagnose | open — inline now |
| Do we need RSS? | answered 2026-09-15 — keep (see session notes) |
| Hardware arenas into top bar + menus, drop Experimental status | open — lands with hardware-arenas merge |
| Start WorkOS login work (account exists) | in-lane (workos-login) — still blocked on founder secrets for go-live |
| Scrollbar tracks transparent, not white | shipped 2026-09-15 |
| Footer "Add your product" → actually goes to GitHub (CONTRIBUTING.md), scanner relabeled "Test your product" | shipped 2026-09-15 |
| Pricing tier (free/paid/enterprise) visible in user story table | shipped 2026-09-15 (tier chips + filter, pricing-tier lane) |
| Enterprise flag for sales-led vendors | shipped 2026-09-15 — 33 vendors live-verified and stamped (Adyen, Marqeta, Mangopay, Sierra, CoreWeave…); ~30 checked-and-rejected recorded |
| Remove /notes (Arena Notes) — not useful | shipped 2026-09-15 (route, lib, generator, drafts, feed merge all removed) |
| Clerky 0/100 — non-agentic or gap? | shipped 2026-09-15 — coverage gap: developers.clerky.com Partner API + llms.txt + mcp.clerky.com MCP were never crawled; PA 13.9→22.1, aiEra 0→14.0, agentReady 0→37.3 |
| Footer: drop "Test your product" (adding = testing) | shipped 2026-09-15 |
| Remove "?" chip next to table filter on main page | shipped 2026-09-15 |
| ALL YC batches covered for agentic/famous companies | shipped 2026-09-15 — full W16–F26 audit: 7 bring-ups (Deepgram W16, RevenueCat S18, SigNoz W21, LanceDB W22, Windmill S22, Context.dev S26, Maritime F26) + 14 domain-verified restamps (82 → 103 stamped products); every batch of the last 10 years covered or honestly recorded as no-arena-fit; coverage queue re-swept W16–F26 (784 candidates) |
| Bring hardware section (processors, GPUs) into the arenas | in-lane (hardware-arenas) |
| Remove "Experiment — not part of the evidence-judged arenas…" banner from /experiments pages | shipped 2026-09-15 |
| Remove "Evidence as of … · story coverage …" footer line on product pages | shipped 2026-09-15 |
| Move "Try it" section below "Products" (family) section on vendor pages | shipped 2026-09-15 |
| Move "For agents" (page-as-markdown / llms.txt) rail cell to bottom of product page | in-lane (startup-sim/page-order) — re-scoped 2026-09-14 |
| Move "Badge / embed score badge" rail cell to bottom of product page | in-lane (startup-sim/page-order) — re-scoped 2026-09-14 |
| Homepage title → "Companies, ranked for the AI era" + refresh share image | shipped 2026-09-14 |
| Tables rankable by OSS status | shipped 2026-09-14 |
| Compare link → fixed right end of row | shipped 2026-09-14 |
| YC pill in YC orange | shipped 2026-09-14 |
| 100 functional improvements | shipped 2026-09-14 (46 done, 54 catalogued in docs/FUNCTIONAL-100.md) |
| 50 growth ideas doc + execution start | shipped 2026-09-14 (doc) — execution rolling |
| Pricing-tier dimension on user stories (free/paid/enterprise) fleet-wide | shipped 2026-09-15 — 1,180 cells classified over 70 arenas (803 free/295 paid/82 enterprise), annotation-only, tier chips + filters + "what's free" lines live |
| Stripe-style exhaustive passes for major startups + hot repos (incl. buzz) | open — queued next wave |
| Remaining payments arenas: card-issuing, tax-automation, banking-as-a-service, marketplace/payfac | shipped 2026-09-15 — 4 arenas, 23 products, 1,219 verdicts; Mangopay beats Stripe Connect in marketplace; Stripe Issuing #1 in issuing; TaxJar (Stripe-owned) last in tax |
| Payments roster expansion (Checkout.com, Mollie, Airwallex, Paddle, Lemon Squeezy, Polar) | shipped 2026-09-15 — 5 arena rows (Polar debuts #2 @ 42.9; Lemon Squeezy = Stripe family entry, acquired 2024 → Stripe Managed Payments) |
| Docusaurus gift PR | blocked (Meta CLA needs founder signature) |
| Greptile pre-review of gift PRs | blocked (needs Greptile installed on ultrametricai org — founder to confirm) |
| npm publishes (mcp/, cli/) + MCP registry submissions | blocked (founder-side npm publish) |
| Show HN + X thread launch | blocked (founder go + posting) |
| GitHub social preview upload (public/og2.png) | blocked (founder — repo Settings) |
| Google Search Console: add domain property for ultrametric.ai (DNS TXT), submit both sitemaps | blocked (founder Google account) |
| Cloudflare managed robots.txt blocks GPTBot/meta-externalagent at apex — disable AI-bot blocking | blocked (founder — CF dashboard, Security → Bots) |
| WorkOS ultrametric login: secrets (`wrangler secret put WORKOS_API_KEY` / `PA_SESSION_KEY`) + dashboard redirect URI `https://ultrametric.ai/productarena/auth/callback` | blocked (founder WorkOS account) — everything else DONE: routes audited vs live docs, per-account /watchlist sync built, WORKOS_MOCK dev harness (testable today, zero secrets); 5-min go-live checklist in docs/AUTH.md |
| Try-it sandbox demo accounts (Stripe test key first) | blocked (founder provisions accounts) — lane building the mechanism |

## Shipped (recent — see git log for full history)

- Instant tooltips sitewide · Agent ceiling → "Current agent ceiling" · Built-in AI rename ·
  Login hidden until WorkOS ships · og2 share image · search prefix ranking · "none yet"
  evidence cells · story-table column-shift bug · arena identity in product eyebrow ·
  buyer-plain column tooltips · process "do it yourself ↗" links · vendor-neutral processes ·
  most-compared KV counter · /gifts review page · crawl4ai PR #2267 · vLLM PR #56909
