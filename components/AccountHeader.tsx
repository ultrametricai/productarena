'use client'

import { fetchLogoutUrl, loginUrl, useSession } from '@/lib/session'
import { SITE_URL } from '@/lib/site'

function currentUrl(): string {
  return typeof window === 'undefined' ? SITE_URL : window.location.href
}

// Identity row for /account: email + log out when signed in; a sign-up prompt when not. Client
// only — the static shell renders the neutral loading line, so no personal state ever prerenders.
export default function AccountHeader() {
  const session = useSession()

  if (session.state === 'authenticated') {
    return (
      <p className="mt-2 flex flex-wrap items-center gap-3 text-sm text-zinc-400">
        Signed in{session.email ? <> as <span className="text-zinc-200">{session.email}</span></> : null}
        <button
          type="button"
          onClick={async () => {
            const url = await fetchLogoutUrl(currentUrl())
            if (url) window.location.href = url
          }}
          className="cursor-pointer text-zinc-400 underline decoration-zinc-700 underline-offset-2 transition hover:text-emerald-300"
        >
          Log out
        </button>
      </p>
    )
  }
  if (session.state === 'anonymous') {
    return (
      <p className="mt-2 text-sm text-zinc-400">
        You&rsquo;re browsing on this device only —{' '}
        <a
          href={loginUrl(currentUrl())}
          className="text-emerald-400 underline decoration-emerald-400/40 hover:text-emerald-300"
        >
          sign up or log in
        </a>{' '}
        to sync your vendors and watchlist to your account.
      </p>
    )
  }
  return <p className="mt-2 text-sm text-zinc-600">…</p>
}
