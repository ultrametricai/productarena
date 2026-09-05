'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import CeilingBar from '@/components/CeilingBar'
import TableControls from '@/components/TableControls'

// The /processes controller: one dense sortable/filterable table over the whole founder-process
// corpus (mega-table pattern — see components/MegaTable.tsx), replacing the phase-grouped card
// list. Rows are pre-flattened server-side; every row clicks out to its own process page.

export interface ProcessRow {
  slug: string
  title: string
  phase: string
  pct: number
  agentSteps: number
  totalSteps: number
  minutes: number
  complexity: string
  vendors: Array<{ label: string; arena: string | null }>
}

type Column = 'title' | 'phase' | 'pct' | 'steps' | 'minutes'
type Direction = 'asc' | 'desc'

const PRESETS: Array<{ col: Column; label: string }> = [
  { col: 'pct', label: 'Most automatable' },
  { col: 'steps', label: 'Most steps' },
  { col: 'minutes', label: 'Longest' },
]

function fieldOf(row: ProcessRow, col: Column): number | string {
  if (col === 'title') return row.title
  if (col === 'phase') return row.phase
  if (col === 'pct') return row.pct
  if (col === 'steps') return row.totalSteps
  return row.minutes
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
          options: [{ value: 'all', label: 'All phases' }, ...phases.map((p) => ({ value: p, label: p }))],
        }}
        query={query}
        onQuery={setQuery}
      />
      <div className="overflow-x-auto rounded-2xl border border-zinc-800 md:overflow-x-visible">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-left text-[10px] uppercase tracking-widest text-zinc-400">
              <SortableTh col="title" current={column} direction={direction} onSort={handleSort}>Process</SortableTh>
              <SortableTh col="phase" current={column} direction={direction} onSort={handleSort} className="hidden md:table-cell">Phase</SortableTh>
              <SortableTh col="pct" current={column} direction={direction} onSort={handleSort}>Agent ceiling</SortableTh>
              <SortableTh col="steps" current={column} direction={direction} onSort={handleSort} className="hidden sm:table-cell">Steps</SortableTh>
              <SortableTh col="minutes" current={column} direction={direction} onSort={handleSort} className="hidden sm:table-cell">Est. time</SortableTh>
              <SortableTh col="title" current={column} direction={direction} onSort={handleSort} sortable={false} className="hidden lg:table-cell">Software</SortableTh>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/70">
            {sorted.map((r) => (
              <tr key={r.slug} className="transition hover:bg-zinc-900/50">
                <td className="max-w-[260px] px-2 py-2">
                  <Link href={`/processes/${r.slug}`} className="font-medium hover:text-emerald-300">
                    {r.title}
                  </Link>
                </td>
                <td className="hidden px-2 py-2 text-xs text-zinc-500 md:table-cell">{r.phase}</td>
                <td className="px-2 py-2">
                  <span className="flex items-center gap-2">
                    <CeilingBar pct={r.pct} />
                    <span className="font-mono text-xs tabular-nums text-zinc-400">{r.pct}%</span>
                  </span>
                </td>
                <td className="hidden px-2 py-2 font-mono text-xs tabular-nums text-zinc-400 sm:table-cell">
                  {r.agentSteps}/{r.totalSteps}
                </td>
                <td className="hidden px-2 py-2 font-mono text-xs tabular-nums text-zinc-400 sm:table-cell">
                  {r.minutes >= 60 ? `${Math.round(r.minutes / 60)}h` : `${r.minutes}m`}
                </td>
                <td className="hidden px-2 py-2 lg:table-cell">
                  <span className="flex flex-wrap gap-1">
                    {r.vendors.slice(0, 3).map((v) =>
                      v.arena ? (
                        <Link key={v.label} href={`/arena/${v.arena}`} className="rounded-full border border-zinc-700 px-1.5 py-px text-[10px] text-zinc-300 transition hover:border-emerald-400/60 hover:text-emerald-300">
                          {v.label}
                        </Link>
                      ) : (
                        <span key={v.label} className="rounded-full border border-zinc-800 px-1.5 py-px text-[10px] text-zinc-500">
                          {v.label}
                        </span>
                      ),
                    )}
                    {r.vendors.length > 3 && <span className="text-[10px] text-zinc-600">+{r.vendors.length - 3}</span>}
                  </span>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-zinc-500">No processes match.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
