import { z } from 'zod'

export const CategorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  personas: z.array(z.string().min(1)).min(1),
  themes: z.array(z.string().min(1)).optional(),
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
    extra: z.array(z.string().url()).optional(),
  }),
  logo: z.string().optional(),
  affiliation: z.string().optional(),
  links: z.object({
    app: z.string().url().optional(),
    api: z.string().url().optional(),
    cli: z.string().url().optional(),
    mcp: z.string().url().optional(),
  }).optional(),
  businessModel: z.object({
    models: z.array(z.string().min(1)).min(1),
    summary: z.string().min(10).max(240),
    url: z.string().url(),
  }).optional(),
  // Copy-pasteable install/try one-liners — curated only where a genuine OFFICIAL command
  // exists (see components/InstallCommands.tsx). `label` is a short kind like "npm", "brew",
  // "pip", "installer", "docker"; `command` is the exact vendor-documented one-liner (never a
  // paraphrase); `url` is the docs page that documents it. Absent entirely for SaaS-only
  // products with nothing to install (see METHODOLOGY.md).
  install: z.array(z.object({
    label: z.string().min(1),
    command: z.string().min(2),
    url: z.string().url().optional(),
  })).max(4).optional(),
  // YC batch code (e.g. "S22", "W23") for products verified — by website domain, never by name
  // alone — to be alumni of a Y Combinator batch (see pipeline/scripts/yc-cross-reference.ts and
  // data/yc-batches.json, the source of truth this field is stamped from). Display-only, like
  // PopularitySchema: never fed into scoring (lib/scoring.ts never imports it).
  ycBatch: z.string().regex(/^[WS]\d{2}$/, 'ycBatch must look like "S22" or "W23"').optional(),
})

// Provenance of a story in the taxonomy: 'canonical' for the 29 ids injected verbatim by
// pipeline/agentic-stories.ts (never LLM-authored), 'normalized' for LLM-assembled stories
// (normalize.ts, or the depth-mining pass's claims-derived stories — see
// pipeline/scripts/depth-mine.ts), 'mined' for stories distilled from demand-side signal (HN/
// community discussion) or an expert-buyer gap review (same script), 'contest' for stories
// ever added/adjusted via a contest issue, 'manual' for hand-edited entries. Optional and
// additive — never referenced by cellHash (see judge.ts), so stamping/backfilling it must
// never bust the judge cache.
export const StoryOriginSchema = z.object({
  kind: z.enum(['normalized', 'canonical', 'contest', 'manual', 'mined']),
  promptVersion: z.string().optional(),
  recordedAt: z.string().optional(),
})

export const StorySchema = z.object({
  id: z.string().min(1),
  persona: z.string().min(1),
  title: z.string().min(1),
  theme: z.string().min(1),
  group: z.string().min(1),
  weight: z.number().int().min(1).max(3),
  origin: StoryOriginSchema.optional(),
})

export const EvidenceSchema = z.object({
  id: z.string().min(1),
  tier: z.enum(['claimed-docs', 'github', 'community', 'probe']),
  url: z.string().url(),
  excerpt: z.string().min(1),
  fetchedAt: z.string().datetime(),
})

export const VerdictBaseSchema = z.object({
  productId: z.string().min(1),
  storyId: z.string().min(1),
  verdict: z.enum(['full', 'partial', 'none', 'disputed', 'na']),
  quality: z.number().min(0).max(10),
  confidence: z.enum(['high', 'medium', 'low']),
  rationale: z.string().min(1),
  evidenceIds: z.array(z.string().min(1)),
})

export const VerdictSchema = VerdictBaseSchema.refine(
  (v) => v.verdict === 'none' || v.verdict === 'na' || v.evidenceIds.length >= 1,
  { message: 'non-none verdicts must cite at least one evidenceId' },
).refine(
  (v) => v.verdict !== 'na' || v.quality === 0,
  { message: 'na verdicts must have quality 0' },
).refine(
  (v) => v.verdict !== 'none' || v.quality === 0,
  { message: 'none verdicts must have quality 0' },
)

// A vendor CLAIM extracted from a product's own claimed-docs/github evidence (see
// pipeline/stages/claims.ts) — distinct from a Verdict, which is our judge's assessment of
// whether the claim actually holds up. `quote` is always copied verbatim from the cited
// evidence item's own excerpt (never LLM-paraphrased), so every claim is traceable byte-for-byte
// back to something the vendor's own materials said. `storyIds` maps this claim onto the
// category's story taxonomy — empty when no story covers the claimed capability, which is
// itself a signal: a taxonomy gap worth surfacing (see lib/claims.ts's claimStatus /
// "claims outside our story set" on the product page), not an error.
export const ClaimSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1).max(160),
  quote: z.string().min(1).max(240),
  url: z.string().url(),
  sourceTier: z.enum(['claimed-docs', 'github']),
  storyIds: z.array(z.string().min(1)),
  extractedAt: z.string().datetime(),
})

// data/{cat}/claims/{productId}.json shape: at most 60 distinct capability claims per product
// (see pipeline/stages/claims.ts's SYSTEM prompt — the LLM consolidates near-duplicate evidence
// into one claim per distinct capability, so this cap is a content limit, not a truncation).
export const ClaimsArraySchema = ClaimSchema.array().min(0).max(60)

export const StackSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  productIds: z.array(z.string().min(1)).min(2),
})

export const RankingsSchema = z.object({
  generatedAt: z.string().datetime(),
  leaderboard: z.array(
    z.object({
      productId: z.string().min(1),
      score: z.number().min(0).max(100),
      agentReady: z.number().min(0).max(100).nullable(),
      agenticApp: z.number().min(0).max(100).nullable(),
      apiQuality: z.number().min(0).max(100).nullable(),
      aiEra: z.number().min(0).max(100).nullable(),
      applicable: z.number().int().min(0),
      total: z.number().int().min(0),
      themeScores: z.record(z.string(), z.number().min(0).max(100).nullable()),
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
          winner: z.enum(['a', 'b', 'draw', 'na']),
          margin: z.number().min(0),
        }),
      ),
    }),
  ),
})

// Keyless popularity/momentum signal for one product (see pipeline/stages/popularity.ts). Every
// field is optional because coverage depends entirely on what's discoverable without an API
// key: GitHub fields only for products with urls.github, npm/pypi fields only for products
// mapped in pipeline/popularity-packages.json. This is a *display-only* signal — never fed into
// scoring (see lib/scoring.ts, which never imports this schema) — so it stays lenient rather
// than mirroring VerdictSchema's strictness.
export const PopularitySchema = z.object({
  stars: z.number().int().min(0).optional(),
  starsPerYear: z.number().min(0).optional(),
  forks: z.number().int().min(0).optional(),
  openIssues: z.number().int().min(0).optional(),
  daysSincePush: z.number().min(0).optional(),
  npmWeekly: z.number().int().min(0).optional(),
  pypiWeekly: z.number().int().min(0).optional(),
  fetchedAt: z.string().datetime(),
})

// data/{cat}/popularity.json shape: productId -> Popularity. A product absent from the map has
// no public signals at all (not "zero" — genuinely unknown), which display code must render as
// muted/absent rather than as a zero value.
export const PopularityMapSchema = z.record(z.string(), PopularitySchema)

// Multi-judge uncertainty result for one decisive cell — see pipeline/scripts/uncertainty-pass.ts.
// Only computed for cells belonging to a "close race" arena (the #1 and #2 leaderboard products
// within 3.0 Arena Score points of each other) on their agenticness-theme cells (agent-access,
// agentic-features, api-quality groups — the axes that actually move the Arena Score). `judgments`
// is exactly 3 independently-sampled verdict tiers for the SAME (productId, storyId) cell: the
// tier already cached in verdicts.json plus two fresh re-judgments against the same evidence
// pack. `agreement` is how many of those 3 agree with the plurality tier — '3/3' means the judge
// is stable on this cell, '2/3' or '1/3' flags real judge noise worth treating with suspicion.
export const UncertaintyEntrySchema = z.object({
  productId: z.string().min(1),
  storyId: z.string().min(1),
  judgments: z.array(VerdictBaseSchema.shape.verdict).length(3),
  agreement: z.enum(['1/3', '2/3', '3/3']),
})

// data/{cat}/uncertainty.json shape: an array of UncertaintyEntry, one per decisive cell that
// was re-judged. Entirely optional/additive — see lib/data.ts's tolerant-optional load — most
// categories (not a "close race") will have no uncertainty.json at all, and even a qualifying
// category only covers its decisive cells, not the full matrix.
export const UncertaintyArraySchema = UncertaintyEntrySchema.array()

// data/yc-map.json shape: one entry per modern-batch (W23–S26) YC company, distilled from the
// yc-oss/api mirror of YC's public directory (see pipeline/scripts/yc-fetch.ts) plus an
// LLM-assigned arena mapping (see pipeline/scripts/yc-classify.ts). `mappedArena` is an existing
// categories.json id the company genuinely competes in; `proposedArena` is a kebab-case name for
// a new arena it clusters with peers under; a company can have at most one of the two set (never
// both), and both null means "not a software product ranked meaningfully here" (hardware,
// biotech, services, marketplaces — see METHODOLOGY.md).
export const YcCompanySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  batch: z.string().min(1),
  website: z.string().url(),
  oneLiner: z.string(),
  tags: z.array(z.string()),
  mappedArena: z.string().min(1).nullable(),
  proposedArena: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'proposedArena must be kebab-case').nullable(),
}).refine((c) => !(c.mappedArena && c.proposedArena), {
  message: 'a company cannot have both mappedArena and proposedArena set',
})

export const YcMapSchema = YcCompanySchema.array()

export type Category = z.infer<typeof CategorySchema>
export type Product = z.infer<typeof ProductSchema>
export type Story = z.infer<typeof StorySchema>
export type StoryOrigin = z.infer<typeof StoryOriginSchema>
export type Evidence = z.infer<typeof EvidenceSchema>
export type Popularity = z.infer<typeof PopularitySchema>
export type UncertaintyEntry = z.infer<typeof UncertaintyEntrySchema>
export type Verdict = z.infer<typeof VerdictSchema>
export type Claim = z.infer<typeof ClaimSchema>
export type Stack = z.infer<typeof StackSchema>
export type YcCompany = z.infer<typeof YcCompanySchema>
export type Rankings = z.infer<typeof RankingsSchema>
export type BattleRecord = Rankings['battles'][number]
export type LeaderboardEntry = Rankings['leaderboard'][number]
