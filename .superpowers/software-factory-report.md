# Software Factory arena — report

Date: 2026-09-03
Category `software-factory` added (12th arena): foreloop (moved from product-feedback), factory,
devin, openhands, codegen, jules.

## 1. Category & taxonomy

`data/categories.json`: id `software-factory`, personas [engineering-lead, developer,
product-manager, ai-native], themes [intent-to-spec, autonomous-implementation,
review-quality-gates, repo-integration, human-oversight, agenticness, scale-parallelism,
pricing-limits]. Description explicitly contrasts with `ai-coding` (interactive pair-coding) by
naming "autonomous end-to-end" production.

`normalize` produced 73 stories on the first run: 29 canonical (agentic-stories.ts is now 29
items, not the older 24) + 44 LLM-authored, within the 30–60 gate. 3 non-canon `ai-native`
stories (`ai-automated-test-generation-on-change`, `ai-automatic-model-routing`,
`ai-issue-triage`) met the ≥3 gate on the first attempt — no re-run needed.

## 2. URL verification / substitutions

All product URLs curl-verified (`-L -A "Mozilla/5.0"`). Notable findings:

- **Cognition/Devin**: `cognition.ai` redirects (301) to the new canonical domain
  **`cognition.com`** — used as `urls.site`. `devin.ai` itself (and every `devin.ai/*` path,
  including `/pricing`) returns a **persistent HTTP 429 with `x-vercel-mitigated: challenge`** —
  a live Vercel bot-challenge, not a dead product (confirmed real via `docs.devin.ai` 200s,
  `cognition.com` blog posts about Devin, and the `cognition.ai`→`devin.ai` redirect chain).
  Kept `links.app: https://devin.ai` (the real, canonical app URL) but substituted the
  `businessModel.url` to the curl-verified `https://cognition.com/blog/new-self-serve-plans-for-devin`
  instead of the 404'ing `cognition.com/pricing`.
- **OpenHands**: `all-hands.dev` and the GitHub org `All-Hands-AI/OpenHands` both redirect to
  the rebranded **`openhands.dev`** / **`OpenHands/OpenHands`** — used as canonical.
- **Factory**: `docs.factory.ai` exposes a real `llms.txt` listing a product literally called
  "Software Factory" (`docs.factory.ai/software-factory/overview`) — a strong naming/category
  fit. CLI is `droid` (npm package verified, v0.211.0 latest at check time).
- **Jules**: `jules.google` is a client-rendered SPA (no crawlable internal links in raw HTML,
  same shape as Foreloop's soft-200 shell pages). Real, separate API docs live at
  `developers.google.com/jules/api` (verified 200, distinct from the marketing site). No
  npm/PyPI package exists for Jules (npm's `jules` is an unrelated JSON tool) — no `install`
  block. Pricing substituted to the curl-verified `https://one.google.com/about/google-ai-plans/`
  (Jules bundles into Google AI Pro/Ultra) since no Jules-specific pricing page resolves.
- Codegen: pip package `codegen` (0.57.0) and OpenHands: pip package `openhands-ai` (1.11.0)
  both verified live on PyPI.

## 3. Foreloop move (product-feedback → software-factory)

- `data/product-feedback/products.json`: foreloop entry removed (3 products remain).
- `data/software-factory/products.json`: foreloop entry added, same id/vendor/businessModel/
  links/install, affiliation text reworded to reference this arena's placement.
- `data/software-factory/evidence/foreloop.json`: copied from product-feedback (15 items
  carried over as-is; extract/normalize/probe/judge for software-factory added to it
  monotonically — final foreloop evidence pack has probe + docs + community(0) items).
- `data/product-feedback/evidence/foreloop.json` and `claims/foreloop.json`: deleted (no
  longer referenced by any product-feedback product).
- `data/product-feedback/verdicts.json`: 260→195 (foreloop's 65 removed).
- `data/product-feedback/popularity.json` / `popularity-history.jsonl`: foreloop entries
  removed.
- `pipeline/cache/judge/product-feedback/foreloop/` (65 files) and the stale
  `pipeline/cache/crawl|extract/product-feedback/foreloop` cache dirs: deleted.
- `pipeline/seeds/community.json`: `foreloop` removed from `product-feedback`, added under a
  new `software-factory` block with all 6 products.
- Re-ran `pnpm pipeline derive --category product-feedback` → **3 products, 3 battles**
  (C(3,2)=3). Recompute-check MATCH. `grep -rn foreloop data/product-feedback` → clean (no
  stale references).

## 4. Software Factory pipeline run

crawl → extract → normalize → collect-community → probe → judge → claims → popularity → logos
→ derive, all against real network/LLM calls (`ANTHROPIC_API_KEY` from env).

- **Judge**: 6 products × 73 stories = **438 verdicts**. Mix: full 81, partial 169, disputed 6,
  none 182, **na 0 (0%)** — spot-checked and legitimate: all 6 products are agentic
  services/platforms (not client libraries like frontend-frameworks' oss libs), so canonical
  agenticness/openness/automation/privacy axes genuinely apply-or-don't (→ `none`) rather than
  being wrong-axis (→ `na`).
- **Disambiguation** (factory/devin/jules explicitly flagged as collision-prone): HN-name-search
  auto-collection returned 0 qualified items for `foreloop`, `factory`, `openhands`, `codegen`
  (names too generic/thin — "Factory" and "Codegen" collide heavily with unrelated usage, and
  the LLM correctly filtered all of it out rather than accept off-topic evidence). Added 5
  curated HN seed URLs (1 for factory, 3 for openhands, 1 for codegen) found via targeted
  search and verified as genuinely on-topic before adding; HN's site itself intermittently
  429'd the pipeline's identifying User-Agent on refetch (a few seeds never actually landed),
  so factory/codegen/openhands end up with **0 community items** — honest thinness, not a
  disambiguation failure. `devin` (10 items) and `jules` (19 items) got rich, on-topic
  community evidence — **read every excerpt**: all genuinely about Cognition's Devin (Windsurf/
  JetBrains/ACU references) and Google's Jules (Gemini CLI, GitHub PRs, free-tier limits) — zero
  name-collision noise. This produced real `disputed` verdicts (6 total, all devin/jules) citing
  vendor claims vs. community skepticism on `autonomous-bug-fixing` and
  `end-to-end-feature-implementation` — exactly the taxonomy's hard questions working as
  intended.
- **Popularity**: openhands 86,090 GitHub stars (34.7k/yr); foreloop 26 npm weekly; added
  `factory`→npm `droid` (14,611 weekly) and `codegen`→pypi `codegen` (372 weekly) to
  `pipeline/popularity-packages.json` after the stage initially skipped both for lack of a
  mapping. `devin` and `jules` have no public package/repo — correctly skipped ("no
  discoverable signal source"), not forced.
- **Logos**: 5/6 saved (foreloop, devin via site icon; factory, codegen, jules via Google
  favicon fallback). `openhands` failed both site-icon and favicon-fallback extraction — falls
  back to the app's built-in text-initial placeholder (`lib/logos.ts`'s `hasLogo` check),
  consistent with prior categories' partial-logo-coverage precedent.

## 5. Leaderboard (Arena Score `aiEra` / agentReady)

| Product | Arena Score | agentReady | agenticApp | Notes |
|---|---|---|---|---|
| **openhands** | **48.5** | 45.7 | 75.8 | leader; OSS, 86k★, best apiQuality (34.3) |
| codegen | 30.2 | 46.4 | 66.7 | |
| devin | 29.5 | **63.8** (highest) | 31.6 | agentReady leader; disputed cells on autonomy claims |
| factory | 28.5 | 48.5 | 59.1 | |
| **foreloop** | 19.3 | 38.8 | 28.0 | **5th of 6** |
| jules | 18.3 | 22.5 | 42.2 | lowest agentReady (no public API-key/webhook surface docs found) |

Coverage: 73/73 applicable for all 6 products (0 na).

**Foreloop**: 40 none / 25 partial / 8 full across 73 stories — no inflation. Its best cells are
genuinely earned (`auto-open-pr-on-completion`: full — docs describe agents opening PRs from
approved tasks; several `partial` on `autonomous-bug-fixing`, `concurrent-task-execution`,
`diff-review-before-pr` citing real but incomplete evidence, e.g. task/contract approval is a
pre-work gate, not a diff review). Ranks 5th/6th — below factory/devin/codegen/openhands, ahead
only of jules — reflecting its early/waitlist-stage evidence pack, not favorable treatment.

## 6. Gates

- `recompute-check.ts` (updated with `software-factory` in the alphabetical list): **ALL
  DETERMINISTIC** across all 12 categories.
- `pnpm test`: **365/365 passing**, no hardcoded counts needed fixing (`data.test.ts` already
  asserts `categories.toHaveLength(raw.length)`).
- `pnpm stats`: 12 arenas, 62 products, 5,000 verdicts (README.md was already stale from an
  earlier, unrelated point in history — now corrected).
- `pnpm build`: green, 431 static pages total. Exact deltas from this session (verified against
  `.next/prerender-manifest.json`, not estimated): **arena pages 11→12 (+1)**, **product pages
  56→62 (+6)**, **battle pages 122→134 (net +12)**, **/vs/ pages 122→134 (net +12,
  1:1 with battles)**. The net battle/vs change is +15 from software-factory's new C(6,2)=15
  minus -3 from product-feedback shrinking from C(4,2)=6 to C(3,2)=3 after the foreloop move —
  not a flat +15/+21 as a naive guess would suggest.

## 7. Concerns / follow-ups

- `factory`, `codegen`, `openhands`, `foreloop` all carry **0 community-tier evidence** — thin
  but honest (generic/collision-prone product names plus an intermittent HN rate-limit on the
  pipeline's identifying User-Agent during seed refetch). Their scores rest on
  claimed-docs/github/probe tiers only; a future pass with a browser-like UA or a delay/backoff
  tune to `pipeline/fetch-page.ts` could recover more signal.
- `devin.ai` (the product's own domain) is permanently 429-gated against the pipeline's and any
  plain `curl`'s automated fetches (Vercel bot-challenge) — this will recur on any future
  refresh of devin's crawl/probe data; `cognition.com` and `docs.devin.ai` remain reliable.
- `openhands` has no logo asset (both site-icon and Google-favicon extraction failed) — cosmetic
  only, app's text-fallback handles it gracefully.
- `jules` has the lowest `agentReady` (22.5) in the category — no MCP/CLI links found, no
  scoped-API-key or webhook documentation surfaced by extract/normalize; worth a manual doc dig
  if Jules ships those in the future, since a purely SPA marketing site made crawl coverage
  thinner than the other 5 products.

## 8. Commits

1. `data: move Foreloop into the new Software Factory arena, add factory/devin/openhands/
   codegen/jules, re-derive Product Feedback` — categories.json, both categories' full data
   dirs (products/stories/verdicts/rankings/evidence/claims/popularity), judge-cache for both
   categories, seeds/community.json, popularity-packages.json, recompute-check.ts, new/updated
   logos.
2. `chore: refresh README stats (pnpm stats)` — README.md only.

Pushed to `main`; CI verified green (see final report to caller for the run URL/ID).
