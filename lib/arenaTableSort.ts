// Pure sort logic for components/ArenaTable.tsx, kept out of the client component so it's
// testable without rendering React (Vitest, no jsdom needed) and so the component itself stays
// a thin view over this + React state.

export type ArenaTableColumn =
  | 'rank'
  | 'name'
  | 'initScore'
  | 'agentReady'
  | 'agenticApp'
  | 'apiQuality'
  | 'openness'
  | 'automation'
  | 'popularity'
  | 'claimsIntegrity'

export type SortDirection = 'asc' | 'desc'

export interface ArenaTableRow {
  productId: string
  name: string
  vendor: string
  initScore: number | null
  agentReady: number | null
  agenticApp: number | null
  apiQuality: number | null
  openness: number | null
  automation: number | null
  // GitHub star count backing the "Popularity" column — the one number both intuitive to sort
  // by and available across the widest swath of products (vs. npm/pypi downloads, which only a
  // curated few have). Null (not 0) for a product with no public signal at all — see
  // lib/popularity.ts's hasSignal, mirrored here so nulls sort last like every other column.
  popularity: number | null
  // Claims-integrity score (0–100) over the product's testable claims — verified count fully,
  // contradicted count doubly against; see lib/claimsIntegrity.ts for the formula. Null when
  // the product has no claims mapped to any story at all (nothing to score), sorting last like
  // every other null column here.
  claimsIntegrity: number | null
}

// Human-readable label for the live "Ranked by ___" strip. `rank` has no independent meaning
// to sort by (it's the output of sorting, not an input), so clicking its header falls back to
// the default Arena Score ordering — same label as `initScore`.
export const COLUMN_LABELS: Record<ArenaTableColumn, string> = {
  rank: 'Arena Score',
  name: 'product name',
  initScore: 'Arena Score',
  agentReady: 'AGENTREADYNESS',
  agenticApp: 'AGENTIC',
  apiQuality: 'API quality',
  openness: 'Openness',
  automation: 'Automation',
  popularity: 'Popularity',
  claimsIntegrity: 'claims integrity',
}

// Every numeric column defaults to descending (highest value first) the first time it's
// clicked; `name` defaults to ascending (A→Z) since "highest name" isn't meaningful.
export function defaultDirectionFor(column: ArenaTableColumn): SortDirection {
  return column === 'name' ? 'asc' : 'desc'
}

function compareNullableNumber(a: number | null, b: number | null, direction: SortDirection): number {
  // Nulls (no applicable evidence for this axis) always sort last, regardless of direction —
  // "we don't know" is never honestly "the best" or "the worst" value on an ascending sort.
  if (a === null && b === null) return 0
  if (a === null) return 1
  if (b === null) return -1
  return direction === 'desc' ? b - a : a - b
}

// The column a given ArenaTableColumn actually reads from a row (rank has no own field; it
// re-derives the default Arena Score order).
function fieldFor(column: ArenaTableColumn): keyof ArenaTableRow | null {
  if (column === 'rank') return 'initScore'
  if (column === 'name') return null
  return column
}

export function sortArenaRows(
  rows: ArenaTableRow[],
  column: ArenaTableColumn,
  direction: SortDirection,
): ArenaTableRow[] {
  const field = fieldFor(column)
  return [...rows].sort((a, b) => {
    if (field === null) {
      const cmp = a.name.localeCompare(b.name)
      return direction === 'desc' ? -cmp : cmp
    }
    return compareNullableNumber(a[field] as number | null, b[field] as number | null, direction)
  })
}

// Case-insensitive substring match over product name + vendor — the ArenaTable's text filter.
export function filterArenaRows(rows: ArenaTableRow[], query: string): ArenaTableRow[] {
  const q = query.trim().toLowerCase()
  if (q === '') return rows
  return rows.filter((r) => r.name.toLowerCase().includes(q) || r.vendor.toLowerCase().includes(q))
}
