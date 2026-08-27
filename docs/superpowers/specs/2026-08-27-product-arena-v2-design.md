# Product Arena v2 — Design Spec

**Date:** 2026-08-27
**Status:** Approved in chat (user: "good to build that")
**Supersedes/extends:** `2026-08-25-product-arena-design.md` (v1). v1 architecture (offline pipeline → committed JSON → static Next.js on Vercel; judged cell matrix → derived battles) is unchanged. This spec covers the v2 deltas.

## 1. Goals

1. **Multi-category arenas** — 7 categories, ~36 products (lineups in §2).
2. **Story groups** — stories cluster into groups under themes (Security → `two-factor-auth` → granular rows like "TOTP app 2FA", "hardware security keys (YubiKey)"). Comparisons render group-by-group.
3. **AI-native persona** — every category's taxonomy includes an `ai-native` persona with agent-operator stories.
4. **Agenticness Index** — a mandatory, canonical `agenticness` story group in every category (public API, official CLI, MCP server, webhooks, SDKs, llms.txt/agent docs, scoped API keys, headless automation), judged from evidence, surfaced as a 0–100 badge everywhere.
5. **N/A verdicts** — `na` for wrong-axis cells; excluded from score denominator AND battle rounds; applicability count displayed.
6. **Logos** — favicon/apple-touch-icon per product fetched to `public/logos/{id}.png`, shown throughout.
7. **v1 follow-ups** — desktop-os evidence refresh (richer source URLs) + re-judge; real README with methodology (incl. judge-bias disclosure for the AI-coding arena); per-page metadata.
8. **Public-release prep (repo stays private)** — LICENSE, CONTRIBUTING with a community evals workflow (contest-a-verdict / add-evidence via PR + issue template), secrets audit, transfer to the `ultrametricai` GitHub org.

## 2. Categories & lineups

| id | name | products (ids) |
|---|---|---|
| desktop-os | Desktop OS | macos, omarchy, ubuntu, fedora |
| startup-banking | Startup Banking | mercury, brex, ramp, wise, relay |
| project-management | Project Management | linear, asana, clickup, notion, monday, jira |
| web-scraping | Web Scraping APIs | firecrawl, crawl4ai, jina-reader, apify, scrapingbee, browserbase |
| mobile-dev | Mobile AI Dev Tools | termius, tailscale, blink-shell, a-shell, working-copy, github-mobile |
| code-hosting | Code Hosting | github, gitlab, bitbucket, gitea |
| ai-coding | AI Coding Agents | codex, claude-code, cursor, github-copilot, gemini-cli |

Product ids are globally unique across categories. Each product belongs to exactly one category.

## 3. Data model deltas

### Layout
```
data/
├── categories.json          # array of Category (id, name, description, personas)
└── {categoryId}/
    ├── products.json
    ├── stories.json
    ├── evidence/{productId}.json
    ├── verdicts.json
    └── rankings.json
```

### Schema changes (lib/schemas.ts)
- `CategorySchema.personas` must include `"ai-native"` in every category.
- `StorySchema` + `group: z.string().min(1)` (kebab-case group id under the theme, e.g. `two-factor-auth`).
- `VerdictSchema.verdict` enum + `'na'`. `na` behaves like `none` for citation rules (evidenceIds may be empty) and MUST have `quality: 0`. Meaning: this axis does not apply to this product (wrong axis), as opposed to `none` (applies, no evidence it delivers).
- `ProductSchema.urls` + optional `extra: z.array(z.string().url())` — additional crawl sources. + optional `logo: z.string()` (path under /public, convention `/logos/{id}.png`).
- `RankingsSchema.leaderboard[]` + `agenticness: number|null` (the agenticness theme score) + `applicable: number` (count of non-na cells) + `total: number` (cell count). `battles[].rounds[].winner` enum + `'na'` (round excluded from record).

### Canonical agenticness stories (same ids in every category, injected by normalize)
theme `agenticness`, group `agent-access`, persona `ai-native`:

| id | title (As an AI-native user, I can …) | weight |
|---|---|---|
| agentic-public-api | … drive the product through a documented public API | 3 |
| agentic-official-cli | … use an official CLI | 2 |
| agentic-mcp-server | … connect an agent via an official MCP server | 3 |
| agentic-webhooks | … subscribe to events via webhooks | 2 |
| agentic-sdks | … build against official SDKs | 2 |
| agentic-agent-docs | … point an agent at llms.txt or agent-oriented docs | 2 |
| agentic-scoped-keys | … issue scoped/least-privilege API credentials for an agent | 2 |
| agentic-headless | … run the product headlessly / in CI for automation | 2 |

## 4. Scoring deltas (lib/scoring.ts)

- Verdict factors: unchanged; `na` has factor 0 AND is excluded from the denominator: `score = Σ(w×q×f over non-na cells) / Σ(w×10 over non-na cells) × 100`. A product with zero applicable cells in a theme gets themeScore null→rendered "n/a" (implementation: omit the theme key or 0 with applicable=0 flag; chosen: themeScores value computed over applicable-only; if no applicable cells in theme, set -1 sentinel is forbidden — use `themeScores[t] = null` via schema `z.number().nullable()`).
- `agenticness` on each leaderboard entry = `themeScores['agenticness']` (null if absent).
- Battle rounds: if either cell is `na`, round.winner = `'na'`, margin 0, excluded from `record` and from the weighted winner sums.
- Battle winner and record computed over non-na rounds only.

## 5. Pipeline deltas

- Every stage takes `--category <id>` (required for extract/normalize/judge/derive; crawl/collect-community/logos accept `--category` and/or `--product`). Paths become category-scoped (`pipeline/cache/{stage}/{categoryId}/{productId}...`).
- **normalize v2 prompt**: produce 30–50 granular stories per category, clustered into groups under themes; every story assigned persona from the category's persona list (must include `ai-native` stories beyond the injected canon); product-neutral; THEN the stage injects the canonical agenticness stories from §3 verbatim (code, not LLM) and dedupes any LLM story that duplicates them. Themes list per category is provided in the category seed (category.json gains optional `themes: string[]`; fallback to v1 list for desktop-os).
- **judge v2 prompt**: adds the `na` definition — "verdict `na` ONLY when the story's axis does not apply to this product's type at all (e.g. an OS-installation story for a SaaS API); lack of evidence for an applicable capability is `none`, not `na`."
- **logos stage** (`pnpm pipeline logos [--category|--product]`): for each product, try in order: (1) parse site HTML for `apple-touch-icon`/largest `icon` link; (2) `{site}/favicon.ico`; (3) `https://www.google.com/s2/favicons?domain={host}&sz=128`. Save to `public/logos/{id}.png` (convert ico→png if trivially possible; otherwise save the s2 png). Never fails the run — warns and falls back to a generated 1-letter SVG placeholder at `public/logos/{id}.svg` (product page/card falls back gracefully).
- Desktop-os refresh: products gain `extra` URLs (deeper vendor feature/docs pages); evidence and all judge cells regenerate (hash-bust is automatic).

## 6. App deltas

Routes:
- `/` — arena index: card per category (name, product logo cluster, leader + score, agenticness leader).
- `/arena/[category]` — leaderboard (rank, logo, name, score bar, agenticness badge, applicability) + grouped story matrix: for each theme → group, a grid of stories × products with verdict badges (na rendered as muted "n/a"), evidence links on hover/click-through to product pages.
- `/arena/[category]/battle/[a]-vs-[b]` — v1 battle view + rounds grouped by theme/group, `na` rounds shown separately ("not comparable on this axis"), agenticness sub-battle callout.
- `/arena/[category]/product/[id]` — v1 product view + logo, groups, agenticness badge.
- Old v1 routes (`/battle/*`, `/product/*`) are gone (site is days old; no redirects needed).
- `generateMetadata` on every page type (title/description per arena/battle/product).
- README.md rewritten: what the site is, methodology (evidence tiers, judge, scoring, N/A, agenticness), refresh workflow, **bias disclosure**: the judge is an Anthropic model and the ai-coding arena includes Anthropic products; every verdict carries citations so it can be contested.

## 7. Public-release prep (repo remains PRIVATE until user flips it)

- LICENSE: MIT.
- CONTRIBUTING.md: community evals workflow — how to contest a verdict (open issue with evidence URLs) or PR new evidence (`data/{cat}/evidence/*.json` + re-run judge for that product), local pipeline setup, data validation (`pnpm test`).
- `.github/ISSUE_TEMPLATE/contest-verdict.md` — structured template (product, story id, current verdict, counter-evidence URLs).
- Secrets audit: no keys anywhere; `.env*` ignored; confirm `git log` never contained secrets.
- Transfer repo to `ultrametricai` org via GitHub API, keep private, update local remote.

## 8. Out of scope for v2
- Visitor voting/accounts; automated probing; scheduled refresh; category suggestion UI; making the repo/site repo public (user flips the switch).

## 9. Cost note
~1,300–1,500 judge calls + per-product extract/community calls on `claude-sonnet-5` (env-overridable via PA_MODEL); several hours pipeline wall-clock. Judge cache keeps future refreshes incremental.
