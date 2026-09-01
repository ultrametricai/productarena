import type { CategoryData } from './data'

// "Evidence as of {date}" — the most recent evidence.fetchedAt timestamp backing a product (or,
// for the category-wide figure, backing any product in the category). Deliberately not
// rankings.generatedAt: that's when scores were last computed, not when the underlying evidence
// was last refreshed — the two can drift apart between an evidence-only pipeline run and a
// derive run.
function maxFetchedAt(items: Array<{ fetchedAt: string }>): string | null {
  let max: string | null = null
  for (const item of items) {
    if (max === null || item.fetchedAt > max) max = item.fetchedAt
  }
  return max
}

function toDateOnly(iso: string): string {
  return iso.slice(0, 10)
}

// Most recent evidence.fetchedAt for one product, formatted YYYY-MM-DD. Null if the product has
// no evidence at all (shouldn't happen for a populated category, but evidence packs can be
// empty during a partial pipeline run).
export function productFreshness(data: CategoryData, productId: string): string | null {
  const items = data.evidence[productId] ?? []
  const max = maxFetchedAt(items)
  return max ? toDateOnly(max) : null
}

// Most recent evidence.fetchedAt across every product in the category, formatted YYYY-MM-DD.
export function categoryFreshness(data: CategoryData): string | null {
  const max = maxFetchedAt(Object.values(data.evidence).flat())
  return max ? toDateOnly(max) : null
}
