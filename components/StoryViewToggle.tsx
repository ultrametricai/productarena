'use client'

import { useEffect, useState, type ReactNode } from 'react'

// "Map | Table" switcher for the product page's story section. Both panels arrive as server-
// rendered ReactNode props (StoryVerdictsTable and StoryMap render at build time — this wrapper
// only flips the `hidden` attribute, keeping the static export intact and both views in the
// HTML for crawlers). Table stays the default: it's the long-standing evidence surface every
// #story-<id> deep link on the site targets. Which is also why this component listens for the
// hash: clicking a map block (or any cross-page deep link that lands mid-session) navigates to
// #story-<id> in the *table*, so we flip back to the table view and re-scroll — the browser's
// own jump no-ops while the row is display:none.

type StoryView = 'table' | 'map'

const TABS: Array<{ view: StoryView; label: string }> = [
  { view: 'table', label: 'Table' },
  { view: 'map', label: 'Map' },
]

export default function StoryViewToggle({ table, map }: { table: ReactNode; map: ReactNode }) {
  const [view, setView] = useState<StoryView>('table')

  useEffect(() => {
    function onHash() {
      const match = window.location.hash.match(/^#story-(.+)$/)
      if (!match) return
      setView('table')
      // Wait a frame so the table is visible again before jumping to the row.
      requestAnimationFrame(() => {
        document.getElementById(`story-${decodeURIComponent(match[1])}`)?.scrollIntoView()
      })
    }
    onHash()
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  return (
    <div className="space-y-3">
      <div
        role="tablist"
        aria-label="Story verdicts view"
        className="inline-flex rounded-lg border border-zinc-800 bg-zinc-900 p-0.5"
      >
        {TABS.map(({ view: v, label }) => (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={view === v}
            onClick={() => setView(v)}
            className={`rounded-md px-3 py-1 text-sm transition ${
              view === v ? 'bg-zinc-800 font-medium text-emerald-300' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div role="tabpanel" aria-label="Story map" hidden={view !== 'map'}>
        {map}
      </div>
      <div role="tabpanel" aria-label="Story verdicts table" hidden={view !== 'table'}>
        {table}
      </div>
    </div>
  )
}
