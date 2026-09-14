'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { fetchLogoutUrl, loginUrl, useSession } from '@/lib/session'
import { SITE_URL } from '@/lib/site'

// The header's account corner. Anonymous (and still-loading — same render, so the header never
// jumps while /auth/me is in flight) readers get one quiet "Log in" text link — currently
// hidden behind the pa-auth-test flag until the WorkOS flow is signed off; nothing else about
// the site changes for them. Authenticated readers get a small chip (their email's first
// letter) opening a menu: Watchlist + Log out. Menu open/close behavior mirrors
// components/ArenaMenu.tsx (outside pointerdown + Escape).
//
// The login href carries return_to back to the exact page the reader is on — computed at click
// time from window.location (the static HTML can't know the page URL, so the server-rendered
// fallback href returns to the site root).

function currentUrl(): string {
  return typeof window === 'undefined' ? SITE_URL : window.location.href
}

// Founder-only test switch (see docs/AUTH.md): localStorage.setItem('pa-auth-test', '1') then
// reload reveals the login link on this device only. Read via useSyncExternalStore with a
// `false` server snapshot — same pattern as components/DoViaAfk.tsx's pa-admin flag — so the
// static HTML never includes the link.
export const AUTH_TEST_FLAG_KEY = 'pa-auth-test'

function readAuthTestFlag(): boolean {
  try {
    return window.localStorage.getItem(AUTH_TEST_FLAG_KEY) === '1'
  } catch {
    // localStorage unavailable (privacy mode) — stay hidden.
    return false
  }
}

function subscribeAuthTestFlag(callback: () => void): () => void {
  window.addEventListener('storage', callback)
  return () => window.removeEventListener('storage', callback)
}

function getServerAuthTestFlag(): boolean {
  return false
}

export default function AccountMenu() {
  const session = useSession()
  const [open, setOpen] = useState(false)
  const testFlag = useSyncExternalStore(subscribeAuthTestFlag, readAuthTestFlag, getServerAuthTestFlag)
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

  if (session.state !== 'authenticated') {
    // Founder call 2026-09-14: no visible "Log in" until the WorkOS auth is tested. Signed-in
    // readers still get the account chip below; anonymous readers see nothing — UNLESS the
    // pa-auth-test localStorage flag is set (localStorage['pa-auth-test'] = '1'), which reveals
    // the link so the founder can exercise the full flow invisibly to everyone else. Go-live =
    // drop the testFlag condition (docs/AUTH.md "Going live").
    if (!testFlag) return null
    return (
      <a
        href={loginUrl(SITE_URL)}
        onClick={(e) => {
          e.preventDefault()
          window.location.href = loginUrl(currentUrl())
        }}
        className="shrink-0 px-1 text-xs text-zinc-500 transition hover:text-emerald-300"
      >
        Log in
      </a>
    )
  }

  const email = session.email
  const initial = (email?.[0] ?? '?').toUpperCase()

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={email ? `Account — ${email}` : 'Account'}
        title={email ?? 'Account'}
        onClick={() => setOpen((v) => !v)}
        className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full border border-emerald-400/60 bg-emerald-400/10 font-mono text-[11px] font-medium text-emerald-300 transition hover:bg-emerald-400/20"
      >
        <span aria-hidden>{initial}</span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-zinc-800 bg-zinc-900 p-1.5 shadow-xl shadow-black/40"
        >
          {email && (
            <p className="truncate px-3 py-1.5 text-xs text-zinc-500" title={email}>
              {email}
            </p>
          )}
          <Link
            role="menuitem"
            href="/watchlist"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-800 hover:text-emerald-300"
          >
            <span aria-hidden className="text-emerald-400">☆</span>
            Watchlist
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={async () => {
              const url = await fetchLogoutUrl(currentUrl())
              if (url) window.location.href = url
              else setOpen(false) // logout flow unreachable — leave the session as-is
            }}
            className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm text-zinc-200 hover:bg-zinc-800 hover:text-emerald-300"
          >
            <span aria-hidden className="text-zinc-500">↩</span>
            Log out
          </button>
        </div>
      )}
    </div>
  )
}
