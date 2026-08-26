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
