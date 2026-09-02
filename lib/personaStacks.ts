import { verdictFor, type CategoryData } from './data'
import { weightedPercent } from './scoring'

export interface PersonaStackRanking {
  productId: string
  score: number
}

export interface PersonaStackResult {
  persona: string
  /** Number of stories in this category written for this persona. */
  storyCount: number
  winner: PersonaStackRanking | null
  runnerUp: PersonaStackRanking | null
}

// Honest v1 of "best stack by user type": for one persona, rank products by their
// persona-weighted coverage — weightedPercent (see lib/scoring.ts) restricted to only that
// persona's stories. The top product is "best for {persona}" in this category; the second is
// the runner-up. Products with zero applicable cells for the persona (all na, or no verdicts at
// all if the story set is empty) are excluded rather than ranked with a fabricated 0 — a
// missing score is different from an earned zero.
//
// Deliberately NOT the same thing as a "stack" in lib/stacks.ts (composed best-of-N coverage
// across curated productIds) — this composes across STORIES for one persona, picking the best
// single PRODUCT, not a multi-product bundle. The name is shared with the spec's "best stack by
// user type" framing, not with the Stack schema.
export function personaStacks(data: CategoryData, persona: string): PersonaStackResult {
  const stories = data.stories.filter((s) => s.persona === persona)
  if (stories.length === 0) {
    return { persona, storyCount: 0, winner: null, runnerUp: null }
  }

  const rankings = data.products
    .map((product) => {
      const cells = stories.map((story) => ({ verdict: verdictFor(data, product.id, story.id), story }))
      const score = weightedPercent(cells)
      return score === null ? null : { productId: product.id, score }
    })
    .filter((r): r is PersonaStackRanking => r !== null)
    .sort((a, b) => b.score - a.score)

  return {
    persona,
    storyCount: stories.length,
    winner: rankings[0] ?? null,
    runnerUp: rankings[1] ?? null,
  }
}

// One PersonaStackResult per persona declared on the category (data.category.personas),
// in the order they're declared there — not alphabetical, so category authors control display
// order (e.g. put the most central persona first).
export function allPersonaStacks(data: CategoryData): PersonaStackResult[] {
  return data.category.personas.map((persona) => personaStacks(data, persona))
}
