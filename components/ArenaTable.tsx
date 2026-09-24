'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import AgentAccessGlyphs from '@/components/AgentAccessGlyphs'
import AiEraBadge from '@/components/AiEraBadge'
import { BusinessModelChip } from '@/components/BusinessModel'
import ClaimsChip from '@/components/ClaimsChip'
import ConfidenceChip from '@/components/ConfidenceChip'
import HotChip from '@/components/HotChip'
import MomentumChip from '@/components/MomentumChip'
import OssPill from '@/components/OssPill'
import PopularTag, { isNotablyPopular } from '@/components/PopularTag'
import ProductLogoView from '@/components/ProductLogoView'
import ShutdownBadge from '@/components/ShutdownBadge'
import TableControls from '@/components/TableControls'
import VerificationMixChip from '@/components/VerificationMixChip'
import { claimsIntegrity } from '@/lib/claimsIntegrity'
import { confidenceFor } from '@/lib/confidence'
import type { PricingCell } from '@/lib/pricing'
import { battleSlug, isGroupUntested, isThemeUntested, type CategoryData } from '@/lib/data-helpers'
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
      oss: product.type === 'oss',
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
  { col: 'initScore', label: 'Highest Overall score' },
  { col: 'agenticApp', label: 'Best built-in AI' },
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

// `pricing` (optional, pricing-covered arenas only — see lib/pricing.ts) adds a non-sortable
// "$ / unit" column: each cell is that product's headline extracted price in the arena's
// canonical agent-action unit, with the source link and as-of date. Serializable cells are
// computed server-side (app/arena/[category]/page.tsx) because this is a client component.
// `hotReasons` (optional, same server-side contract): productId -> 🔥 reason string from
// lib/hotProducts.ts — the fleet-relative threshold needs every arena's history, so it can't
// be derived from this arena's `data` alone.
export default function ArenaTable({ data, logoMap, pricing, hotReasons }: { data: CategoryData; logoMap: Record<string, boolean>; pricing?: Record<string, PricingCell>; hotReasons?: Record<string, string> }) {
  // Arena-level "this dimension doesn't apply" set (CategorySchema.naDimensions — hardware
  // arenas): render n/a instead of a number, before any untested check.
  const naDims = new Set(data.category.naDimensions ?? [])
  const naCell = (
    <span className="text-zinc-600" title="Not meaningful for this arena's product class — a physical part has no agent-drivable surface or API of its own. The Overall score still applies; see the arena methodology note.">
      n/a
    </span>
  )
  const [column, setColumn] = useState<ArenaTableColumn>('initScore')
  const [direction, setDirection] = useState<SortDirection>('desc')
  const [query, setQuery] = useState('')

  const productById = useMemo(() => new Map(data.products.map((p) => [p.id, p])), [data])
  // Confidence grades are pure over `data` — compute once per product, not per render pass.
  const confidenceOf = useMemo(
    () => new Map(data.products.map((p) => [p.id, confidenceFor(data, p.id)])),
    [data],
  )
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

  // Products whose vendor announced a shutdown (lib/shutdown.ts): the row stays, tagged, but
  // the "vs …" affordance never SUGGESTS one as the rival to compare against.
  const shutdownIds = useMemo(
    () => new Set(data.products.filter((p) => p.shutdown).map((p) => p.id)),
    [data],
  )

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
                <span title="Overall score /100 — the blended headline score: agent-ready ×0.30, API quality ×0.20, openness ×0.20, Built-in AI ×0.15, automation ×0.15. Click a badge for the methodology.">Overall score</span>
              </SortableTh>
              <SortableTh col="agentReady" current={column} direction={direction} onSort={handleSort}>
                <span title="AGENT-READY = outside-in: can YOUR agent drive this product? Measures the access surface — API, MCP, CLI, headless runs, agent docs. A product can score high here with zero AI features of its own (think Stripe).">Agent-ready</span>
              </SortableTh>
              <SortableTh col="agenticApp" current={column} direction={direction} onSort={handleSort} className="hidden sm:table-cell">
                <span title="BUILT-IN AI = inside-out: how agentic the product itself is FOR its users — built-in assistants, autonomous features, AI-first workflows. A walled-garden AI app can score high here while being hard for YOUR agent to drive.">Built-in AI</span>
              </SortableTh>
              <SortableTh col="apiQuality" current={column} direction={direction} onSort={handleSort} className="hidden md:table-cell">
                <span title="API quality /100 — machine-readable spec, interactive docs, sandbox, versioning discipline. Untested = no evidence either way.">API</span>
              </SortableTh>
              <SortableTh col="openness" current={column} direction={direction} onSort={handleSort} className="hidden xl:table-cell">
                {/* Full word, not "Open" — abbreviated it reads as an action verb, not the metric. */}
                <span title="Openness /100 — self-host, full export, read the source">Openness</span>
              </SortableTh>
              <SortableTh col="automation" current={column} direction={direction} onSort={handleSort} className="hidden xl:table-cell">
                <span title="Automation depth /100 — how much of the product's work can run hands-off, end to end, without a person clicking through">Autom.</span>
              </SortableTh>
              <SortableTh col="popularity" current={column} direction={direction} onSort={handleSort} className="hidden md:table-cell">
                <span title="Adoption signal from public registries (GitHub stars, weekly installs) — context only, never part of the Overall score">Popularity</span>
              </SortableTh>
              {pricing && (
                <SortableTh col="rank" current={column} direction={direction} onSort={handleSort} sortable={false} className="hidden md:table-cell">
                  <span title="Headline price per unit, read from the vendor's public pricing page — hover a cell for the unit and date">$ / unit</span>
                </SortableTh>
              )}
              <SortableTh col="rank" current={column} direction={direction} onSort={handleSort} sortable={false} className="hidden sm:table-cell">
                <span title="Agent access surfaces — MCP server / CLI / API, from judged evidence: ✓ full, ~ partial, ! disputed, — none found">Access</span>
              </SortableTh>
              <SortableTh col="rank" current={column} direction={direction} onSort={handleSort} sortable={false} className="hidden lg:table-cell">
                <span title="How verdicts were proven: T probed by us · X community-backed · C vendor claim only · D contradicted">Verification</span>
              </SortableTh>
              <SortableTh col="claimsIntegrity" current={column} direction={direction} onSort={handleSort} className="hidden lg:table-cell">
                <span title="Claims integrity /100 — how much of what the vendor claims held up when tested; click a score for the breakdown">Claims</span>
              </SortableTh>
              {/* Founder 2026-09-23: an evidence column at the end — every ranking clicks
                  through to the receipt that produced it (the product's /score page). */}
              <SortableTh col="rank" current={column} direction={direction} onSort={handleSort} sortable={false} className="w-8">
                <span title="The evidence behind this ranking — click a row's ⚖ for the full receipt: every story, verdict, and cited evidence item">Evidence</span>
              </SortableTh>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/70">
            {sorted.map((row) => {
              const product = productById.get(row.productId)!
              const rank = rankOf.get(row.productId) ?? sorted.length
              // Suggested rival: the best-ranked OTHER product that isn't shutting down.
              const rival = data.rankings.leaderboard.find(
                (e) => e.productId !== row.productId && !shutdownIds.has(e.productId),
              )
              return (
                <tr key={row.productId} className="transition hover:bg-zinc-800/70">
                  <td className="w-8 px-2 py-2 font-mono tabular-nums text-zinc-400">
                    {rank}
                  </td>
                  <td className="min-w-[220px] max-w-[320px] px-2 py-2">
                    <Link
                      href={`/arena/${data.category.id}/product/${product.id}`}
                      className="flex items-center gap-2 hover:text-emerald-300"
                    >
                      <ProductLogoView product={product} size={24} hasLogo={logoMap[product.id] ?? false} />
                      <span className="min-w-0 truncate font-medium">{product.name}</span>
                      {hotReasons?.[row.productId] && <HotChip reason={hotReasons[row.productId]} />}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {/* The pill doubles as the OSS sort affordance — this table has no OSS
                          column header, so the indicator itself is the click target. */}
                      {product.type === 'oss' && (
                        <button
                          type="button"
                          onClick={() => handleSort('oss')}
                          title="Open source — the product's code is publicly available. Click to sort open-source products first."
                          aria-label="Sort open-source products first"
                          className="cursor-pointer"
                        >
                          <OssPill variant="compact" />
                        </button>
                      )}
                      <BusinessModelChip product={product} skipOpenSource={product.type === 'oss'} />
                      <ShutdownBadge shutdown={product.shutdown} source={product.shutdownSource} />
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
                    <div className="flex items-center gap-1.5">
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
                      <ConfidenceChip confidence={confidenceOf.get(row.productId)!} />
                    </div>
                  </td>
                  <td className="px-2 py-2 font-mono tabular-nums text-zinc-300">
                    {naDims.has('agentReady') ? naCell : isGroupUntested(data, row.productId, 'agent-access') ? (
                      <span className="font-sans text-xs italic text-zinc-500" title="No agent-access evidence found or probed either way — unscored, not zero.">
                        untested
                      </span>
                    ) : row.agentReady === null ? <span className="text-zinc-500">n/a</span> : <>{row.agentReady.toFixed(0)}<span className="text-zinc-600">/100</span></>}
                  </td>
                  <td className="hidden px-2 py-2 font-mono tabular-nums text-zinc-300 sm:table-cell">
                    {naDims.has('agenticApp') ? naCell : isGroupUntested(data, row.productId, 'agentic-features') ? (
                      <span className="font-sans text-xs italic text-zinc-500" title="No agentic-features evidence found or probed either way — unscored, not zero.">
                        untested
                      </span>
                    ) : row.agenticApp === null ? <span className="text-zinc-500">n/a</span> : <>{row.agenticApp.toFixed(0)}<span className="text-zinc-600">/100</span></>}
                  </td>
                  <td className="hidden px-2 py-2 font-mono tabular-nums text-zinc-300 md:table-cell">
                    {naDims.has('apiQuality') ? naCell : isGroupUntested(data, row.productId, 'api-quality') ? (
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
                    {isThemeUntested(data, row.productId, 'openness') ? (
                      <span className="font-sans text-xs italic text-zinc-500" title="No openness evidence found or probed either way — unscored, not zero.">
                        untested
                      </span>
                    ) : row.openness === null ? <span className="text-zinc-500">n/a</span> : <>{row.openness.toFixed(0)}<span className="text-zinc-600">/100</span></>}
                  </td>
                  <td className="hidden px-2 py-2 font-mono tabular-nums text-zinc-300 xl:table-cell">
                    {isThemeUntested(data, row.productId, 'automation-depth') ? (
                      <span className="font-sans text-xs italic text-zinc-500" title="No automation-depth evidence found or probed either way — unscored, not zero.">
                        untested
                      </span>
                    ) : row.automation === null ? <span className="text-zinc-500">n/a</span> : <>{row.automation.toFixed(0)}<span className="text-zinc-600">/100</span></>}
                  </td>
                  <td className="hidden px-2 py-2 md:table-cell">
                    {data.popularity[row.productId]?.stars !== undefined || data.popularity[row.productId]?.npmWeekly !== undefined || data.popularity[row.productId]?.pypiWeekly !== undefined ? (
                      productById.get(row.productId)?.urls.github ? (
                        <a href={productById.get(row.productId)!.urls.github} target="_blank" rel="noopener noreferrer" title="Open the GitHub repo" className="hover:text-emerald-300">
                          <MomentumChip popularity={data.popularity[row.productId]} compact />
                        </a>
                      ) : (
                        <MomentumChip popularity={data.popularity[row.productId]} compact />
                      )
                    ) : isNotablyPopular(row.productId) ? (
                      <PopularTag />
                    ) : null}
                  </td>
                  {pricing && (
                    <td className="hidden px-2 py-2 md:table-cell">
                      {(() => {
                        const cell = pricing[row.productId]
                        if (!cell) return null
                        if ('unclear' in cell) {
                          return (
                            <span className="text-xs italic text-zinc-500" title={`Pricing unclear: ${cell.reason}. We never estimate a price we didn't extract.`}>
                              unclear
                            </span>
                          )
                        }
                        return (
                          <a
                            href={cell.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`${cell.label} ${cell.unit} (${cell.tier}) — extracted verbatim from the vendor's pricing page, as of ${cell.asOf}`}
                            className="whitespace-nowrap hover:text-emerald-300"
                          >
                            <span className="font-mono tabular-nums text-zinc-300">{cell.label}</span>
                            {/* "free tier" stands alone; "per …" units read as "$X / unit";
                                non-"per" units ("gateway fee") read as a plain suffix. */}
                            {cell.tier !== 'free' && (
                              <span className="ml-1 text-[10px] text-zinc-500">
                                {cell.unit === 'gateway fee' ? cell.unit : `/ ${cell.unit}`}
                              </span>
                            )}
                          </a>
                        )
                      })()}
                    </td>
                  )}
                  <td className="hidden px-2 py-2 sm:table-cell">
                    <AgentAccessGlyphs data={data} productId={row.productId} />
                  </td>
                  <td className="hidden px-2 py-2 lg:table-cell">
                    <VerificationMixChip
                      data={data}
                      productId={row.productId}
                      href={`/arena/${data.category.id}/product/${row.productId}#story-verdicts`}
                    />
                  </td>
                  <td className="hidden px-2 py-2 lg:table-cell">
                    <ClaimsChip
                      data={data}
                      productId={row.productId}
                      href={`/arena/${data.category.id}/product/${row.productId}#claims`}
                    />
                  </td>
                  <td className="w-8 px-2 py-2 text-center">
                    <Link
                      href={`/arena/${data.category.id}/product/${row.productId}/score`}
                      title={`The evidence behind ${product.name}'s ranking — every story, verdict, and cited evidence item, with the arithmetic`}
                      aria-label={`Evidence behind ${product.name}'s ranking`}
                      className="inline-block rounded border border-zinc-800 px-1 font-mono text-[10px] leading-4 text-zinc-500 transition hover:border-emerald-400/40 hover:text-emerald-300"
                    >
                      ⚖
                    </Link>
                  </td>
                </tr>
              )
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={pricing ? 14 : 13} className="px-3 py-6 text-center text-zinc-500">
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
