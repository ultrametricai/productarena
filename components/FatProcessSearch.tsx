'use client'

import Link from 'next/link'
import { useMemo, useRef, useState } from 'react'
import IconChip from '@/components/IconChip'

// The /processes hero search (founder 2026-09-25: "a nice fat search bar instead of" the intro
// paragraph). Client-side substring match over the pre-serialized rows — type to see matching
// entries instantly, click through (or Enter for the first hit). Pure lookup UI: no judged
// numbers, no URL state; the sortable table below keeps its own ?pq filter.
// Since the combined-table ask (founder 2026-09-29) the rows include the end-to-end chains too
// — same matching, href pointing at the chain page. Same-day follow-up ("we don't need to say
// 'playbook'… playbooks are still processes"): no chip and no separate count — chains count in
// the one processes N and the hover distinguisher reads 'multi-process'.
export interface FatSearchRow {
  href: string
  title: string
  icon: string
  // The process's phase — or the literal 'playbook' for a chain row, kept as invisible matching
  // data so typing "playbook" still surfaces them (the visible copy never says it).
  phase: string
  pct: number
  playbook?: boolean
}

const MAX_RESULTS = 8

export default function FatProcessSearch({ rows }: { rows: FatSearchRow[] }) {
  const [q, setQ] = useState('')
  const [focused, setFocused] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const matches = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (needle === '') return []
    const starts = rows.filter((r) => r.title.toLowerCase().startsWith(needle))
    const contains = rows.filter(
      (r) => !r.title.toLowerCase().startsWith(needle) && (r.title.toLowerCase().includes(needle) || r.phase.toLowerCase().includes(needle)),
    )
    return [...starts, ...contains].slice(0, MAX_RESULTS)
  }, [rows, q])

  // One unified count (founder 2026-09-29: playbooks are still processes) — chain rows count
  // in N alongside every plain process.
  const placeholder = `Search ${rows.length} processes — payroll, SOC 2, EIN…`

  return (
    <div ref={rootRef} className="relative mx-auto mt-4 max-w-xl">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && matches[0]) window.location.href = matches[0].href
        }}
        placeholder={placeholder}
        aria-label="Search processes"
        className="w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-5 py-3.5 text-base text-zinc-100 shadow-lg shadow-black/20 placeholder:text-zinc-500 focus:border-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
      />
      {focused && matches.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 py-1 text-left shadow-2xl shadow-black/50">
          {matches.map((r) => (
            <Link
              key={r.href}
              href={r.href}
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-zinc-200 transition hover:bg-zinc-800 hover:text-emerald-300"
            >
              <IconChip icon={r.icon} title={r.playbook ? `${r.title} — multi-process` : `${r.title} — ${r.phase} process`} />
              <span className="min-w-0 flex-1 truncate">{r.title}</span>
              <span className="shrink-0 font-mono text-[11px] tabular-nums text-zinc-500" title="Agent ceiling — share of steps an agent can run today">
                {r.pct}%
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
