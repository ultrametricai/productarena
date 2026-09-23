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
// mode for whoever the link is sent to. URL ONLY (founder 2026-09-23): restoring the device's
// last mode from localStorage after hydration flashed companies→processes on every load for
// process-mode readers — a pristine visit is now always companies with zero flicker, and the
// one expected post-hydration flip is a shared ?view=processes link opening in the sender's view.
type Mode = 'companies' | 'processes'

export default function HomeModes({ companies, processes }: { companies: ReactNode; processes: ReactNode }) {
  const [mode, setMode] = useState<Mode>('companies')
  /* eslint-disable react-hooks/set-state-in-effect -- one-time post-hydration sync FROM the URL
     (external system). The static HTML must render the default mode, so this cannot be a
     useState initializer (hydration mismatch); it runs once and renders at most one extra pass. */
  useEffect(() => {
    if (readParam('view') === 'processes') setMode('processes')
  }, [])
  /* eslint-enable react-hooks/set-state-in-effect */
  const pick = (m: Mode) => {
    setMode(m)
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
