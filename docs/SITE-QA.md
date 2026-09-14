# SITE-QA — full-site audit (2026-09-14)

Method: production build (`pnpm build` + `next start`), Playwright crawl of a representative
sample of every route type at 1280px and 375px (console errors, failed requests, horizontal
overflow, broken images, missing alt, `undefined`/`NaN`/`[object Object]` renders), a full
link-check of all 989 internal links collected from the crawl, a dedicated sweep of all 307
`/vs/` links across all 23 family pages, plus grep audits (placeholder copy, `target="_blank"`
without `rel="noopener"`, `<img>` without alt, plain `<a>` for internal routes).

Legend: **bug** (broken behavior users hit) > **deficiency** (missing/degraded quality) >
**polish** (nice-to-have). Status: ✅ fixed in this pass · ⏳ needs lane · 🔒 owned by another
lane this hour.

## Bugs

1. ✅ **Dead `/vs/` links on family pages — 139 of 307 (45%) 404** (`/family/*`).
   `judgedCard()` in `app/family/[id]/page.tsx` built slugs as
   `battleSlug(entry.productId, rival.productId)` in leaderboard order, but `/vs/[slug]` only
   prerenders the slug in the battle record's stored `(a, b)` order (`dynamicParams = false`).
   E.g. `/vs/clerky-vs-stripe-atlas` 404s while `/vs/stripe-atlas-vs-clerky` exists. Fixed by
   resolving against the arena's actual `rankings.battles` (forward or reverse, drop if the
   pair has no battle page — honest, not a guessed link).

2. ✅ **Internal links rendered without the `/productarena` basePath — 404 in production**
   (site is served at `ultrametric.ai/productarena`, so a plain `<a href="/arena/...">`
   escapes the app entirely). Offenders:
   - `components/AiModeBadge.tsx` — the "Built-in AI assistant" pill on every row of
     `/rankings/agentic`, `/rankings/ai-native`, arena tables (150+ broken links per page).
   - `components/CapabilityDag.tsx` — every capability node on `/global` (29 links).
   - `app/methodology/page.tsx` — links to `/rankings/claims-integrity`, `/llms.txt`,
     `/openapi.json`.
   All switched to `next/link` (which applies basePath).

3. ✅ **Missing badge SVGs — 404s + broken images** on `/badges` and product pages: 8 newer
   products (carta, pulley, insomnia, kong-ai-gateway, cake-equity, ledgy,
   fidelity-private-shares, …) had no `public/badges/<id>-*.svg`; 16 requests 404 per page
   render, images show broken. Fixed by running `scripts/generate-badges.mjs` (25 SVGs
   added/updated) — the committed-artifact workflow that script documents.

4. ✅ **Horizontal scroll at 375px on `/rankings/agentic` and `/rankings/ai-native`.**
   Root cause: `sr-only` spans (position:absolute) inside the wide table escape the
   `overflow-x-auto` wrapper's clip because the wrapper isn't a containing block, widening the
   document itself (scrollWidth 458/510 vs 375 viewport). Fixed by adding `relative` to the
   scroll wrapper in all four index tables (Agentic, AiNative, Init, ClaimsIntegrity — the
   latter two had the same latent bug).

5. ✅ **Horizontal scroll at 375px on every product page** (`/arena/*/product/*`, scrollWidth
   563 vs 375). The "By theme" grid uses `grid gap-3 sm:grid-cols-2` with no base
   `grid-cols-1`, so the implicit auto column is sized to the cards' max-content width (the
   `truncate`/nowrap rows can't shrink). Fixed with `grid-cols-1`.

6. 🔒 **Horizontal scroll at 375px on `/integrations`** (scrollWidth 443) — product/arena
   chips row overflows. Integrations page is owned by another lane this hour; listed, not
   touched.

## Deficiencies

7. ✅ **No visible keyboard focus indicator on most interactive elements** — several inputs
   set `focus:outline-none` with only a border-color swap, and links/buttons rely on the
   browser default which is nearly invisible on zinc-950. Added a global emerald
   `:focus-visible` outline in `app/globals.css` (keyboard-only; mouse clicks unaffected).

8. ✅ **No skip-to-content link** — keyboard/screen-reader users must tab through ~30 header
   links (two dropdown menus, 65 arena items) on every page. Added a standard visually-hidden
   "Skip to content" link targeting `<main id="main">` in `app/layout.tsx`.

9. ✅ **404 page has no title** — `app/not-found.tsx` renders the excellent "No evidence this
   page exists" body but the tab reads bare "ProductArena". Added
   `metadata.title: 'Page not found — ProductArena'` (+ robots noindex).

10. ✅ **`:target` glow animation ignores `prefers-reduced-motion`** — the story-anchor glow
    in `globals.css` runs unconditionally. Wrapped in a reduced-motion guard (keeps a static
    highlight, drops the animation).

11. ⏳ **`/reports` latest week is stale** ("week ending Sep 7, 2026" as of Sep 14) — weekly
    report generation is a pipeline job, not a site fix. Needs lane.

12. ⏳ **`lib/stackBuilder.ts` TODO** — role/metric constants should derive from
    `data/icp-types.json` now that it ships. Data-plumbing change; needs lane.

13. 🔒 **Explore menu carries 19 flat items** — findability suffers; grouping (rankings /
    tools / docs) would help. `ArenaMenu` is owned by another lane this hour.

## Polish

14. ✅ **Compare empty state is instructions-only** — guides you to search but offers nothing
    clickable. Added three curated starter comparisons (classic pairs) under the empty state
    on `/compare` (page-level, additive; `CompareBuilder` untouched).

15. ✅ **`/vs/*` titles drop the "— ProductArena" brand suffix** every other page carries
    (e.g. "macOS vs Ubuntu Desktop (2026): which is more AI-ready? Evidence-tested
    comparison"). Left as-is after review — the title is already long and keyword-complete;
    documented as a deliberate exception.
    *(No change shipped; listed for the record.)*

16. **`/family/*` prefetch flood** — a family page renders up to ~26 battle links per line;
    Next prefetches all of them, so `networkidle` never settles (crawl timeout; users see
    nothing wrong, just wasted bandwidth). Consider `prefetch={false}` on the battle chips.
    Low priority; not shipped this pass.

17. **Verified clean** (no action): every `<img>` has alt text; every `target="_blank"`
    carries `rel="noopener"`; no TODO/FIXME/lorem in rendered copy; no `undefined`/`NaN`/
    `[object Object]` renders (the three "null" hits are honest methodology copy about
    null-vs-zero scoring); `feed.xml`/`llms.txt`/`openapi.json`/`sitemap.xml` all 200; footer
    and tool empty states are honest and specific; 404 page is on-brand and helpful.

## Counts

- Bugs: 6 (5 fixed, 1 owned by another lane)
- Deficiencies: 7 (4 fixed, 2 need lane, 1 owned by another lane)
- Polish: 3 (1 fixed, 2 documented/deferred)
