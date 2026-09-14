'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import CeilingBar from '@/components/CeilingBar'
import IconChip from '@/components/IconChip'
import ProductLogoView from '@/components/ProductLogoView'
import TableControls from '@/components/TableControls'
import { phaseIcon, phaseTooltip } from '@/lib/processIcons'

// The /processes controller: one dense sortable/filterable table over the whole founder-process
// corpus (mega-table pattern — see components/MegaTable.tsx), replacing the phase-grouped card
// list. Rows are pre-flattened server-side; every row clicks out to its own process page.
// Each row leads with its curated process icon (lib/processIcons.ts) and its software chips
// carry real product logos (hasLogo resolved server-side — ProductLogoView is client-safe).

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
  vendors: Array<{ id: string; label: string; arena: string | null; hasLogo: boolean }>
}

type Column = 'title' | 'phase' | 'pct' | 'steps'
type Direction = 'asc' | 'desc'

const PRESETS: Array<{ col: Column; label: string }> = [
  { col: 'pct', label: 'Most automatable' },
  { col: 'steps', label: 'Most steps' },
]

function fieldOf(row: ProcessRow, col: Column): number | string {
  if (col === 'title') return row.title
  if (col === 'phase') return row.phase
  if (col === 'pct') return row.pct
  return row.totalSteps
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
      return direction === 'desc' ? -cmp : cmp
    })
  }, [filtered, column, direction])

  function handleSort(col: Column) {
    if (col === column) setDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setColumn(col)
      setDirection(col === 'title' || col === 'phase' ? 'asc' : 'desc')
    }
  }

  return (
    <div className="space-y-3">
      <TableControls
        presets={PRESETS}
        activeColumn={column}
        presetActive={direction === 'desc'}
        onPreset={(col) => {
          setColumn(col)
          setDirection('desc')
        }}
        scope={{
          value: phase,
          onChange: setPhase,
          ariaLabel: 'Filter by phase',
          options: [
            { value: 'all', label: 'All phases' },
            ...phases.map((p) => ({ value: p, label: `${phaseIcon(p)} ${p}`.trim() })),
          ],
        }}
        query={query}
        onQuery={setQuery}
      />
      <div className="overflow-x-auto rounded-2xl border border-zinc-800 md:overflow-x-visible">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-left text-[10px] uppercase tracking-widest text-zinc-400">
              <SortableTh col="title" current={column} direction={direction} onSort={handleSort}><span title="A real startup operating process, mapped step by step">Process</span></SortableTh>
              <SortableTh col="phase" current={column} direction={direction} onSort={handleSort} className="hidden md:table-cell"><span title="Where in the life of the company this process happens (formation, finance, hiring…)">Phase</span></SortableTh>
              <SortableTh col="pct" current={column} direction={direction} onSort={handleSort}><span title="Agent ceiling: the share of this process's steps an AI agent can run today — the rest still needs forms or people">Current agent ceiling</span></SortableTh>
              <SortableTh col="steps" current={column} direction={direction} onSort={handleSort} className="hidden sm:table-cell"><span title="Agent-runnable steps out of the total steps in the process">Steps</span></SortableTh>
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
                  <span className="flex items-center gap-1.5 whitespace-nowrap">
                    <IconChip icon={phaseIcon(r.phase)} title={phaseTooltip(r.phase)} />
                    {r.phase}
                  </span>
                </td>
                <td className="px-2 py-2">
                  <CeilingBar pct={r.pct} />
                </td>
                <td className="hidden px-2 py-2 font-mono text-xs tabular-nums text-zinc-400 sm:table-cell">
                  {r.agentSteps}/{r.totalSteps}
                </td>
                <td className="hidden px-2 py-2 lg:table-cell">
                  <span className="flex flex-wrap gap-1">
                    {r.vendors.slice(0, 3).map((v) =>
                      v.arena ? (
                        <Link key={v.label} href={`/arena/${v.arena}`} title={`${v.label} — judged in the ${v.arena} arena`} className="inline-flex items-center gap-1 rounded-full border border-zinc-700 py-px pl-0.5 pr-1.5 text-[10px] text-zinc-300 transition hover:border-emerald-400/60 hover:text-emerald-300">
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
                      <span className="text-[10px] text-zinc-600" title={r.vendors.slice(3).map((v) => v.label).join(', ')}>
                        +{r.vendors.length - 3}
                      </span>
                    )}
                  </span>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-zinc-500">
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
