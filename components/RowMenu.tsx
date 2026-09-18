'use client'

import { useEffect, useRef, useState } from 'react'
import { REPO } from '@/lib/site'

// The ⋯ menu at the right end of every story-verdict row (founder 2026-09-18): one tap-able
// home for per-row actions so they don't crowd the row. First (and currently only) action:
// Flag — the same prefilled GitHub issue ContestLink builds, without needing to expand the
// row first. Close behavior mirrors AccountMenu/ArenaMenu (outside pointerdown + Escape).
export default function RowMenu({
  category,
  productId,
  storyId,
  verdict,
  quality,
}: {
  category: string
  productId: string
  storyId: string
  verdict: string
  quality: number
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const title = `[flag] ${category}/${productId}/${storyId}`
  const body = `**Category**\n${category}\n\n**Product**\n${productId}\n\n**Story id**\n${storyId}\n\n**Current verdict**\n${verdict}, quality ${quality}\n\n**Proposed verdict**\n<!-- what you think it should be, and why -->\n\n**Evidence URLs**\n<!-- one or more source URLs supporting your proposed verdict -->\n\n**Quotes**\n<!-- verbatim excerpt(s) from each URL above -->\n`
  const flagUrl = `https://github.com/${REPO}/issues/new?${new URLSearchParams({
    template: 'flag-verdict.yml',
    title,
    labels: 'contest',
    body,
  }).toString()}`

  return (
    <div ref={rootRef} className="relative inline-block">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Row actions"
        title="Row actions"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        className="cursor-pointer rounded px-1.5 py-0.5 font-mono text-sm leading-none text-zinc-600 transition hover:bg-zinc-800 hover:text-zinc-300"
      >
        ⋯
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-1 w-48 rounded-lg border border-zinc-800 bg-zinc-900 p-1 shadow-xl shadow-black/40"
        >
          <a
            role="menuitem"
            href={flagUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            title="Think this verdict is wrong? Opens a prefilled public GitHub issue"
            className="flex items-center gap-2 rounded px-2.5 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800 hover:text-emerald-300"
          >
            <span aria-hidden>⚑</span>
            Flag this verdict
          </a>
        </div>
      )}
    </div>
  )
}
