'use client'

import type { ReactNode } from 'react'
import { loginUrl, useSession } from '@/lib/session'
import { SITE_URL } from '@/lib/site'

// Client-side gate for /watchlist: the page itself is static and open (no notFound — it's a
// real destination you can link to), but the list is an account feature, so anonymous readers
// get a friendly log-in prompt instead of the list. While whoami is in flight (and in the
// static HTML) it renders nothing — the header/intro above it are always visible.

export default function WatchlistGate({ children }: { children: ReactNode }) {
  const session = useSession()

  if (session.state === 'loading') return null

  if (session.state === 'anonymous') {
    return (
      <div className="rounded-xl border border-dashed border-zinc-800 p-6 text-sm text-zinc-400">
        <p>
          <span aria-hidden className="mr-2 text-zinc-500">☆</span>
          Log in to keep a watchlist — star any product and it&rsquo;s pinned here with its
          current scores and trend.
        </p>
        <a
          href={loginUrl(SITE_URL)}
          onClick={(e) => {
            e.preventDefault()
            window.location.href = loginUrl(window.location.href)
          }}
          className="mt-3 inline-block rounded-lg border border-emerald-400/60 px-3 py-1.5 text-xs font-medium text-emerald-300 transition hover:bg-emerald-400/10"
        >
          Log in
        </a>
      </div>
    )
  }

  return <>{children}</>
}
