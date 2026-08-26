# Product Arena v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the Desktop OS arena — a static Next.js site on Vercel ranking macOS, Omarchy, Ubuntu, and Fedora via an LLM-judged user-story matrix with deterministically derived battles.

**Architecture:** One repo, two halves. `pipeline/` holds local-only TypeScript CLI stages (crawl → extract → normalize → collect-community → judge → derive) that write zod-validated JSON into `data/`. The Next.js App Router app statically renders three page types (leaderboard `/`, `/battle/[slug]`, `/product/[id]`) from that committed JSON; the build fails on invalid data. All LLM cost is linear: cells are judged per (product × story); battles are pure math over cell scores.

**Tech Stack:** Next.js 15 (App Router, SSG), TypeScript (strict), Tailwind CSS 4, zod 3, vitest + @testing-library/react, tsx (pipeline runner), @anthropic-ai/sdk, turndown (HTML→markdown), pnpm.

**Spec:** `docs/superpowers/specs/2026-08-25-product-arena-design.md`

## Global Constraints

- Node ≥ 20, package manager **pnpm**.
- TypeScript `strict: true`; no `any` in committed code.
- Every file in `data/` must parse against schemas in `lib/schemas.ts`; the Next build calls `loadData()` and must fail on invalid data.
- Verdict factors (exact): full = 1.0, partial = 0.6, disputed = 0.3, none = 0. Story weight ∈ {1,2,3}, quality ∈ 0–10.
- Product score = Σ(weight × quality × factor) ÷ Σ(weight × 10) × 100, rounded to 1 decimal.
- Battle round: higher cell score wins; exact tie = draw. Battle winner: greater sum of story weights over won rounds; equal = "draw".
- LLM stages use model `claude-sonnet-5` unless overridden by env `PA_MODEL`; require `ANTHROPIC_API_KEY`; every LLM output is zod-validated with schema-error feedback and max 2 retries.
- Evidence tiers (exact strings): `claimed-docs`, `github`, `community`, `probe`. Evidence ids follow `{productId}-{tier-abbrev}-{n}` (e.g. `omarchy-docs-3`, `ubuntu-comm-1`).
- `pipeline/cache/` is gitignored; only `data/` output is committed.
- No LLM calls in tests — fixtures/mocks only.
- Deviation from spec noted and accepted: evidence excerpts for `claimed-docs`/`github` tiers are emitted by the **extract** stage (which reads crawl caches), not by crawl itself — one LLM pass instead of two.

---

### Task 1: Scaffold app + tooling

**Files:**
- Create: entire Next.js scaffold (via `create-next-app`), `vitest.config.ts`, `.env.example`
- Modify: `package.json` (scripts, deps), `.gitignore`

**Interfaces:**
- Produces: `pnpm dev` / `pnpm build` / `pnpm test` all runnable; `tsx pipeline/cli.ts` runnable via `pnpm pipeline`; path alias `@/*` → repo root.

- [ ] **Step 1: Scaffold Next.js in the existing repo**

```bash
cd /Users/judegomila/Documents/GitHub/productarena
pnpm dlx create-next-app@latest . --ts --tailwind --app --no-src-dir --import-alias "@/*" --eslint --no-turbopack
```

(`create-next-app` accepts a non-empty dir containing only `docs/` and `.git`; if it refuses, scaffold into `/tmp/pa-scaffold` and `rsync -a /tmp/pa-scaffold/ .` excluding `.git`.)

- [ ] **Step 2: Add dependencies**

```bash
pnpm add zod @anthropic-ai/sdk turndown
pnpm add -D vitest @vitejs/plugin-react @testing-library/react jsdom tsx @types/turndown
```

- [ ] **Step 3: Wire scripts and config**

In `package.json` add to `"scripts"`:

```json
{
  "test": "vitest run",
  "pipeline": "tsx pipeline/cli.ts"
}
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  test: { include: ['**/__tests__/**/*.test.{ts,tsx}'] },
  resolve: { alias: { '@': path.resolve(__dirname) } },
})
```

Append to `.gitignore`:

```
pipeline/cache/
.env
```

Create `.env.example`:

```
ANTHROPIC_API_KEY=
# PA_MODEL=claude-sonnet-5
```

- [ ] **Step 4: Verify build and empty test run**

Run: `pnpm build && pnpm test`
Expected: build succeeds; vitest reports "no test files found" (exit 0 — if vitest exits non-zero on empty, add `passWithNoTests: true` to the test config).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "chore: scaffold Next.js app with vitest, tailwind, pipeline tooling"
```

---

### Task 2: Zod schemas

**Files:**
- Create: `lib/schemas.ts`, `lib/__tests__/schemas.test.ts`

**Interfaces:**
- Produces (exact exports from `lib/schemas.ts`):
  - Schemas: `CategorySchema`, `ProductSchema`, `StorySchema`, `EvidenceSchema`, `VerdictSchema`, `RankingsSchema`
  - Types (inferred): `Category`, `Product`, `Story`, `Evidence`, `Verdict`, `Rankings`, plus `BattleRecord = Rankings['battles'][number]`, `LeaderboardEntry = Rankings['leaderboard'][number]`

- [ ] **Step 1: Write the failing tests**

`lib/__tests__/schemas.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { EvidenceSchema, ProductSchema, StorySchema, VerdictSchema } from '@/lib/schemas'

describe('schemas', () => {
  it('accepts a valid verdict', () => {
    const v = {
      productId: 'omarchy', storyId: 'keyboard-tiling', verdict: 'full',
      quality: 9, confidence: 'high', rationale: 'Tiling is the default paradigm.',
      evidenceIds: ['omarchy-docs-1'],
    }
    expect(VerdictSchema.parse(v)).toEqual(v)
  })

  it('rejects a non-none verdict with zero evidence', () => {
    const r = VerdictSchema.safeParse({
      productId: 'p', storyId: 's', verdict: 'full', quality: 9,
      confidence: 'high', rationale: 'x', evidenceIds: [],
    })
    expect(r.success).toBe(false)
  })

  it('allows a none verdict with zero evidence', () => {
    const r = VerdictSchema.safeParse({
      productId: 'p', storyId: 's', verdict: 'none', quality: 0,
      confidence: 'medium', rationale: 'No sign of this capability.', evidenceIds: [],
    })
    expect(r.success).toBe(true)
  })

  it('rejects out-of-range quality and weight', () => {
    expect(StorySchema.safeParse({ id: 's', persona: 'developer', title: 't', theme: 'x', weight: 4 }).success).toBe(false)
    expect(VerdictSchema.safeParse({
      productId: 'p', storyId: 's', verdict: 'full', quality: 11,
      confidence: 'high', rationale: 'x', evidenceIds: ['e'],
    }).success).toBe(false)
  })

  it('rejects an unknown evidence tier', () => {
    expect(EvidenceSchema.safeParse({
      id: 'e', tier: 'blog', url: 'https://x.com', excerpt: 'q', fetchedAt: '2026-08-26T00:00:00Z',
    }).success).toBe(false)
  })

  it('requires a valid site url on products', () => {
    expect(ProductSchema.safeParse({
      id: 'p', name: 'P', vendor: 'V', type: 'oss', urls: { site: 'not-a-url' },
    }).success).toBe(false)
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm test lib/__tests__/schemas.test.ts`
Expected: FAIL — cannot resolve `@/lib/schemas`.

- [ ] **Step 3: Implement `lib/schemas.ts`**

```ts
import { z } from 'zod'

export const CategorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  personas: z.array(z.string().min(1)).min(1),
})

export const ProductSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  vendor: z.string().min(1),
  type: z.enum(['oss', 'commercial']),
  urls: z.object({
    site: z.string().url(),
    docs: z.string().url().optional(),
    changelog: z.string().url().optional(),
    github: z.string().url().optional(),
  }),
})

export const StorySchema = z.object({
  id: z.string().min(1),
  persona: z.string().min(1),
  title: z.string().min(1),
  theme: z.string().min(1),
  weight: z.number().int().min(1).max(3),
})

export const EvidenceSchema = z.object({
  id: z.string().min(1),
  tier: z.enum(['claimed-docs', 'github', 'community', 'probe']),
  url: z.string().url(),
  excerpt: z.string().min(1),
  fetchedAt: z.string().datetime(),
})

export const VerdictSchema = z
  .object({
    productId: z.string().min(1),
    storyId: z.string().min(1),
    verdict: z.enum(['full', 'partial', 'none', 'disputed']),
    quality: z.number().min(0).max(10),
    confidence: z.enum(['high', 'medium', 'low']),
    rationale: z.string().min(1),
    evidenceIds: z.array(z.string().min(1)),
  })
  .refine((v) => v.verdict === 'none' || v.evidenceIds.length >= 1, {
    message: 'non-none verdicts must cite at least one evidenceId',
  })

export const RankingsSchema = z.object({
  generatedAt: z.string().datetime(),
  leaderboard: z.array(
    z.object({
      productId: z.string().min(1),
      score: z.number().min(0).max(100),
      themeScores: z.record(z.string(), z.number().min(0).max(100)),
    }),
  ),
  battles: z.array(
    z.object({
      a: z.string().min(1),
      b: z.string().min(1),
      winner: z.string().min(1), // productId or "draw"
      record: z.object({
        aWins: z.number().int().min(0),
        bWins: z.number().int().min(0),
        draws: z.number().int().min(0),
      }),
      rounds: z.array(
        z.object({
          storyId: z.string().min(1),
          winner: z.enum(['a', 'b', 'draw']),
          margin: z.number().min(0),
        }),
      ),
    }),
  ),
})

export type Category = z.infer<typeof CategorySchema>
export type Product = z.infer<typeof ProductSchema>
export type Story = z.infer<typeof StorySchema>
export type Evidence = z.infer<typeof EvidenceSchema>
export type Verdict = z.infer<typeof VerdictSchema>
export type Rankings = z.infer<typeof RankingsSchema>
export type BattleRecord = Rankings['battles'][number]
export type LeaderboardEntry = Rankings['leaderboard'][number]
```

- [ ] **Step 4: Run to verify pass**

Run: `pnpm test lib/__tests__/schemas.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add lib && git commit -m "feat: zod schemas for all data files"
```

---

### Task 3: Scoring + rankings math

**Files:**
- Create: `lib/scoring.ts`, `lib/__tests__/scoring.test.ts`

**Interfaces:**
- Consumes: types from `lib/schemas.ts`.
- Produces (exact exports):
  - `VERDICT_FACTORS: Record<'full'|'partial'|'none'|'disputed', number>`
  - `cellScore(verdict: Verdict, story: Story): number`
  - `buildRankings(products: Product[], stories: Story[], verdicts: Verdict[], generatedAt: string): Rankings` — throws `Error` naming the cell if any (product × story) verdict is missing. Battle pairs are emitted in `products` array order (a = earlier index).

- [ ] **Step 1: Write the failing tests**

`lib/__tests__/scoring.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import type { Product, Story, Verdict } from '@/lib/schemas'
import { buildRankings, cellScore } from '@/lib/scoring'

const products: Product[] = [
  { id: 'a', name: 'A', vendor: 'v', type: 'oss', urls: { site: 'https://a.example' } },
  { id: 'b', name: 'B', vendor: 'v', type: 'oss', urls: { site: 'https://b.example' } },
]
const stories: Story[] = [
  { id: 's1', persona: 'dev', title: 't1', theme: 'core', weight: 2 },
  { id: 's2', persona: 'dev', title: 't2', theme: 'core', weight: 1 },
  { id: 's3', persona: 'dev', title: 't3', theme: 'extras', weight: 1 },
]
const v = (productId: string, storyId: string, verdict: Verdict['verdict'], quality: number): Verdict => ({
  productId, storyId, verdict, quality, confidence: 'high', rationale: 'r',
  evidenceIds: verdict === 'none' ? [] : ['e1'],
})

describe('cellScore', () => {
  it('applies weight x quality x factor', () => {
    expect(cellScore(v('a', 's1', 'full', 10), stories[0])).toBe(20)
    expect(cellScore(v('a', 's1', 'partial', 10), stories[0])).toBe(12)
    expect(cellScore(v('a', 's1', 'disputed', 10), stories[0])).toBe(6)
    expect(cellScore(v('a', 's1', 'none', 10), stories[0])).toBe(0)
  })
})

describe('buildRankings', () => {
  const verdicts = [
    v('a', 's1', 'full', 10), v('a', 's2', 'full', 10), v('a', 's3', 'none', 0),
    v('b', 's1', 'none', 0), v('b', 's2', 'full', 10), v('b', 's3', 'full', 10),
  ]
  const r = buildRankings(products, stories, verdicts, '2026-08-26T00:00:00.000Z')

  it('normalizes product scores to 0-100 and sorts descending', () => {
    // max possible = (2+1+1)*10 = 40. a: 20+10+0=30 -> 75. b: 0+10+10=20 -> 50.
    expect(r.leaderboard).toEqual([
      expect.objectContaining({ productId: 'a', score: 75 }),
      expect.objectContaining({ productId: 'b', score: 50 }),
    ])
  })

  it('computes per-theme scores', () => {
    expect(r.leaderboard[0].themeScores).toEqual({ core: 100, extras: 0 })
    expect(r.leaderboard[1].themeScores).toEqual({ core: 33.3, extras: 100 })
  })

  it('derives rounds with draws on exact ties', () => {
    const battle = r.battles[0]
    expect([battle.a, battle.b]).toEqual(['a', 'b'])
    expect(battle.rounds).toEqual([
      { storyId: 's1', winner: 'a', margin: 20 },
      { storyId: 's2', winner: 'draw', margin: 0 },
      { storyId: 's3', winner: 'b', margin: 10 },
    ])
    expect(battle.record).toEqual({ aWins: 1, bWins: 1, draws: 1 })
  })

  it('weights the battle winner by story weight', () => {
    // a won s1 (weight 2), b won s3 (weight 1) -> a wins despite equal round count
    expect(r.battles[0].winner).toBe('a')
  })

  it('throws on a missing cell, naming it', () => {
    expect(() => buildRankings(products, stories, verdicts.slice(1), 'x'))
      .toThrow(/a:s1/)
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm test lib/__tests__/scoring.test.ts`
Expected: FAIL — cannot resolve `@/lib/scoring`.

- [ ] **Step 3: Implement `lib/scoring.ts`**

```ts
import type { Product, Rankings, Story, Verdict } from './schemas'

export const VERDICT_FACTORS: Record<Verdict['verdict'], number> = {
  full: 1.0,
  partial: 0.6,
  disputed: 0.3,
  none: 0,
}

const round1 = (n: number) => Math.round(n * 10) / 10

export function cellScore(verdict: Verdict, story: Story): number {
  return story.weight * verdict.quality * VERDICT_FACTORS[verdict.verdict]
}

export function buildRankings(
  products: Product[],
  stories: Story[],
  verdicts: Verdict[],
  generatedAt: string,
): Rankings {
  const byCell = new Map(verdicts.map((v) => [`${v.productId}:${v.storyId}`, v]))
  const cell = (productId: string, story: Story): number => {
    const v = byCell.get(`${productId}:${story.id}`)
    if (!v) throw new Error(`missing verdict for cell ${productId}:${story.id}`)
    return cellScore(v, story)
  }

  const themes = [...new Set(stories.map((s) => s.theme))]
  const maxFor = (ss: Story[]) => ss.reduce((sum, s) => sum + s.weight * 10, 0)

  const leaderboard = products
    .map((p) => ({
      productId: p.id,
      score: round1((stories.reduce((sum, s) => sum + cell(p.id, s), 0) / maxFor(stories)) * 100),
      themeScores: Object.fromEntries(
        themes.map((t) => {
          const themed = stories.filter((s) => s.theme === t)
          return [t, round1((themed.reduce((sum, s) => sum + cell(p.id, s), 0) / maxFor(themed)) * 100)]
        }),
      ),
    }))
    .sort((x, y) => y.score - x.score)

  const battles: Rankings['battles'] = []
  for (let i = 0; i < products.length; i++) {
    for (let j = i + 1; j < products.length; j++) {
      const a = products[i].id
      const b = products[j].id
      const rounds = stories.map((s) => {
        const sa = cell(a, s)
        const sb = cell(b, s)
        return {
          storyId: s.id,
          winner: sa > sb ? ('a' as const) : sb > sa ? ('b' as const) : ('draw' as const),
          margin: round1(Math.abs(sa - sb)),
        }
      })
      const weightOf = (storyId: string) => stories.find((s) => s.id === storyId)!.weight
      const pts = (side: 'a' | 'b') =>
        rounds.filter((r) => r.winner === side).reduce((sum, r) => sum + weightOf(r.storyId), 0)
      const aPts = pts('a')
      const bPts = pts('b')
      battles.push({
        a,
        b,
        winner: aPts > bPts ? a : bPts > aPts ? b : 'draw',
        record: {
          aWins: rounds.filter((r) => r.winner === 'a').length,
          bWins: rounds.filter((r) => r.winner === 'b').length,
          draws: rounds.filter((r) => r.winner === 'draw').length,
        },
        rounds,
      })
    }
  }

  return { generatedAt, leaderboard, battles }
}
```

- [ ] **Step 4: Run to verify pass**

Run: `pnpm test lib/__tests__/scoring.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib && git commit -m "feat: scoring math and rankings derivation"
```

---

### Task 4: Seed data + sample matrix

Hand-authored sample data so the app is buildable before the real pipeline run (Task 16 replaces stories/evidence/verdicts with pipeline output; `category.json` and `products.json` are permanent).

**Files:**
- Create: `data/category.json`, `data/products.json`, `data/stories.json`, `data/evidence/macos.json`, `data/evidence/omarchy.json`, `data/evidence/ubuntu.json`, `data/evidence/fedora.json`, `data/verdicts.json`

**Interfaces:**
- Produces: a complete, schema-valid dataset with a full 4×5 verdict matrix. Product ids (permanent): `macos`, `omarchy`, `ubuntu`, `fedora`.

- [ ] **Step 1: Verify product URLs resolve**

```bash
for u in https://www.apple.com/macos/ https://omarchy.org/ https://github.com/basecamp/omarchy https://ubuntu.com/desktop https://fedoraproject.org/workstation/ ; do curl -sIL -o /dev/null -w "%{http_code} $u\n" "$u"; done
```

Expected: all 200. If any 404s (especially the Omarchy GitHub/docs URLs), find the correct URL from omarchy.org and use it instead.

- [ ] **Step 2: Write `data/category.json` and `data/products.json`**

`data/category.json`:

```json
{
  "id": "desktop-os",
  "name": "Desktop OS",
  "description": "Operating systems for daily-driver desktop and laptop computing, judged on what a user can actually accomplish out of the box and beyond.",
  "personas": ["developer", "designer", "switcher", "power-user"]
}
```

`data/products.json` (adjust any URL that failed Step 1):

```json
[
  {
    "id": "macos",
    "name": "macOS",
    "vendor": "Apple",
    "type": "commercial",
    "urls": {
      "site": "https://www.apple.com/macos/",
      "docs": "https://support.apple.com/guide/mac-help/welcome/mac"
    }
  },
  {
    "id": "omarchy",
    "name": "Omarchy",
    "vendor": "DHH / 37signals",
    "type": "oss",
    "urls": {
      "site": "https://omarchy.org/",
      "github": "https://github.com/basecamp/omarchy"
    }
  },
  {
    "id": "ubuntu",
    "name": "Ubuntu Desktop",
    "vendor": "Canonical",
    "type": "oss",
    "urls": {
      "site": "https://ubuntu.com/desktop",
      "docs": "https://help.ubuntu.com/"
    }
  },
  {
    "id": "fedora",
    "name": "Fedora Workstation",
    "vendor": "Fedora Project / Red Hat",
    "type": "oss",
    "urls": {
      "site": "https://fedoraproject.org/workstation/",
      "docs": "https://docs.fedoraproject.org/en-US/fedora/latest/"
    }
  }
]
```

- [ ] **Step 3: Write sample `data/stories.json`**

```json
[
  { "id": "fresh-install", "persona": "switcher", "title": "As a switcher, I can get from blank machine to a working desktop in under 30 minutes", "theme": "install-setup", "weight": 3 },
  { "id": "keyboard-tiling", "persona": "developer", "title": "As a developer, I can tile and manage windows entirely from the keyboard", "theme": "window-management", "weight": 2 },
  { "id": "commercial-apps", "persona": "designer", "title": "As a designer, I can run mainstream commercial apps like Photoshop, Figma, and Slack natively", "theme": "app-ecosystem", "weight": 3 },
  { "id": "dev-toolchain", "persona": "developer", "title": "As a developer, I can set up a modern dev toolchain (git, docker, language runtimes) without friction", "theme": "dev-experience", "weight": 2 },
  { "id": "deep-theming", "persona": "power-user", "title": "As a power user, I can deeply theme and customize every part of my desktop", "theme": "customization", "weight": 1 }
]
```

- [ ] **Step 4: Write sample evidence files**

`data/evidence/macos.json`:

```json
[
  { "id": "macos-docs-1", "tier": "claimed-docs", "url": "https://www.apple.com/macos/", "excerpt": "SAMPLE: macOS ships preinstalled on every Mac with a guided setup assistant.", "fetchedAt": "2026-08-26T00:00:00Z" },
  { "id": "macos-docs-2", "tier": "claimed-docs", "url": "https://support.apple.com/guide/mac-help/welcome/mac", "excerpt": "SAMPLE: Stage Manager and full-screen tiling arrange windows; third-party tiling requires additional apps.", "fetchedAt": "2026-08-26T00:00:00Z" }
]
```

`data/evidence/omarchy.json`:

```json
[
  { "id": "omarchy-docs-1", "tier": "claimed-docs", "url": "https://omarchy.org/", "excerpt": "SAMPLE: An opinionated Arch/Hyprland setup: keyboard-driven tiling out of the box, themed end to end.", "fetchedAt": "2026-08-26T00:00:00Z" },
  { "id": "omarchy-gh-1", "tier": "github", "url": "https://github.com/basecamp/omarchy", "excerpt": "SAMPLE: One-command install script converts a fresh Arch installation into a complete dev-ready desktop.", "fetchedAt": "2026-08-26T00:00:00Z" }
]
```

`data/evidence/ubuntu.json`:

```json
[
  { "id": "ubuntu-docs-1", "tier": "claimed-docs", "url": "https://ubuntu.com/desktop", "excerpt": "SAMPLE: Guided graphical installer; GNOME desktop with app store and snap packaging.", "fetchedAt": "2026-08-26T00:00:00Z" },
  { "id": "ubuntu-docs-2", "tier": "claimed-docs", "url": "https://help.ubuntu.com/", "excerpt": "SAMPLE: Docker, git, and mainstream language runtimes are installable from official repositories.", "fetchedAt": "2026-08-26T00:00:00Z" }
]
```

`data/evidence/fedora.json`:

```json
[
  { "id": "fedora-docs-1", "tier": "claimed-docs", "url": "https://fedoraproject.org/workstation/", "excerpt": "SAMPLE: Fedora Workstation ships a polished GNOME desktop with Anaconda guided installer.", "fetchedAt": "2026-08-26T00:00:00Z" },
  { "id": "fedora-docs-2", "tier": "claimed-docs", "url": "https://docs.fedoraproject.org/en-US/fedora/latest/", "excerpt": "SAMPLE: Toolbox and container tooling ship by default for development workflows.", "fetchedAt": "2026-08-26T00:00:00Z" }
]
```

- [ ] **Step 5: Write sample `data/verdicts.json` (all 20 cells)**

```json
[
  { "productId": "macos", "storyId": "fresh-install", "verdict": "full", "quality": 9, "confidence": "high", "rationale": "SAMPLE: Preinstalled with a guided setup assistant.", "evidenceIds": ["macos-docs-1"] },
  { "productId": "macos", "storyId": "keyboard-tiling", "verdict": "partial", "quality": 6, "confidence": "medium", "rationale": "SAMPLE: Native tiling is limited; full tiling needs third-party apps.", "evidenceIds": ["macos-docs-2"] },
  { "productId": "macos", "storyId": "commercial-apps", "verdict": "full", "quality": 10, "confidence": "high", "rationale": "SAMPLE: First-class native support from every major vendor.", "evidenceIds": ["macos-docs-1"] },
  { "productId": "macos", "storyId": "dev-toolchain", "verdict": "full", "quality": 8, "confidence": "high", "rationale": "SAMPLE: Homebrew ecosystem; Docker via VM layer.", "evidenceIds": ["macos-docs-1"] },
  { "productId": "macos", "storyId": "deep-theming", "verdict": "partial", "quality": 5, "confidence": "medium", "rationale": "SAMPLE: Accent colors and wallpapers; no deep system theming.", "evidenceIds": ["macos-docs-2"] },
  { "productId": "omarchy", "storyId": "fresh-install", "verdict": "full", "quality": 9, "confidence": "medium", "rationale": "SAMPLE: One-command install onto Arch.", "evidenceIds": ["omarchy-gh-1"] },
  { "productId": "omarchy", "storyId": "keyboard-tiling", "verdict": "full", "quality": 10, "confidence": "high", "rationale": "SAMPLE: Hyprland tiling is the core paradigm.", "evidenceIds": ["omarchy-docs-1"] },
  { "productId": "omarchy", "storyId": "commercial-apps", "verdict": "partial", "quality": 4, "confidence": "medium", "rationale": "SAMPLE: Web/electron versions only for most commercial apps.", "evidenceIds": ["omarchy-docs-1"] },
  { "productId": "omarchy", "storyId": "dev-toolchain", "verdict": "full", "quality": 9, "confidence": "high", "rationale": "SAMPLE: Dev-ready by design: terminal-first with toolchain preconfigured.", "evidenceIds": ["omarchy-gh-1"] },
  { "productId": "omarchy", "storyId": "deep-theming", "verdict": "full", "quality": 10, "confidence": "high", "rationale": "SAMPLE: Coordinated system-wide themes are a headline feature.", "evidenceIds": ["omarchy-docs-1"] },
  { "productId": "ubuntu", "storyId": "fresh-install", "verdict": "full", "quality": 8, "confidence": "high", "rationale": "SAMPLE: Mature guided installer.", "evidenceIds": ["ubuntu-docs-1"] },
  { "productId": "ubuntu", "storyId": "keyboard-tiling", "verdict": "partial", "quality": 5, "confidence": "medium", "rationale": "SAMPLE: Basic GNOME tiling; full tiling via extensions.", "evidenceIds": ["ubuntu-docs-1"] },
  { "productId": "ubuntu", "storyId": "commercial-apps", "verdict": "partial", "quality": 6, "confidence": "medium", "rationale": "SAMPLE: Slack/Figma via snap or web; no native Adobe.", "evidenceIds": ["ubuntu-docs-1"] },
  { "productId": "ubuntu", "storyId": "dev-toolchain", "verdict": "full", "quality": 8, "confidence": "high", "rationale": "SAMPLE: apt + native Docker.", "evidenceIds": ["ubuntu-docs-2"] },
  { "productId": "ubuntu", "storyId": "deep-theming", "verdict": "full", "quality": 7, "confidence": "medium", "rationale": "SAMPLE: GNOME theming and extensions.", "evidenceIds": ["ubuntu-docs-1"] },
  { "productId": "fedora", "storyId": "fresh-install", "verdict": "full", "quality": 8, "confidence": "high", "rationale": "SAMPLE: Anaconda guided installer.", "evidenceIds": ["fedora-docs-1"] },
  { "productId": "fedora", "storyId": "keyboard-tiling", "verdict": "partial", "quality": 5, "confidence": "medium", "rationale": "SAMPLE: Basic GNOME tiling; extensions for more.", "evidenceIds": ["fedora-docs-1"] },
  { "productId": "fedora", "storyId": "commercial-apps", "verdict": "partial", "quality": 5, "confidence": "medium", "rationale": "SAMPLE: Flatpak covers some; no native Adobe.", "evidenceIds": ["fedora-docs-1"] },
  { "productId": "fedora", "storyId": "dev-toolchain", "verdict": "full", "quality": 8, "confidence": "high", "rationale": "SAMPLE: dnf, Toolbox, Podman by default.", "evidenceIds": ["fedora-docs-2"] },
  { "productId": "fedora", "storyId": "deep-theming", "verdict": "full", "quality": 7, "confidence": "medium", "rationale": "SAMPLE: GNOME theming and extensions.", "evidenceIds": ["fedora-docs-1"] }
]
```

- [ ] **Step 6: Sanity-check via a one-off validation script**

Run:

```bash
pnpm tsx -e "
import { CategorySchema, ProductSchema, StorySchema, EvidenceSchema, VerdictSchema } from './lib/schemas';
import fs from 'node:fs';
const read = (p: string) => JSON.parse(fs.readFileSync(p, 'utf8'));
CategorySchema.parse(read('data/category.json'));
ProductSchema.array().parse(read('data/products.json'));
StorySchema.array().parse(read('data/stories.json'));
for (const p of ['macos','omarchy','ubuntu','fedora']) EvidenceSchema.array().parse(read('data/evidence/' + p + '.json'));
console.log('verdicts:', VerdictSchema.array().parse(read('data/verdicts.json')).length);
"
```

Expected: prints `verdicts: 20` with no errors.

- [ ] **Step 7: Commit**

```bash
git add data && git commit -m "feat: seed category/products and sample story matrix"
```

---

### Task 5: Pipeline CLI + derive stage

**Files:**
- Create: `pipeline/cli.ts`, `pipeline/stages/derive.ts`, `pipeline/paths.ts`, `pipeline/__tests__/derive.test.ts`
- Create (output): `data/rankings.json`

**Interfaces:**
- Consumes: `buildRankings` from `lib/scoring.ts`; schemas from `lib/schemas.ts`.
- Produces:
  - `pipeline/paths.ts` exports `DATA_DIR`, `CACHE_DIR` (absolute paths), `readJson<T>(schema: z.ZodType<T>, file: string): T`, `writeJson(file: string, value: unknown): void` (2-space indent, trailing newline, mkdir -p).
  - `pipeline/stages/derive.ts` exports `runDerive(): Promise<void>` — reads products/stories/verdicts from `DATA_DIR`, writes validated `rankings.json`.
  - `pipeline/cli.ts`: `pnpm pipeline <stage> [--product <id>]` dispatching to `run<Stage>` functions; unknown stage exits 1 with usage. Stage names: `crawl`, `extract`, `normalize`, `collect-community`, `judge`, `derive`.

- [ ] **Step 1: Write the failing test**

`pipeline/__tests__/derive.test.ts`:

```ts
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { RankingsSchema } from '@/lib/schemas'

describe('derive stage', () => {
  it('writes a valid rankings.json with 6 battles from the CLI', () => {
    execFileSync('pnpm', ['pipeline', 'derive'], { cwd: path.resolve(__dirname, '../..') })
    const raw = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../data/rankings.json'), 'utf8'))
    const rankings = RankingsSchema.parse(raw)
    expect(rankings.battles).toHaveLength(6)
    expect(rankings.leaderboard).toHaveLength(4)
    expect(rankings.leaderboard[0].score).toBeGreaterThanOrEqual(rankings.leaderboard[3].score)
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm test pipeline/__tests__/derive.test.ts`
Expected: FAIL — `pipeline/cli.ts` does not exist.

- [ ] **Step 3: Implement**

`pipeline/paths.ts`:

```ts
import fs from 'node:fs'
import path from 'node:path'
import type { z } from 'zod'

export const ROOT = path.resolve(__dirname, '..')
export const DATA_DIR = path.join(ROOT, 'data')
export const CACHE_DIR = path.join(ROOT, 'pipeline', 'cache')

export function readJson<T>(schema: z.ZodType<T>, file: string): T {
  return schema.parse(JSON.parse(fs.readFileSync(file, 'utf8')))
}

export function writeJson(file: string, value: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n')
}
```

`pipeline/stages/derive.ts`:

```ts
import path from 'node:path'
import { ProductSchema, RankingsSchema, StorySchema, VerdictSchema } from '../../lib/schemas'
import { buildRankings } from '../../lib/scoring'
import { DATA_DIR, readJson, writeJson } from '../paths'

export async function runDerive(): Promise<void> {
  const products = readJson(ProductSchema.array(), path.join(DATA_DIR, 'products.json'))
  const stories = readJson(StorySchema.array(), path.join(DATA_DIR, 'stories.json'))
  const verdicts = readJson(VerdictSchema.array(), path.join(DATA_DIR, 'verdicts.json'))
  const rankings = buildRankings(products, stories, verdicts, new Date().toISOString())
  writeJson(path.join(DATA_DIR, 'rankings.json'), RankingsSchema.parse(rankings))
  console.log(`derive: wrote rankings for ${products.length} products, ${rankings.battles.length} battles`)
}
```

`pipeline/cli.ts`:

```ts
const STAGES = ['crawl', 'extract', 'normalize', 'collect-community', 'judge', 'derive'] as const
type Stage = (typeof STAGES)[number]

async function main() {
  const [stage, ...rest] = process.argv.slice(2)
  const productFlag = rest.indexOf('--product')
  const product = productFlag >= 0 ? rest[productFlag + 1] : undefined

  if (!STAGES.includes(stage as Stage)) {
    console.error(`usage: pnpm pipeline <${STAGES.join('|')}> [--product <id>]`)
    process.exit(1)
  }

  switch (stage as Stage) {
    case 'derive':
      return (await import('./stages/derive')).runDerive()
    case 'crawl':
      return (await import('./stages/crawl')).runCrawl({ product })
    case 'extract':
      return (await import('./stages/extract')).runExtract({ product })
    case 'normalize':
      return (await import('./stages/normalize')).runNormalize()
    case 'collect-community':
      return (await import('./stages/collect-community')).runCollectCommunity({ product })
    case 'judge':
      return (await import('./stages/judge')).runJudge({ product })
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
```

(The four not-yet-written stage imports are dynamic, so `derive` works before they exist; TypeScript will complain about missing modules if `pnpm build` type-checks pipeline files — exclude `pipeline/` from `tsconfig.json` `include` for the Next build if so, or create the four files as stubs that throw `new Error('not implemented')`. Prefer the stub files; they are replaced in Tasks 10–15.)

Stub content for `pipeline/stages/crawl.ts`, `extract.ts`, `normalize.ts`, `collect-community.ts`, `judge.ts` (adjust the exported name per file: `runCrawl({ product }: { product?: string })`, `runExtract(...)`, `runNormalize()`, `runCollectCommunity(...)`, `runJudge(...)`):

```ts
export async function runCrawl(_opts: { product?: string }): Promise<void> {
  throw new Error('not implemented')
}
```

- [ ] **Step 4: Run stage + tests**

Run: `pnpm pipeline derive && pnpm test pipeline/__tests__/derive.test.ts`
Expected: `data/rankings.json` exists; test PASSES. Omarchy and macOS should sit at the top of the sample leaderboard.

- [ ] **Step 5: Commit**

```bash
git add pipeline data/rankings.json && git commit -m "feat: pipeline CLI with derive stage producing rankings.json"
```

---

### Task 6: Data loader with referential integrity

**Files:**
- Create: `lib/data.ts`, `lib/__tests__/data.test.ts`

**Interfaces:**
- Consumes: schemas from `lib/schemas.ts`.
- Produces (exact exports from `lib/data.ts`):
  - `interface AppData { category: Category; products: Product[]; stories: Story[]; evidence: Record<string, Evidence[]>; verdicts: Verdict[]; rankings: Rankings }`
  - `loadData(dir?: string): AppData` — validates all files and referential integrity; throws `Error` with a descriptive message on any violation. Memoizes per `dir`.
  - `battleSlug(a: string, b: string): string` → `"a-vs-b"`; `parseBattleSlug(slug: string, products: Product[]): { a: string; b: string } | null` — resolves by matching known product ids (ids contain no `-vs-`).
  - `verdictFor(data: AppData, productId: string, storyId: string): Verdict`
  - `evidenceById(data: AppData): Map<string, Evidence>`

Integrity rules enforced by `loadData`:
1. Every (product × story) pair has exactly one verdict; no verdict references unknown product/story.
2. Every `verdict.evidenceIds` entry exists in that product's evidence file.
3. Every leaderboard entry and battle references known product ids; battles cover every unordered pair exactly once.

- [ ] **Step 1: Write the failing tests**

`lib/__tests__/data.test.ts`:

```ts
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { battleSlug, loadData, parseBattleSlug } from '@/lib/data'

const REAL = path.resolve(__dirname, '../../data')
let tmp: string | undefined
afterEach(() => { if (tmp) fs.rmSync(tmp, { recursive: true, force: true }); tmp = undefined })

function corruptedCopy(mutate: (dir: string) => void): string {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pa-data-'))
  fs.cpSync(REAL, tmp, { recursive: true })
  mutate(tmp)
  return tmp
}

describe('loadData', () => {
  it('loads the committed dataset', () => {
    const data = loadData(REAL)
    expect(data.products).toHaveLength(4)
    expect(data.verdicts).toHaveLength(data.products.length * data.stories.length)
  })

  it('rejects a verdict citing missing evidence', () => {
    const dir = corruptedCopy((d) => {
      const verdicts = JSON.parse(fs.readFileSync(path.join(d, 'verdicts.json'), 'utf8'))
      verdicts[0].evidenceIds = ['ghost-ev-99']
      fs.writeFileSync(path.join(d, 'verdicts.json'), JSON.stringify(verdicts))
    })
    expect(() => loadData(dir)).toThrow(/ghost-ev-99/)
  })

  it('rejects an incomplete matrix', () => {
    const dir = corruptedCopy((d) => {
      const verdicts = JSON.parse(fs.readFileSync(path.join(d, 'verdicts.json'), 'utf8'))
      fs.writeFileSync(path.join(d, 'verdicts.json'), JSON.stringify(verdicts.slice(1)))
    })
    expect(() => loadData(dir)).toThrow(/missing verdict/)
  })
})

describe('battle slugs', () => {
  it('round-trips', () => {
    const products = loadData(REAL).products
    expect(battleSlug('macos', 'omarchy')).toBe('macos-vs-omarchy')
    expect(parseBattleSlug('macos-vs-omarchy', products)).toEqual({ a: 'macos', b: 'omarchy' })
    expect(parseBattleSlug('nope-vs-omarchy', products)).toBeNull()
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm test lib/__tests__/data.test.ts`
Expected: FAIL — cannot resolve `@/lib/data`.

- [ ] **Step 3: Implement `lib/data.ts`**

```ts
import fs from 'node:fs'
import path from 'node:path'
import {
  type Category, CategorySchema, type Evidence, EvidenceSchema,
  type Product, ProductSchema, type Rankings, RankingsSchema,
  type Story, StorySchema, type Verdict, VerdictSchema,
} from './schemas'

export interface AppData {
  category: Category
  products: Product[]
  stories: Story[]
  evidence: Record<string, Evidence[]>
  verdicts: Verdict[]
  rankings: Rankings
}

const cache = new Map<string, AppData>()

export function loadData(dir: string = path.join(process.cwd(), 'data')): AppData {
  const hit = cache.get(dir)
  if (hit) return hit

  const read = (file: string) => JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'))
  const category = CategorySchema.parse(read('category.json'))
  const products = ProductSchema.array().parse(read('products.json'))
  const stories = StorySchema.array().parse(read('stories.json'))
  const verdicts = VerdictSchema.array().parse(read('verdicts.json'))
  const rankings = RankingsSchema.parse(read('rankings.json'))
  const evidence = Object.fromEntries(
    products.map((p) => [p.id, EvidenceSchema.array().parse(read(path.join('evidence', `${p.id}.json`)))]),
  )

  const productIds = new Set(products.map((p) => p.id))
  const storyIds = new Set(stories.map((s) => s.id))

  const cellKeys = new Set<string>()
  for (const v of verdicts) {
    if (!productIds.has(v.productId)) throw new Error(`verdict references unknown product ${v.productId}`)
    if (!storyIds.has(v.storyId)) throw new Error(`verdict references unknown story ${v.storyId}`)
    const key = `${v.productId}:${v.storyId}`
    if (cellKeys.has(key)) throw new Error(`duplicate verdict for cell ${key}`)
    cellKeys.add(key)
    const known = new Set(evidence[v.productId].map((e) => e.id))
    for (const id of v.evidenceIds) {
      if (!known.has(id)) throw new Error(`verdict ${key} cites missing evidence ${id}`)
    }
  }
  for (const p of products) for (const s of stories) {
    if (!cellKeys.has(`${p.id}:${s.id}`)) throw new Error(`missing verdict for cell ${p.id}:${s.id}`)
  }

  for (const entry of rankings.leaderboard) {
    if (!productIds.has(entry.productId)) throw new Error(`leaderboard references unknown product ${entry.productId}`)
  }
  const pairs = new Set<string>()
  for (const b of rankings.battles) {
    if (!productIds.has(b.a) || !productIds.has(b.b)) throw new Error(`battle ${b.a} vs ${b.b} references unknown product`)
    pairs.add([b.a, b.b].sort().join('|'))
  }
  const expectedPairs = (products.length * (products.length - 1)) / 2
  if (pairs.size !== expectedPairs || rankings.battles.length !== expectedPairs) {
    throw new Error(`expected ${expectedPairs} unique battles, found ${rankings.battles.length}`)
  }

  const data: AppData = { category, products, stories, evidence, verdicts, rankings }
  cache.set(dir, data)
  return data
}

export function battleSlug(a: string, b: string): string {
  return `${a}-vs-${b}`
}

export function parseBattleSlug(slug: string, products: Product[]): { a: string; b: string } | null {
  for (const a of products) {
    const prefix = `${a.id}-vs-`
    if (!slug.startsWith(prefix)) continue
    const b = slug.slice(prefix.length)
    if (b !== a.id && products.some((p) => p.id === b)) return { a: a.id, b }
  }
  return null
}

export function verdictFor(data: AppData, productId: string, storyId: string): Verdict {
  const v = data.verdicts.find((x) => x.productId === productId && x.storyId === storyId)
  if (!v) throw new Error(`missing verdict for cell ${productId}:${storyId}`)
  return v
}

export function evidenceById(data: AppData): Map<string, Evidence> {
  return new Map(Object.values(data.evidence).flat().map((e) => [e.id, e]))
}
```

- [ ] **Step 4: Run to verify pass**

Run: `pnpm test lib/__tests__/data.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib && git commit -m "feat: data loader with referential integrity checks"
```

---

### Task 7: Leaderboard page (`/`)

**Files:**
- Create: `components/ScoreBar.tsx`, `components/VerdictBadge.tsx`, `components/LeaderboardTable.tsx`, `components/__tests__/LeaderboardTable.test.tsx`
- Modify: `app/page.tsx`, `app/layout.tsx`, `app/globals.css`
- Delete: scaffold boilerplate in `app/page.tsx`

**Interfaces:**
- Consumes: `loadData`, `battleSlug` from `lib/data.ts`.
- Produces:
  - `ScoreBar({ score, className? }: { score: number; className?: string })` — 0–100 horizontal bar with numeric label.
  - `VerdictBadge({ verdict }: { verdict: Verdict['verdict'] })` — colored pill (full=emerald, partial=amber, disputed=red, none=zinc).
  - `LeaderboardTable({ data }: { data: AppData })` — pure presentational; ranks, names, score bars, theme chips, links to `/product/[id]` and top battles.

Design direction (applies to Tasks 7–9): dark arena aesthetic — background `zinc-950`, off-white text, single amber accent for scores/wins, tabular numbers (`font-mono` for figures), generous whitespace, no gradients-everywhere AI-slop. Site title: **Product Arena**; tagline: “User-story combat for software. Evidence in, rankings out.”

- [ ] **Step 1: Write the failing component test**

`components/__tests__/LeaderboardTable.test.tsx`:

```tsx
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import LeaderboardTable from '@/components/LeaderboardTable'
import { loadData } from '@/lib/data'

describe('LeaderboardTable', () => {
  it('renders every product with its score, rank order intact', () => {
    const data = loadData(path.resolve(__dirname, '../../data'))
    render(<LeaderboardTable data={data} />)
    for (const p of data.products) {
      expect(screen.getByText(p.name)).toBeDefined()
    }
    const first = data.rankings.leaderboard[0]
    expect(screen.getByText(first.score.toFixed(1))).toBeDefined()
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm test components/__tests__/LeaderboardTable.test.tsx`
Expected: FAIL — cannot resolve `@/components/LeaderboardTable`.

- [ ] **Step 3: Implement components and pages**

`components/ScoreBar.tsx`:

```tsx
export default function ScoreBar({ score, className = '' }: { score: number; className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-800">
        <div className="h-full rounded-full bg-amber-400" style={{ width: `${score}%` }} />
      </div>
      <span className="w-12 text-right font-mono text-sm tabular-nums text-amber-300">{score.toFixed(1)}</span>
    </div>
  )
}
```

`components/VerdictBadge.tsx`:

```tsx
import type { Verdict } from '@/lib/schemas'

const STYLES: Record<Verdict['verdict'], string> = {
  full: 'bg-emerald-950 text-emerald-300 ring-emerald-800',
  partial: 'bg-amber-950 text-amber-300 ring-amber-800',
  disputed: 'bg-red-950 text-red-300 ring-red-800',
  none: 'bg-zinc-900 text-zinc-500 ring-zinc-700',
}

export default function VerdictBadge({ verdict }: { verdict: Verdict['verdict'] }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${STYLES[verdict]}`}>
      {verdict}
    </span>
  )
}
```

`components/LeaderboardTable.tsx`:

```tsx
import Link from 'next/link'
import ScoreBar from '@/components/ScoreBar'
import { type AppData, battleSlug } from '@/lib/data'

export default function LeaderboardTable({ data }: { data: AppData }) {
  const { leaderboard } = data.rankings
  const productById = new Map(data.products.map((p) => [p.id, p]))
  return (
    <ol className="divide-y divide-zinc-800 rounded-xl border border-zinc-800">
      {leaderboard.map((entry, i) => {
        const product = productById.get(entry.productId)!
        const rivals = leaderboard.filter((e) => e.productId !== entry.productId).slice(0, 2)
        return (
          <li key={entry.productId} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <span className="w-8 font-mono text-2xl tabular-nums text-zinc-600">{i + 1}</span>
              <div className="min-w-0">
                <Link href={`/product/${product.id}`} className="text-lg font-semibold hover:text-amber-300">
                  {product.name}
                </Link>
                <p className="truncate text-sm text-zinc-500">{product.vendor}</p>
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <ScoreBar score={entry.score} />
              <div className="flex flex-wrap gap-2 text-xs text-zinc-500">
                {rivals.map((r) => (
                  <Link
                    key={r.productId}
                    href={`/battle/${battleSlug(...([entry.productId, r.productId].sort() as [string, string]))}`}
                    className="rounded-full border border-zinc-800 px-2 py-0.5 hover:border-amber-400 hover:text-amber-300"
                  >
                    vs {productById.get(r.productId)!.name}
                  </Link>
                ))}
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
```

Caveat: `battleSlug` must receive ids in `products.json` order (that is how battles are keyed), not alphabetical order. Replace the `.sort()` call above with ordering by product index:

```tsx
const orderByProduct = (x: string, y: string): [string, string] => {
  const idx = (id: string) => data.products.findIndex((p) => p.id === id)
  return idx(x) <= idx(y) ? [x, y] : [y, x]
}
// usage: href={`/battle/${battleSlug(...orderByProduct(entry.productId, r.productId))}`}
```

`app/layout.tsx` (replace scaffold body classes/metadata; keep the font setup create-next-app generated):

```tsx
export const metadata = {
  title: 'Product Arena',
  description: 'User-story combat for software. Evidence in, rankings out.',
}
```

and on `<body>`: `className="bg-zinc-950 text-zinc-100 antialiased"`, with a simple header inside the layout:

```tsx
<header className="border-b border-zinc-800">
  <div className="mx-auto flex max-w-4xl items-baseline justify-between px-5 py-4">
    <Link href="/" className="text-lg font-bold tracking-tight">
      Product<span className="text-amber-400">Arena</span>
    </Link>
    <span className="text-xs text-zinc-500">evidence in, rankings out</span>
  </div>
</header>
<main className="mx-auto max-w-4xl px-5 py-10">{children}</main>
```

`app/page.tsx`:

```tsx
import LeaderboardTable from '@/components/LeaderboardTable'
import { loadData } from '@/lib/data'

export default function Home() {
  const data = loadData()
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-widest text-amber-400">Arena 001</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">{data.category.name}</h1>
        <p className="mt-2 max-w-2xl text-zinc-400">{data.category.description}</p>
        <p className="mt-2 text-xs text-zinc-600">
          {data.stories.length} user stories · {data.verdicts.length} judged cells · updated{' '}
          {data.rankings.generatedAt.slice(0, 10)}
        </p>
      </div>
      <LeaderboardTable data={data} />
    </div>
  )
}
```

- [ ] **Step 4: Run tests + build**

Run: `pnpm test components/__tests__/LeaderboardTable.test.tsx && pnpm build`
Expected: test PASSES; build succeeds and prerenders `/`.

- [ ] **Step 5: Commit**

```bash
git add app components && git commit -m "feat: leaderboard homepage with arena styling"
```

---

### Task 8: Battle pages (`/battle/[slug]`)

**Files:**
- Create: `app/battle/[slug]/page.tsx`, `components/BattleView.tsx`

**Interfaces:**
- Consumes: `loadData`, `parseBattleSlug`, `battleSlug`, `verdictFor`, `evidenceById` from `lib/data.ts`; `VerdictBadge`.
- Produces: statically generated pages for all 6 pairings via `generateStaticParams`; unknown slugs → `notFound()`.

- [ ] **Step 1: Implement `components/BattleView.tsx`**

```tsx
import VerdictBadge from '@/components/VerdictBadge'
import { type AppData, evidenceById, verdictFor } from '@/lib/data'
import type { BattleRecord } from '@/lib/schemas'

export default function BattleView({ data, battle }: { data: AppData; battle: BattleRecord }) {
  const productById = new Map(data.products.map((p) => [p.id, p]))
  const storyById = new Map(data.stories.map((s) => [s.id, s]))
  const evidence = evidenceById(data)
  const a = productById.get(battle.a)!
  const b = productById.get(battle.b)!
  const winnerName = battle.winner === 'draw' ? null : productById.get(battle.winner)!.name

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          {a.name} <span className="text-zinc-600">vs</span> {b.name}
        </h1>
        <p className="mt-2 text-amber-300">
          {winnerName ? `${winnerName} wins` : 'Draw'} · {battle.record.aWins}–{battle.record.bWins}
          {battle.record.draws > 0 ? ` (${battle.record.draws} drawn)` : ''}
        </p>
      </div>

      <ol className="space-y-3">
        {battle.rounds.map((round) => {
          const story = storyById.get(round.storyId)!
          const va = verdictFor(data, battle.a, round.storyId)
          const vb = verdictFor(data, battle.b, round.storyId)
          const roundWinner = round.winner === 'a' ? a.name : round.winner === 'b' ? b.name : 'draw'
          return (
            <li key={round.storyId} className="rounded-xl border border-zinc-800 p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-medium">{story.title}</h2>
                <span className="text-xs text-zinc-500">
                  {story.theme} · weight {story.weight} ·{' '}
                  {round.winner === 'draw' ? 'round drawn' : `round to ${roundWinner}`}
                </span>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {[{ p: a, v: va, won: round.winner === 'a' }, { p: b, v: vb, won: round.winner === 'b' }].map(
                  ({ p, v, won }) => (
                    <div key={p.id} className={`rounded-lg p-4 ring-1 ${won ? 'ring-amber-400/60 bg-amber-400/5' : 'ring-zinc-800'}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">{p.name}</span>
                        <span className="flex items-center gap-2">
                          <VerdictBadge verdict={v.verdict} />
                          <span className="font-mono text-sm tabular-nums text-zinc-400">{v.quality}/10</span>
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-zinc-400">{v.rationale}</p>
                      <ul className="mt-2 space-y-1">
                        {v.evidenceIds.map((id) => {
                          const e = evidence.get(id)!
                          return (
                            <li key={id} className="text-xs text-zinc-500">
                              <a href={e.url} target="_blank" rel="noopener noreferrer" className="underline decoration-zinc-700 hover:text-amber-300">
                                [{e.tier}]
                              </a>{' '}
                              “{e.excerpt.length > 140 ? e.excerpt.slice(0, 140) + '…' : e.excerpt}”
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  ),
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
```

- [ ] **Step 2: Implement `app/battle/[slug]/page.tsx`**

```tsx
import { notFound } from 'next/navigation'
import BattleView from '@/components/BattleView'
import { battleSlug, loadData, parseBattleSlug } from '@/lib/data'

export function generateStaticParams() {
  const data = loadData()
  return data.rankings.battles.map((b) => ({ slug: battleSlug(b.a, b.b) }))
}

export const dynamicParams = false

export default async function BattlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const data = loadData()
  const pair = parseBattleSlug(slug, data.products)
  if (!pair) notFound()
  const battle = data.rankings.battles.find((b) => b.a === pair.a && b.b === pair.b)
  if (!battle) notFound()
  return <BattleView data={data} battle={battle} />
}
```

- [ ] **Step 3: Verify build prerenders all six battles**

Run: `pnpm build`
Expected: build output lists 6 `/battle/…` static pages (e.g. `/battle/macos-vs-omarchy`, `/battle/ubuntu-vs-fedora`).

- [ ] **Step 4: Commit**

```bash
git add app components && git commit -m "feat: battle pages with round-by-round verdicts and evidence"
```

---

### Task 9: Product pages (`/product/[id]`)

**Files:**
- Create: `app/product/[id]/page.tsx`

**Interfaces:**
- Consumes: `loadData`, `verdictFor`, `evidenceById`, `battleSlug` from `lib/data.ts`; `ScoreBar`, `VerdictBadge`.
- Produces: statically generated pages for all 4 products; unknown ids → `notFound()`.

- [ ] **Step 1: Implement `app/product/[id]/page.tsx`**

```tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ScoreBar from '@/components/ScoreBar'
import VerdictBadge from '@/components/VerdictBadge'
import { battleSlug, evidenceById, loadData, verdictFor } from '@/lib/data'

export function generateStaticParams() {
  return loadData().products.map((p) => ({ id: p.id }))
}

export const dynamicParams = false

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = loadData()
  const product = data.products.find((p) => p.id === id)
  if (!product) notFound()
  const entry = data.rankings.leaderboard.find((e) => e.productId === id)!
  const rank = data.rankings.leaderboard.indexOf(entry) + 1
  const evidence = evidenceById(data)
  const tierCounts = data.evidence[id].reduce<Record<string, number>>((acc, e) => {
    acc[e.tier] = (acc[e.tier] ?? 0) + 1
    return acc
  }, {})
  const themes = [...new Set(data.stories.map((s) => s.theme))]
  const idx = (pid: string) => data.products.findIndex((p) => p.id === pid)

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-widest text-amber-400">Rank #{rank}</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">{product.name}</h1>
        <p className="mt-1 text-zinc-500">
          {product.vendor} · {product.type === 'oss' ? 'open source' : 'commercial'} ·{' '}
          <a href={product.urls.site} className="underline decoration-zinc-700 hover:text-amber-300">site</a>
        </p>
        <ScoreBar score={entry.score} className="mt-4 max-w-md" />
        <p className="mt-2 text-xs text-zinc-600">
          evidence: {Object.entries(tierCounts).map(([t, n]) => `${t} ×${n}`).join(' · ') || 'none'}
        </p>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">By theme</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {themes.map((t) => (
            <div key={t} className="rounded-lg border border-zinc-800 p-4">
              <p className="mb-2 text-sm text-zinc-400">{t}</p>
              <ScoreBar score={entry.themeScores[t] ?? 0} />
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Story verdicts</h2>
        <ul className="divide-y divide-zinc-800 rounded-xl border border-zinc-800">
          {data.stories.map((s) => {
            const v = verdictFor(data, id, s.id)
            return (
              <li key={s.id} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{s.title}</p>
                  <span className="flex items-center gap-2">
                    <VerdictBadge verdict={v.verdict} />
                    <span className="font-mono text-sm tabular-nums text-zinc-400">{v.quality}/10</span>
                  </span>
                </div>
                <p className="mt-1 text-sm text-zinc-500">{v.rationale}</p>
                {v.evidenceIds.length > 0 && (
                  <p className="mt-1 text-xs text-zinc-600">
                    {v.evidenceIds.map((eid, i) => {
                      const e = evidence.get(eid)!
                      return (
                        <a key={eid} href={e.url} className="underline decoration-zinc-800 hover:text-amber-300">
                          {i > 0 ? ' · ' : ''}[{e.tier}]
                        </a>
                      )
                    })}
                  </p>
                )}
              </li>
            )
          })}
        </ul>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Battles</h2>
        <div className="flex flex-wrap gap-2">
          {data.products.filter((p) => p.id !== id).map((rival) => {
            const [a, b] = idx(id) <= idx(rival.id) ? [id, rival.id] : [rival.id, id]
            return (
              <Link key={rival.id} href={`/battle/${battleSlug(a, b)}`}
                className="rounded-full border border-zinc-800 px-3 py-1 text-sm hover:border-amber-400 hover:text-amber-300">
                vs {rival.name}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify build prerenders all pages**

Run: `pnpm build`
Expected: 4 `/product/…` pages plus 6 battles plus `/` in the static output.

- [ ] **Step 3: Full test suite**

Run: `pnpm test`
Expected: all suites PASS.

- [ ] **Step 4: Commit**

```bash
git add app && git commit -m "feat: product profile pages"
```

---

### Task 10: LLM wrapper

**Files:**
- Create: `pipeline/llm.ts`, `pipeline/__tests__/llm.test.ts`

**Interfaces:**
- Produces (exact exports from `pipeline/llm.ts`):
  - `extractJson(text: string): unknown` — strips markdown fences, finds the first `{` or `[`, returns parsed JSON or `undefined` on failure.
  - `llmJson<T>(opts: { schema: z.ZodType<T>; system: string; prompt: string; maxTokens?: number }): Promise<T>` — calls Anthropic Messages API with model `process.env.PA_MODEL ?? 'claude-sonnet-5'`; on parse/validation failure appends the assistant reply plus a correction message containing the zod error and retries (max 2 retries, then throws).
  - `getClient(): Anthropic` — module-level singleton, overridable for tests via `setClientForTests(client)`.

- [ ] **Step 1: Write the failing tests**

`pipeline/__tests__/llm.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { extractJson, llmJson, setClientForTests } from '@/pipeline/llm'

const textResponse = (text: string) => ({ content: [{ type: 'text', text }] })

describe('extractJson', () => {
  it('parses fenced json', () => {
    expect(extractJson('```json\n{"a":1}\n```')).toEqual({ a: 1 })
  })
  it('parses json embedded in prose', () => {
    expect(extractJson('Here you go: [1,2,3] hope that helps')).toEqual([1, 2, 3])
  })
  it('returns undefined for garbage', () => {
    expect(extractJson('no json here')).toBeUndefined()
  })
})

describe('llmJson', () => {
  const schema = z.object({ name: z.string() })

  it('returns validated output on first success', async () => {
    const create = vi.fn().mockResolvedValue(textResponse('{"name":"ok"}'))
    setClientForTests({ messages: { create } } as never)
    await expect(llmJson({ schema, system: 's', prompt: 'p' })).resolves.toEqual({ name: 'ok' })
    expect(create).toHaveBeenCalledTimes(1)
  })

  it('feeds validation errors back and retries', async () => {
    const create = vi
      .fn()
      .mockResolvedValueOnce(textResponse('{"name":42}'))
      .mockResolvedValueOnce(textResponse('{"name":"fixed"}'))
    setClientForTests({ messages: { create } } as never)
    await expect(llmJson({ schema, system: 's', prompt: 'p' })).resolves.toEqual({ name: 'fixed' })
    expect(create).toHaveBeenCalledTimes(2)
    const secondCallMessages = create.mock.calls[1][0].messages
    expect(secondCallMessages).toHaveLength(3) // user, assistant, correction
    expect(JSON.stringify(secondCallMessages[2])).toMatch(/expected string/i)
  })

  it('throws after max retries', async () => {
    const create = vi.fn().mockResolvedValue(textResponse('still not json'))
    setClientForTests({ messages: { create } } as never)
    await expect(llmJson({ schema, system: 's', prompt: 'p' })).rejects.toThrow(/failed validation/)
    expect(create).toHaveBeenCalledTimes(3)
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm test pipeline/__tests__/llm.test.ts`
Expected: FAIL — cannot resolve `@/pipeline/llm`.

- [ ] **Step 3: Implement `pipeline/llm.ts`**

```ts
import Anthropic from '@anthropic-ai/sdk'
import type { z } from 'zod'

const MODEL = process.env.PA_MODEL ?? 'claude-sonnet-5'
const MAX_RETRIES = 2

let client: Anthropic | undefined

export function getClient(): Anthropic {
  if (!client) client = new Anthropic()
  return client
}

export function setClientForTests(fake: Anthropic): void {
  client = fake
}

export function extractJson(text: string): unknown {
  const unfenced = text.replace(/```(?:json)?/g, '')
  const start = unfenced.search(/[[{]/)
  if (start === -1) return undefined
  // walk back from the end until a parse succeeds
  for (let end = unfenced.length; end > start; end--) {
    const candidate = unfenced.slice(start, end).trim()
    if (!candidate.endsWith('}') && !candidate.endsWith(']')) continue
    try {
      return JSON.parse(candidate)
    } catch {
      /* keep walking */
    }
  }
  return undefined
}

export async function llmJson<T>(opts: {
  schema: z.ZodType<T>
  system: string
  prompt: string
  maxTokens?: number
}): Promise<T> {
  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: opts.prompt }]
  let lastError = ''
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await getClient().messages.create({
      model: MODEL,
      max_tokens: opts.maxTokens ?? 4096,
      system: opts.system,
      messages,
    })
    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')
    const json = extractJson(text)
    const parsed = json === undefined ? undefined : opts.schema.safeParse(json)
    if (parsed?.success) return parsed.data
    lastError = json === undefined ? 'response contained no parseable JSON' : JSON.stringify(parsed?.error.issues)
    messages.push(
      { role: 'assistant', content: text },
      {
        role: 'user',
        content: `Your response failed validation: ${lastError}\nReply with ONLY the corrected JSON. No prose, no code fences.`,
      },
    )
  }
  throw new Error(`LLM output failed validation after ${MAX_RETRIES + 1} attempts: ${lastError}`)
}
```

- [ ] **Step 4: Run to verify pass**

Run: `pnpm test pipeline/__tests__/llm.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add pipeline && git commit -m "feat: zod-validated LLM wrapper with error-feedback retries"
```

---

### Task 11: Crawl stage

**Files:**
- Modify: `pipeline/stages/crawl.ts` (replace stub)
- Create: `pipeline/fetch-page.ts`, `pipeline/__tests__/fetch-page.test.ts`

**Interfaces:**
- Consumes: `CACHE_DIR` from `pipeline/paths.ts`; product list from `data/products.json`.
- Produces:
  - `pipeline/fetch-page.ts` exports `htmlToMarkdown(html: string): string` (turndown, strips `<script>/<style>/<nav>/<footer>` first) and `fetchWithRetry(url: string, retries?: number): Promise<string>` (3 attempts, exponential backoff 1s/2s/4s, browser User-Agent header, throws on final failure).
  - `runCrawl({ product }: { product?: string }): Promise<void>` — for each product (or just `--product`): fetch every URL in `product.urls`; for `github` URLs fetch `https://raw.githubusercontent.com/{owner}/{repo}/HEAD/README.md` instead of the HTML page; write markdown to `pipeline/cache/crawl/{productId}/{key}.md` where key ∈ {site, docs, changelog, github}. A per-URL failure logs a warning and continues; the stage fails (exit non-zero) only if a product ends up with zero cached pages.

- [ ] **Step 1: Write the failing test (pure parts only — no network in tests)**

`pipeline/__tests__/fetch-page.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { htmlToMarkdown } from '@/pipeline/fetch-page'

describe('htmlToMarkdown', () => {
  it('converts headings and paragraphs, strips scripts and nav', () => {
    const html = `<html><head><script>evil()</script></head><body>
      <nav><a href="/">Home</a></nav>
      <h1>Omarchy</h1><p>Opinionated <strong>Arch</strong> setup.</p>
      <footer>© 2026</footer></body></html>`
    const md = htmlToMarkdown(html)
    expect(md).toContain('# Omarchy')
    expect(md).toContain('**Arch**')
    expect(md).not.toContain('evil()')
    expect(md).not.toContain('Home')
    expect(md).not.toContain('© 2026')
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm test pipeline/__tests__/fetch-page.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `pipeline/fetch-page.ts`**

```ts
import TurndownService from 'turndown'

const turndown = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' })
turndown.remove(['script', 'style', 'nav', 'footer', 'iframe'])

export function htmlToMarkdown(html: string): string {
  return turndown.turndown(html)
}

export async function fetchWithRetry(url: string, retries = 2): Promise<string> {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ProductArena/1.0; +https://productarena.dev)' },
        redirect: 'follow',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
      return await res.text()
    } catch (err) {
      if (attempt >= retries) throw err
      await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt))
    }
  }
}
```

- [ ] **Step 4: Implement `pipeline/stages/crawl.ts`**

```ts
import fs from 'node:fs'
import path from 'node:path'
import { ProductSchema, type Product } from '../../lib/schemas'
import { fetchWithRetry, htmlToMarkdown } from '../fetch-page'
import { CACHE_DIR, DATA_DIR, readJson } from '../paths'

function githubReadmeUrl(githubUrl: string): string {
  const [, owner, repo] = new URL(githubUrl).pathname.split('/')
  return `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/README.md`
}

async function crawlProduct(product: Product): Promise<number> {
  const dir = path.join(CACHE_DIR, 'crawl', product.id)
  fs.mkdirSync(dir, { recursive: true })
  let saved = 0
  for (const [key, url] of Object.entries(product.urls) as [string, string][]) {
    try {
      const raw = await fetchWithRetry(key === 'github' ? githubReadmeUrl(url) : url)
      const markdown = key === 'github' ? raw : htmlToMarkdown(raw)
      fs.writeFileSync(path.join(dir, `${key}.md`), `<!-- source: ${url} -->\n\n${markdown}\n`)
      console.log(`crawl: ${product.id}/${key} (${markdown.length} chars)`)
      saved++
    } catch (err) {
      console.warn(`crawl: WARN ${product.id}/${key} failed: ${(err as Error).message}`)
    }
  }
  return saved
}

export async function runCrawl({ product }: { product?: string }): Promise<void> {
  const products = readJson(ProductSchema.array(), path.join(DATA_DIR, 'products.json')).filter(
    (p) => !product || p.id === product,
  )
  if (products.length === 0) throw new Error(`unknown product: ${product}`)
  for (const p of products) {
    const saved = await crawlProduct(p)
    if (saved === 0) throw new Error(`crawl: no pages saved for ${p.id}`)
  }
}
```

- [ ] **Step 5: Run tests, then a live smoke test on one product**

Run: `pnpm test pipeline/__tests__/fetch-page.test.ts` → PASS.
Run: `pnpm pipeline crawl --product omarchy`
Expected: `pipeline/cache/crawl/omarchy/site.md` and `github.md` exist with real content (inspect the first lines).

- [ ] **Step 6: Commit**

```bash
git add pipeline && git commit -m "feat: crawl stage caching product pages as markdown"
```

---

### Task 12: Extract stage (candidate stories + claimed/github evidence)

**Files:**
- Modify: `pipeline/stages/extract.ts` (replace stub)
- Create: `pipeline/__tests__/extract.test.ts`

**Interfaces:**
- Consumes: crawl caches; `llmJson` from `pipeline/llm.ts`.
- Produces:
  - Internal zod schema `ExtractionSchema` (exported for tests): `{ stories: Array<{ persona: string; title: string; quote: string; sourceKey: 'site'|'docs'|'changelog'|'github' }> }` (5–40 stories).
  - `buildEvidence(productId: string, extraction: Extraction, sourceUrls: Record<string, string>, fetchedAt: string): { candidates: CandidateStory[]; evidence: Evidence[] }` (exported, pure — dedupes identical quotes, assigns ids `{productId}-docs-{n}` for site/docs/changelog quotes and `{productId}-gh-{n}` for github quotes, maps sourceKey→URL). `CandidateStory = { persona: string; title: string; evidenceId: string }`.
  - `runExtract({ product }: { product?: string }): Promise<void>` — per product: read all `pipeline/cache/crawl/{id}/*.md` (concatenate, cap 60,000 chars), one `llmJson` call, then write `data/evidence/{id}.json` (replacing only `claimed-docs` and `github` tier items; preserving any existing `community`/`probe` items) and `pipeline/cache/extract/{id}.json` (the candidate stories). Fails if no crawl cache exists for the product.

- [ ] **Step 1: Write the failing test for the pure helper**

`pipeline/__tests__/extract.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { buildEvidence } from '@/pipeline/stages/extract'

describe('buildEvidence', () => {
  const urls = { site: 'https://omarchy.org/', github: 'https://github.com/basecamp/omarchy' }
  const extraction = {
    stories: [
      { persona: 'developer', title: 'tile windows by keyboard', quote: 'Hyprland tiling out of the box', sourceKey: 'site' as const },
      { persona: 'switcher', title: 'install in one command', quote: 'One command converts fresh Arch', sourceKey: 'github' as const },
      { persona: 'power-user', title: 'themes everywhere', quote: 'Hyprland tiling out of the box', sourceKey: 'site' as const },
    ],
  }

  it('assigns tier-based ids, maps urls, dedupes identical quotes', () => {
    const { candidates, evidence } = buildEvidence('omarchy', extraction, urls, '2026-08-26T00:00:00Z')
    expect(evidence).toHaveLength(2) // duplicate quote deduped
    expect(evidence[0]).toMatchObject({ id: 'omarchy-docs-1', tier: 'claimed-docs', url: urls.site })
    expect(evidence[1]).toMatchObject({ id: 'omarchy-gh-1', tier: 'github', url: urls.github })
    expect(candidates).toHaveLength(3)
    expect(candidates[2].evidenceId).toBe('omarchy-docs-1') // deduped story points at existing evidence
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm test pipeline/__tests__/extract.test.ts`
Expected: FAIL — `buildEvidence` not exported.

- [ ] **Step 3: Implement `pipeline/stages/extract.ts`**

```ts
import fs from 'node:fs'
import path from 'node:path'
import { z } from 'zod'
import { type Evidence, EvidenceSchema, ProductSchema } from '../../lib/schemas'
import { llmJson } from '../llm'
import { CACHE_DIR, DATA_DIR, readJson, writeJson } from '../paths'

export const ExtractionSchema = z.object({
  stories: z
    .array(
      z.object({
        persona: z.string().min(1),
        title: z.string().min(1),
        quote: z.string().min(1),
        sourceKey: z.enum(['site', 'docs', 'changelog', 'github']),
      }),
    )
    .min(5)
    .max(40),
})
export type Extraction = z.infer<typeof ExtractionSchema>
export type CandidateStory = { persona: string; title: string; evidenceId: string }

export function buildEvidence(
  productId: string,
  extraction: Extraction,
  sourceUrls: Record<string, string>,
  fetchedAt: string,
): { candidates: CandidateStory[]; evidence: Evidence[] } {
  const evidence: Evidence[] = []
  const byQuote = new Map<string, string>()
  const counters = { docs: 0, gh: 0 }
  const candidates = extraction.stories.map((s) => {
    let evidenceId = byQuote.get(s.quote)
    if (!evidenceId) {
      const isGithub = s.sourceKey === 'github'
      const abbrev = isGithub ? 'gh' : 'docs'
      counters[abbrev]++
      evidenceId = `${productId}-${abbrev}-${counters[abbrev]}`
      evidence.push({
        id: evidenceId,
        tier: isGithub ? 'github' : 'claimed-docs',
        url: sourceUrls[s.sourceKey] ?? sourceUrls.site,
        excerpt: s.quote,
        fetchedAt,
      })
      byQuote.set(s.quote, evidenceId)
    }
    return { persona: s.persona, title: s.title, evidenceId }
  })
  return { candidates, evidence }
}

const SYSTEM = `You extract user stories from a software product's own marketing and documentation.
A user story is a concrete capability a user gains: "As a <persona>, I can <do something specific>."
Only include capabilities the materials actually claim. Each story needs a short verbatim-ish quote (max 200 chars) from the materials as evidence and which source file it came from.
Personas must be drawn from: developer, designer, switcher, power-user.
Return JSON: {"stories":[{"persona":"...","title":"As a ..., I can ...","quote":"...","sourceKey":"site|docs|changelog|github"}]}`

export async function runExtract({ product }: { product?: string }): Promise<void> {
  const products = readJson(ProductSchema.array(), path.join(DATA_DIR, 'products.json')).filter(
    (p) => !product || p.id === product,
  )
  if (products.length === 0) throw new Error(`unknown product: ${product}`)

  for (const p of products) {
    const crawlDir = path.join(CACHE_DIR, 'crawl', p.id)
    if (!fs.existsSync(crawlDir)) throw new Error(`extract: no crawl cache for ${p.id} — run crawl first`)
    const parts = fs.readdirSync(crawlDir).map((f) => {
      const key = f.replace(/\.md$/, '')
      return `=== SOURCE ${key} ===\n${fs.readFileSync(path.join(crawlDir, f), 'utf8')}`
    })
    const corpus = parts.join('\n\n').slice(0, 60_000)

    const extraction = await llmJson({
      schema: ExtractionSchema,
      system: SYSTEM,
      prompt: `Product: ${p.name} (${p.vendor})\n\nMaterials:\n\n${corpus}`,
      maxTokens: 8192,
    })

    const { candidates, evidence } = buildEvidence(p.id, extraction, p.urls, new Date().toISOString())

    const evidenceFile = path.join(DATA_DIR, 'evidence', `${p.id}.json`)
    const existing = fs.existsSync(evidenceFile) ? readJson(EvidenceSchema.array(), evidenceFile) : []
    const kept = existing.filter((e) => e.tier === 'community' || e.tier === 'probe')
    writeJson(evidenceFile, [...evidence, ...kept])
    writeJson(path.join(CACHE_DIR, 'extract', `${p.id}.json`), candidates)
    console.log(`extract: ${p.id} → ${candidates.length} candidate stories, ${evidence.length} evidence items`)
  }
}
```

- [ ] **Step 4: Run to verify pass**

Run: `pnpm test pipeline/__tests__/extract.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add pipeline && git commit -m "feat: extract stage producing candidate stories and claimed evidence"
```

---

### Task 13: Normalize stage (canonical story taxonomy)

**Files:**
- Modify: `pipeline/stages/normalize.ts` (replace stub)

**Interfaces:**
- Consumes: `pipeline/cache/extract/*.json` candidate stories; `llmJson`.
- Produces: `runNormalize(): Promise<void>` — one LLM call over all products' candidates producing 25–50 canonical stories validated by `StorySchema.array().min(25).max(50)`, written to `data/stories.json` sorted by theme then id. Refuses to run (throws, with instruction) if `data/verdicts.json` contains non-SAMPLE verdicts, unless env `PA_FORCE_NORMALIZE=1` — taxonomy changes invalidate judged cells.

- [ ] **Step 1: Implement `pipeline/stages/normalize.ts`**

```ts
import fs from 'node:fs'
import path from 'node:path'
import { StorySchema } from '../../lib/schemas'
import { llmJson } from '../llm'
import { CACHE_DIR, DATA_DIR, writeJson } from '../paths'

const THEMES = [
  'install-setup', 'window-management', 'app-ecosystem', 'dev-experience',
  'customization', 'privacy-security', 'hardware-support', 'daily-workflow',
] as const

const SYSTEM = `You design a canonical user-story taxonomy for comparing products in one category.
Input: candidate user stories extracted from several competing products' own materials.
Output: 25-50 canonical stories that TOGETHER cover what all products claim, with duplicates merged and product-specific phrasing neutralized. Every story must be judgeable for ANY product in the category (never mention a product name).
Fields: id (kebab-case, stable, descriptive), persona (developer|designer|switcher|power-user), title ("As a <persona>, I can <specific capability>"), theme (one of: ${THEMES.join(', ')}), weight (3 = core daily-driver need, 2 = important, 1 = nice-to-have).
Return JSON: array of story objects.`

export async function runNormalize(): Promise<void> {
  const verdictsPath = path.join(DATA_DIR, 'verdicts.json')
  if (fs.existsSync(verdictsPath) && process.env.PA_FORCE_NORMALIZE !== '1') {
    const raw = fs.readFileSync(verdictsPath, 'utf8')
    if (!raw.includes('SAMPLE:')) {
      throw new Error(
        'normalize: real verdicts exist and would be invalidated. Re-run with PA_FORCE_NORMALIZE=1, then re-run judge for all products.',
      )
    }
  }

  const extractDir = path.join(CACHE_DIR, 'extract')
  if (!fs.existsSync(extractDir)) throw new Error('normalize: no extract caches — run extract first')
  const inputs = fs.readdirSync(extractDir).map((f) => {
    const productId = f.replace(/\.json$/, '')
    const candidates = JSON.parse(fs.readFileSync(path.join(extractDir, f), 'utf8')) as { persona: string; title: string }[]
    return `## ${productId}\n${candidates.map((c) => `- (${c.persona}) ${c.title}`).join('\n')}`
  })
  if (inputs.length < 2) throw new Error('normalize: need extracts from at least 2 products')

  const stories = await llmJson({
    schema: StorySchema.array().min(25).max(50),
    system: SYSTEM,
    prompt: `Category: Desktop OS.\n\nCandidate stories by product:\n\n${inputs.join('\n\n')}`,
    maxTokens: 8192,
  })

  const sorted = [...stories].sort((a, b) => a.theme.localeCompare(b.theme) || a.id.localeCompare(b.id))
  const ids = new Set(sorted.map((s) => s.id))
  if (ids.size !== sorted.length) throw new Error('normalize: duplicate story ids in LLM output')
  writeJson(path.join(DATA_DIR, 'stories.json'), sorted)
  console.log(`normalize: wrote ${sorted.length} canonical stories`)
}
```

- [ ] **Step 2: Type-check and guard-rail check**

Run: `pnpm tsc --noEmit --project tsconfig.json 2>&1 | grep -v node_modules; pnpm pipeline normalize`
Expected: no type errors touching `pipeline/stages/normalize.ts`; the stage exits with `no extract caches` error (extract not yet run for all products) — proving the guard works. (The sample verdicts contain `SAMPLE:`, so the verdict guard passes.)

- [ ] **Step 3: Commit**

```bash
git add pipeline && git commit -m "feat: normalize stage building canonical story taxonomy"
```

---

### Task 14: Community evidence stage

**Files:**
- Modify: `pipeline/stages/collect-community.ts` (replace stub)
- Create: `pipeline/seeds/community.json`

**Interfaces:**
- Consumes: `fetchWithRetry`, `htmlToMarkdown`, `llmJson`, evidence file conventions from Task 12.
- Produces: `runCollectCommunity({ product }): Promise<void>` — per product:
  1. Query HN Algolia (`https://hn.algolia.com/api/v1/search?query=<encoded name>&tags=story&hitsPerPage=5`), fetch top comment text per hit via `https://hn.algolia.com/api/v1/items/{objectID}`.
  2. Fetch each seeded URL from `pipeline/seeds/community.json` (shape: `{ [productId]: string[] }`), converting HTML→markdown.
  3. One `llmJson` call condensing all of it into 5–20 evidence items validated against a local schema `{ items: Array<{ url: string; excerpt: string }> }` — excerpts must be real user experiences (positive or negative), not marketing.
  4. Write items with ids `{productId}-comm-{n}`, tier `community`, into `data/evidence/{productId}.json`, replacing prior `community` items and preserving all other tiers.

- [ ] **Step 1: Create `pipeline/seeds/community.json`**

```json
{
  "macos": [],
  "omarchy": [],
  "ubuntu": [],
  "fedora": []
}
```

(Seed URLs are optional accelerants — HN search alone is acceptable for v1. Add specific thread URLs here over time.)

- [ ] **Step 2: Implement `pipeline/stages/collect-community.ts`**

```ts
import fs from 'node:fs'
import path from 'node:path'
import { z } from 'zod'
import { type Evidence, EvidenceSchema, ProductSchema } from '../../lib/schemas'
import { fetchWithRetry, htmlToMarkdown } from '../fetch-page'
import { llmJson } from '../llm'
import { DATA_DIR, readJson } from '../paths'
import { writeJson } from '../paths'

const CommunityItemsSchema = z.object({
  items: z.array(z.object({ url: z.string().url(), excerpt: z.string().min(10).max(400) })).min(5).max(20),
})

const SYSTEM = `You distill community discussion about a software product into evidence items.
Each item: a real user experience or claim from the discussion (praise, complaint, workaround, comparison), paraphrased tightly or quoted, max 400 chars, with the URL it came from.
Exclude marketing, vendor statements, and speculation. Cover both positives and negatives.
Return JSON: {"items":[{"url":"...","excerpt":"..."}]}`

async function hnCorpus(name: string): Promise<{ url: string; text: string }[]> {
  const search = JSON.parse(
    await fetchWithRetry(`https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(name)}&tags=story&hitsPerPage=5`),
  ) as { hits: { objectID: string; title: string; num_comments: number }[] }
  const out: { url: string; text: string }[] = []
  for (const hit of search.hits.filter((h) => h.num_comments > 0)) {
    const item = JSON.parse(await fetchWithRetry(`https://hn.algolia.com/api/v1/items/${hit.objectID}`)) as {
      title: string
      children: { text: string | null }[]
    }
    const comments = item.children
      .map((c) => (c.text ? htmlToMarkdown(c.text) : ''))
      .filter(Boolean)
      .slice(0, 30)
      .join('\n---\n')
    out.push({ url: `https://news.ycombinator.com/item?id=${hit.objectID}`, text: `# ${item.title}\n${comments}` })
  }
  return out
}

export async function runCollectCommunity({ product }: { product?: string }): Promise<void> {
  const products = readJson(ProductSchema.array(), path.join(DATA_DIR, 'products.json')).filter(
    (p) => !product || p.id === product,
  )
  if (products.length === 0) throw new Error(`unknown product: ${product}`)
  const seeds = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'seeds', 'community.json'), 'utf8')) as Record<string, string[]>

  for (const p of products) {
    const sources = await hnCorpus(`${p.name}`)
    for (const url of seeds[p.id] ?? []) {
      try {
        sources.push({ url, text: htmlToMarkdown(await fetchWithRetry(url)).slice(0, 20_000) })
      } catch (err) {
        console.warn(`collect-community: WARN seed ${url} failed: ${(err as Error).message}`)
      }
    }
    if (sources.length === 0) {
      console.warn(`collect-community: WARN no community sources found for ${p.id}; skipping`)
      continue
    }
    const corpus = sources.map((s) => `=== ${s.url} ===\n${s.text}`).join('\n\n').slice(0, 80_000)
    const { items } = await llmJson({
      schema: CommunityItemsSchema,
      system: SYSTEM,
      prompt: `Product: ${p.name}\n\nDiscussions:\n\n${corpus}`,
      maxTokens: 8192,
    })
    const now = new Date().toISOString()
    const community: Evidence[] = items.map((item, i) => ({
      id: `${p.id}-comm-${i + 1}`,
      tier: 'community',
      url: item.url,
      excerpt: item.excerpt,
      fetchedAt: now,
    }))
    const file = path.join(DATA_DIR, 'evidence', `${p.id}.json`)
    const existing = fs.existsSync(file) ? readJson(EvidenceSchema.array(), file) : []
    writeJson(file, [...existing.filter((e) => e.tier !== 'community'), ...community])
    console.log(`collect-community: ${p.id} → ${community.length} items from ${sources.length} sources`)
  }
}
```

- [ ] **Step 3: Type-check + live smoke test on one product**

Run: `pnpm tsc --noEmit 2>&1 | grep pipeline/stages/collect-community; pnpm pipeline collect-community --product omarchy`
Expected: no type errors for this file; `data/evidence/omarchy.json` now contains `omarchy-comm-*` items alongside the sample docs items. Inspect 2–3 excerpts for plausibility. Then restore the sample file for now: `git checkout data/evidence/omarchy.json` (real data lands in Task 16).

- [ ] **Step 4: Commit**

```bash
git add pipeline && git commit -m "feat: community evidence stage via HN Algolia and seeded URLs"
```

---

### Task 15: Judge stage

**Files:**
- Modify: `pipeline/stages/judge.ts` (replace stub)
- Create: `pipeline/__tests__/judge.test.ts`

**Interfaces:**
- Consumes: `llmJson`; data files; `CACHE_DIR`.
- Produces:
  - `PROMPT_VERSION` (exported const string, bump on any judge-prompt change — busts the cache).
  - `cellHash(story: Story, evidence: Evidence[], promptVersion: string): string` (exported, pure) — sha256 hex of the JSON of `{ storyId: story.id, title: story.title, evidence: evidence.map(e => [e.id, e.excerpt]), promptVersion }`.
  - `validateVerdictRules(verdict: Verdict, evidence: Evidence[]): string | null` (exported, pure) — returns an error string or null. Rules: non-none must cite ≥1 known id; `disputed` must cite evidence from ≥2 distinct tiers; `none` forces `quality` 0.
  - `runJudge({ product }): Promise<void>` — for each (product × story) cell: skip if `pipeline/cache/judge/{productId}/{storyId}.json` exists with matching hash; else call `llmJson` (verdict schema minus product/story ids, which are stamped on afterwards), apply `validateVerdictRules` (one corrective retry appending the rule violation to the prompt, then fail the stage), write cache `{ hash, verdict }`. After all cells: assemble `data/verdicts.json` from ALL cache files (every product, sorted by productId then storyId) and validate the full matrix is complete before writing.

- [ ] **Step 1: Write the failing tests for the pure parts**

`pipeline/__tests__/judge.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import type { Evidence, Story, Verdict } from '@/lib/schemas'
import { cellHash, validateVerdictRules } from '@/pipeline/stages/judge'

const story: Story = { id: 's1', persona: 'developer', title: 't', theme: 'core', weight: 2 }
const ev = (id: string, tier: Evidence['tier']): Evidence => ({
  id, tier, url: 'https://x.example/e', excerpt: 'q', fetchedAt: '2026-08-26T00:00:00Z',
})
const verdict = (over: Partial<Verdict>): Verdict => ({
  productId: 'p', storyId: 's1', verdict: 'full', quality: 8, confidence: 'high',
  rationale: 'r', evidenceIds: ['e1'], ...over,
})

describe('cellHash', () => {
  it('is stable and sensitive to evidence and prompt version', () => {
    const evidence = [ev('e1', 'claimed-docs')]
    const h1 = cellHash(story, evidence, 'v1')
    expect(h1).toBe(cellHash(story, [...evidence], 'v1'))
    expect(h1).not.toBe(cellHash(story, evidence, 'v2'))
    expect(h1).not.toBe(cellHash(story, [ev('e1', 'claimed-docs'), ev('e2', 'community')], 'v1'))
  })
})

describe('validateVerdictRules', () => {
  const evidence = [ev('e1', 'claimed-docs'), ev('e2', 'community')]

  it('accepts a clean verdict', () => {
    expect(validateVerdictRules(verdict({}), evidence)).toBeNull()
  })
  it('rejects citations of unknown evidence', () => {
    expect(validateVerdictRules(verdict({ evidenceIds: ['nope'] }), evidence)).toMatch(/unknown evidence/)
  })
  it('requires two tiers for disputed', () => {
    expect(validateVerdictRules(verdict({ verdict: 'disputed', evidenceIds: ['e1'] }), evidence)).toMatch(/two distinct tiers/)
    expect(validateVerdictRules(verdict({ verdict: 'disputed', evidenceIds: ['e1', 'e2'] }), evidence)).toBeNull()
  })
  it('forces quality 0 for none', () => {
    expect(validateVerdictRules(verdict({ verdict: 'none', quality: 3, evidenceIds: [] }), evidence)).toMatch(/quality 0/)
    expect(validateVerdictRules(verdict({ verdict: 'none', quality: 0, evidenceIds: [] }), evidence)).toBeNull()
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm test pipeline/__tests__/judge.test.ts`
Expected: FAIL — exports missing.

- [ ] **Step 3: Implement `pipeline/stages/judge.ts`**

```ts
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { z } from 'zod'
import {
  type Evidence, EvidenceSchema, ProductSchema, type Story, StorySchema,
  type Verdict, VerdictSchema,
} from '../../lib/schemas'
import { llmJson } from '../llm'
import { CACHE_DIR, DATA_DIR, readJson, writeJson } from '../paths'

export const PROMPT_VERSION = 'v1'

export function cellHash(story: Story, evidence: Evidence[], promptVersion: string): string {
  const payload = JSON.stringify({
    storyId: story.id,
    title: story.title,
    evidence: evidence.map((e) => [e.id, e.excerpt]),
    promptVersion,
  })
  return crypto.createHash('sha256').update(payload).digest('hex')
}

export function validateVerdictRules(verdict: Verdict, evidence: Evidence[]): string | null {
  const known = new Map(evidence.map((e) => [e.id, e]))
  for (const id of verdict.evidenceIds) {
    if (!known.has(id)) return `cites unknown evidence id "${id}"`
  }
  if (verdict.verdict !== 'none' && verdict.evidenceIds.length === 0) return 'non-none verdict must cite evidence'
  if (verdict.verdict === 'disputed') {
    const tiers = new Set(verdict.evidenceIds.map((id) => known.get(id)!.tier))
    if (tiers.size < 2) return 'disputed requires citations from at least two distinct tiers'
  }
  if (verdict.verdict === 'none' && verdict.quality !== 0) return 'none verdicts must have quality 0'
  return null
}

const RawVerdictSchema = VerdictSchema.innerType().omit({ productId: true, storyId: true })

const SYSTEM = `You are the judge in a product arena. Given ONE user story and ONE product's evidence pack, decide how well the product delivers that story.
Verdicts: "full" (clearly delivers), "partial" (delivers with significant caveats/extra tools), "none" (no evidence it delivers), "disputed" (vendor claims it but community/hands-on evidence contradicts — requires citing both sides).
quality: 0-10 how WELL it delivers (0 if none). confidence: high/medium/low based on evidence strength. rationale: 1-3 sentences. evidenceIds: cite the specific items you relied on (empty only for "none").
Judge ONLY from the evidence pack. Absence of evidence for a mainstream capability of a well-known product may still only ever yield "none" — do not use outside knowledge.
Return JSON: {"verdict":"...","quality":N,"confidence":"...","rationale":"...","evidenceIds":["..."]}`

function judgePrompt(productName: string, story: Story, evidence: Evidence[], extra = ''): string {
  const pack = evidence
    .map((e) => `[${e.id}] (${e.tier}) ${e.excerpt} — ${e.url}`)
    .join('\n')
  return `Product: ${productName}\n\nUser story: ${story.title}\n(persona: ${story.persona}, theme: ${story.theme})\n\nEvidence pack:\n${pack}\n${extra}`
}

export async function runJudge({ product }: { product?: string }): Promise<void> {
  const products = readJson(ProductSchema.array(), path.join(DATA_DIR, 'products.json'))
  const stories = readJson(StorySchema.array(), path.join(DATA_DIR, 'stories.json'))
  const targets = products.filter((p) => !product || p.id === product)
  if (targets.length === 0) throw new Error(`unknown product: ${product}`)

  for (const p of targets) {
    const evidence = readJson(EvidenceSchema.array(), path.join(DATA_DIR, 'evidence', `${p.id}.json`))
    for (const story of stories) {
      const cacheFile = path.join(CACHE_DIR, 'judge', p.id, `${story.id}.json`)
      const hash = cellHash(story, evidence, PROMPT_VERSION)
      if (fs.existsSync(cacheFile)) {
        const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf8')) as { hash: string }
        if (cached.hash === hash) continue
      }

      let raw = await llmJson({ schema: RawVerdictSchema, system: SYSTEM, prompt: judgePrompt(p.name, story, evidence) })
      let verdict: Verdict = { ...raw, productId: p.id, storyId: story.id }
      let violation = validateVerdictRules(verdict, evidence)
      if (violation) {
        raw = await llmJson({
          schema: RawVerdictSchema,
          system: SYSTEM,
          prompt: judgePrompt(p.name, story, evidence, `\nYour previous verdict violated a rule: ${violation}. Correct it.`),
        })
        verdict = { ...raw, productId: p.id, storyId: story.id }
        violation = validateVerdictRules(verdict, evidence)
        if (violation) throw new Error(`judge: ${p.id}:${story.id} still violates rules: ${violation}`)
      }
      writeJson(cacheFile, { hash, verdict })
      console.log(`judge: ${p.id}:${story.id} → ${verdict.verdict} q${verdict.quality}`)
    }
  }

  // Assemble verdicts.json from ALL cached cells (not just targets)
  const all: Verdict[] = []
  for (const p of products) {
    for (const story of stories) {
      const cacheFile = path.join(CACHE_DIR, 'judge', p.id, `${story.id}.json`)
      if (!fs.existsSync(cacheFile)) {
        console.warn(`judge: matrix incomplete — missing ${p.id}:${story.id}; not writing verdicts.json`)
        return
      }
      all.push(VerdictSchema.parse((JSON.parse(fs.readFileSync(cacheFile, 'utf8')) as { verdict: unknown }).verdict))
    }
  }
  all.sort((x, y) => x.productId.localeCompare(y.productId) || x.storyId.localeCompare(y.storyId))
  writeJson(path.join(DATA_DIR, 'verdicts.json'), all)
  console.log(`judge: wrote ${all.length} verdicts`)
}
```

Note: `VerdictSchema.innerType()` works because `VerdictSchema` is a `ZodEffects` wrapping the object; if the zod version in use lacks `innerType()` on the refined schema, define the base object schema separately in `lib/schemas.ts` as `VerdictBaseSchema` (export it), derive `VerdictSchema = VerdictBaseSchema.refine(...)`, and use `VerdictBaseSchema.omit(...)` here.

- [ ] **Step 4: Run to verify pass**

Run: `pnpm test pipeline/__tests__/judge.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add pipeline lib && git commit -m "feat: judge stage with content-hash caching and integrity rules"
```

---

### Task 16: Real pipeline run — replace sample data

Requires `ANTHROPIC_API_KEY` in the environment (`.env` is not auto-loaded by tsx; export it in the shell or use `set -a; source .env; set +a`).

**Files:**
- Modify (regenerated): `data/stories.json`, `data/evidence/*.json`, `data/verdicts.json`, `data/rankings.json`

**Interfaces:**
- Consumes: all pipeline stages.
- Produces: the real, committed v1 dataset. No `"SAMPLE:"` strings anywhere in `data/`.

- [ ] **Step 1: Crawl all products**

```bash
set -a; source .env; set +a
pnpm pipeline crawl
ls pipeline/cache/crawl/*/
```

Expected: ≥1 markdown file per product. If a macOS or Fedora page fails on bot detection, add an alternative URL (e.g. Wikipedia's feature list is NOT acceptable — prefer vendor pages; try `https://www.apple.com/macos/macos-tahoe/` style deep pages) to `products.json` `docs`/`changelog` and re-run for that product.

- [ ] **Step 2: Extract all products, then normalize**

```bash
pnpm pipeline extract
pnpm pipeline normalize
```

Expected: `data/stories.json` now has 25–50 canonical stories across ≥5 themes; skim titles for quality — every story must be product-neutral and concrete. If titles are vague ("As a user, I can use the system"), tighten the normalize SYSTEM prompt and re-run.

- [ ] **Step 3: Collect community evidence**

```bash
pnpm pipeline collect-community
```

Expected: each `data/evidence/{id}.json` gains `*-comm-*` items. Spot-check 3 excerpts against their URLs.

- [ ] **Step 4: (Optional, best-effort) add probe evidence**

If any hands-on checks were performed, append `probe`-tier items by hand to the relevant evidence file (ids `{productId}-probe-{n}`, url = a gist or repo doc describing the probe). Skip freely — v1 does not require probe items.

- [ ] **Step 5: Judge the full matrix and derive**

```bash
pnpm pipeline judge
pnpm pipeline derive
```

Expected: `judge: wrote N verdicts` where N = 4 × story-count; derive reports 6 battles. Sanity-read 5 random verdicts — rationale should reference actual evidence.

- [ ] **Step 6: Verify no sample data remains and everything passes**

```bash
! grep -r "SAMPLE:" data/
pnpm test && pnpm build
```

Expected: grep finds nothing; all tests pass (data tests validate the new dataset through `loadData`); build prerenders 11 pages.

- [ ] **Step 7: Commit the dataset**

```bash
git add data && git commit -m "data: first real judged dataset for the Desktop OS arena"
```

---

### Task 17: Deploy to Vercel

**Files:**
- Create: `vercel.json` (only if needed — default Next.js detection should suffice; prefer no file)

- [ ] **Step 1: Push to GitHub**

```bash
git push origin main
```

- [ ] **Step 2: Link and deploy**

```bash
pnpm dlx vercel link   # link to the judegomila account/project; accept defaults, project name "productarena"
pnpm dlx vercel deploy --prod
```

No environment variables are needed in Vercel — the site is fully static; `ANTHROPIC_API_KEY` is local-pipeline-only and must NOT be added to the Vercel project.

- [ ] **Step 3: Smoke-test production**

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://<deployment-url>/
curl -s -o /dev/null -w "%{http_code}\n" https://<deployment-url>/battle/macos-vs-omarchy
curl -s -o /dev/null -w "%{http_code}\n" https://<deployment-url>/product/omarchy
```

Expected: 200, 200, 200. (Use the real slugs from `data/rankings.json` battle order if product order changed.)

- [ ] **Step 4: Commit anything generated and push**

```bash
git add -A && git commit -m "chore: vercel deployment config" --allow-empty && git push
```

---

## Self-review notes (already applied)

- **Spec coverage:** schemas/data model (T2, T4), scoring rules (T3), pipeline CLI + all 6 stages (T5, T10–T15), integrity rules incl. disputed-two-tier (T6 loader, T15 judge), three page types (T7–T9), build-fails-on-bad-data (loadData at build time, T6–T9), tests-without-LLM-calls (T10 mocks, others pure), real dataset (T16), deploy (T17). Probe tier: schema-supported (T2), best-effort population (T16 step 4) — matches spec §8 deferral of automated probing.
- **Deviation (noted in Global Constraints):** evidence emission moved from crawl to extract; spec §7's "snapshot test of leaderboard and battle pages" is covered by the LeaderboardTable render test (T7) plus full static prerender of every page at build (T8/T9) — the build IS the render check for battle/product pages.
- **Type consistency:** `runCrawl/runExtract/runNormalize/runCollectCommunity/runJudge/runDerive` signatures match cli.ts dispatch; `battleSlug`/`parseBattleSlug` used consistently (products.json order, enforced in T7 caveat and T9 `idx()`); `Verdict`/`Evidence`/`Story` types flow from `lib/schemas.ts` everywhere.
