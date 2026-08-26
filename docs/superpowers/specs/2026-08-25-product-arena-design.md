# Product Arena — Design Spec

**Date:** 2026-08-25
**Status:** Approved design, pre-implementation

## 1. Overview

Product Arena is a website that ranks competing software products within a category by comparing their **user stories** — what a user can actually accomplish with each product — backed by collected evidence and judged by an LLM.

**v1 scope:** one category, done well — **Desktop OS**, with four products: **macOS, Omarchy, Ubuntu, Fedora**. The system is built so more categories and products can be added later, but v1 ships only this arena.

**Core mechanic (Approach C — judged matrix, derived battles):**
1. Scan each product's materials and extract its user stories.
2. Normalize all products' stories into one canonical story taxonomy for the category.
3. An LLM judge scores each *(product, story)* cell independently against an evidence pack: a verdict, a 0–10 quality score, a rationale, and citations.
4. Battles and rankings are **derived deterministically** from the cell matrix — no extra LLM calls. For any pair of products, comparing their cell scores story-by-story yields round wins/losses/draws and an overall winner; weighted coverage yields the leaderboard.

This keeps LLM cost linear (products × stories), makes every verdict citable, and means adding a fifth product later requires judging only one new column — all its battles materialize for free.

## 2. Architecture

One repository, two halves:

- **`pipeline/`** — TypeScript scripts run locally via a CLI (`pnpm pipeline <stage>`). Uses the Claude API for extraction, normalization, and judging; plain `fetch` + HTML→markdown conversion for crawling. Never deployed.
- **Next.js app** (App Router, TypeScript, Tailwind CSS) deployed to **Vercel**, fully static (SSG). Reads committed JSON from **`data/`** at build time. No database, no server runtime, no auth.

**Refresh model:** re-run pipeline stages → data files change → commit → push → Vercel redeploys. Raw crawl caches live in `pipeline/cache/` and are gitignored; only structured evidence excerpts and derived data are committed.

### Repository layout

```
productarena/
├── app/                  # Next.js App Router pages
├── components/           # React components
├── lib/                  # data loading + zod schemas (shared with pipeline)
├── data/                 # committed JSON — the product of the pipeline
│   ├── category.json
│   ├── products.json
│   ├── stories.json
│   ├── evidence/{productId}.json
│   ├── verdicts.json
│   └── rankings.json
├── pipeline/
│   ├── cli.ts            # entry: pnpm pipeline <stage> [--product id]
│   ├── stages/           # crawl, extract, normalize, collect-community, judge, derive
│   ├── cache/            # gitignored raw crawl output + LLM caches
│   └── fixtures/         # recorded LLM responses for tests
└── docs/superpowers/specs/
```

## 3. Data model

All files in `data/` are validated by zod schemas in `lib/schemas.ts`, shared by the pipeline (write side) and the app (read side). The Next.js build validates all data and **fails the build** on invalid data.

### `category.json`
```jsonc
{
  "id": "desktop-os",
  "name": "Desktop OS",
  "description": "...",
  "personas": ["developer", "designer", "switcher", "power-user"]
}
```

### `products.json`
```jsonc
[{
  "id": "omarchy",
  "name": "Omarchy",
  "vendor": "37signals / DHH",
  "type": "oss",              // "oss" | "commercial"
  "urls": {
    "site": "https://omarchy.org/",
    "docs": "...",
    "changelog": "...",
    "github": "..."           // optional
  }
}]
```

### `stories.json` — the canonical taxonomy
~30–50 stories for the category, produced by the normalize stage and then mostly stable.
```jsonc
[{
  "id": "keyboard-tiling",
  "persona": "developer",
  "title": "As a developer, I can tile and manage windows entirely from the keyboard",
  "theme": "window-management",  // e.g. install-setup, window-management,
                                 // app-ecosystem, dev-experience,
                                 // customization, privacy, hardware-support
  "weight": 2                    // 1–3, importance within the category
}]
```

### `evidence/{productId}.json`
```jsonc
[{
  "id": "omarchy-ev-014",
  "tier": "claimed-docs",   // "claimed-docs" | "github" | "community" | "probe"
  "url": "https://...",
  "excerpt": "verbatim quote or tight summary of the source passage",
  "fetchedAt": "2026-08-25T00:00:00Z"
}]
```
The **probe** tier (hands-on testing) is schema-supported from day one but populated best-effort in v1 as structured probe notes; automated VM probing is explicitly out of scope for v1.

### `verdicts.json` — one cell per (product × story)
```jsonc
[{
  "productId": "omarchy",
  "storyId": "keyboard-tiling",
  "verdict": "full",          // "full" | "partial" | "none" | "disputed"
                              // disputed = claimed by vendor, refuted by community/probe
  "quality": 9,               // 0–10, how well it delivers the story
  "confidence": "high",       // "high" | "medium" | "low"
  "rationale": "1–3 sentences",
  "evidenceIds": ["omarchy-ev-014", "omarchy-ev-031"]
}]
```

### `rankings.json` — derived, pure math, no LLM
```jsonc
{
  "generatedAt": "...",
  "leaderboard": [{
    "productId": "omarchy",
    "score": 71.4,            // weighted coverage: Σ(weight × quality × verdictFactor) normalized to 0–100
    "themeScores": { "window-management": 92.0, "...": 0 }
  }],
  "battles": [{
    "a": "macos", "b": "omarchy",
    "winner": "macos",        // or "draw"
    "record": { "aWins": 18, "bWins": 12, "draws": 11 },
    "rounds": [{ "storyId": "keyboard-tiling", "winner": "b", "margin": 3 }]
  }]
}
```

**Scoring rules (derive stage):**
- Cell score = `weight × quality × verdictFactor`, with verdictFactor: full = 1.0, partial = 0.6, disputed = 0.3, none = 0.
- Product score = sum of cell scores ÷ maximum possible, × 100.
- Battle round: higher cell score wins; equal (within a margin threshold of 0) is a draw. Battle winner = more round wins, weighted by story weight.

## 4. Pipeline

Each stage is a resumable CLI step: `pnpm pipeline <stage> [--product <id>]`. Stages write per-product files where possible so a failure never loses other products' progress. Every LLM call output is zod-validated; on validation failure the schema error is fed back to the model for a bounded number of retries, then the stage fails loud.

1. **crawl** — fetch each product's configured URLs (marketing site, docs, changelog) and GitHub README/docs via the GitHub API for OSS products. Store raw markdown in `pipeline/cache/` (gitignored); emit `claimed-docs` and `github` tier evidence excerpts into `data/evidence/`.
2. **extract** — LLM reads a product's own crawled materials and emits candidate user stories (persona + title + supporting quote).
3. **normalize** — LLM merges all products' candidate stories into the canonical `stories.json` taxonomy: dedupes, assigns themes and weights, keeps ~30–50 stories. Run once at setup; afterwards it proposes additions rather than rewriting (taxonomy stability protects verdict cache validity).
4. **collect-community** — pull discussion and review content (HN, Reddit, review threads) from a seeded list of search/thread URLs per product; emit `community` tier evidence.
5. **judge** — for each (product, story) cell, assemble the evidence pack (all tiers) and ask the LLM judge for verdict/quality/confidence/rationale/citations. Judge prompt requires citing evidenceIds and instructs that vendor claims contradicted by community/probe evidence yield `disputed`. Cells are **cached by a content hash of (story, evidence pack, prompt version)** so re-runs only judge changed cells.
6. **derive** — pure TypeScript computing `rankings.json` per the scoring rules above. No LLM.

## 5. Web app

Three page types, all statically generated:

- **`/`** — the Desktop OS arena leaderboard: ranked products with overall score bars, per-theme breakdown, and links to battles and profiles. (v1 has one category, so the homepage *is* the arena; a `/arena/[category]` structure is deferred until a second category exists.)
- **`/battle/[a]-vs-[b]`** — head-to-head page for each of the 6 pairings: overall winner and record, round-by-round story verdicts side by side, each round expandable to show rationale and evidence citations (linking out to sources).
- **`/product/[id]`** — product profile: coverage by theme, its story verdicts, evidence tier breakdown.

Explicit v1 non-goals: per-story pages, visitor voting, search, category browsing, automated refresh.

## 6. Error handling

- **Pipeline:** zod validation on every LLM output with schema-error feedback retries (bounded); network fetches retried with backoff; every stage idempotent and resumable; failures exit non-zero with the offending product/cell named.
- **App/build:** `data/` is validated at build time — invalid or mutually inconsistent data (e.g. a verdict citing a missing evidenceId, a battle referencing an unknown product) fails the Vercel build rather than deploying.
- **Judge integrity:** verdicts must cite at least one evidenceId that exists; `disputed` requires evidence from ≥2 tiers.

## 7. Testing

- **Unit tests** for the derive stage: scoring math, verdict factors, battle records, edge cases (all-none products, ties) — pure functions, fully deterministic.
- **Schema tests:** fixtures of valid/invalid data files against the zod schemas; referential-integrity checks (verdict→evidence, battle→product).
- **LLM stages:** tested against recorded fixture responses in `pipeline/fixtures/` — no live API calls in tests.
- **App:** render/snapshot test of leaderboard and battle pages from fixture data.

## 8. Out of scope for v1 (deferred)

- Additional categories (Mercury vs Brex, Linear vs Asana, Firecrawl vs competitors) — the data model already supports them.
- Visitor voting / community verdict feedback.
- Automated hands-on probing (VM automation).
- In-app/scheduled pipeline refresh (would require a DB and background jobs).
- Per-story pages, search, category index.
