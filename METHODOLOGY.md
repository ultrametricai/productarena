# INIT Methodology

The full methodology writeup — evidence tiers, judging, scoring, the INIT Score, story
provenance, re-judge stability, and bias disclosure. The on-site [/methodology](https://init.dog/methodology)
page is a tight one-screen summary of this document; this file is the source of truth. See also
[README.md](./README.md) for the arena list, data layout, and pipeline workflow, and
[CONTRIBUTING.md](./CONTRIBUTING.md) for how to contest a verdict.

## Evidence tiers

Every claim about a product is backed by an **evidence** item with one of four tiers, ranked
strongest first:

**`probe` (tested) > `github` (code) > `community` (independent) > `claimed-docs` (vendor claim)**

| Tier | What it is |
|---|---|
| `probe` | direct, hands-on observation of the product (tested) |
| `github` | README/repo content (code) |
| `community` | independent forums/reviews/social posts (independent) |
| `claimed-docs` | vendor site/docs/changelog copy (vendor claim) |

Evidence is stored per product at `data/{category}/evidence/{product}.json`, each item with a
stable id, tier, source URL, verbatim excerpt, and fetch timestamp (`fetchedAt`).

`lib/verification.ts`'s `strongestEvidence()` walks a verdict's cited evidence down this ladder
and returns the single best-supported item — the source behind every "proof ↗" link on the site
(product page verdict rows, story matrix cells, and battle round cards). It's a different,
finer-grained ranking than the coarser `verificationLevel` badge
(`tested`/`corroborated`/`vendor-claim`/`disputed`), which groups `github` in with `claimed-docs`
for display purposes.

`pnpm pipeline probe` runs a small set of keyless, hands-on checks per product and turns each
*definitive* result — positive or negative — into a `probe`-tier evidence item (ambiguous
results, e.g. a 403 from a WAF, produce no item rather than a guess): whether `/llms.txt`
resolves, whether the docs URL serves a `.md` variant, whether a conventional OpenAPI spec path
resolves, and whether the curated `links.mcp`/`links.cli` URLs are live.

## Judging

For every (product, story) pair, an LLM judge reads only that product's evidence pack for that
story and returns a **verdict**:

| Verdict | Meaning |
|---|---|
| `full` | Clearly delivers the story |
| `partial` | Delivers, with significant caveats or extra tooling required |
| `disputed` | Vendor claims it, but community/hands-on evidence contradicts — must cite both sides |
| `none` | No evidence it delivers (never used for capabilities that don't apply — see `na`) |
| `na` | The story's axis doesn't apply to this product at all (wrong-axis, e.g. an OS-install story for a SaaS API) |

Each verdict also carries a `quality` score (0–10, how *well* it delivers — 0 for `none`/`na`), a
`confidence` level, a short rationale, and the specific `evidenceIds` the judge relied on. The
judge is instructed to use **only** the evidence pack, never outside/training knowledge —
absence of evidence for a well-known capability still yields `none`, not a guess.

Verdicts are cached and keyed on a hash of `(storyId, story title, evidence ids+excerpts, prompt
version)`, so re-running `judge` is a no-op unless the story or evidence actually changed.

## Scoring formula

A cell's score is `story.weight × quality × verdictFactor`, where the verdict factor is
`full=1.0, partial=0.6, disputed=0.3, none=0, na=excluded`. A product's overall score (and each
per-theme score) is the weighted percentage across all **applicable** (non-`na`) cells:

```
score = 100 × Σ(cellScore) / Σ(story.weight × 10)   — over non-na cells only
```

`na` cells are excluded from both numerator and denominator entirely — they neither help nor
hurt a product's score. Head-to-head battles use the same per-cell scores: each story is a
"round" won by whichever product scores higher on it (ties are draws, `na` rounds are excluded),
and the overall battle winner is whoever wins more story-weight.

**Important:** scores measure **evidenced story coverage**, not absolute product quality. A
product with a thin crawl (fewer/weaker evidence items) will score lower even if it's
objectively excellent — the judge can only score what's in the evidence pack.

## The INIT Score (formerly the "AI-Era Index")

Every leaderboard entry carries an **INIT Score** — displayed on-site as `INIT {n}/100` — a
single number meant to answer "how ready is this product for a world where agents, not just
humans, are the primary users?" Internally it's still the `aiEra` field; only the display name
changed (the score, formula, and weights are identical to what shipped as the "AI-Era Index").
It's a weighted blend of five existing leaderboard components:

| Component | Weight | What it measures |
|---|---|---|
| `agentReady` | 0.30 | can an agent reach the product (API/CLI/MCP/webhooks/SDKs/docs) |
| `apiQuality` | 0.20 | how good is that API surface (docs, spec, versioning, sandbox) |
| `openness` | 0.20 | can you self-host, export your data, and read the source |
| `agenticApp` | 0.15 | does the product act agentically on its own behalf |
| `automation` | 0.15 | how deep are its rules/scheduling/bulk/versioned-automation primitives |

```
aiEra = Σ(component × weight) / Σ(weight)   — over non-null components only
```

Weights are renormalized over whichever components are non-null for a given product, so a
product missing one axis isn't penalized twice — once for the missing axis, once for a shrunken
blend. `aiEra` is `null` only when every component is null. The exact weights live in
`AI_ERA_WEIGHTS` in `lib/scoring.ts`. Leaderboards sort primarily by the INIT Score (nulls last,
ties broken by the coverage score).

**These weights are a starting position, not a verdict.** If you think the weighting is wrong,
[contest it via an issue](./CONTRIBUTING.md) — like every verdict on this site, the formula is
open to challenge.

## Story provenance

Every story in `data/{category}/stories.json` optionally carries an `origin` field
(`lib/schemas.ts`'s `StoryOriginSchema`) recording where it came from and when:

| `origin.kind` | Meaning |
|---|---|
| `canonical` | one of the 29 fixed agenticness/openness/automation-depth/privacy-posture stories (`pipeline/agentic-stories.ts`), injected verbatim into every category — never LLM-authored |
| `normalized` | assembled into the category's taxonomy by the LLM-driven `normalize` stage; carries the judge `promptVersion` in force at the time |
| `contest` | added or adjusted via a contest issue |
| `manual` | hand-edited |

`origin` is additive and never participates in `cellHash` (`pipeline/stages/judge.ts`) —
stamping or backfilling it can never invalidate the judge cache or change a verdict. Hover a
story title or matrix cell on any product page to see its origin in the tooltip (e.g.
"canonical" or "normalized · v2").

## Re-judge stability policy

Verdicts are cached on a hash of (story id, story title, evidence ids+excerpts, prompt version)
— re-running `judge` is a no-op unless the story or evidence actually changed. LLM judging still
has measurable re-roll variance (~9% of cells can change verdict or quality on a re-judge with
no relevant evidence change), so large re-judge waves are reviewed against the prior state and
pure churn is reverted under audited rules: applicability (`na`↔`none`) never flips without new
evidence, verdicts citing nothing new don't move close races, and negative mechanical probe
results only affect the story axis they actually test.

## Bias disclosure — the judge is an Anthropic model

The judge model is made by Anthropic, and the `ai-coding` arena includes Anthropic's own
product, Claude Code — a real conflict of interest. We ran an adversarial bias audit of every
`claude-code` verdict scored `full` in that arena, made corrections in both directions (one
against Claude Code's favor, one in favor of a competitor), and documented every cell with a
caveat. See [README.md](./README.md) §8 for the full writeup, including the specific cells
adjusted and why.

---

[MIT](./LICENSE) © 2026 Ultrametric Inc
