// "Alternatives to <X>" data (app/alternatives/[product]/page.tsx): X's arena rivals in
// leaderboard order, each with its top story-level wins over X taken from the already-derived
// battle rounds (never recomputed here), plus a small set of cross-arena "adjacent" products
// for buyers shopping a neighboring category. Pure and `node:fs`-free, same contract as
// lib/data-helpers.ts: callers pass CategoryData / CategoryData[] (usually via loadAll()),
// tests pass fixtures.
import { battleSlug, stripPersonaPrefix, type CategoryData } from './data-helpers'
import type { LeaderboardEntry, Product } from './schemas'

// The canonical lens themes injected into EVERY arena (see pipeline/agentic-stories.ts):
// shared by construction, so they carry zero adjacency signal and are excluded from the
// shared-theme count below. Domain themes (pricing-limits, dev-experience, onboarding, …)
// are what make two arenas genuinely adjacent.
const UNIVERSAL_THEMES: ReadonlySet<string> = new Set([
  'agenticness',
  'automation-depth',
  'openness',
  'privacy-posture',
])

export interface RivalWin {
  storyId: string
  /** Persona-stripped story title, ready for display. */
  title: string
  /** Weighted cell-score margin of the round (see pipeline derive) — bigger = clearer win. */
  margin: number
}

export interface Rival {
  product: Product
  entry: LeaderboardEntry
  /** 1-based leaderboard rank within the arena (including X itself). */
  rank: number
  /** Top story-level wins over X, widest margin first (at most `maxWins`). */
  wins: RivalWin[]
  /** Slug for the /vs/[slug] battle page covering this pair. */
  battleSlug: string
}

// A product id can (rarely) be ranked in two arenas — e.g. `square` in both payments and
// mobile-payments. Same deterministic rule as scripts/generate-badges.mjs: the first category
// (categories.json / loadAll order) owns the id.
export function findProductArena(
  categories: CategoryData[],
  productId: string,
): { data: CategoryData; product: Product } | null {
  for (const data of categories) {
    const product = data.products.find((p) => p.id === productId)
    if (product) return { data, product }
  }
  return null
}

// X's arena rivals in leaderboard order (X itself excluded), each with its top `maxWins`
// story-level wins over X pulled from the pair's battle rounds. A rival with no winning
// rounds gets `wins: []` — honest, not an error: it simply never beats X on any story.
export function rivalsFor(data: CategoryData, productId: string, maxWins = 2): Rival[] {
  const titleOf = new Map(data.stories.map((s) => [s.id, stripPersonaPrefix(s.title)]))
  const productById = new Map(data.products.map((p) => [p.id, p]))

  return data.rankings.leaderboard
    .map((entry, i) => ({ entry, rank: i + 1 }))
    .filter(({ entry }) => entry.productId !== productId)
    .flatMap(({ entry, rank }) => {
      const product = productById.get(entry.productId)
      if (!product) return []
      const battle = data.rankings.battles.find(
        (b) =>
          (b.a === productId && b.b === entry.productId) ||
          (b.a === entry.productId && b.b === productId),
      )
      const rivalSide = battle ? (battle.a === entry.productId ? 'a' : 'b') : null
      const wins = battle
        ? battle.rounds
            .filter((r) => r.winner === rivalSide)
            .sort((x, y) => y.margin - x.margin)
            .slice(0, maxWins)
            .map((r) => ({ storyId: r.storyId, title: titleOf.get(r.storyId) ?? r.storyId, margin: r.margin }))
        : []
      return [{
        product,
        entry,
        rank,
        wins,
        battleSlug: battle ? battleSlug(battle.a, battle.b) : battleSlug(productId, entry.productId),
      }]
    })
}

// Non-universal theme names present in an arena's story taxonomy.
export function domainThemes(data: CategoryData): Set<string> {
  return new Set(data.stories.map((s) => s.theme).filter((t) => !UNIVERSAL_THEMES.has(t)))
}

export interface AdjacentProduct {
  categoryId: string
  categoryName: string
  product: Product
  entry: LeaderboardEntry
  /** The domain themes this arena shares with X's arena (≥2 by construction). */
  sharedThemes: string[]
}

// Cross-arena "adjacent" products: the top-ranked product of every OTHER arena whose story
// taxonomy shares ≥2 non-universal theme names with X's arena, strongest overlap first,
// capped. Deliberately simple — a buyer browsing payments alternatives may really be shopping
// mobile-payments, not a rigorous similarity model.
export function adjacentProducts(
  categories: CategoryData[],
  data: CategoryData,
  productId: string,
  cap = 3,
): AdjacentProduct[] {
  const baseThemes = domainThemes(data)
  const out: Array<AdjacentProduct & { overlap: number }> = []
  for (const other of categories) {
    if (other.category.id === data.category.id) continue
    const shared = [...domainThemes(other)].filter((t) => baseThemes.has(t)).sort()
    if (shared.length < 2) continue
    // Skip X itself when the same product id is ranked in the adjacent arena too.
    const entry = other.rankings.leaderboard.find((e) => e.productId !== productId)
    const product = entry && other.products.find((p) => p.id === entry.productId)
    if (!entry || !product) continue
    out.push({
      categoryId: other.category.id,
      categoryName: other.category.name,
      product,
      entry,
      sharedThemes: shared,
      overlap: shared.length,
    })
  }
  return out
    .sort((a, b) => b.overlap - a.overlap || a.categoryId.localeCompare(b.categoryId))
    .slice(0, cap)
    .map(({ overlap: _overlap, ...rest }) => rest)
}
