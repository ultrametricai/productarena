// The full audit trail behind one product's Overall score — the data spine of the per-vendor
// /arena/{cat}/product/{id}/score page ("the receipt"). For each of the five blend dimensions
// it lists exactly which stories feed it, each cell's verdict × quality × weight arithmetic and
// the evidence the judge cited, then reproduces the dimension score and the weighted PA blend
// with THIS product's numbers substituted. Everything here is a pure re-derivation from
// CategoryData through the same lib/scoring.ts primitives buildRankings uses — no second
// formula to drift. lib/__tests__/scoreBreakdown.test.ts asserts the recomputed numbers equal
// the published rankings.json entry, so the page is a standing determinism proof, not prose.
import type { CategoryData } from './data-helpers'
import type { Evidence, Story, Verdict } from './schemas'
import { AI_ERA_WEIGHTS, cellScore, computeAiEra, VERDICT_FACTORS, weightedPercent } from './scoring'

export type DimensionKey = keyof typeof AI_ERA_WEIGHTS

// Display names match the vendor-page pills (AgenticBadge/AiEraBadge labels), not the internal
// field names — "Built-in AI" is `agenticApp` internally, same index either way.
export const DIMENSION_LABELS: Record<DimensionKey, string> = {
  agentReady: 'Agent-ready',
  apiQuality: 'API quality',
  openness: 'Openness',
  agenticApp: 'Built-in AI',
  automation: 'Automation',
}

// One-line "what this axis measures" — the score page's per-section subtitle. The generic
// /methodology#ai-era carries the longer "why these axes, why these weights" argument.
export const DIMENSION_MEANINGS: Record<DimensionKey, string> = {
  agentReady: 'Outside-in: can YOUR agent reach and drive this product — API, MCP, CLI, headless runs, agent docs.',
  apiQuality: 'The programmable surface once an agent is there — machine-readable spec, interactive docs, sandbox, versioning discipline.',
  openness: 'Can you leave, inspect, or self-host — data export, open source, portability.',
  agenticApp: 'Inside-out: how agentic the product itself is for its users — built-in assistants, autonomous features.',
  automation: 'Depth of automation primitives — rules, scheduling, bulk operations, webhooks.',
}

// URL fragments for the /score page's per-dimension sections — the vendor-page pills deep-link
// to these (/score#agent-ready etc.), so treat them as public API and keep them stable.
export const DIMENSION_ANCHORS: Record<DimensionKey, string> = {
  agentReady: 'agent-ready',
  apiQuality: 'api-quality',
  openness: 'openness',
  agenticApp: 'built-in-ai',
  automation: 'automation',
}

// Which stories feed each dimension — the exact selectors buildRankings (lib/scoring.ts) uses:
// three group-scoped slices of the agenticness theme, plus two whole themes. The determinism
// test is the drift guard: if these ever diverge from buildRankings, the recomputed PA stops
// matching rankings.json and the suite fails.
const DIMENSION_STORIES: Record<DimensionKey, (s: Story) => boolean> = {
  agentReady: (s) => s.theme === 'agenticness' && s.group === 'agent-access',
  apiQuality: (s) => s.theme === 'agenticness' && s.group === 'api-quality',
  openness: (s) => s.theme === 'openness',
  agenticApp: (s) => s.theme === 'agenticness' && s.group === 'agentic-features',
  automation: (s) => s.theme === 'automation-depth',
}

// One (story, verdict) cell of a dimension's ledger, with its arithmetic pre-chewed so the page
// renders numbers it never computes itself: points = weight × quality × factor (lib/scoring.ts's
// cellScore), max = weight × 10 (a full-verdict, quality-10 cell). `na` cells carry points/max
// too, but the dimension sums exclude them entirely (numerator AND denominator — see
// weightedPercent), which the page must say out loud rather than render as a zero.
export interface BreakdownCell {
  story: Story
  verdict: Verdict
  factor: number
  points: number
  max: number
  // The evidence items the verdict cites, resolved in citation order — url + verbatim excerpt,
  // so every cell's points trace to something a reader can open. Empty only for none/na cells
  // (VerdictSchema requires ≥1 citation on everything else).
  evidence: Evidence[]
}

export interface DimensionBreakdown {
  key: DimensionKey
  label: string
  anchor: string
  weight: number
  cells: BreakdownCell[]
  // Σ points and Σ max over the non-na cells only — the exact fraction behind the score:
  // score = round1(numerator / denominator × 100), null when no cell is applicable.
  numerator: number
  denominator: number
  score: number | null
}

// One term of the PA blend equation, in AI_ERA_WEIGHTS order. Null-score terms are excluded
// from both the weighted sum and the total weight (computeAiEra's renormalization).
export interface BlendTerm {
  key: DimensionKey
  label: string
  anchor: string
  weight: number
  score: number | null
}

export interface ScoreBreakdown {
  productId: string
  dimensions: DimensionBreakdown[]
  blend: {
    terms: BlendTerm[]
    // Σ score×weight and Σ weight over the non-null terms — PA = round1(weightedSum/totalWeight).
    weightedSum: number
    totalWeight: number
    aiEra: number | null
  }
}

export function buildScoreBreakdown(data: CategoryData, productId: string): ScoreBreakdown {
  const verdictByStory = new Map(
    data.verdicts.filter((v) => v.productId === productId).map((v) => [v.storyId, v]),
  )
  // loadCategory already validated every citation resolves, so the lookup is total.
  const evidenceForProduct = new Map((data.evidence[productId] ?? []).map((e) => [e.id, e]))

  const dimensions = (Object.keys(AI_ERA_WEIGHTS) as DimensionKey[]).map((key): DimensionBreakdown => {
    const cells = data.stories.filter(DIMENSION_STORIES[key]).map((story): BreakdownCell => {
      const verdict = verdictByStory.get(story.id)
      if (!verdict) throw new Error(`missing verdict for cell ${productId}:${story.id}`)
      return {
        story,
        verdict,
        factor: VERDICT_FACTORS[verdict.verdict],
        points: cellScore(verdict, story),
        max: story.weight * 10,
        evidence: verdict.evidenceIds.map((id) => evidenceForProduct.get(id)!),
      }
    })
    const applicable = cells.filter((c) => c.verdict.verdict !== 'na')
    return {
      key,
      label: DIMENSION_LABELS[key],
      anchor: DIMENSION_ANCHORS[key],
      weight: AI_ERA_WEIGHTS[key],
      cells,
      numerator: applicable.reduce((sum, c) => sum + c.points, 0),
      denominator: applicable.reduce((sum, c) => sum + c.max, 0),
      // Recomputed through the same helper buildRankings used, so rounding matches exactly.
      score: weightedPercent(cells.map((c) => ({ verdict: c.verdict, story: c.story }))),
    }
  })

  const scoreOf = (key: DimensionKey) => dimensions.find((d) => d.key === key)!.score
  const terms: BlendTerm[] = dimensions.map((d) => ({
    key: d.key, label: d.label, anchor: d.anchor, weight: d.weight, score: d.score,
  }))
  const live = terms.filter((t) => t.score !== null)
  return {
    productId,
    dimensions,
    blend: {
      terms,
      weightedSum: live.reduce((sum, t) => sum + t.score! * t.weight, 0),
      totalWeight: live.reduce((sum, t) => sum + t.weight, 0),
      aiEra: computeAiEra({
        agentReady: scoreOf('agentReady'),
        apiQuality: scoreOf('apiQuality'),
        openness: scoreOf('openness'),
        agenticApp: scoreOf('agenticApp'),
        automation: scoreOf('automation'),
      }),
    },
  }
}
