# Product Arena v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand Product Arena to 7 categories / ~36 products with story groups, an AI-native persona, a judged Agenticness Index, N/A verdicts, product logos, per-page metadata, a real README, and public-release prep (repo stays private; transferred to the `ultrametricai` org).

**Architecture:** Unchanged from v1 (offline pipeline → committed JSON → static Next.js). v2 re-shapes the data layout to `data/categories.json` + `data/{categoryId}/…`, adds `group` to stories and `na` to verdicts, injects a canonical agenticness story set per category, adds a logos stage, and moves routes under `/arena/[category]`.

**Tech Stack:** unchanged (Next 16, TS strict, Tailwind 4, zod 4, vitest, tsx, @anthropic-ai/sdk, turndown, pnpm).

**Spec:** `docs/superpowers/specs/2026-08-27-product-arena-v2-design.md` (v1 spec still governs unchanged parts: `docs/superpowers/specs/2026-08-25-product-arena-design.md`)

## Global Constraints

- All v1 Global Constraints still hold (strict TS, no `any`, zod-validated data, build fails on bad data, pipeline model `claude-sonnet-5` via `PA_MODEL`, no LLM calls in tests, `pipeline/cache/` gitignored).
- Verdict enum (exact): `full | partial | none | disputed | na`. `na` ⇒ quality 0, evidenceIds may be empty. Factors: full 1.0, partial 0.6, disputed 0.3, none 0; **na excluded from numerator AND denominator**.
- Score = Σ(w×q×f over non-na cells) ÷ Σ(w×10 over non-na cells) × 100, 1-decimal. Theme with zero applicable cells → `themeScores[t] = null`.
- Battle round with either side `na` → `round.winner = 'na'`, margin 0, excluded from record and weighted winner sums.
- Agenticness Index = `themeScores['agenticness']`, exposed as `leaderboard[].agenticness` (number|null).
- Canonical agentic stories (exact ids/weights, injected by normalize, never LLM-authored): agentic-public-api w3, agentic-official-cli w2, agentic-mcp-server w3, agentic-webhooks w2, agentic-sdks w2, agentic-agent-docs w2, agentic-scoped-keys w2, agentic-headless w2 — all theme `agenticness`, group `agent-access`, persona `ai-native`.
- Every category's personas include `ai-native`. Every story has a kebab-case `group`.
- Category ids/product ids exactly as spec §2. Product ids globally unique.
- Data layout exactly: `data/categories.json`, `data/{cat}/products.json`, `data/{cat}/stories.json`, `data/{cat}/evidence/{productId}.json`, `data/{cat}/verdicts.json`, `data/{cat}/rankings.json`.
- Routes: `/`, `/arena/[category]`, `/arena/[category]/battle/[slug]`, `/arena/[category]/product/[id]`. `dynamicParams = false` everywhere.
- Repo remains PRIVATE throughout, including after transfer to `ultrametricai`.
- Tasks 1–3 may leave `pnpm build` broken (app still on v1 loader); unit tests must pass every task; the build gate returns at Task 4 and stays for all later tasks.

---

### Task 1: Schemas v2

**Files:**
- Modify: `lib/schemas.ts`, `lib/__tests__/schemas.test.ts`

**Interfaces:**
- Produces (changed/new exports; all v1 exports preserved):
  - `StorySchema` + required `group: z.string().min(1)`
  - `VerdictBaseSchema`/`VerdictSchema`: verdict enum + `'na'`; refine: evidenceIds ≥1 unless verdict is `'none'` **or `'na'`**; additional refine: verdict `'na'` ⇒ quality === 0 (message `na verdicts must have quality 0`).
  - `ProductSchema.urls` + `extra: z.array(z.string().url()).optional()`; `ProductSchema` + `logo: z.string().optional()`
  - `CategorySchema` + `themes: z.array(z.string().min(1)).optional()`
  - `RankingsSchema.leaderboard[]` + `agenticness: z.number().min(0).max(100).nullable()`, `applicable: z.number().int().min(0)`, `total: z.number().int().min(0)`; `themeScores` values become `z.number().min(0).max(100).nullable()`; `battles[].rounds[].winner` enum + `'na'`.

- [ ] **Step 1: Extend the test file with failing v2 cases** (keep all v1 tests; update fixtures that now need `group` on stories and the new rankings fields — the v1 tests' story fixtures gain `group: 'core'`):

```ts
it('requires a group on stories', () => {
  expect(StorySchema.safeParse({ id: 's', persona: 'developer', title: 't', theme: 'security', weight: 2 }).success).toBe(false)
  expect(StorySchema.safeParse({ id: 's', persona: 'ai-native', title: 't', theme: 'security', group: 'two-factor-auth', weight: 2 }).success).toBe(true)
})

it('accepts na verdicts with zero evidence and quality 0 only', () => {
  const base = { productId: 'p', storyId: 's', confidence: 'medium', rationale: 'axis does not apply', evidenceIds: [] }
  expect(VerdictSchema.safeParse({ ...base, verdict: 'na', quality: 0 }).success).toBe(true)
  expect(VerdictSchema.safeParse({ ...base, verdict: 'na', quality: 3 }).success).toBe(false)
})

it('accepts nullable theme scores, agenticness and applicability on rankings', () => {
  const r = {
    generatedAt: '2026-08-27T00:00:00Z',
    leaderboard: [{ productId: 'p', score: 50, agenticness: null, applicable: 10, total: 12, themeScores: { security: null, agenticness: 75 } }],
    battles: [{ a: 'p', b: 'q', winner: 'draw', record: { aWins: 0, bWins: 0, draws: 1 }, rounds: [{ storyId: 's', winner: 'na', margin: 0 }] }],
  }
  expect(RankingsSchema.safeParse(r).success).toBe(true)
})
```

- [ ] **Step 2: Run to verify the new tests fail** (`pnpm test lib/__tests__/schemas.test.ts`).
- [ ] **Step 3: Implement the schema changes** exactly per Interfaces (VerdictBaseSchema keeps the object shape; chain two `.refine`s for the citation and na-quality rules).
- [ ] **Step 4: Full suite** — the sample-era tests in `lib/__tests__/scoring.test.ts` and `data.test.ts` will now FAIL because fixtures/committed data lack `group`. THAT IS EXPECTED and fixed in Tasks 2–3; run only `pnpm test lib/__tests__/schemas.test.ts` (must pass) and note the known-red files in the report.
- [ ] **Step 5: Commit** `feat: v2 schemas — story groups, na verdicts, agenticness rankings`

---

### Task 2: Scoring v2

**Files:**
- Modify: `lib/scoring.ts`, `lib/__tests__/scoring.test.ts`

**Interfaces:**
- `cellScore(verdict, story)`: unchanged for non-na; returns 0 for na (callers must exclude na from denominators — new helper below).
- `buildRankings(products, stories, verdicts, generatedAt)`: implements the v2 scoring rules from Global Constraints (na exclusion, nullable theme scores, agenticness field, applicable/total counts, na rounds).

- [ ] **Step 1: Update fixtures (stories gain `group`) and add failing v2 tests:**

```ts
const vNa = (productId: string, storyId: string): Verdict => ({
  productId, storyId, verdict: 'na', quality: 0, confidence: 'high', rationale: 'wrong axis', evidenceIds: [],
})

describe('na handling', () => {
  // stories: s1 w2 theme core, s2 w1 theme core, s3 w1 theme extras (as v1), all with group fields
  const verdicts = [
    v('a', 's1', 'full', 10), v('a', 's2', 'full', 10), vNa('a', 's3'),
    v('b', 's1', 'none', 0), v('b', 's2', 'full', 10), v('b', 's3', 'full', 10),
  ]
  const r = buildRankings(products, stories, verdicts, '2026-08-27T00:00:00.000Z')

  it('excludes na cells from the denominator', () => {
    // a: applicable = s1,s2 → (20+10)/((2+1)*10)*100 = 100
    const a = r.leaderboard.find((e) => e.productId === 'a')!
    expect(a.score).toBe(100)
    expect(a.applicable).toBe(2)
    expect(a.total).toBe(3)
  })

  it('yields null theme score when no applicable cells in theme', () => {
    const a = r.leaderboard.find((e) => e.productId === 'a')!
    expect(a.themeScores.extras).toBeNull()
    expect(a.themeScores.core).toBe(100)
  })

  it('marks rounds na and excludes them from record and winner math', () => {
    const battle = r.battles[0]
    const s3 = battle.rounds.find((x) => x.storyId === 's3')!
    expect(s3).toEqual({ storyId: 's3', winner: 'na', margin: 0 })
    expect(battle.record).toEqual({ aWins: 1, bWins: 1, draws: 0 })
    expect(battle.winner).toBe('a') // s1 weight 2 beats s2... a won s1(w2), b won s2(w1) → a
  })
})

describe('agenticness index', () => {
  it('surfaces the agenticness theme score, null when theme absent', () => {
    // add a story s4 theme 'agenticness' group 'agent-access' w3; a full q10, b none
    // expect a.agenticness === 100, b.agenticness === 0; and for the original 3-story set expect null
  })
})
```

(Write the agenticness test fully — construct a 4-story set including `{id:'s4', persona:'ai-native', title:'t4', theme:'agenticness', group:'agent-access', weight:3}` and assert `agenticness` is 100 for a (full q10) and 0 for b (none), plus `agenticness: null` when using the 3-story set.)

- [ ] **Step 2: Verify failures.**
- [ ] **Step 3: Implement** — key mechanics: `const applicable = (p: string, ss: Story[]) => ss.filter((s) => byCell.get(`${p}:${s.id}`)!.verdict !== 'na')`; score/theme math over applicable only; `themeScores[t] = themed.length applicable ? round1(...) : null`; `agenticness: themeScores['agenticness'] ?? null`; rounds: `if (va.verdict === 'na' || vb.verdict === 'na') → {winner:'na', margin:0}` and filter `r.winner === 'na'` out of record counts and pts sums.
- [ ] **Step 4: `pnpm test lib/__tests__/scoring.test.ts` + schemas file both green.** (data.test.ts still known-red until Task 3.)
- [ ] **Step 5: Commit** `feat: v2 scoring — na exclusion, nullable theme scores, agenticness index`

---

### Task 3: Data layout migration + loader v2

**Files:**
- Create: `data/categories.json`; move v1 desktop-os data to `data/desktop-os/…`
- Modify: `lib/data.ts`, `lib/__tests__/data.test.ts`
- Delete: old flat `data/*.json` + `data/evidence/`

**Interfaces:**
- `loadCategories(dir?: string): Category[]` — parses `categories.json`.
- `loadCategory(categoryId: string, dir?: string): CategoryData` where `interface CategoryData { category: Category; products: Product[]; stories: Story[]; evidence: Record<string, Evidence[]>; verdicts: Verdict[]; rankings: Rankings }` — validates + full v1 integrity checks per category; memoized per (dir, categoryId).
- `loadAll(dir?: string): CategoryData[]` — every category, in categories.json order.
- `battleSlug`/`parseBattleSlug`/`verdictFor`/`evidenceById` keep signatures (parseBattleSlug already takes `products`; callers pass the category's products). Remove `loadData` (v1 API) — app is updated in Task 4.

**Migration (desktop-os):**
- `data/categories.json` = `[ <v1 category.json content + personas gains "ai-native" + themes: ["install-setup","window-management","app-ecosystem","dev-experience","customization","privacy-security","hardware-support","daily-workflow"] > ]` with id `desktop-os`.
- Move products/stories/evidence/verdicts/rankings under `data/desktop-os/`.
- v1 stories lack `group`: write a tiny one-off migration (tsx -e) setting `group` = story's `theme` value (provisional; the Task 8 re-normalize replaces the taxonomy anyway). v1 rankings lack new fields: regenerate by running derive AFTER Task 5 — until then rankings.json is stale-shaped; loader validation would fail ⇒ as part of THIS task, write a temporary regeneration script step: run `pnpm tsx -e` calling `buildRankings` on the migrated files and writing rankings.json (buildRankings v2 outputs the new shape).
- desktop-os products gain richer sources now (used by Task 8 refresh): macos.urls.extra = ["https://www.apple.com/macos/continuity/", "https://support.apple.com/guide/mac-help/mchl46d3d4a7/mac", "https://www.apple.com/macos/features/"], ubuntu extra = ["https://ubuntu.com/desktop/features", "https://documentation.ubuntu.com/desktop/"], fedora extra = ["https://docs.fedoraproject.org/en-US/quick-docs/", "https://fedoraproject.org/workstation/features"], omarchy extra = ["https://learn.omacom.io/2/the-omarchy-manual"] (curl-verify each; drop/replace 404s and note it).

- [ ] **Step 1: Failing tests** — rewrite `lib/__tests__/data.test.ts` against the new API: loads desktop-os via `loadCategory('desktop-os', REAL)`; corruption tests (missing evidence id, incomplete matrix) unchanged in spirit but operating on `data/desktop-os/...` copies; `loadCategories` returns 1 category with `ai-native` persona; `loadAll` returns 1 entry; slug round-trip unchanged.
- [ ] **Step 2: Verify failures.**
- [ ] **Step 3: Migrate data + implement loader v2 + regenerate desktop-os rankings via buildRankings v2.**
- [ ] **Step 4: `pnpm test` — ALL unit tests green (build still broken; do not run pnpm build).**
- [ ] **Step 5: Commit** `feat: category-scoped data layout and loader`

---

### Task 4: App v2 (routes, matrix, logos, metadata)

**Files:**
- Create: `app/arena/[category]/page.tsx`, `app/arena/[category]/battle/[slug]/page.tsx`, `app/arena/[category]/product/[id]/page.tsx`, `components/StoryMatrix.tsx`, `components/AgenticBadge.tsx`, `components/ProductLogo.tsx`
- Modify: `app/page.tsx` (arena index), `components/LeaderboardTable.tsx` (takes CategoryData, adds logo + agenticness + applicability, links under /arena/...), `components/BattleView.tsx` (rounds grouped by theme→group; na rounds section; agenticness callout), `components/__tests__/LeaderboardTable.test.tsx`
- Delete: `app/battle/`, `app/product/` (v1 routes)

**Interfaces:**
- `ProductLogo({ product, size?: number })` — renders `/logos/{id}.png` via `next/image` unoptimized `<img>` (static export friendly) with `onError`-free server-safe fallback: if `public/logos/{id}.png` missing at build time (fs check in a server helper `lib/logos.ts: hasLogo(id): boolean`), render a rounded div with the product's first letter.
- `AgenticBadge({ value }: { value: number|null })` — pill showing `AGENTIC {value}` amber-scaled, or muted `AGENTIC n/a`.
- `StoryMatrix({ data }: { data: CategoryData })` — for each theme (order of first appearance in stories), for each group: heading + table rows = stories, columns = products (logo initial header), cells = VerdictBadge (na → muted "n/a") + quality. Server component.
- All pages: `generateStaticParams` from `loadCategories`/`loadAll`; `generateMetadata` (arena: `{category.name} Arena — Product Arena`; battle: `{A} vs {B} — {category.name}`; product: `{name} — {category.name} Arena`); `dynamicParams = false`.
- VerdictBadge gains `na` style: `bg-zinc-900 text-zinc-600 ring-zinc-800 italic`.

Implementation notes (follow existing v1 component style exactly):
- Arena index `/`: card per category → logo cluster (up to 6 ProductLogos overlapping), leader name + score, agenticness leader (max by `agenticness ?? -1`), story/verdict counts, link to `/arena/{id}`.
- Arena page: header (name, description, stats), LeaderboardTable, then StoryMatrix.
- Battle page: reuse BattleView; group rounds by story theme→group with sticky group headings; na rounds collapse into a final muted section titled "Not comparable on these axes"; below the header add an "Agenticness" mini-strip comparing the two products' agenticness scores.
- Product page: add ProductLogo next to name, AgenticBadge next to ScoreBar, group the story verdict list by theme→group, show `applicable/total` line.

- [ ] **Step 1: Failing component test** — update LeaderboardTable test to build from `loadCategory('desktop-os', ...)` and assert: every product name renders, top score renders, an element with text matching /AGENTIC/ renders.
- [ ] **Step 2: Verify failure. Step 3: Implement everything above. Step 4: `pnpm test` green AND `pnpm build` green** — expect routes: `/`, `/arena/desktop-os`, 6 battles, 4 products (17 pages incl. framework routes). Placeholder logos are acceptable this task (logos land in Task 6; the fs-fallback covers it).
- [ ] **Step 5: Commit** `feat: v2 app — arena routes, story matrix, agenticness badges, metadata`

---

### Task 5: Pipeline v2 plumbing

**Files:**
- Modify: `pipeline/cli.ts` (add `--category` flag parsing; pass `{category, product}` to every stage), `pipeline/stages/crawl.ts`, `extract.ts`, `normalize.ts`, `collect-community.ts`, `judge.ts`, `derive.ts`, `pipeline/paths.ts` (helper `categoryDir(cat)`), `pipeline/seeds/community.json` (nest per category: `{ [categoryId]: { [productId]: string[] } }`)
- Create: `pipeline/agentic-stories.ts`, `pipeline/__tests__/normalize.test.ts`

**Interfaces:**
- Every stage export becomes `run<Stage>(opts: { category?: string; product?: string })`. Rules: crawl/extract/collect-community/judge/derive iterate ALL categories when `--category` omitted, else one; `--product` further filters within. normalize REQUIRES `--category` (exits with usage error otherwise).
- `pipeline/agentic-stories.ts` exports `AGENTIC_STORIES: Story[]` — the 8 canonical stories exactly as Global Constraints (titles from spec §3, e.g. `As an AI-native user, I can connect an agent via an official MCP server`).
- normalize v2: reads extracts from `pipeline/cache/extract/{cat}/*.json`; prompt gains: category name/personas/themes from categories.json; "cluster stories into kebab-case `group`s under themes; be granular — one capability per story (e.g. separate stories for TOTP-app 2FA vs hardware-key 2FA); include ai-native persona stories; DO NOT write stories about APIs/CLIs/MCP/webhooks/SDKs/agent docs (added separately)". After LLM: drop any LLM story with theme `agenticness` or id starting `agentic-`, append `AGENTIC_STORIES`, dedupe ids, sort by theme/group/id, validate `StorySchema.array().min(30).max(60)`, write `data/{cat}/stories.json`. The SAMPLE-guard from v1 applies per category (real verdicts in `data/{cat}/verdicts.json` block re-normalize without PA_FORCE_NORMALIZE=1).
- judge v2: paths `pipeline/cache/judge/{cat}/{productId}/{storyId}.json`; evidence from `data/{cat}/evidence/`; SYSTEM prompt adds: `Verdict "na": ONLY when the story's axis fundamentally does not apply to this product's type (wrong axis), e.g. an OS-install story for a SaaS API. Lack of evidence for an applicable capability is "none", never "na". na must have quality 0.` Bump `PROMPT_VERSION` to `'v2'`. Assembly per category (stale-hash guard kept).
- derive v2: per category, `buildRankings` → `data/{cat}/rankings.json`.
- crawl v2: also fetches each `urls.extra[i]` → cache key `extra-{i}`.

- [ ] **Step 1: Failing test** for the pure normalize post-processing — extract it as exported `assembleTaxonomy(llmStories: Story[]): Story[]` (drops LLM agentic dupes, appends canon, dedupes, sorts): test that an LLM story with theme `agenticness` is dropped, canon ids all present exactly once, output sorted, and a duplicate id throws.
- [ ] **Step 2: Verify failure. Step 3: Implement all plumbing.** Update judge/extract/etc. path handling consistently; keep all existing pure-function exports/tests passing (judge tests unchanged; extract buildEvidence unchanged).
- [ ] **Step 4: `pnpm test` + `pnpm tsc --noEmit` + `pnpm build` all green; `pnpm pipeline normalize` exits with usage error (no --category); `pnpm pipeline derive --category desktop-os` regenerates identical-but-timestamp rankings (revert file after).**
- [ ] **Step 5: Commit** `feat: category-scoped pipeline with canonical agentic stories and na judging`

---

### Task 6: Logos stage

**Files:**
- Create: `pipeline/stages/logos.ts`, `pipeline/__tests__/logos.test.ts`
- Modify: `pipeline/cli.ts` (stage `logos`)

**Interfaces:**
- `runLogos({ category, product }): Promise<void>` — per product: (1) fetch `urls.site` HTML, parse for `<link rel="apple-touch-icon" ...>` or largest `<link rel="icon">` with png href (exported pure helper `pickIconHref(html: string, baseUrl: string): string | null` — resolves relative hrefs, prefers apple-touch-icon, then icons whose href/`sizes` suggest png ≥64px); (2) if found and fetch succeeds and content-type/extension is png → save bytes to `public/logos/{id}.png`; (3) else fetch `https://www.google.com/s2/favicons?domain={site-host}&sz=128` and save that. Warn-and-continue per product; never throws for one product.
- Products keep no code reference; app uses fs-existence fallback from Task 4.

- [ ] **Step 1: Failing tests for `pickIconHref`** (apple-touch-icon wins; relative href resolved against base; icon with sizes=192x192 .png chosen over 16x16; returns null when none).
- [ ] **Step 2–3: Verify fail; implement.**
- [ ] **Step 4: `pnpm test` green; live smoke `pnpm pipeline logos --category desktop-os` → 4 files in `public/logos/`; commit the fetched pngs.**
- [ ] **Step 5: Commit** `feat: logos stage fetching product icons`

---

### Task 7: Seed the six new categories

**Files:**
- Modify: `data/categories.json` (7 entries, each with personas incl. `ai-native` and a themes list)
- Create: `data/{cat}/products.json` for startup-banking, project-management, web-scraping, mobile-dev, code-hosting, ai-coding

Category definitions (name/description/personas/themes — personas always include `ai-native`):
- startup-banking: personas [founder, finance-lead, developer, ai-native], themes [accounts-payments, cards-spend, treasury-yield, accounting-integrations, security, agenticness, support-reliability, onboarding]
- project-management: personas [engineer, product-manager, designer, ai-native], themes [planning-tracking, collaboration, automation-workflows, reporting-insights, integrations, security, agenticness, onboarding]
- web-scraping: personas [developer, data-engineer, ai-native], themes [extraction-quality, js-rendering, scale-reliability, anti-bot, output-formats, pricing-limits, agenticness, dev-experience]
- mobile-dev: personas [developer, ai-native, power-user], themes [terminal-ssh, networking-access, git-code, running-agents, offline-sync, security, agenticness, ux-ergonomics]
- code-hosting: personas [developer, devops-lead, open-source-maintainer, ai-native], themes [repos-collaboration, ci-cd, security, project-planning, self-hosting, agenticness, ecosystem-integrations, governance]
- ai-coding: personas [developer, ai-native, engineering-lead], themes [code-generation, codebase-understanding, autonomy-agents, ide-terminal-integration, review-safety, agenticness, pricing-limits, ecosystem]

Products (site/docs/github/extra — **curl-verify every URL (`curl -sIL -o /dev/null -w "%{http_code}"`), fix any non-200 by finding the correct page from the product's site, and record substitutions in the report**):

startup-banking: mercury (mercury.com, docs.mercury.com), brex (brex.com, developer.brex.com), ramp (ramp.com, docs.ramp.com), wise (wise.com, docs.wise.com), relay (relayfi.com, support docs page)
project-management: linear (linear.app, developers.linear.app, changelog linear.app/changelog), asana (asana.com, developers.asana.com), clickup (clickup.com, developer.clickup.com), notion (notion.com, developers.notion.com), monday (monday.com, developer.monday.com), jira (atlassian.com/software/jira, developer.atlassian.com)
web-scraping: firecrawl (firecrawl.dev, docs.firecrawl.dev, github firecrawl repo), crawl4ai (docs.crawl4ai.com, github unclecode/crawl4ai), jina-reader (jina.ai/reader, github jina-ai/reader), apify (apify.com, docs.apify.com), scrapingbee (scrapingbee.com, its documentation page), browserbase (browserbase.com, docs.browserbase.com)
mobile-dev: termius (termius.com, its docs/support site), tailscale (tailscale.com, tailscale.com/kb), blink-shell (blink.sh, docs.blink.sh, github blinksh/blink), a-shell (its site, github holzschu/a-shell), working-copy (workingcopy.app or workingcopyapp.com — verify which resolves, plus its manual page), github-mobile (github.com/mobile)
code-hosting: github (github.com, docs.github.com), gitlab (about.gitlab.com, docs.gitlab.com), bitbucket (bitbucket.org product page, support.atlassian.com/bitbucket-cloud), gitea (about.gitea.com, docs.gitea.com, github go-gitea/gitea)
ai-coding: codex (openai.com/codex, developers.openai.com/codex or its docs — verify), claude-code (claude.com/claude-code, code.claude.com/docs or docs.anthropic.com — verify), cursor (cursor.com, docs.cursor.com), github-copilot (github.com/features/copilot, docs.github.com/copilot), gemini-cli (github google-gemini/gemini-cli)

vendor/type fields: fill accurately (oss: crawl4ai, jina-reader(reader repo), blink-shell(GPL), a-shell, gitea, gemini-cli, omarchy…; commercial otherwise; firecrawl = oss (repo) with hosted API — use `oss`).

- [ ] **Step 1: Write categories.json + all six products.json. Step 2: curl-verify all URLs; fix. Step 3: validate via `pnpm tsx -e` ProductSchema/CategorySchema parse loop. Step 4: `pnpm test && pnpm build` still green (new categories have no stories/verdicts yet — loadAll must therefore tolerate… NO: loadAll validates full category data. Guard: `loadCategories` lists all 7, but `loadAll`/page `generateStaticParams` must only include categories whose `stories.json` exists — add `isPopulated(categoryId)` (fs check for stories.json+verdicts.json+rankings.json) to lib/data.ts and filter in loadAll + arena index. Add a unit test: unpopulated category excluded from loadAll, included in loadCategories.** (This guard is REQUIRED — it keeps the site deployable between seeding and pipeline runs.)
- [ ] **Step 5: Commit** `feat: seed six new arena categories`

---

### Task 8: Pipeline run A — desktop-os refresh + startup-banking + code-hosting

Execution task (13 products, ~45 stories × 13 ≈ 550 judge calls incl. desktop-os re-judge). ANTHROPIC_API_KEY from shell env.

- [ ] Per category (desktop-os first: PA_FORCE_NORMALIZE=1 is required since real verdicts exist — the re-normalize intentionally rebuilds the taxonomy with groups):
  1. `pnpm pipeline crawl --category {cat}`
  2. `pnpm pipeline extract --category {cat}`
  3. `pnpm pipeline normalize --category {cat}` (desktop-os: prefix PA_FORCE_NORMALIZE=1)
  4. Quality gate: read ALL story titles — granular, product-neutral, grouped sensibly, ai-native stories present beyond the canon; agentic canon present exactly once. If vague, tighten prompt minimally, re-run, note it.
  5. `pnpm pipeline collect-community --category {cat}`
  6. `pnpm pipeline judge --category {cat} --product {each product sequentially, foreground, timeout 600000}`
  7. `pnpm pipeline derive --category {cat}`
  8. Gates: read 5 random verdicts per category (incl. ≥2 agentic cells and ≥1 na if any) — rationales must match cited evidence; `na` only for true wrong-axis cells.
- [ ] `pnpm pipeline logos --category {each}`; `pnpm test && pnpm build`; commit per category: `data: judged dataset for {cat}` (+ logos in the same commit).

---

### Task 9: Pipeline run B — project-management + web-scraping

Same recipe as Task 8 for the two categories (12 products). Commit per category.

---

### Task 10: Pipeline run C — mobile-dev + ai-coding

Same recipe (11 products). For ai-coding, add to the report: any verdict where Anthropic products got the benefit of the doubt beyond evidence (bias check — sample all claude-code full-verdict cells and confirm citations support them). Commit per category.

---

### Task 11: Full verification + deploy

- [ ] `pnpm test` (all green), `pnpm tsc` via `pnpm build` (green), route audit: build output lists 1 index + 7 arenas + Σbattles (6+10+15+15+15+6+10=77) + 36 products.
- [ ] Data audit script (tsx one-off): every category loads via loadCategory; print per category: story count, group count, na-rate, agenticness leader. Include output in report.
- [ ] Merge/push per the controller's process; `pnpm dlx vercel deploy --prod --yes`; curl-smoke `/`, one arena, one battle, one product on https://productarena.vercel.app (200s).

---

### Task 12: Public-release prep (repo stays PRIVATE)

**Files:** Create `LICENSE` (MIT, copyright 2026 Ultrametric), `CONTRIBUTING.md`, `.github/ISSUE_TEMPLATE/contest-verdict.md`; rewrite `README.md`.

- README: what Product Arena is; the 7 arenas; methodology (evidence tiers → judged cells → derived battles; scoring formula; na semantics; agenticness canon; judge model + PROMPT_VERSION; **bias disclosure** for ai-coding); local dev (`pnpm dev`), pipeline refresh workflow per category; data layout; contributing pointer.
- CONTRIBUTING: contest-a-verdict flow (issue template → maintainer adds evidence → re-judge cell), add-evidence PR flow (edit `data/{cat}/evidence/{product}.json`, run `pnpm pipeline judge --category X --product Y`, commit both), local setup, style (schemas are law: `pnpm test` validates), no secrets.
- Issue template fields: category, product, story id, current verdict, proposed verdict, evidence URLs, quotes.
- Secrets audit: `git log -p | grep -iE 'sk-|api[_-]?key\s*=' ` style scan (bounded: `git log --all -p -- .env* ; gitleaks if available else grep of full history dump`) — report findings (expect none).
- [ ] Commit `docs: public-release prep — README, LICENSE, CONTRIBUTING, verdict-contest template`

---

### Task 13: Transfer repo to ultrametricai (keep private)

- [ ] `gh api repos/judegomila/productarena/transfer -f new_owner=ultrametricai` (repo transfer preserves history/settings; requires org create-repo permission — if the API returns 422 for permissions, fall back to: `gh repo create ultrametricai/productarena --private` + push all branches, and report that the old repo should be archived).
- [ ] Verify: `gh repo view ultrametricai/productarena --json isPrivate,name` shows private; `git remote set-url origin https://github.com/ultrametricai/productarena.git`; `git push origin main` (no-op) + `git pull --dry-run` OK.
- [ ] Confirm Vercel still deploys (CLI-linked to local dir, unaffected by GitHub transfer) — no action expected; note it.
- [ ] Report the new repo URL.

## Self-review notes (applied)
- Spec coverage: §2 lineups (T7), §3 schema/layout (T1,T3), agentic canon (T5), §4 scoring (T2), §5 pipeline incl. logos (T5,T6), §6 app/README/metadata (T4,T12), §7 release prep + transfer (T12,T13), desktop-os refresh (T3 urls + T8), runs (T8–T10), deploy (T11).
- Known transient red: T1–T3 keep the build broken until T4; unit-suite green is per-task gate; `isPopulated` guard (T7) keeps the site buildable while categories await their pipeline runs.
- Type consistency: `CategoryData` name used in T3/T4; `runLogos`/stage signatures in T5/T6; canonical agentic ids identical in T2 test, T5 module, spec §3.
