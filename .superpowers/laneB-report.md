# Lane B — Deep story analysis (5 categories)

Status: COMPLETE. All gates green (`pnpm test`: 276/276 passing; `pnpm build`: succeeds).

## Commits (this worktree, not pushed/merged)
1. `depth: project-management taxonomy deepening (Lane B)` — schema change (+'mined' origin kind) + shared scripts + project-management data
2. `depth: web-scraping taxonomy deepening (Lane B)`
3. `depth: edge-platforms taxonomy deepening (Lane B)`
4. `depth: frontend-frameworks taxonomy deepening (Lane B)`
5. `depth: local-llm-runtimes taxonomy deepening (Lane B)`

## New-story counts by source (claims / mined / gap)
| category | claims | mined | gap | total | stories (was → now) |
|---|---|---|---|---|---|
| project-management | 7 | 6 | 7 | 20 | 63 → 83 |
| web-scraping | 7 | 5 | 6 | 18 | 78 → 96 |
| edge-platforms | 6 | 7 | 7 | 20 | 78 → 98 |
| frontend-frameworks | 2 | 6 | 6 | 14 | 71 → 85 |
| local-llm-runtimes | 5 | 5 | 6 | 16 | 76 → 92 |

(Counts are post-dedupe: the mining pass over-produced a few near-duplicates —
e.g. web-scraping's "pay-only-successful-requests" vs "failed-request-billing",
edge-platforms' "multi-language-workers" vs "polyglot-edge-runtimes",
frontend-frameworks' "published-bundle-size-cost" vs "minimal-bundle-footprint",
local-llm-runtimes' "shared-model-cache-interop" vs "model-cache-portability" —
which were manually cut before injection since the automated Jaccard-overlap
dedupe only catches literal wording overlap, not paraphrase-level duplicates.)

## New-cell verdicts judged
- project-management: 120/120 (20 stories × 6 products)
- web-scraping: 108/108 (18 × 6)
- edge-platforms: 120/120 (20 × 6)
- frontend-frameworks: 70/70 (14 × 5)
- local-llm-runtimes: 80/80 (16 × 5)
- Total new cells: 498. All matrices complete (verdicts.json length == stories×products for every category); `claims` stage re-run per category so mappings cover the new stories (e.g. Linear's taxonomy-gap claims dropped 12→6).

Spot-read 5 new-cell verdicts per category (25 total) for evidence-grounding — all cited real evidenceIds with tier-appropriate confidence; several correctly landed on "disputed" citing conflicting vendor-docs vs community evidence (e.g. Cloudflare's Python-Workers claim, Fly.io's status-page accuracy, Vue's two-way-binding complaints).

## Notable new stories
- `interface-rate-limit-disclosure` / `documented-rate-limits` (gap, several categories) — "I know the documented API rate limits and concurrency caps before building automation at scale."
- `agent-toolchain-autoprovisioning` (project-management, claims) — coding agent auto-detects/installs its own toolchain, sourced from a real Linear changelog claim our old taxonomy had no story for.
- `governance-backing-risk` (frontend-frameworks, gap) — "I know whether the framework is governed by a foundation or a single company, so I can assess lock-in/continuity risk."
- `known-overage-pricing` / `credit-overage-billing` (edge-platforms/web-scraping, gap) — exact overage-fee schedule disclosure, a recurring pricing-trap blind spot.
- `coding-agent-backend-integration` (local-llm-runtimes, claims) — pointing third-party coding-agent CLIs (Claude Code, Codex) at the local runtime as model backend.

## Schema change
Added `'mined'` to `StoryOriginSchema.kind` in `lib/schemas.ts` (additive, non-breaking). Claims-derived stories use `{kind:'normalized', promptVersion:'v2-depth'}`; both demand-mined and gap-review stories use `{kind:'mined', promptVersion:'v2-depth'}` (gap-review isn't explicitly assigned in the brief; treated as "mined" since it's not vendor-claim-derived).

## Infra added
- `pipeline/scripts/depth-mine.ts` — per-category mining (unmapped claims + HN Algolia comment search/community evidence + expert-buyer gap review), token-Jaccard dedupe against existing stories, canon-id-prefix sanitizer (avoids `agentic-`/`automation-`/`privacy-`/`openness-`/`api-` collisions with the 29 canonical ids), injects into `stories.json` (sorted, canon untouched).
- `pipeline/scripts/judge-all-products.ts` — runs `judge --product` sequentially per product in a category (cache-resumable).

## Concerns
- An early run accidentally launched judge for all 4 remaining categories as parallel background tasks; caught mid-flight, background tasks abandoned/lost (their partial cache files survived on disk since judge writes per-cell immediately), and the rest of the work was redone strictly sequentially per the coordinator's correction. No data was lost or corrupted — verified via matrix-completeness checks before every commit.
- Dedupe is best-effort (id collision + literal token overlap); manually caught 4 additional paraphrase-level duplicates across categories that the automated check missed. Worth a human second pass before merge.
- `frontend-frameworks` landed at 14 new stories (low end of the 10-20 target) because very few claims were unmapped for that category (2) — reflects genuinely thin claims data more than under-mining.
