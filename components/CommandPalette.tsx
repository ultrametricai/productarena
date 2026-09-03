'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { SearchEntry, SearchEntryType } from '@/lib/search-index'

const TYPE_ORDER: SearchEntryType[] = ['arena', 'product', 'story']
const TYPE_LABEL: Record<SearchEntryType, string> = { arena: 'Arenas', product: 'Products', story: 'Stories' }
const MAX_RESULTS = 40

function matches(entry: SearchEntry, query: string): boolean {
  const q = query.toLowerCase()
  return entry.label.toLowerCase().includes(q) || entry.sublabel.toLowerCase().includes(q)
}

// Global ⌘K/Ctrl+K search over every arena, product, and story (see lib/search-index.ts).
// Self-contained: renders both its own header trigger button and the overlay, so it can be
// dropped into the (server-component) layout without lifting open-state elsewhere.
export default function CommandPalette({ entries }: { entries: SearchEntry[] }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // Focus the input whenever the palette becomes visible. Purely imperative (no state
  // updates), so it's a legitimate effect rather than something to inline into an handler.
  useEffect(() => {
    if (!open) return
    const id = requestAnimationFrame(() => inputRef.current?.focus())
    return () => cancelAnimationFrame(id)
  }, [open])

  // Results are pre-grouped by type (arena, product, story) so rendering can walk one flat
  // array in display order — no index bookkeeping needed at render time.
  const results = useMemo(() => {
    const trimmed = query.trim()
    const filtered = trimmed === '' ? entries : entries.filter((e) => matches(e, trimmed))
    const limited = filtered.slice(0, MAX_RESULTS)
    return TYPE_ORDER.flatMap((type) => limited.filter((e) => e.type === type))
  }, [entries, query])

  function close() {
    setOpen(false)
    setQuery('')
    setActiveIndex(0)
  }

  function go(entry: SearchEntry) {
    close()
    router.push(entry.href)
  }

  function onInputChange(value: string) {
    setQuery(value)
    setActiveIndex(0)
  }

  function onKeyDownInPalette(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') {
      e.preventDefault()
      close()
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, results.length - 1))
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      const chosen = results[activeIndex]
      if (chosen) go(chosen)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex shrink-0 items-center gap-2 rounded-lg border border-zinc-800 px-2.5 py-1 text-xs text-zinc-400 transition hover:border-emerald-400/60 hover:text-emerald-300"
        aria-label="Open search"
      >
        <span>Search</span>
        <kbd className="rounded border border-zinc-700 bg-zinc-900 px-1 font-mono text-[10px] text-zinc-500">⌘K</kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 pt-24" onClick={close}>
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={onKeyDownInPalette}
            className="w-full max-w-lg overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl"
          >
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder="Search arenas, products, stories…"
              className="w-full border-b border-zinc-800 bg-transparent px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-400 focus:outline-none"
            />
            <div className="max-h-96 overflow-y-auto py-2">
              {results.length === 0 && <p className="px-4 py-6 text-center text-sm text-zinc-400">No matches</p>}
              {results.map((entry, index) => {
                const showHeader = index === 0 || results[index - 1].type !== entry.type
                const active = index === activeIndex
                return (
                  <div key={`${entry.type}-${entry.href}-${entry.label}`} className="px-2">
                    {showHeader && (
                      <p className="px-2 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-400">
                        {TYPE_LABEL[entry.type]}
                      </p>
                    )}
                    <button
                      type="button"
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => go(entry)}
                      className={`flex w-full flex-col items-start rounded-lg px-2 py-2 text-left text-sm transition ${
                        active ? 'bg-emerald-400/10 text-emerald-300' : 'text-zinc-300'
                      }`}
                    >
                      <span className="font-medium">{entry.label}</span>
                      <span className="text-xs text-zinc-500">{entry.sublabel}</span>
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
