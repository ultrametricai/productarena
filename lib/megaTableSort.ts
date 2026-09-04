// Pure sort/filter logic for components/MegaTable.tsx — the homepage's single global,
// sortable/filterable table over every product in every arena (see lib/megaTable.ts for the
// server-side row builder). Split out the same way lib/arenaTableSort.ts is split from
// ArenaTable.tsx: testable without rendering React, and keeps the client component a thin view.

export type MegaTableColumn =
  | 'rank'
  | 'name'
  | 'arena'
  | 'initScore'
  | 'agentReady'
  | 'agenticApp'
  | 'apiQuality'
  | 'popularity'

export type SortDirection = 'asc' | 'desc'

export interface MegaTableAccessGlyph {
  char: string
  className: string
  title: string
  // Internal link to the story section on the product page that this glyph's verdict (and its
  // evidence) lives on — the glyph is a citation, so clicking it goes to the receipts.
  href: string
}

export interface MegaTableRow {
  productId: string
  name: string
  vendor: string
  type: 'oss' | 'commercial'
  arenaId: string
  arenaName: string
  hasLogo: boolean
  // Blended Arena Score (see AiEraBadge) — kept as `initScore` for naming parity with
  // lib/arenaTableSort.ts's ArenaTableRow.
  initScore: number | null
  agentReady: number | null
  agenticApp: number | null
  apiQuality: number | null
  // True when every api-quality cell for this product is a zero-evidence none/na — i.e. we
  // never found (or probed) anything either way, so the honest render is "untested", not "0".
  apiUntested: boolean
  // GitHub star count — see lib/arenaTableSort.ts's ArenaTableRow.popularity doc.
  popularity: number | null
  // Verified YC batch code (e.g. "S22") — see lib/schemas.ts's ProductSchema.ycBatch doc. Optional
  // (not `| null`, unlike popularity) so existing MegaTableRow fixtures/callers built before this
  // field existed stay valid without every one needing an update.
  ycBatch?: string
  // 30-day Arena Score trend delta (see lib/scoreTrend.ts's trendDelta) — null when the product
  // has <2 history points yet; optional for the same fixture-compat reason as ycBatch. Rendered
  // as the ▲/▼/— arrow next to the Arena Score badge, never sorted on.
  trendDelta?: number | null
  // 30-day agent-readiness trend delta — same contract as trendDelta, rendered as the arrow in
  // the Agent-ready column ("is this product getting more agent-friendly?").
  agentReadyTrendDelta?: number | null
  // Score-confidence summary (see lib/confidence.ts): grade + the fractions behind it, rendered
  // as the small chip next to the Arena Score badge. Optional for the same fixture-compat
  // reason as ycBatch.
  confidence?: import('./confidence').ProductConfidence
  access: { MCP: MegaTableAccessGlyph; CLI: MegaTableAccessGlyph; API: MegaTableAccessGlyph }
}

// AGENTREADYNESS is this table's whole reason for existing (a cross-arena "can your agent even
// reach this product" view), so it — not the per-row Arena Score — is both the default sort
// column and what `rank` re-derives when no other sort is active.
export const DEFAULT_COLUMN: MegaTableColumn = 'agentReady'
export const DEFAULT_DIRECTION: SortDirection = 'desc'

export const COLUMN_LABELS: Record<MegaTableColumn, string> = {
  rank: 'AGENTREADYNESS',
  name: 'product name',
  arena: 'arena',
  initScore: 'Arena Score',
  agentReady: 'AGENTREADYNESS',
  agenticApp: 'AGENTIC',
  apiQuality: 'API quality',
  popularity: 'Popularity',
}

export function defaultDirectionFor(column: MegaTableColumn): SortDirection {
  return column === 'name' || column === 'arena' ? 'asc' : 'desc'
}

function compareNullableNumber(a: number | null, b: number | null, direction: SortDirection): number {
  // Nulls (no applicable evidence for this axis) always sort last, regardless of direction.
  if (a === null && b === null) return 0
  if (a === null) return 1
  if (b === null) return -1
  return direction === 'desc' ? b - a : a - b
}

type StringField = 'name' | 'arenaName'
type NumericField = 'initScore' | 'agentReady' | 'agenticApp' | 'apiQuality' | 'popularity'

function stringFieldFor(column: MegaTableColumn): StringField | null {
  if (column === 'name') return 'name'
  if (column === 'arena') return 'arenaName'
  return null
}

// The column a given MegaTableColumn actually reads from a row (rank has no own field; it
// re-derives the default AGENTREADYNESS order).
const NUMERIC_FIELDS: Record<MegaTableColumn, NumericField | null> = {
  rank: 'agentReady',
  name: null,
  arena: null,
  initScore: 'initScore',
  agentReady: 'agentReady',
  agenticApp: 'agenticApp',
  apiQuality: 'apiQuality',
  popularity: 'popularity',
}

function numericFieldFor(column: MegaTableColumn): NumericField | null {
  return NUMERIC_FIELDS[column]
}

export function sortMegaRows(rows: MegaTableRow[], column: MegaTableColumn, direction: SortDirection): MegaTableRow[] {
  const strField = stringFieldFor(column)
  if (strField !== null) {
    return [...rows].sort((a, b) => {
      const cmp = a[strField].localeCompare(b[strField])
      return direction === 'desc' ? -cmp : cmp
    })
  }
  const field = numericFieldFor(column) as NumericField
  return [...rows].sort((a, b) => compareNullableNumber(a[field], b[field], direction))
}

// Case-insensitive substring match over product name + vendor.
export function filterMegaRowsByQuery(rows: MegaTableRow[], query: string): MegaTableRow[] {
  const q = query.trim().toLowerCase()
  if (q === '') return rows
  return rows.filter((r) => r.name.toLowerCase().includes(q) || r.vendor.toLowerCase().includes(q))
}

// Arena dropdown filter — `'all'` (the default) means every arena.
export function filterMegaRowsByArena(rows: MegaTableRow[], arenaId: string): MegaTableRow[] {
  if (arenaId === 'all') return rows
  return rows.filter((r) => r.arenaId === arenaId)
}

// Fixed rank identity: each product's position in the full (unfiltered) list sorted by the
// default column (AGENTREADYNESS desc, nulls last) — doesn't jump around when the visible sort
// or filter changes, same rationale as ArenaTable's rankOf.
export function rankMegaRows(rows: MegaTableRow[]): Map<string, number> {
  const sorted = sortMegaRows(rows, DEFAULT_COLUMN, DEFAULT_DIRECTION)
  const map = new Map<string, number>()
  sorted.forEach((row, i) => map.set(row.productId, i + 1))
  return map
}
