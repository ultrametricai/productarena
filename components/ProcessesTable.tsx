'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { Fragment, useEffect, useMemo, useState } from 'react'
import CeilingBar from '@/components/CeilingBar'
import IconChip from '@/components/IconChip'
import ProductLogoView from '@/components/ProductLogoView'
import GeoDropdown from '@/components/GeoDropdown'
import TableControls from '@/components/TableControls'
import { useGeoSelection } from '@/components/useGeoSelection'
import { GEO_SCOPE_GLYPH } from '@/lib/geoPreference'
import { phaseIcon, phaseTooltip } from '@/lib/processIcons'
import { readParams, setParams } from '@/lib/urlState'

// The /processes controller: one dense sortable/filterable table over the whole founder-process
// corpus (mega-table pattern — see components/MegaTable.tsx), replacing the phase-grouped card
// list. Rows are pre-flattened server-side; every row clicks out to its own process page.
// Each row leads with its curated process icon (lib/processIcons.ts) and its software chips
// carry real product logos (hasLogo resolved server-side — ProductLogoView is client-safe).
//
// Grouped-by-AREA default (founder 2026-09-28): the table opens grouped into friendly
// founder-lifecycle areas ("Starting up", "Ongoing compliance & tax", … — the curated
// phase→area map in lib/processRows.ts), area header rows carrying the process count and the
// area's average agent ceiling, rows ordered by timeOrder within each area. Grouping and
// cross-corpus sorting can't coexist honestly, so picking ANY rank-by preset or column sort
// switches to the flat sorted table; a subtle "grouped by area" reset pill returns. The
// grouped view is the no-param default — the ?order= URL contract below is unchanged.
//
// ONE combined view (founder 2026-09-29): the curated end-to-end chains are rows in this same
// table. Founder follow-up the same day ("we don't need to say 'playbook' on those playbooks…
// playbooks are still processes — just more abstract or general processes with higher
// complexity"): no 'playbook' chip and no leading group — in the grouped default each chain row
// folds into its DOMINANT area (its first constituent process's area) at that constituent's
// timeOrder position; the constituent icon chips + route-dot strip signal composition without a
// category label. The flat view keeps its semantics: interleaved where the sort applies to the
// aggregate ceiling/steps/title, appended after the processes on the per-process orderings.
// The /processes page passes `playbooks`; surfaces that omit it (the homepage's process mode)
// render exactly the process-only table they always did.
//
// Rank-by presets (founder ask 2026-09-18) — beyond the agent ceiling, five curated orderings
// over the corpus (fields on processes/corpus.json, coverage-tested):
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
  // Friendly display area over the internal phase (lib/processRows.ts PHASE_AREA — curated and
  // totality-tested) plus its founder-lifecycle rank (AREA_ORDER index), both resolved
  // server-side so this client component never imports the node-only builder.
  area: string
  areaRank: number
  // The GEO dimension (founder 2026-09-28) — required on every corpus process. While a non-US
  // country is selected (GeoSwitcher / lib/geoPreference.ts) each row wears its scope glyph
  // (🌐 global / 🇺🇸 US / 🏛 state); the default view is untouched. Display only — no re-sorting.
  geoScope: 'global' | 'us' | 'us-state'
  pct: number
  agentSteps: number
  totalSteps: number
  complexity: string
  // The five-orderings fields (curated in processes/corpus.json; cadence label/rank resolved
  // server-side so this component stays free of the node-only cadence helpers).
  timeOrder: number
  cadenceLabel: string
  cadenceRank: number
  annoyance: number
  risk: number
  growthImpact: number
  vendors: Array<{ id: string; label: string; arena: string | null; hasLogo: boolean }>
}

// A curated end-to-end chain (journeys/chains.json) as a row in the SAME table (founder
// 2026-09-29: one view for the processes under the process search — the separate playbooks
// section is gone). Serialized server-side by lib/processRows.ts buildPlaybookRows.
export interface PlaybookRow {
  id: string
  title: string
  tagline: string
  icon: string
  href: string
  // The dominant area — the area of the chain's FIRST constituent process (founder 2026-09-29:
  // playbooks are still processes, so a chain row folds into an area group, not its own group)
  // — with its lifecycle rank and that first constituent's timeOrder, all resolved server-side,
  // so the grouped view slots the row into the area at its journey position.
  dominantArea: string
  areaRank: number
  timeOrder: number
  // The constituent processes (icon chips in the Phase column) and their distinct phases —
  // the phase filter scopes playbooks by membership, not by a single phase they don't have.
  processes: Array<{ id: string; icon: string; title: string; phase: string }>
  phases: string[]
  // Aggregate agent ceiling across every step of every process in the chain.
  pct: number
  agentSteps: number
  totalSteps: number
  steps: Array<{ label: string; route: 'agent' | 'form' | 'person'; legalSignature: boolean }>
}

type Column = 'title' | 'phase' | 'pct' | 'steps' | 'order' | 'cadence' | 'annoyance' | 'risk' | 'growth'
type Direction = 'asc' | 'desc'

// Columns whose preset/default direction is ascending (timeline runs first→last; regularity
// runs daily→once). Everything numeric-desc otherwise.
const ASC_DEFAULT = new Set<Column>(['title', 'phase', 'order', 'cadence'])
const defaultDirection = (col: Column): Direction => (ASC_DEFAULT.has(col) ? 'asc' : 'desc')

// Shareable ?order= values (founder 2026-09-21, lib/urlState.ts): every pickable column, with
// the timeOrder column spelled 'timeline' in the URL (?order=order reads badly; ?order=timeline
// says what it is). The UI's default sort (pct — the agent ceiling) never appears in the URL,
// and bad values fall back silently — since 2026-09-28 the no-param default is the grouped-by-
// area view, and any valid ?order= (pct included) opens the flat sorted table. Both `timeline`
// and the raw `order` are accepted on read.
const ALL_COLUMNS: readonly Column[] = ['title', 'phase', 'pct', 'steps', 'order', 'cadence', 'annoyance', 'risk', 'growth']
const columnToParam = (col: Column): string => (col === 'order' ? 'timeline' : col)
function paramToColumn(value: string | null): Column | null {
  if (value === null) return null
  if (value === 'timeline') return 'order'
  return (ALL_COLUMNS as readonly string[]).includes(value) ? (value as Column) : null
}

const PRESETS: Array<{ col: Column; label: string; icon: string }> = [
  { col: 'pct', label: 'Most automatable', icon: '⚡' },
  { col: 'steps', label: 'Most steps', icon: '🪜' },
  { col: 'order', label: 'Founder timeline', icon: '🗓️' },
  { col: 'cadence', label: 'Regularity', icon: '🔁' },
  { col: 'annoyance', label: 'Most annoying', icon: '😤' },
  { col: 'risk', label: 'Riskiest', icon: '⚠️' },
  { col: 'growth', label: 'Growth-focused', icon: '📈' },
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
  // null while the grouped view is active — no column is sorted-on, so none reads as current.
  current: Column | null
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

// The columns a playbook honestly has a value for (aggregate ceiling/steps, its name). On any
// other sort — the five curated per-process orderings and phase — playbooks lack the field, so
// the flat view lists them AFTER the sorted processes (missing values last), ceiling-desc.
const PLAYBOOK_SORTABLE = new Set<Column>(['title', 'pct', 'steps'])
function playbookFieldOf(row: PlaybookRow, col: Column): number | string {
  if (col === 'title') return row.title
  if (col === 'pct') return row.pct
  return row.totalSteps
}

// The flat view's union row type: process and playbook rows sorted through one comparator.
type FlatItem = { kind: 'process'; row: ProcessRow } | { kind: 'playbook'; row: PlaybookRow }

export default function ProcessesTable({ rows, phases, playbooks = [] }: { rows: ProcessRow[]; phases: string[]; playbooks?: PlaybookRow[] }) {
  // Grouped-by-area is the default view; column/direction only apply once the reader sorts
  // (which flips grouped off — grouping and cross-corpus sorting can't coexist honestly).
  const [grouped, setGrouped] = useState(true)
  const [column, setColumn] = useState<Column>('pct')
  const [direction, setDirection] = useState<Direction>('desc')
  const [phase, setPhase] = useState('all')
  const [query, setQuery] = useState('')
  // Non-null while the reader has a non-US country selected (GeoSwitcher seeds the shared
  // store) — each row then wears its geoScope glyph. Null in the static HTML and the default
  // view, so the no-selection markup is untouched. Display only: never re-sorts.
  const geo = useGeoSelection()

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
    if (col !== null) {
      // Any shared ?order= opens the FLAT sorted table — grouped is the no-param default.
      // ?order=pct is accepted on read (it shares the ceiling-sorted flat view) even though
      // the UI still elides pct on write, per the original contract.
      setGrouped(false)
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
  // Any sort leaves the grouped default for the flat table.
  function changeSort(col: Column, dir: Direction) {
    setGrouped(false)
    setColumn(col)
    setDirection(dir)
    setParams({ order: col === 'pct' ? null : columnToParam(col) })
  }

  // The "grouped by area" reset pill: back to the default view, with a clean ?order=.
  function resetToGrouped() {
    setGrouped(true)
    setColumn('pct')
    setDirection('desc')
    setParams({ order: null })
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter(
      (r) =>
        (phase === 'all' || r.phase === phase)
        && (q === '' || r.title.toLowerCase().includes(q) || r.vendors.some((v) => v.label.toLowerCase().includes(q))),
    )
  }, [rows, phase, query])

  // Playbooks live in the same table under the same controls (founder 2026-09-29): the phase
  // filter keeps a playbook while any of its constituent processes is in that phase; the text
  // filter matches its name, tagline, and constituent process titles.
  const filteredPlaybooks = useMemo(() => {
    const q = query.trim().toLowerCase()
    return playbooks.filter(
      (p) =>
        (phase === 'all' || p.phases.includes(phase))
        && (q === ''
          || p.title.toLowerCase().includes(q)
          || p.tagline.toLowerCase().includes(q)
          || p.processes.some((t) => t.title.toLowerCase().includes(q))),
    )
  }, [playbooks, phase, query])

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

  // The flat sorted view over BOTH row kinds. Where the active column applies to playbooks
  // (title, aggregate ceiling, steps) they interleave with the processes through one comparator;
  // on the per-process orderings (timeline, cadence, annoyance, risk, growth, phase) they lack
  // the field, so they follow the sorted processes — missing values last, ceiling-desc.
  const flatItems = useMemo<FlatItem[]>(() => {
    const processItems: FlatItem[] = sorted.map((row) => ({ kind: 'process', row }))
    if (filteredPlaybooks.length === 0) return processItems
    if (!PLAYBOOK_SORTABLE.has(column)) {
      const tail: FlatItem[] = [...filteredPlaybooks]
        .sort((a, b) => b.pct - a.pct || a.title.localeCompare(b.title))
        .map((row) => ({ kind: 'playbook', row }))
      return [...processItems, ...tail]
    }
    const playbookItems: FlatItem[] = filteredPlaybooks.map((row) => ({ kind: 'playbook', row }))
    return [...processItems, ...playbookItems].sort((a, b) => {
      const av = a.kind === 'process' ? fieldOf(a.row, column) : playbookFieldOf(a.row, column)
      const bv = b.kind === 'process' ? fieldOf(b.row, column) : playbookFieldOf(b.row, column)
      const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number)
      if (cmp === 0) {
        // Process–process ties keep the founder-timeline fallback the table always had;
        // ties involving a playbook resolve by title so the order stays deterministic.
        if (a.kind === 'process' && b.kind === 'process') return a.row.timeOrder - b.row.timeOrder
        return a.row.title.localeCompare(b.row.title)
      }
      return direction === 'desc' ? -cmp : cmp
    })
  }, [sorted, filteredPlaybooks, column, direction])

  function handleSort(col: Column) {
    // From the grouped view any header click starts a fresh flat sort in the column's preset
    // direction (there's no current sort to toggle).
    if (grouped) changeSort(col, defaultDirection(col))
    else if (col === column) setDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
    else changeSort(col, defaultDirection(col))
  }

  // The grouped view's area sections: filtered rows bucketed by area, areas in founder-lifecycle
  // order (areaRank rides on every row), rows in timeOrder within each area. Chain rows fold
  // into their DOMINANT area (founder 2026-09-29: playbooks are still processes — no leading
  // 'Playbooks' group) at their first constituent's timeOrder; on a timeOrder tie the plain
  // process leads (a chain shares its first constituent's timeOrder, so the constituent reads
  // first, then the chain that starts with it), chain–chain ties resolve by title. The phase
  // filter above collapses this to the matching area(s) for free — filtered/filteredPlaybooks
  // already only hold that phase's rows.
  const groups = useMemo(() => {
    if (!grouped) return null
    const byArea = new Map<string, { areaRank: number; items: FlatItem[] }>()
    const add = (area: string, areaRank: number, item: FlatItem) => {
      const bucket = byArea.get(area)
      if (bucket) bucket.items.push(item)
      else byArea.set(area, { areaRank, items: [item] })
    }
    for (const r of filtered) add(r.area, r.areaRank, { kind: 'process', row: r })
    for (const p of filteredPlaybooks) add(p.dominantArea, p.areaRank, { kind: 'playbook', row: p })
    return [...byArea.entries()]
      .map(([area, g]) => ({
        area,
        areaRank: g.areaRank,
        items: [...g.items].sort(
          (a, b) =>
            a.row.timeOrder - b.row.timeOrder
            || (a.kind === b.kind ? 0 : a.kind === 'process' ? -1 : 1)
            || a.row.title.localeCompare(b.row.title),
        ),
      }))
      .sort((a, b) => a.areaRank - b.areaRank)
  }, [filtered, filteredPlaybooks, grouped])

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

  // One process row — identical markup in the grouped and flat views (the founder ask keeps the
  // existing columns/rows unchanged under the area headers).
  function processRow(r: ProcessRow): ReactNode {
    return (
      <tr key={r.slug} className="transition hover:bg-zinc-800/70">
        <td className="max-w-[260px] px-2 py-2">
          <span className="flex items-center gap-1.5">
            <IconChip icon={r.icon} title={`${r.title} — ${r.phase} process`} />
            <Link href={`/processes/${r.slug}`} className="font-medium hover:text-emerald-300">
              {r.title}
            </Link>
            {geo !== null && (
              <span
                aria-hidden
                className="text-[10px] opacity-70"
                title={GEO_SCOPE_GLYPH[r.geoScope].label}
              >
                {GEO_SCOPE_GLYPH[r.geoScope].glyph}
              </span>
            )}
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
                <span key={v.label} title={`${v.label} — not yet judged on Ultrametric`} className="inline-flex items-center gap-1 rounded-full border border-zinc-800 py-px pl-0.5 pr-1.5 text-[10px] text-zinc-500">
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
    )
  }

  // One chain row — no category label (founder 2026-09-29: "we don't need to say 'playbook'…
  // playbooks are still processes"): the tagline, multi-icon constituent chips, and per-step
  // route strip naturally signal composition under the same columns — constituent-process chips
  // where a process shows its phase, the aggregate ceiling, agent/total steps with the route
  // dots, and an honest dash on the per-process metric axes it doesn't have.
  function playbookRow(p: PlaybookRow): ReactNode {
    return (
      <tr key={`playbook-${p.id}`} className="transition hover:bg-zinc-800/70">
        <td className="max-w-[260px] px-2 py-2">
          <span className="flex items-center gap-1.5">
            <IconChip icon={p.icon} title={`${p.title} — multi-process`} />
            <Link href={p.href} className="font-medium hover:text-emerald-300">
              {p.title}
            </Link>
          </span>
          {/* No tagline (founder 2026-09-29: titles are self-evident) — the field stays as
              search-matching data only. */}
        </td>
        <td className="hidden px-2 py-2 md:table-cell">
          {/* Where a process shows its one phase, a playbook spans several processes — the old
              playbooks table's 'Processes' chips, at the same breakpoint. */}
          <span className="flex flex-wrap items-center gap-1 text-xs text-zinc-400">
            {p.processes.map((t, i) => (
              <IconChip key={`${t.id}-${i}`} icon={t.icon} title={`${t.title} — ${t.phase} process`} />
            ))}
            <span className="text-zinc-500">{p.processes.length}</span>
          </span>
        </td>
        <td className="px-2 py-2">
          <CeilingBar pct={p.pct} />
        </td>
        <td className="hidden px-2 py-2 sm:table-cell">
          <span className="flex items-center gap-1.5 whitespace-nowrap font-mono text-xs tabular-nums text-zinc-400">
            <Link
              href={p.href}
              title={`${p.agentSteps} of ${p.totalSteps} combined steps are agent-runnable — open the start-to-finish walkthrough`}
              className="underline decoration-zinc-800 underline-offset-2 transition hover:text-emerald-300"
            >
              {p.agentSteps}/{p.totalSteps}
            </Link>
          </span>
        </td>
        <td className="whitespace-nowrap px-2 py-2">
          <span className="text-xs text-zinc-600" title="Multi-process row — the constituent processes carry the timeline/cadence/annoyance/risk/growth values; the combined row ranks by its aggregate ceiling">
            —
          </span>
        </td>
        <td className="hidden px-2 py-2 lg:table-cell">
          <Link href={p.href} className="whitespace-nowrap text-sm font-medium text-emerald-400 transition hover:text-emerald-300" title="A multi-process row spans the software of each process it runs — open it for the per-step options">
            Go to process →
          </Link>
        </td>
      </tr>
    )
  }

  return (
    <div className="space-y-3">
      <TableControls
        presetsAsDropdown
        after={<GeoDropdown />}
        presets={PRESETS}
        activeColumn={column}
        // In the grouped default no preset is "on" — the pills light up only once the reader
        // has sorted into the flat view (and the mobile "Rank by" select shows its placeholder).
        presetActive={!grouped && direction === defaultDirection(column)}
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
      {/* Sorting flattens the table (cross-corpus order and area grouping can't coexist) — this
          subtle pill is the way back to the grouped default. */}
      {!grouped && (
        <p className="text-xs text-zinc-500">
          Sorted across all areas —{' '}
          <button
            type="button"
            onClick={resetToGrouped}
            title="Back to the default view — processes grouped into founder-lifecycle areas"
            className="rounded-full border border-zinc-800 px-2.5 py-0.5 text-[11px] text-zinc-400 transition hover:border-emerald-400/40 hover:text-emerald-300"
          >
            ← grouped by area
          </button>
        </p>
      )}
      <div className="-mx-5 overflow-x-auto border-y border-zinc-800 sm:mx-0 sm:rounded-2xl sm:border md:overflow-x-visible">
        <table className="w-full border-collapse text-sm">
          <thead>
            {/* In the grouped view no column is sorted-on (current=null, aria-sort none) —
                clicking any header sorts that column and flattens the table. */}
            <tr className="border-b border-zinc-800 text-left text-[10px] uppercase tracking-widest text-zinc-400">
              <SortableTh col="title" current={grouped ? null : column} direction={direction} onSort={handleSort}><span title="A real startup operating process, mapped step by step">Process</span></SortableTh>
              <SortableTh col="phase" current={grouped ? null : column} direction={direction} onSort={handleSort} className="hidden md:table-cell"><span title="Where in the life of the company this process happens (formation, finance, hiring…)">Phase</span></SortableTh>
              <SortableTh col="pct" current={grouped ? null : column} direction={direction} onSort={handleSort}><span title="Agent ceiling: the share of this process's steps an AI agent can run today — the rest still needs forms or people">Agent ceiling</span></SortableTh>
              <SortableTh col="steps" current={grouped ? null : column} direction={direction} onSort={handleSort} className="hidden sm:table-cell"><span title="Agent-runnable steps out of the total steps in the process">Steps</span></SortableTh>
              {/* Adaptive metric column: shows whichever of the five orderings is active (falls
                  back to cadence) — the ranked-on number is always on screen. */}
              <SortableTh col={metric} current={grouped ? null : column} direction={direction} onSort={handleSort}><span title={METRIC_META[metric].tooltip}>{METRIC_META[metric].header}</span></SortableTh>
              <SortableTh col="title" current={grouped ? null : column} direction={direction} onSort={handleSort} sortable={false} className="hidden lg:table-cell"><span title="The main software this process runs on — judged vendors link to their product page">Software</span></SortableTh>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/70">
            {/* Grouped default (founder 2026-09-29: playbooks are still processes — chain rows
                fold into their dominant area at their timeline position, no leading group). */}
            {groups !== null
              ? groups.map((g) => (
                  <Fragment key={g.area}>
                    {/* Area header: friendly name + row count (chain rows count as processes —
                        founder 2026-09-29). colSpan spans whatever columns the breakpoint shows
                        (hidden columns collapse it), so the header reads fine at the homepage
                        width and in the mobile edge-to-edge table. */}
                    <tr className="bg-zinc-900/50">
                      <th colSpan={6} scope="colgroup" className="px-2 pb-1.5 pt-3 text-left font-normal">
                        <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                          <span className="font-display text-sm font-semibold tracking-tight text-zinc-100">{g.area}</span>
                          <span className="text-[11px] text-zinc-500">
                            {g.items.length} {g.items.length === 1 ? 'process' : 'processes'}
                          </span>
                        </span>
                      </th>
                    </tr>
                    {g.items.map((it) => (it.kind === 'playbook' ? playbookRow(it.row) : processRow(it.row)))}
                  </Fragment>
                ))
              : flatItems.map((it) => (it.kind === 'playbook' ? playbookRow(it.row) : processRow(it.row)))}
            {sorted.length === 0 && filteredPlaybooks.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-zinc-500">
                  {/* Echo the active filters — same convention as the product tables. One
                      vocabulary (founder 2026-09-29): chain rows are processes too. */}
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
