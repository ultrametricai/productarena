'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import AiEraBadge from '@/components/AiEraBadge'
import MomentumChip from '@/components/MomentumChip'
import TableControls from '@/components/TableControls'
import OssPill from '@/components/OssPill'
import ProductLogoView from '@/components/ProductLogoView'
import YcBadge from '@/components/YcBadge'
import type { MegaTableArenaOption } from '@/lib/megaTable'
import {
  DEFAULT_COLUMN,
  DEFAULT_DIRECTION,
  defaultDirectionFor,
  filterMegaRowsByArena,
  filterMegaRowsByQuery,
  rankMegaRows,
  sortMegaRows,
  type MegaTableColumn,
  type MegaTableRow,
  type SortDirection,
} from '@/lib/megaTableSort'

// The homepage's single global table over every product in every arena — replaces the old
// three-preview-tables-plus-arena-cards-first layout (see app/page.tsx: hero → this → compact
// arena cards → leading battles). Every row here is one product's leaderboard entry from its
// own arena's rankings.json; rows are pre-flattened + stripped server-side (lib/megaTable.ts) so
// this client component never carries evidence/verdicts/stories over the wire.
//
// AGENTREADYNESS is the default sort (desc) — see lib/megaTableSort.ts's DEFAULT_COLUMN doc —
// and `rank` is a fixed identity derived from that same default order, not a re-derived row
// index, so it doesn't reshuffle when a reader sorts by another column.
//
// The three /rankings/* pages (highest Arena Score, most agentic, most AI-native) remain the
// "preset view" links above the table — this table is the single-honest-view superset of what
// those three (plus the old per-arena ArenaTable trio) used to render separately.

function SortableTh({
  children,
  col,
  current,
  direction,
  onSort,
  sortable = true,
  className = '',
}: {
  children: ReactNode
  col: MegaTableColumn
  current: MegaTableColumn
  direction: SortDirection
  onSort: (col: MegaTableColumn) => void
  sortable?: boolean
  className?: string
}) {
  if (!sortable) {
    return (
      <th scope="col" className={`sticky top-0 z-20 bg-zinc-950 px-3 py-2 font-normal ${className}`}>
        {children}
      </th>
    )
  }
  const isCurrent = col === current
  const ariaSort: 'ascending' | 'descending' | 'none' = !isCurrent ? 'none' : direction === 'asc' ? 'ascending' : 'descending'
  return (
    <th scope="col" aria-sort={ariaSort} className={`sticky top-0 z-20 bg-zinc-950 px-3 py-2 font-normal ${className}`}>
      <button
        type="button"
        onClick={() => onSort(col)}
        className={`flex items-center gap-1 whitespace-nowrap hover:text-emerald-300 ${isCurrent ? 'text-emerald-300' : ''}`}
      >
        {children}
        {isCurrent && <span aria-hidden>{direction === 'asc' ? '▲' : '▼'}</span>}
      </button>
    </th>
  )
}

// The "rank by" presets rendered as a segmented control above the table — one-click views of
// the same rows (they just set the sort column), replacing the old links out to /rankings/*.
const RANK_PRESETS: Array<{ col: MegaTableColumn; label: string }> = [
  { col: 'agentReady', label: 'Most agent-ready' },
  { col: 'initScore', label: 'Highest Arena Score' },
  { col: 'agenticApp', label: 'Most AI-native' },
  { col: 'popularity', label: 'Most popular' },
]

export default function MegaTable({ rows, arenas }: { rows: MegaTableRow[]; arenas: MegaTableArenaOption[] }) {
  const [column, setColumn] = useState<MegaTableColumn>(DEFAULT_COLUMN)
  const [direction, setDirection] = useState<SortDirection>(DEFAULT_DIRECTION)
  const [query, setQuery] = useState('')
  const [arenaId, setArenaId] = useState('all')
  const [showAll, setShowAll] = useState(false)

  const byArena = useMemo(() => filterMegaRowsByArena(rows, arenaId), [rows, arenaId])
  // Rank is scoped to what's shown: global 1..N across all arenas by default, but 1..X within
  // the selected arena when one is chosen — a reader picking an arena wants that arena's
  // standings, not each product's position in the site-wide list.
  const rankOf = useMemo(() => rankMegaRows(arenaId === 'all' ? rows : byArena), [rows, byArena, arenaId])
  const filtered = useMemo(() => filterMegaRowsByQuery(byArena, query), [byArena, query])
  const sorted = useMemo(() => sortMegaRows(filtered, column, direction), [filtered, column, direction])
  // The homepage table caps at 50 rows — past that it's a wall, and every row is one click from
  // its arena anyway. Filtering/sorting always applies to the full set; the cap is display-only.
  const visible = showAll ? sorted : sorted.slice(0, 50)

  function handleSort(col: MegaTableColumn) {
    if (col === column) {
      setDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setColumn(col)
      setDirection(defaultDirectionFor(col))
    }
  }

  function applyPreset(col: MegaTableColumn) {
    setColumn(col)
    setDirection('desc')
  }

  return (
    <div className="space-y-3">
      <TableControls
        presets={RANK_PRESETS}
        activeColumn={column}
        presetActive={direction === 'desc'}
        onPreset={applyPreset}
        scope={{
          value: arenaId,
          onChange: setArenaId,
          ariaLabel: 'Filter by arena',
          options: [{ value: 'all', label: 'All products' }, ...arenas.map((a) => ({ value: a.id, label: a.name }))],
        }}
        query={query}
        onQuery={setQuery}
      />

      <div className="overflow-x-auto rounded-2xl border border-zinc-800 md:overflow-x-visible">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-left text-[10px] uppercase tracking-widest text-zinc-400">
              <SortableTh col="name" current={column} direction={direction} onSort={handleSort}>
                # / Product
              </SortableTh>
              <SortableTh col="arena" current={column} direction={direction} onSort={handleSort} className="hidden lg:table-cell">
                Arena
              </SortableTh>
              <SortableTh col="rank" current={column} direction={direction} onSort={handleSort} sortable={false} className="hidden md:table-cell">
                OSS
              </SortableTh>
              <SortableTh col="initScore" current={column} direction={direction} onSort={handleSort}>
                Arena Score
              </SortableTh>
              <SortableTh col="agentReady" current={column} direction={direction} onSort={handleSort}>
                Agent-ready
              </SortableTh>
              <SortableTh col="agenticApp" current={column} direction={direction} onSort={handleSort} className="hidden sm:table-cell">
                Agentic
              </SortableTh>
              <SortableTh col="apiQuality" current={column} direction={direction} onSort={handleSort} className="hidden lg:table-cell">
                API
              </SortableTh>
              <SortableTh col="popularity" current={column} direction={direction} onSort={handleSort} className="hidden md:table-cell">
                GitHub ★
              </SortableTh>
              <SortableTh col="rank" current={column} direction={direction} onSort={handleSort} sortable={false} className="hidden sm:table-cell">
                Access
              </SortableTh>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/70">
            {visible.map((row) => {
              const rank = rankOf.get(row.productId) ?? sorted.length
              return (
                <tr key={row.productId} className="transition hover:bg-zinc-900/50">
                  <td className="max-w-[220px] px-2 py-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 shrink-0 font-mono tabular-nums text-zinc-400">{rank}</span>
                      <Link
                        href={`/arena/${row.arenaId}/product/${row.productId}`}
                        className="flex min-w-0 items-center gap-2 hover:text-emerald-300"
                      >
                        <ProductLogoView product={{ id: row.productId, name: row.name }} size={24} hasLogo={row.hasLogo} />
                        <span className="min-w-0 truncate font-medium">{row.name}</span>
                      </Link>
                      <YcBadge ycBatch={row.ycBatch} />
                    </div>
                  </td>
                  <td className="hidden px-2 py-2 lg:table-cell">
                    <Link href={`/arena/${row.arenaId}`} className="text-zinc-400 hover:text-emerald-300">
                      {row.arenaName}
                    </Link>
                  </td>
                  <td className="hidden px-2 py-2 md:table-cell">
                    {row.type === 'oss' ? <OssPill /> : <span className="text-zinc-600">—</span>}
                  </td>
                  <td className="px-2 py-2">
                    <AiEraBadge
                      value={row.initScore}
                      size="sm"
                      href="/methodology#arena-score"
                      components={{
                        agentReady: row.agentReady,
                        apiQuality: row.apiQuality,
                        openness: null,
                        agenticApp: row.agenticApp,
                        automation: null,
                      }}
                    />
                  </td>
                  <td className="px-2 py-2 font-mono tabular-nums text-zinc-300">
                    {row.agentReady === null ? <span className="text-zinc-500">n/a</span> : <>{row.agentReady.toFixed(0)}<span className="text-zinc-600">/100</span></>}
                  </td>
                  <td className="hidden px-2 py-2 font-mono tabular-nums text-zinc-300 sm:table-cell">
                    {row.agenticApp === null ? <span className="text-zinc-500">n/a</span> : <>{row.agenticApp.toFixed(0)}<span className="text-zinc-600">/100</span></>}
                  </td>
                  <td className="hidden px-2 py-2 font-mono tabular-nums text-zinc-300 lg:table-cell">
                    {row.apiUntested ? (
                      <span className="font-sans text-xs italic text-zinc-500" title="No API-quality evidence found or probed either way — unscored, not zero.">
                        untested
                      </span>
                    ) : row.apiQuality === null ? (
                      <span className="text-zinc-500">n/a</span>
                    ) : (
                      <>{row.apiQuality.toFixed(0)}<span className="text-zinc-600">/100</span></>
                    )}
                  </td>
                  <td className="hidden px-2 py-2 md:table-cell">
                    <MomentumChip popularity={row.popularity === null ? undefined : { fetchedAt: '', stars: row.popularity }} compact />
                  </td>
                  <td className="hidden px-2 py-2 sm:table-cell">
                    <div className="flex items-center gap-2.5 font-mono text-xs">
                      {(['MCP', 'CLI', 'API'] as const).map((label) => {
                        const glyph = row.access[label]
                        return (
                          <Link
                            key={label}
                            href={glyph.href}
                            className="flex items-center gap-1 hover:text-emerald-300"
                            title={glyph.title}
                          >
                            <span className="text-zinc-400">{label}</span>
                            <span className={glyph.className}>{glyph.char}</span>
                          </Link>
                        )
                      })}
                    </div>
                  </td>
                </tr>
              )
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center text-zinc-500">
                  No products match &ldquo;{query}&rdquo;.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {!showAll && sorted.length > 50 && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="mx-auto block rounded-full border border-zinc-800 px-4 py-1.5 text-xs text-zinc-400 transition hover:border-emerald-400/40 hover:text-emerald-300"
        >
          Show all {sorted.length} products
        </button>
      )}
    </div>
  )
}
