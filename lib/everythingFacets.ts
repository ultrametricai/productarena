// Pure facet/filter/group logic for the /everything power view's product catalog (see
// lib/everything.ts for the server-side row builders and components/EverythingCatalog.tsx for
// the client view). Split out the same way lib/megaTableSort.ts is split from MegaTable.tsx:
// `node:fs`-free and testable without rendering React, so the client component stays a thin view
// and the bundle never drags CategoryData/verdicts along.

// One product row on /everything — deliberately leaner than MegaTableRow: bare numbers, a grade
// letter, and the three access glyphs collapsed to a 3-char string (MCP, CLI, API order). No
// evidence, verdicts, hrefs, or tooltip prose crosses the wire; the view re-derives those from
// ids and chars.
export interface EverythingRow {
  productId: string
  name: string
  vendor: string
  arenaId: string
  arenaName: string
  oss: boolean
  /** Blended PA Score (initScore/aiEra) — first number of the "42·77·23" triplet. */
  score: number | null
  agentReady: number | null
  agenticApp: number | null
  /** Score-confidence grade letter (see lib/confidence.ts). */
  grade: 'A' | 'B' | 'C' | 'D'
  /** Access glyph chars in MCP·CLI·API order, each one of ✓ ~ ! — (see lib/accessGlyphs.ts). */
  access: string
  /** 30-day PA Score trend delta (lib/scoreTrend.ts) — null when <2 history points. */
  trend: number | null
}

export interface EverythingFacets {
  /** 'all' or one arena id. */
  arenaId: string
  ossOnly: boolean
  /** Only rows whose MCP access is evidenced (✓ or ~). */
  mcpOnly: boolean
  /** Only rows with confidence grade A or B. */
  confBPlus: boolean
  /** Case-insensitive substring over name / vendor / arena name / arena id. */
  query: string
}

export const DEFAULT_FACETS: EverythingFacets = {
  arenaId: 'all',
  ossOnly: false,
  mcpOnly: false,
  confBPlus: false,
  query: '',
}

// Evidenced MCP access = the MCP glyph is ✓ (full) or ~ (partial). `!` (disputed) and `—`
// (none/na) don't count — a disputed claim is not a working endpoint.
export function hasMcp(row: Pick<EverythingRow, 'access'>): boolean {
  const c = row.access.charAt(0)
  return c === '✓' || c === '~'
}

export function rowMatchesFacets(row: EverythingRow, facets: EverythingFacets): boolean {
  if (facets.arenaId !== 'all' && row.arenaId !== facets.arenaId) return false
  if (facets.ossOnly && !row.oss) return false
  if (facets.mcpOnly && !hasMcp(row)) return false
  if (facets.confBPlus && row.grade !== 'A' && row.grade !== 'B') return false
  const q = facets.query.trim().toLowerCase()
  if (q !== '') {
    return (
      row.name.toLowerCase().includes(q)
      || row.vendor.toLowerCase().includes(q)
      || row.arenaName.toLowerCase().includes(q)
      || row.arenaId.includes(q)
    )
  }
  return true
}

export function filterEverythingRows(rows: EverythingRow[], facets: EverythingFacets): EverythingRow[] {
  return rows.filter((r) => rowMatchesFacets(r, facets))
}

export interface EverythingArenaGroup {
  arenaId: string
  arenaName: string
  /** The arena's canonical leaderboard leader — always from the FULL row set, so facets never
   *  reassign leadership (a filtered-out leader is still the leader). */
  leaderName: string
  rows: EverythingRow[]
}

// Group visible rows by arena in first-seen (categories.json) order. `allRows` supplies the
// canonical leader per arena: rows are built in leaderboard order (see lib/everything.ts), so
// each arena's first unfiltered row is its leader.
export function groupRowsByArena(allRows: EverythingRow[], visible: EverythingRow[]): EverythingArenaGroup[] {
  const leaders = new Map<string, string>()
  for (const r of allRows) if (!leaders.has(r.arenaId)) leaders.set(r.arenaId, r.name)
  const groups = new Map<string, EverythingArenaGroup>()
  for (const r of visible) {
    let g = groups.get(r.arenaId)
    if (!g) {
      g = { arenaId: r.arenaId, arenaName: r.arenaName, leaderName: leaders.get(r.arenaId) ?? r.name, rows: [] }
      groups.set(r.arenaId, g)
    }
    g.rows.push(r)
  }
  return [...groups.values()]
}

// Flat view ordering: agent-readiness desc (the site's cross-arena default, see
// lib/megaTableSort.ts's DEFAULT_COLUMN), nulls last; ties broken by PA Score desc then name.
export function sortRowsFlat(rows: EverythingRow[]): EverythingRow[] {
  const num = (v: number | null) => (v === null ? -Infinity : v)
  return [...rows].sort(
    (a, b) =>
      num(b.agentReady) - num(a.agentReady)
      || num(b.score) - num(a.score)
      || a.name.localeCompare(b.name),
  )
}
