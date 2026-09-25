'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import CeilingBar from '@/components/CeilingBar'
import IconChip from '@/components/IconChip'
import ProductLogoView from '@/components/ProductLogoView'
import TableControls from '@/components/TableControls'
import { phaseIcon, phaseTooltip } from '@/lib/processIcons'
import { readParams, setParams } from '@/lib/urlState'

// The /processes controller: one dense sortable/filterable table over the whole founder-process
// corpus (mega-table pattern — see components/MegaTable.tsx), replacing the phase-grouped card
// list. Rows are pre-flattened server-side; every row clicks out to its own process page.
// Each row leads with its curated process icon (lib/processIcons.ts) and its software chips
// carry real product logos (hasLogo resolved server-side — ProductLogoView is client-safe).
//
// Rank-by presets (founder ask 2026-09-18) — beyond the agent ceiling, five curated orderings
// over the corpus (fields on data/processes.json, coverage-tested):
//   Founder timeline — timeOrder, the sequence a founder actually hits these processes;
//   Regularity       — cadence, daily loops first through one-time setup;
//   Most annoying    — annoyance 1–5, the drudgery score;
//   Riskiest         — risk 1–5, cost of getting it wrong (legal/tax/security exposure);
//   Growth-focused   — growthImpact 1–5, how directly it drives revenue/user growth.
// The metric column adapts to the active preset so the number being ranked on is always visible.

export interface ProcessRow {
  slug: string
  title: string
  // Curated emoji for this process (lib/processIcons.ts), resolved server-side by task id.
  icon: string
  phase: string
  pct: number
  agentSteps: number
  totalSteps: number
  complexity: string
  // The five-orderings fields (curated in data/processes.json; cadence label/rank resolved
  // server-side so this component stays free of the node-only cadence helpers).
  timeOrder: number
  cadenceLabel: string
  cadenceRank: number
  annoyance: number
  risk: number
  growthImpact: number
  vendors: Array<{ id: string; label: string; arena: string | null; hasLogo: boolean }>
}

type Column = 'title' | 'phase' | 'pct' | 'steps' | 'order' | 'cadence' | 'annoyance' | 'risk' | 'growth'
type Direction = 'asc' | 'desc'

// Columns whose preset/default direction is ascending (timeline runs first→last; regularity
// runs daily→once). Everything numeric-desc otherwise.
const ASC_DEFAULT = new Set<Column>(['title', 'phase', 'order', 'cadence'])
const defaultDirection = (col: Column): Direction => (ASC_DEFAULT.has(col) ? 'asc' : 'desc')

// Shareable ?order= values (founder 2026-09-21, lib/urlState.ts): every pickable column, with
// the timeOrder column spelled 'timeline' in the URL (?order=order reads badly; ?order=timeline
// says what it is). The default sort (pct — the agent ceiling) never appears in the URL, and
// bad values fall back to it silently. Both `timeline` and the raw `order` are accepted on read.
const ALL_COLUMNS: readonly Column[] = ['title', 'phase', 'pct', 'steps', 'order', 'cadence', 'annoyance', 'risk', 'growth']
const columnToParam = (col: Column): string => (col === 'order' ? 'timeline' : col)
function paramToColumn(value: string | null): Column | null {
  if (value === null) return null
  if (value === 'timeline') return 'order'
  return (ALL_COLUMNS as readonly string[]).includes(value) ? (value as Column) : null
}

const PRESETS: Array<{ col: Column; label: string }> = [
  { col: 'pct', label: 'Most automatable' },
  { col: 'steps', label: 'Most steps' },
  { col: 'order', label: 'Founder timeline' },
  { col: 'cadence', label: 'Regularity' },
  { col: 'annoyance', label: 'Most annoying' },
  { col: 'risk', label: 'Riskiest' },
  { col: 'growth', label: 'Growth-focused' },
]

// The adaptive metric column: which of the five orderings it currently shows. Defaults to the
// regularity axis when the sort lives elsewhere (ceiling, title…).
type Metric = 'order' | 'cadence' | 'annoyance' | 'risk' | 'growth'
const METRIC_META: Record<Metric, { header: string; tooltip: string }> = {
  order: { header: 'Timeline', tooltip: 'The order a founder typically hits this process — incorporation first, then banking, payroll, …' },
  cadence: { header: 'Cadence', tooltip: 'How often this really recurs in a running company — daily loops through one-time setup' },
  annoyance: { header: 'Annoyance', tooltip: 'Curated drudgery score: how much of a toil this is to do by hand (1–5)' },
  risk: { header: 'Risk', tooltip: 'Cost of getting it wrong — legal, tax, and security exposure (1–5)' },
  growth: { header: 'Growth impact', tooltip: 'How directly this process drives revenue and user growth (1–5)' },
}

function fieldOf(row: ProcessRow, col: Column): number | string {
  if (col === 'title') return row.title
  if (col === 'phase') return row.phase
  if (col === 'pct') return row.pct
  if (col === 'order') return row.timeOrder
  if (col === 'cadence') return row.cadenceRank
  if (col === 'annoyance') return row.annoyance
  if (col === 'risk') return row.risk
  if (col === 'growth') return row.growthImpact
  return row.totalSteps
}

// 1–5 score rendered as dots, tooltip carries the number.
function ScoreDots({ value, label }: { value: number; label: string }) {
  return (
    <span title={`${label}: ${value}/5`} className="font-mono text-xs tracking-tight text-zinc-300">
      <span className="text-emerald-300">{'●'.repeat(value)}</span>
      <span className="text-zinc-700">{'○'.repeat(5 - value)}</span>
    </span>
  )
}

function SortableTh({
  children, col, current, direction, onSort, sortable = true, className = '',
}: {
  children: ReactNode
  col: Column
  current: Column
  direction: Direction
  onSort: (col: Column) => void
  sortable?: boolean
  className?: string
}) {
  if (!sortable) {
    return <th scope="col" className={`sticky top-0 z-20 bg-zinc-950 px-2 py-2 font-normal ${className}`}>{children}</th>
  }
  const isCurrent = col === current
  const ariaSort: 'ascending' | 'descending' | 'none' = !isCurrent ? 'none' : direction === 'asc' ? 'ascending' : 'descending'
  return (
    <th scope="col" aria-sort={ariaSort} className={`sticky top-0 z-20 bg-zinc-950 px-2 py-2 font-normal ${className}`}>
      <button type="button" onClick={() => onSort(col)} className={`flex items-center gap-1 whitespace-nowrap hover:text-emerald-300 ${isCurrent ? 'text-emerald-300' : ''}`}>
        {children}
        {isCurrent && <span aria-hidden>{direction === 'asc' ? '▲' : '▼'}</span>}
      </button>
    </th>
  )
}

export default function ProcessesTable({ rows, phases }: { rows: ProcessRow[]; phases: string[] }) {
  const [column, setColumn] = useState<Column>('pct')
  const [direction, setDirection] = useState<Direction>('desc')
  const [phase, setPhase] = useState('all')
  const [query, setQuery] = useState('')

  // Shareable-view URL state (lib/urlState.ts), read once on mount so the static HTML is
  // untouched: ?order=<preset>, ?phase=<phase>, ?pq=<text> (pq, not q — this table co-mounts
  // with MegaTable on the homepage's process mode and the two filters must coexist). Invalid
  // values fall back to the defaults silently.
  /* eslint-disable react-hooks/set-state-in-effect -- one-time post-hydration sync FROM the URL
     (external system). The static HTML must render the default view, so these cannot be useState
     initializers (hydration mismatch); the effect runs once and renders at most one extra pass. */
  useEffect(() => {
    const p = readParams()
    const col = paramToColumn(p.get('order'))
    if (col !== null && col !== 'pct') {
      setColumn(col)
      setDirection(defaultDirection(col))
    }
    const ph = p.get('phase')
    if (ph !== null && phases.includes(ph)) setPhase(ph)
    const q = p.get('pq')
    if (q !== null && q !== '') setQuery(q)
    // Mount-only by design: the URL is the INITIAL view; after that the reader's clicks own it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  /* eslint-enable react-hooks/set-state-in-effect */

  // Every phase change (the <select> AND the in-row phase buttons) mirrors into ?phase=,
  // with the 'all' default elided.
  function changePhase(value: string) {
    setPhase(value)
    setParams({ phase: value === 'all' ? null : value })
  }

  // Sort changes mirror into ?order= (default pct elided). Direction is deliberately NOT in the
  // URL: a shared ordering opens in its preset direction — the five orderings are what's shared.
  function changeSort(col: Column, dir: Direction) {
    setColumn(col)
    setDirection(dir)
    setParams({ order: col === 'pct' ? null : columnToParam(col) })
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter(
      (r) =>
        (phase === 'all' || r.phase === phase)
        && (q === '' || r.title.toLowerCase().includes(q) || r.vendors.some((v) => v.label.toLowerCase().includes(q))),
    )
  }, [rows, phase, query])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = fieldOf(a, column)
      const bv = fieldOf(b, column)
      const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number)
      // Ties (cadence buckets, 1–5 scores) fall back to the founder timeline so the order is
      // deterministic and still reads as a journey inside each bucket.
      if (cmp === 0) return a.timeOrder - b.timeOrder
      return direction === 'desc' ? -cmp : cmp
    })
  }, [filtered, column, direction])

  function handleSort(col: Column) {
    if (col === column) setDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
    else changeSort(col, defaultDirection(col))
  }

  // Which ordering the adaptive metric column shows.
  const metric: Metric = (['order', 'cadence', 'annoyance', 'risk', 'growth'] as const).includes(column as Metric)
    ? (column as Metric)
    : 'cadence'

  function metricCell(r: ProcessRow): ReactNode {
    if (metric === 'order') return <span className="font-mono text-xs tabular-nums text-zinc-400">#{r.timeOrder}</span>
    if (metric === 'cadence') return <span className="text-xs text-zinc-400">{r.cadenceLabel}</span>
    if (metric === 'annoyance') return <ScoreDots value={r.annoyance} label="Annoyance" />
    if (metric === 'risk') return <ScoreDots value={r.risk} label="Risk" />
    return <ScoreDots value={r.growthImpact} label="Growth impact" />
  }

  return (
    <div className="space-y-3">
      <TableControls
        presets={PRESETS}
        activeColumn={column}
        presetActive={direction === defaultDirection(column)}
        onPreset={(col) => changeSort(col, defaultDirection(col))}
        scope={{
          value: phase,
          onChange: changePhase,
          ariaLabel: 'Filter by phase',
          options: [
            // Founder 2026-09-23: reads "areas" to users, not the internal "phases" term.
            { value: 'all', label: 'All areas' },
            ...phases.map((p) => ({ value: p, label: `${phaseIcon(p)} ${p}`.trim() })),
          ],
        }}
        query={query}
        onQuery={(value) => {
          setQuery(value)
          setParams({ pq: value.trim() === '' ? null : value })
        }}
      />
      <div className="-mx-5 overflow-x-auto border-y border-zinc-800 sm:mx-0 sm:rounded-2xl sm:border md:overflow-x-visible">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-left text-[10px] uppercase tracking-widest text-zinc-400">
              <SortableTh col="title" current={column} direction={direction} onSort={handleSort}><span title="A real startup operating process, mapped step by step">Process</span></SortableTh>
              <SortableTh col="phase" current={column} direction={direction} onSort={handleSort} className="hidden md:table-cell"><span title="Where in the life of the company this process happens (formation, finance, hiring…)">Phase</span></SortableTh>
              <SortableTh col="pct" current={column} direction={direction} onSort={handleSort}><span title="Agent ceiling: the share of this process's steps an AI agent can run today — the rest still needs forms or people">Current agent ceiling</span></SortableTh>
              <SortableTh col="steps" current={column} direction={direction} onSort={handleSort} className="hidden sm:table-cell"><span title="Agent-runnable steps out of the total steps in the process">Steps</span></SortableTh>
              {/* Adaptive metric column: shows whichever of the five orderings is active (falls
                  back to cadence) — the ranked-on number is always on screen. */}
              <SortableTh col={metric} current={column} direction={direction} onSort={handleSort}><span title={METRIC_META[metric].tooltip}>{METRIC_META[metric].header}</span></SortableTh>
              <SortableTh col="title" current={column} direction={direction} onSort={handleSort} sortable={false} className="hidden lg:table-cell"><span title="The main software this process runs on — judged vendors link to their product page">Software</span></SortableTh>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/70">
            {sorted.map((r) => (
              <tr key={r.slug} className="transition hover:bg-zinc-800/70">
                <td className="max-w-[260px] px-2 py-2">
                  <span className="flex items-center gap-1.5">
                    <IconChip icon={r.icon} title={`${r.title} — ${r.phase} process`} />
                    <Link href={`/processes/${r.slug}`} className="font-medium hover:text-emerald-300">
                      {r.title}
                    </Link>
                  </span>
                </td>
                <td className="hidden px-2 py-2 text-xs text-zinc-500 md:table-cell">
                  {/* Founder 2026-09-18: the phase is the filter — click it to scope the table
                      to that phase; click again (or pick All) to clear. */}
                  <button
                    type="button"
                    onClick={() => changePhase(phase === r.phase ? 'all' : r.phase)}
                    title={`${phaseTooltip(r.phase)} — click to ${phase === r.phase ? 'clear the phase filter' : `filter to ${r.phase}`}`}
                    className={`flex cursor-pointer items-center gap-1.5 whitespace-nowrap transition hover:text-emerald-300 ${phase === r.phase ? 'text-emerald-300' : ''}`}
                  >
                    <IconChip icon={phaseIcon(r.phase)} title={phaseTooltip(r.phase)} />
                    {r.phase}
                  </button>
                </td>
                <td className="px-2 py-2">
                  <CeilingBar pct={r.pct} />
                </td>
                <td className="hidden px-2 py-2 font-mono text-xs tabular-nums text-zinc-400 sm:table-cell">
                  <Link
                    href={`/processes/${r.slug}#steps`}
                    title={`${r.agentSteps} of ${r.totalSteps} steps are agent-runnable — open the step-by-step breakdown`}
                    className="underline decoration-zinc-800 underline-offset-2 transition hover:text-emerald-300"
                  >
                    {r.agentSteps}/{r.totalSteps}
                  </Link>
                </td>
                <td className="whitespace-nowrap px-2 py-2">{metricCell(r)}</td>
                <td className="hidden px-2 py-2 lg:table-cell">
                  <span className="flex flex-wrap gap-1">
                    {r.vendors.slice(0, 3).map((v) =>
                      v.arena ? (
                        // Founder 2026-09-25: a vendor chip opens the PROCESS through that
                        // vendor (?via= lens, lib/processLens.ts) — not the vendor's own page.
                        <Link key={v.label} href={`/processes/${r.slug}?via=${v.arena}:${v.id}`} title={`Open ${r.title} viewed via ${v.label} — every step resolved to it where it serves`} className="inline-flex items-center gap-1 rounded-full border border-zinc-700 py-px pl-0.5 pr-1.5 text-[10px] text-zinc-300 transition hover:border-emerald-400/60 hover:text-emerald-300">
                          <ProductLogoView product={{ id: v.id, name: v.label }} size={14} hasLogo={v.hasLogo} />
                          {v.label}
                        </Link>
                      ) : (
                        <span key={v.label} title={`${v.label} — not yet judged on ProductArena`} className="inline-flex items-center gap-1 rounded-full border border-zinc-800 py-px pl-0.5 pr-1.5 text-[10px] text-zinc-500">
                          <ProductLogoView product={{ id: v.id, name: v.label }} size={14} hasLogo={v.hasLogo} />
                          {v.label}
                        </span>
                      ),
                    )}
                    {r.vendors.length > 3 && (
                      <Link
                        href={`/processes/${r.slug}`}
                        className="text-[10px] text-zinc-500 transition hover:text-emerald-300"
                        title={`${r.vendors.slice(3).map((v) => v.label).join(', ')} — see the full per-step rankings`}
                      >
                        +{r.vendors.length - 3} →
                      </Link>
                    )}
                  </span>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-zinc-500">
                  {/* Echo the active filters — same convention as the product tables. */}
                  No processes match{query.trim() ? <> &ldquo;{query}&rdquo;</> : ''}{phase !== 'all' ? ` in the ${phase} phase` : ''}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
