'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import AiEraBadge from '@/components/AiEraBadge'
import MomentumChip from '@/components/MomentumChip'
import OssPill from '@/components/OssPill'
import ProductLogoView from '@/components/ProductLogoView'
import type { MegaTableArenaOption } from '@/lib/megaTable'
import {
  COLUMN_LABELS,
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
      <th scope="col" className={`px-3 py-2 font-normal ${className}`}>
        {children}
      </th>
    )
  }
  const isCurrent = col === current
  const ariaSort: 'ascending' | 'descending' | 'none' = !isCurrent ? 'none' : direction === 'asc' ? 'ascending' : 'descending'
  return (
    <th scope="col" aria-sort={ariaSort} className={`px-3 py-2 font-normal ${className}`}>
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

function presetButtonClass(active: boolean): string {
  const base = 'rounded-full border px-3 py-1.5 text-xs font-medium transition'
  return active
    ? `${base} border-emerald-400/60 bg-emerald-400/10 text-emerald-300`
    : `${base} border-zinc-800 text-zinc-400 hover:border-emerald-400/40 hover:text-emerald-300`
}

export default function MegaTable({ rows, arenas }: { rows: MegaTableRow[]; arenas: MegaTableArenaOption[] }) {
  const [column, setColumn] = useState<MegaTableColumn>(DEFAULT_COLUMN)
  const [direction, setDirection] = useState<SortDirection>(DEFAULT_DIRECTION)
  const [query, setQuery] = useState('')
  const [arenaId, setArenaId] = useState('all')

  const rankOf = useMemo(() => rankMegaRows(rows), [rows])
  const byArena = useMemo(() => filterMegaRowsByArena(rows, arenaId), [rows, arenaId])
  const filtered = useMemo(() => filterMegaRowsByQuery(byArena, query), [byArena, query])
  const sorted = useMemo(() => sortMegaRows(filtered, column, direction), [filtered, column, direction])

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
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-widest text-zinc-500">Rank by</span>
        {RANK_PRESETS.map((p) => (
          <button key={p.col} type="button" onClick={() => applyPreset(p.col)} className={presetButtonClass(column === p.col && direction === 'desc')}>
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-widest text-zinc-500">Show</span>
        <select
          value={arenaId}
          onChange={(e) => setArenaId(e.target.value)}
          aria-label="Filter by arena"
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-sm text-zinc-100 focus:border-emerald-400/60 focus:outline-none"
        >
          <option value="all">All products</option>
          {arenas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter products…"
          aria-label="Filter products by name or vendor"
          className="ml-auto w-full min-w-0 max-w-[14rem] rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-400/60 focus:outline-none sm:w-48"
        />
      </div>

      <p className="text-xs text-zinc-400" aria-live="polite">
        Ranked by <span className="font-semibold text-emerald-300">{COLUMN_LABELS[column]}</span>{' '}
        ({direction === 'desc' ? 'high → low' : 'low → high'})
      </p>

      <div className="overflow-x-auto rounded-2xl border border-zinc-800">
        <table className="w-full min-w-[880px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-left text-xs uppercase tracking-widest text-zinc-400">
              <SortableTh col="name" current={column} direction={direction} onSort={handleSort} className="sticky left-0 z-20 w-[220px] bg-zinc-950">
                # / Product
              </SortableTh>
              <SortableTh col="arena" current={column} direction={direction} onSort={handleSort}>
                Arena
              </SortableTh>
              <SortableTh col="rank" current={column} direction={direction} onSort={handleSort} sortable={false}>
                OSS
              </SortableTh>
              <SortableTh col="initScore" current={column} direction={direction} onSort={handleSort}>
                Arena Score
              </SortableTh>
              <SortableTh col="agentReady" current={column} direction={direction} onSort={handleSort}>
                Agentreadyness
              </SortableTh>
              <SortableTh col="agenticApp" current={column} direction={direction} onSort={handleSort}>
                Agentic
              </SortableTh>
              <SortableTh col="apiQuality" current={column} direction={direction} onSort={handleSort}>
                API quality
              </SortableTh>
              <SortableTh col="popularity" current={column} direction={direction} onSort={handleSort}>
                Popularity
              </SortableTh>
              <SortableTh col="rank" current={column} direction={direction} onSort={handleSort} sortable={false}>
                Access
              </SortableTh>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/70">
            {sorted.map((row) => {
              const rank = rankOf.get(row.productId) ?? sorted.length
              return (
                <tr key={row.productId} className="group transition hover:bg-zinc-900/50">
                  <td className="sticky left-0 z-10 w-[220px] bg-zinc-950 px-3 py-2 group-hover:bg-zinc-900/50">
                    <div className="flex items-center gap-2">
                      <span className="w-6 shrink-0 font-mono tabular-nums text-zinc-400">{rank}</span>
                      <Link
                        href={`/arena/${row.arenaId}/product/${row.productId}`}
                        className="flex min-w-0 items-center gap-2 hover:text-emerald-300"
                      >
                        <ProductLogoView product={{ id: row.productId, name: row.name }} size={24} hasLogo={row.hasLogo} />
                        <span className="min-w-0 truncate font-medium">{row.name}</span>
                      </Link>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <Link href={`/arena/${row.arenaId}`} className="text-zinc-400 hover:text-emerald-300">
                      {row.arenaName}
                    </Link>
                  </td>
                  <td className="px-3 py-2">
                    {row.type === 'oss' ? <OssPill /> : <span className="text-zinc-600">—</span>}
                  </td>
                  <td className="px-3 py-2">
                    <AiEraBadge
                      value={row.initScore}
                      size="sm"
                      components={{
                        agentReady: row.agentReady,
                        apiQuality: row.apiQuality,
                        openness: null,
                        agenticApp: row.agenticApp,
                        automation: null,
                      }}
                    />
                  </td>
                  <td className="px-3 py-2 font-mono tabular-nums text-zinc-300">
                    {row.agentReady === null ? <span className="text-zinc-500">n/a</span> : row.agentReady.toFixed(0)}
                  </td>
                  <td className="px-3 py-2 font-mono tabular-nums text-zinc-300">
                    {row.agenticApp === null ? <span className="text-zinc-500">n/a</span> : row.agenticApp.toFixed(0)}
                  </td>
                  <td className="px-3 py-2 font-mono tabular-nums text-zinc-300">
                    {row.apiUntested ? (
                      <span className="font-sans text-xs italic text-zinc-500" title="No API-quality evidence found or probed either way — unscored, not zero.">
                        untested
                      </span>
                    ) : row.apiQuality === null ? (
                      <span className="text-zinc-500">n/a</span>
                    ) : (
                      row.apiQuality.toFixed(0)
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <MomentumChip popularity={row.popularity === null ? undefined : { fetchedAt: '', stars: row.popularity }} compact />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-3 font-mono text-xs">
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
    </div>
  )
}
