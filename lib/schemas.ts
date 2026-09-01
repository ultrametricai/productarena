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
})

// Provenance of a story in the taxonomy: 'canonical' for the 28 ids injected verbatim by
// pipeline/agentic-stories.ts (never LLM-authored), 'normalized' for LLM-assembled stories
// (normalize.ts), 'contest' for stories ever added/adjusted via a contest issue, 'manual' for
// hand-edited entries. Optional and additive — never referenced by cellHash (see judge.ts),
// so stamping/backfilling it must never bust the judge cache.
export const StoryOriginSchema = z.object({
  kind: z.enum(['normalized', 'canonical', 'contest', 'manual']),
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
)

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

export type Category = z.infer<typeof CategorySchema>
export type Product = z.infer<typeof ProductSchema>
export type Story = z.infer<typeof StorySchema>
export type StoryOrigin = z.infer<typeof StoryOriginSchema>
export type Evidence = z.infer<typeof EvidenceSchema>
export type Verdict = z.infer<typeof VerdictSchema>
export type Stack = z.infer<typeof StackSchema>
export type Rankings = z.infer<typeof RankingsSchema>
export type BattleRecord = Rankings['battles'][number]
export type LeaderboardEntry = Rankings['leaderboard'][number]
