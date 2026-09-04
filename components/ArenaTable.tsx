'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import AgentAccessGlyphs from '@/components/AgentAccessGlyphs'
import AiEraBadge from '@/components/AiEraBadge'
import { BusinessModelChip } from '@/components/BusinessModel'
import ClaimsChip from '@/components/ClaimsChip'
import MomentumChip from '@/components/MomentumChip'
import OssPill from '@/components/OssPill'
import ProductLogoView from '@/components/ProductLogoView'
import TableControls from '@/components/TableControls'
import VerificationMixChip from '@/components/VerificationMixChip'
import { claimsIntegrity } from '@/lib/claimsIntegrity'
import { battleSlug, isGroupUntested, type CategoryData } from '@/lib/data-helpers'
import {
  type ArenaTableColumn,
  type ArenaTableRow,
  type SortDirection,
  defaultDirectionFor,
  filterArenaRows,
  sortArenaRows,
} from '@/lib/arenaTableSort'

// Single dense, sortable/filterable table that replaces the old leaderboard + two "question
// strip" trio (see docs history: LeaderboardTable + QuestionRankStrip×2) — same underlying
// leaderboard data, one honest view instead of three overlapping renders of it. The two preset
// buttons re-create the old strips' *sort order* (agentReady / agenticApp) without re-rendering
// the same 12 products three times on one page.
//
// OSS pill and business-model chip are rendered inline under the product name rather than as
// their own columns — the spec's "columns" list is the *information* the row must carry, not a
// literal one-field-per-<th> requirement, and two more wide columns would blow the mobile
// scroll budget for very little scannability gain.
function buildRows(data: CategoryData): ArenaTableRow[] {
  const productById = new Map(data.products.map((p) => [p.id, p]))
  return data.rankings.leaderboard.map((entry) => {
    const product = productById.get(entry.productId)!
    return {
      productId: entry.productId,
      name: product.name,
      vendor: product.vendor,
      initScore: entry.aiEra,
      agentReady: entry.agentReady,
      agenticApp: entry.agenticApp,
      apiQuality: entry.apiQuality,
      openness: entry.themeScores['openness'] ?? null,
      automation: entry.themeScores['automation-depth'] ?? null,
      popularity: data.popularity[entry.productId]?.stars ?? null,
      claimsIntegrity: claimsIntegrity(data, entry.productId).score,
    }
  })
}

// Same preset vocabulary as the homepage MegaTable (see its RANK_PRESETS) so "rank by" reads
// identically on every leaderboard; only the columns differ per table.
const RANK_PRESETS: Array<{ col: ArenaTableColumn; label: string }> = [
  { col: 'agentReady', label: 'Most agent-ready' },
  { col: 'initScore', label: 'Highest Arena Score' },
  { col: 'agenticApp', label: 'Most AI-native' },
  { col: 'popularity', label: 'Most popular' },
]

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
  col: ArenaTableColumn
  current: ArenaTableColumn
  direction: SortDirection
  onSort: (col: ArenaTableColumn) => void
  sortable?: boolean
  className?: string
}) {
  const isCurrent = col === current
  if (!sortable) {
    return (
      <th scope="col" className={`sticky top-0 z-20 bg-zinc-950 px-3 py-2 font-normal ${className}`}>
        {children}
      </th>
    )
  }
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

export default function ArenaTable({ data, logoMap }: { data: CategoryData; logoMap: Record<string, boolean> }) {
  const [column, setColumn] = useState<ArenaTableColumn>('initScore')
  const [direction, setDirection] = useState<SortDirection>('desc')
  const [query, setQuery] = useState('')

  const productById = useMemo(() => new Map(data.products.map((p) => [p.id, p])), [data])
  const allRows = useMemo(() => buildRows(data), [data])
  const filtered = useMemo(() => filterArenaRows(allRows, query), [allRows, query])
  const sorted = useMemo(() => sortArenaRows(filtered, column, direction), [filtered, column, direction])

  // Rank is a fixed identity (position in the default Arena-Score-desc leaderboard), not a
  // re-derived row index — it doesn't jump around confusingly when you sort by another column.
  const rankOf = useMemo(() => {
    const map = new Map<string, number>()
    data.rankings.leaderboard.forEach((entry, i) => map.set(entry.productId, i + 1))
    return map
  }, [data])

  const topRivalId = data.rankings.leaderboard[0]?.productId

  // Battle slugs are ordered by each product's position in data.products (see
  // lib/data.ts's battleSlug + how rankings.battles is built in lib/scoring.ts), not
  // alphabetically — replicate that exact ordering here so the link always resolves.
  function orderByProduct(x: string, y: string): [string, string] {
    const idx = (id: string) => data.products.findIndex((p) => p.id === id)
    return idx(x) <= idx(y) ? [x, y] : [y, x]
  }

  function handleSort(col: ArenaTableColumn) {
    if (col === column) {
      setDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setColumn(col)
      setDirection(defaultDirectionFor(col))
    }
  }

  function applyPreset(col: ArenaTableColumn) {
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
        query={query}
        onQuery={setQuery}
        after={
          <a href="#legend" className="underline decoration-zinc-700 hover:text-emerald-300">
            legend
          </a>
        }
      />

      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-left text-[10px] uppercase tracking-widest text-zinc-400">
              <SortableTh col="rank" current={column} direction={direction} onSort={handleSort} className="w-8">
                #
              </SortableTh>
              <SortableTh col="name" current={column} direction={direction} onSort={handleSort}>
                Product
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
              <SortableTh col="apiQuality" current={column} direction={direction} onSort={handleSort} className="hidden md:table-cell">
                API
              </SortableTh>
              <SortableTh col="openness" current={column} direction={direction} onSort={handleSort} className="hidden xl:table-cell">
                Open
              </SortableTh>
              <SortableTh col="automation" current={column} direction={direction} onSort={handleSort} className="hidden xl:table-cell">
                Autom.
              </SortableTh>
              <SortableTh col="popularity" current={column} direction={direction} onSort={handleSort} className="hidden md:table-cell">
                Popularity
              </SortableTh>
              <SortableTh col="rank" current={column} direction={direction} onSort={handleSort} sortable={false} className="hidden sm:table-cell">
                Access
              </SortableTh>
              <SortableTh col="rank" current={column} direction={direction} onSort={handleSort} sortable={false} className="hidden lg:table-cell">
                Verification
              </SortableTh>
              <SortableTh col="claimsIntegrity" current={column} direction={direction} onSort={handleSort} className="hidden lg:table-cell">
                Claims
              </SortableTh>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/70">
            {sorted.map((row) => {
              const product = productById.get(row.productId)!
              const rank = rankOf.get(row.productId) ?? sorted.length
              const rival = row.productId === topRivalId ? data.rankings.leaderboard[1] : data.rankings.leaderboard[0]
              return (
                <tr key={row.productId} className="transition hover:bg-zinc-900/50">
                  <td className="w-8 px-2 py-2 font-mono tabular-nums text-zinc-400">
                    {rank}
                  </td>
                  <td className="max-w-[200px] px-2 py-2">
                    <Link
                      href={`/arena/${data.category.id}/product/${product.id}`}
                      className="flex items-center gap-2 hover:text-emerald-300"
                    >
                      <ProductLogoView product={product} size={24} hasLogo={logoMap[product.id] ?? false} />
                      <span className="min-w-0 truncate font-medium">{product.name}</span>
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {product.type === 'oss' && <OssPill />}
                      <BusinessModelChip product={product} />
                    </div>
                    {rival && (
                      <Link
                        href={`/arena/${data.category.id}/battle/${battleSlug(...orderByProduct(row.productId, rival.productId))}`}
                        className="mt-1 inline-block text-[10px] text-zinc-500 hover:text-emerald-300"
                      >
                        vs {productById.get(rival.productId)?.name} ↗
                      </Link>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <AiEraBadge
                      value={row.initScore}
                      size="sm"
                      href="/methodology#arena-score"
                      components={{
                        agentReady: row.agentReady,
                        apiQuality: row.apiQuality,
                        openness: row.openness,
                        agenticApp: row.agenticApp,
                        automation: row.automation,
                      }}
                    />
                  </td>
                  <td className="px-2 py-2 font-mono tabular-nums text-zinc-300">
                    {row.agentReady === null ? <span className="text-zinc-500">n/a</span> : <>{row.agentReady.toFixed(0)}<span className="text-zinc-600">/100</span></>}
                  </td>
                  <td className="hidden px-2 py-2 font-mono tabular-nums text-zinc-300 sm:table-cell">
                    {row.agenticApp === null ? <span className="text-zinc-500">n/a</span> : <>{row.agenticApp.toFixed(0)}<span className="text-zinc-600">/100</span></>}
                  </td>
                  <td className="hidden px-2 py-2 font-mono tabular-nums text-zinc-300 md:table-cell">
                    {isGroupUntested(data, row.productId, 'api-quality') ? (
                      <span className="font-sans text-xs italic text-zinc-500" title="No API-quality evidence found or probed either way — unscored, not zero.">
                        untested
                      </span>
                    ) : row.apiQuality === null ? (
                      <span className="text-zinc-500">n/a</span>
                    ) : (
                      <>{row.apiQuality.toFixed(0)}<span className="text-zinc-600">/100</span></>
                    )}
                  </td>
                  <td className="hidden px-2 py-2 font-mono tabular-nums text-zinc-300 xl:table-cell">
                    {row.openness === null ? <span className="text-zinc-500">n/a</span> : <>{row.openness.toFixed(0)}<span className="text-zinc-600">/100</span></>}
                  </td>
                  <td className="hidden px-2 py-2 font-mono tabular-nums text-zinc-300 xl:table-cell">
                    {row.automation === null ? <span className="text-zinc-500">n/a</span> : <>{row.automation.toFixed(0)}<span className="text-zinc-600">/100</span></>}
                  </td>
                  <td className="hidden px-2 py-2 md:table-cell">
                    <MomentumChip popularity={data.popularity[row.productId]} compact />
                  </td>
                  <td className="hidden px-2 py-2 sm:table-cell">
                    <AgentAccessGlyphs data={data} productId={row.productId} />
                  </td>
                  <td className="hidden px-2 py-2 lg:table-cell">
                    <VerificationMixChip data={data} productId={row.productId} />
                  </td>
                  <td className="hidden px-2 py-2 lg:table-cell">
                    <ClaimsChip data={data} productId={row.productId} />
                  </td>
                </tr>
              )
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={12} className="px-3 py-6 text-center text-zinc-500">
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
