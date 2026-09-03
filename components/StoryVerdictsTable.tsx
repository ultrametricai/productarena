'use client'

import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import ContestLink from '@/components/ContestLink'
import ThemeIcon from '@/components/ThemeIcon'
import UncertaintyMarker from '@/components/UncertaintyMarker'
import VerdictBadge from '@/components/VerdictBadge'
import VerificationBadge from '@/components/VerificationBadge'
import type { Verdict } from '@/lib/schemas'
import {
  type SortDirection,
  type StoryVerdictColumn,
  type StoryVerdictRow,
  COLUMN_LABELS,
  defaultDirectionFor,
  filterStoryVerdictRows,
  isStoryUntested,
  sortStoryVerdictRows,
} from '@/lib/storyVerdictsSort'

// Sortable/filterable replacement for the product page's old vertical "Story verdicts" list
// (same data, one dense view instead of a long theme-grouped scroll). Every row keeps the old
// list's id={`story-${storyId}`} anchor — StoryMatrix, AgentAccessGlyphs, the mega table,
// ClaimsSection, and AiModeBadge all deep-link to #story-<id> on this page — and the full
// rationale + evidence detail the list used to show inline lives in a per-row expansion
// (auto-opened when the URL hash targets that row).

function SortableTh({
  children,
  col,
  current,
  direction,
  onSort,
  className = '',
}: {
  children: ReactNode
  col: StoryVerdictColumn
  current: StoryVerdictColumn
  direction: SortDirection
  onSort: (col: StoryVerdictColumn) => void
  className?: string
}) {
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

// Reconstructs the minimal Verdict shape ContestLink's prefilled-issue body reads from a
// serialized row — same values the server judged, never invented.
function verdictForContest(productId: string, row: StoryVerdictRow): Verdict {
  return {
    productId,
    storyId: row.storyId,
    verdict: row.verdict,
    quality: row.quality,
    confidence: row.confidence,
    rationale: row.rationale,
    evidenceIds: row.evidence.map((e) => e.id),
  }
}

export default function StoryVerdictsTable({
  category,
  productId,
  rows,
}: {
  category: string
  productId: string
  rows: StoryVerdictRow[]
}) {
  const [column, setColumn] = useState<StoryVerdictColumn>('quality')
  const [direction, setDirection] = useState<SortDirection>('desc')
  const [query, setQuery] = useState('')
  const [theme, setTheme] = useState('')
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set())

  // Themes in first-seen story order (the taxonomy's own order), not alphabetical — matches
  // how groupInOrder drives the "By theme" strip above the table.
  const themes = useMemo(() => {
    const seen: string[] = []
    for (const r of rows) if (!seen.includes(r.theme)) seen.push(r.theme)
    return seen
  }, [rows])

  const filtered = useMemo(() => filterStoryVerdictRows(rows, query, theme), [rows, query, theme])
  const sorted = useMemo(() => sortStoryVerdictRows(filtered, column, direction), [filtered, column, direction])

  // Auto-expand the row a #story-<id> deep link targets — on mount for cross-page links
  // (StoryMatrix, mega table, glyph tables) and on hashchange for same-page ones (ClaimsSection,
  // AiModeBadge), which update the hash without a remount.
  useEffect(() => {
    function expandFromHash() {
      const match = window.location.hash.match(/^#story-(.+)$/)
      if (!match) return
      const storyId = decodeURIComponent(match[1])
      if (!rows.some((r) => r.storyId === storyId)) return
      setExpanded((prev) => (prev.has(storyId) ? prev : new Set(prev).add(storyId)))
    }
    expandFromHash()
    window.addEventListener('hashchange', expandFromHash)
    return () => window.removeEventListener('hashchange', expandFromHash)
  }, [rows])

  function handleSort(col: StoryVerdictColumn) {
    if (col === column) {
      setDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setColumn(col)
      setDirection(defaultDirectionFor(col))
    }
  }

  function toggle(storyId: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(storyId)) next.delete(storyId)
      else next.add(storyId)
      return next
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          aria-label="Filter stories by theme"
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-100 focus:border-emerald-400/60 focus:outline-none"
        >
          <option value="">All themes</option>
          {themes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter stories…"
          aria-label="Filter stories by title, persona, or theme"
          className="ml-auto w-full min-w-0 max-w-[14rem] rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-400/60 focus:outline-none sm:w-48"
        />
      </div>

      <p className="text-xs text-zinc-400" aria-live="polite">
        Sorted by <span className="font-semibold text-emerald-300">{COLUMN_LABELS[column]}</span>{' '}
        ({direction === 'desc' ? 'high → low' : 'low → high'})
        {' · '}
        {sorted.length}/{rows.length} stories · click a row&rsquo;s chevron for the rationale and evidence
      </p>

      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-left text-xs uppercase tracking-widest text-zinc-400">
              <SortableTh col="title" current={column} direction={direction} onSort={handleSort}>
                Story
              </SortableTh>
              <SortableTh col="theme" current={column} direction={direction} onSort={handleSort}>
                Theme
              </SortableTh>
              <SortableTh col="weight" current={column} direction={direction} onSort={handleSort}>
                Weight
              </SortableTh>
              <SortableTh col="verdict" current={column} direction={direction} onSort={handleSort}>
                Verdict
              </SortableTh>
              <SortableTh col="quality" current={column} direction={direction} onSort={handleSort}>
                Quality
              </SortableTh>
              <SortableTh col="verification" current={column} direction={direction} onSort={handleSort}>
                Verification
              </SortableTh>
              <SortableTh col="evidence" current={column} direction={direction} onSort={handleSort}>
                Evidence
              </SortableTh>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/70">
            {sorted.map((row) => {
              const isOpen = expanded.has(row.storyId)
              const untested = isStoryUntested(row)
              return (
                // React fragments can't carry the anchor, so the id lives on the main <tr>;
                // scroll-mt-4 keeps #story-<id> deep links landing clear of the viewport top.
                <StoryRowPair
                  key={row.storyId}
                  row={row}
                  isOpen={isOpen}
                  untested={untested}
                  category={category}
                  productId={productId}
                  onToggle={() => toggle(row.storyId)}
                />
              )
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-zinc-500">
                  No stories match{theme !== '' ? ` theme “${theme}”` : ''}{query.trim() !== '' ? ` “${query}”` : ''}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StoryRowPair({
  row,
  isOpen,
  untested,
  category,
  productId,
  onToggle,
}: {
  row: StoryVerdictRow
  isOpen: boolean
  untested: boolean
  category: string
  productId: string
  onToggle: () => void
}) {
  const detailsId = `story-details-${row.storyId}`
  return (
    <>
      <tr id={`story-${row.storyId}`} className="scroll-mt-4 align-top transition hover:bg-zinc-900/50">
        <td className="px-3 py-2">
          <div className="flex items-start gap-2">
            <button
              type="button"
              onClick={onToggle}
              aria-expanded={isOpen}
              aria-controls={detailsId}
              aria-label={`Details for story ${row.storyId}`}
              className="mt-0.5 shrink-0 rounded p-0.5 text-zinc-500 transition hover:text-emerald-300"
            >
              <svg
                viewBox="0 0 16 16"
                width={12}
                height={12}
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden
                className={`transition-transform ${isOpen ? 'rotate-90' : ''}`}
              >
                <path d="M6 3.5 10.5 8 6 12.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className="min-w-0">
              <p className="font-medium" title={row.origin}>
                {row.title}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">
                {row.persona}
                {row.group !== row.theme && <> · {row.group}</>}
              </p>
            </div>
          </div>
        </td>
        <td className="whitespace-nowrap px-3 py-2 text-xs text-zinc-400">
          <span className="inline-flex items-center gap-1.5">
            <ThemeIcon theme={row.theme} />
            {row.theme}
          </span>
        </td>
        <td className="px-3 py-2 font-mono tabular-nums text-zinc-300">{row.weight}</td>
        <td className="px-3 py-2">
          <span className="inline-flex items-center gap-1.5">
            <VerdictBadge verdict={row.verdict} />
            <UncertaintyMarker agreement={row.agreement} />
          </span>
        </td>
        <td className="px-3 py-2 font-mono tabular-nums text-zinc-400">
          {untested ? (
            <span
              className="font-sans text-xs italic text-zinc-500"
              title="No evidence found or probed either way — unscored, not zero."
            >
              untested
            </span>
          ) : (
            <>{row.quality}/10</>
          )}
        </td>
        <td className="px-3 py-2">
          <VerificationBadge level={row.verification} compact />
        </td>
        <td className="px-3 py-2">
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={isOpen}
            aria-controls={detailsId}
            className={`font-mono text-xs tabular-nums underline decoration-zinc-800 hover:text-emerald-300 ${row.evidence.length === 0 ? 'text-zinc-500' : 'text-zinc-300'}`}
          >
            {row.evidence.length} {row.evidence.length === 1 ? 'source' : 'sources'}
          </button>
        </td>
      </tr>
      {isOpen && (
        <tr id={detailsId} className="bg-zinc-900/30">
          <td colSpan={7} className="px-3 py-3 pl-9">
            <p className="text-sm text-zinc-500">{row.rationale}</p>
            {row.evidence.length > 0 && (
              <ul className="mt-2 space-y-1.5">
                {row.evidence.map((e) => (
                  <li key={e.id} className="text-xs text-zinc-400">
                    <a
                      href={e.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline decoration-zinc-800 hover:text-emerald-300"
                    >
                      [{e.tier}]
                    </a>{' '}
                    <span className="break-all text-zinc-500">{e.url}</span>
                    <span className="mt-0.5 block text-zinc-500">&ldquo;{e.excerpt}&rdquo;</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-2 flex items-center justify-end gap-3">
              {row.proofUrl && (
                <a
                  href={row.proofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-zinc-400 hover:text-emerald-300"
                >
                  proof ↗
                </a>
              )}
              <ContestLink
                category={category}
                productId={productId}
                storyId={row.storyId}
                verdict={verdictForContest(productId, row)}
              />
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
