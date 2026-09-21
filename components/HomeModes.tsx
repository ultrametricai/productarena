'use client'

import { type ReactNode, useEffect, useState } from 'react'
import { readParam, setParams } from '@/lib/urlState'

// Homepage mode switch (founder 2026-09-21: "add processes onto the homepage as well, maybe have
// two modes, company mode/process mode"). Both modes are server-rendered into the static HTML —
// companies visible by default (the homepage IS the table, founder call 2026-09-14, and the SEO
// surface is unchanged), processes toggled in client-side via CSS. The choice persists per
// device; readers who live in process land come back to it.
//
// Shareable URLs (founder 2026-09-21, lib/urlState.ts): ?view=processes reproduces the process
// mode for whoever the link is sent to — the URL wins over the localStorage preference on first
// load; clicking a tab updates both. The default (companies) never appears in the URL.
const MODE_KEY = 'pa-home-mode'
type Mode = 'companies' | 'processes'

export default function HomeModes({ companies, processes }: { companies: ReactNode; processes: ReactNode }) {
  const [mode, setMode] = useState<Mode>('companies')
  useEffect(() => {
    const fromUrl = readParam('view')
    if (fromUrl === 'processes' || fromUrl === 'companies') {
      setMode(fromUrl) // a shared link shows the sender's view, whatever this device prefers
      return
    }
    const saved = localStorage.getItem(MODE_KEY)
    if (saved === 'processes') setMode('processes')
  }, [])
  const pick = (m: Mode) => {
    setMode(m)
    localStorage.setItem(MODE_KEY, m)
    setParams({ view: m === 'companies' ? null : m })
  }
  const tab = (m: Mode, label: string, title: string) => (
    <button
      type="button"
      onClick={() => pick(m)}
      title={title}
      aria-pressed={mode === m}
      className={`rounded-full px-3.5 py-1 text-sm transition ${
        mode === m
          ? 'bg-emerald-400/15 font-medium text-emerald-300 ring-1 ring-emerald-400/50'
          : 'text-zinc-400 hover:text-zinc-200'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div>
      <div className="mb-4 inline-flex items-center gap-1 rounded-full border border-zinc-800 p-1">
        {tab('companies', '🏢 Companies', 'Every product judged across every arena — the mega-table')}
        {tab('processes', '🔁 Processes', 'Startup processes, the software that runs them, and the best an agent can do today')}
      </div>
      <div className={mode === 'companies' ? '' : 'hidden'}>{companies}</div>
      <div className={mode === 'processes' ? '' : 'hidden'}>{processes}</div>
    </div>
  )
}
