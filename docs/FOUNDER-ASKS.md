# Founder asks — running tracker

Every founder request gets a row when made and a status update when merged+deployed.
Statuses: `open` · `in-lane (<topic>)` · `shipped YYYY-MM-DD` · `blocked (<on what>)`.
The orchestrator updates this file at every merge; anything `open` for >1 session is a bug.

## Open / in flight (2026-09-14)

| Ask | Status |
|---|---|
| Hardware arenas: n/a on non-applicable sub-scores (agent-ready, API) keeping PA Score | shipped 2026-09-15 — naDimensions on processors+gpus; n/a pills/cells on vendor page + arena + everything tables |
| YC S09 pill wraps to two lines | shipped 2026-09-15 (whitespace-nowrap) |
| Product name column truncates too early | shipped 2026-09-15 (min-width raised on homepage + arena tables) |
| "Built-in AI assistant" pill breaks row height on /rankings/agentic | shipped 2026-09-15 — AI mode is its own column on agentic + ai-native rankings |
| Operating rhythm page + email-marketing arena + arenas strip on product pages | shipped 2026-09-15 (startup-rhythm lane merged) |
| Stripe engine: 3 new arenas (identity-verification, banking-data-apis, stablecoin-payments), 13 lines dispositioned, competitor spikes, /queue | shipped 2026-09-15 |
| "PA Score" label inside the pill on vendor page | shipped 2026-09-15 |
| /arena/processors description too long above fold | shipped 2026-09-15 (both hardware arena descriptions tightened to house style) |
| Stacks page: layer names clickable → their arena page | shipped 2026-09-15 |
| Make /rankings/most-connected comprehensive | open — queued (todo per founder) |
| Story-type icons left of story text on arena pages | shipped 2026-09-15 (theme icon per row) |
| Front page: "+" card in Arenas grid → suggest an arena via GitHub issue | shipped 2026-09-15 |
| Front-page scope dropdown: "All products" → "All arenas" | shipped 2026-09-15 |
| Arena icons in the front-page arena dropdown (same as top bar) | open — UI lane |
| Pulley possibly shut down — verify, mark closed, keep data | shipped 2026-09-15 — vendor notice: ceasing operations 2026-12-08, Carta migration; CLOSING badge, data kept |
| "⚿ auth 1 auth-gated probe" not useful above the fold | shipped 2026-09-15 (moved to page bottom) |
| Vendor pills: "Built-in AI XX/100", "Agent-ready XX/100" + click through to evidence log | shipped 2026-09-15 — /score per-vendor receipt pages (+439 pages), pills show /100 and deep-link |
| PA Score above fold → per-vendor transparent calculation page (not just generic methodology) | shipped 2026-09-15 — /arena/<a>/product/<p>/score shows the full arithmetic, PA recomputes exactly |
| Flag/Badge/Try demoted from top of vendor page; Try marked "Experimental" | shipped 2026-09-15 |
| "For agents" above-fold cell → bottom of vendor page | shipped 2026-09-15 |
| Compare head-to-head uses vendor logos | shipped 2026-09-15 |
| Stripe "Not yet judged (13)" products: find/create arenas and judge all | shipped 2026-09-15 — 3 judged in new arenas (Identity 3rd, Financial Connections 4th, Crypto last with preview gates costed); 4 covered in existing entries; 6 honestly not judgeable (reasons recorded) |
| Deep spikes on Stripe's nearest competitors — build an engine if multi-day | shipped 2026-09-15 — 8 competitors spiked (Airwallex #6→#2); spike-engine cron daily 04:23 UTC |
| Microterminal: actually live + sandboxed, not a replay | shipped 2026-09-15 — 316/649 proofs (49%, 48 arenas) re-runnable live via worker allowlist (manifest-keyed, no user input reaches fetch, 20/min/IP); rest honestly labeled recorded; section marked Experimental |
| Score trend → bottom of vendor page | shipped 2026-09-15 |
| User story table: filter by user type | shipped 2026-09-15 |
| Deep spike on Mercury and Rippling | queued in spike engine (Mercury already had the startup-banking exhaustive pass; both ranked in data/spike-priorities.json) |
| Business-model tags in user story table (free vs enterprise-only stories) | shipped 2026-09-15 (tier chips + tier filter — pricing-tier lane; coverage grows as evidence states gating) |
| Always-running probe/spike engine over top companies + visible queue | shipped 2026-09-15 — spike-engine.ts + daily cron + unlinked /queue page (staleness × popularity × priority) |
| Gifts URL + read rejection notes, fix gifts that will fail again | shipped 2026-09-15 — Homebrew retired (maintainer passed), vLLM disclosure body ready (founder: gh pr edit 56909 --body-file drafts/outreach/vllm/PR-BODY-v2.md), docusaurus on hold (competing PR #11958), gitea fixed (needs founder account+DCO); checklist hardened |
| Submit PA to directories for traffic; PA-specific Terms + Privacy building on ultrametric.ai TOS | shipped 2026-09-15 — 30-venue plan in drafts/growth/DIRECTORIES.md (2 awesome-list PRs ready for founder review); /terms extended + /privacy added (counsel review recommended) |
| WhatsApp preview sometimes shows old image — diagnose | shipped 2026-09-15 — root cause: app/opengraph-image.png overrode og2.png with a double-basePath 404 URL; removed |
| Do we need RSS? | answered 2026-09-15 — keep (see session notes) |
| Hardware arenas into top bar + menus, drop Experimental status | shipped 2026-09-15 — Hardware section in arena menu, /experiments pages are now spec annexes linking the arenas |
| Start WorkOS login work (account exists) | shipped 2026-09-15 (code) — mock-mode harness + account watchlist sync; go-live = 5-min founder checklist in docs/AUTH.md (secrets + redirect URI) |
| Scrollbar tracks transparent, not white | shipped 2026-09-15 |
| Footer "Add your product" → actually goes to GitHub (CONTRIBUTING.md), scanner relabeled "Test your product" | shipped 2026-09-15 |
| Pricing tier (free/paid/enterprise) visible in user story table | shipped 2026-09-15 (tier chips + filter, pricing-tier lane) |
| Enterprise flag for sales-led vendors | shipped 2026-09-15 — 33 vendors live-verified and stamped (Adyen, Marqeta, Mangopay, Sierra, CoreWeave…); ~30 checked-and-rejected recorded |
| Remove /notes (Arena Notes) — not useful | shipped 2026-09-15 (route, lib, generator, drafts, feed merge all removed) |
| Clerky 0/100 — non-agentic or gap? | shipped 2026-09-15 — coverage gap: developers.clerky.com Partner API + llms.txt + mcp.clerky.com MCP were never crawled; PA 13.9→22.1, aiEra 0→14.0, agentReady 0→37.3 |
| Footer: drop "Test your product" (adding = testing) | shipped 2026-09-15 |
| Remove "?" chip next to table filter on main page | shipped 2026-09-15 |
| ALL YC batches covered for agentic/famous companies | shipped 2026-09-15 — full W16–F26 audit: 7 bring-ups (Deepgram W16, RevenueCat S18, SigNoz W21, LanceDB W22, Windmill S22, Context.dev S26, Maritime F26) + 14 domain-verified restamps (82 → 103 stamped products); every batch of the last 10 years covered or honestly recorded as no-arena-fit; coverage queue re-swept W16–F26 (784 candidates) |
| Bring hardware section (processors, GPUs) into the arenas | shipped 2026-09-15 — processors + gpus arenas (16 products, 696 verdicts); Ryzen AI Max+ best agentReady in CPUs, MI355X in GPUs; 9950X3D honest 0 aiEra |
| Arena for YubiKey-type hardware authenticators | shipped 2026-09-15 — security-keys: 6 products, 324 verdicts, 11 recorded probes; YubiKey #1 (ykman + YubiEnterprise API), Nitrokey #2 on open updatable firmware, Titan last (zero agent surface); Ledger evaluated and excluded (crypto wallet first — FIDO app is a 21-star side capability) |
| Arena for authenticator-type apps | shipped 2026-09-15 — authenticator-apps: 8 products, 440 verdicts, 14 recorded probes incl. two FULL keyless MCP handshakes (Bitwarden stdio, 1Password remote); Bitwarden #1, 1Password best agent-readiness (70.1); Authy/Google/Microsoft bottom on export lock-in + no programmatic surface |
| Game engines arena — Unity vs three.js, agenticness measured | shipped 2026-09-15 — game-engines: 8 products, 448 verdicts, 19 recorded probes; MCP landscape verified honestly (PlayCanvas = only official npm-published editor MCP; Unity official MCP in com.unity.ai.assistant, closed distribution; Godot/Unreal community-only); Unity runtime-fee history + Muse→"Unity's AI tools" rename cited from Unity's own pages; Babylon.js edges Phaser for #1 aiEra, Unreal last (source auth-gated, site 403s agents) |
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
| Stripe-style exhaustive passes for major startups + hot repos (incl. buzz) | shipped 2026-09-15 — subsumed by the spike engine: the standing daily loop works the whole fleet by staleness × popularity × founder priority (buzz and every hot repo queue mechanically) |
| Arenas for Stripe's 13 unjudged lines — judge all of Stripe's products | shipped 2026-09-15 — 3 new arenas (identity-verification, banking-data-apis, stablecoin-payments; 19 products, ~1,000 verdicts); Identity/Financial Connections/Crypto flipped page-only → judged; the other 10 lines stay honestly page-only with refreshed recorded reasons (Invoicing/RevRec inside Billing's entry, Managed Payments+Lemon Squeezy inside payments, Capital/Sigma/Data Pipeline/Directory/Projects/Climate not judgeable — each note says why) |
| Deep spikes on Stripe's nearest payments competitors (adyen, paypal, square, checkout-com, airwallex, paddle, polar, mollie) | shipped 2026-09-15 — one exhaustive spike-engine pass each: llms.txt-discovered URL expansion, re-crawl, re-judge, churn policy applied (flips kept only when citing new evidence ids) |
| Deep running engine always probing/spiking top companies, with a visible queue | shipped 2026-09-15 — pipeline/scripts/spike-engine.ts (rank + process modes, budget-capped, judge-cache- and churn-policy-respecting), .github/workflows/spike-engine.yml daily 04:23 UTC with the story-runner soft key gate, queue state in data/spike-queue.json rendered at the unlinked /queue page |
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
