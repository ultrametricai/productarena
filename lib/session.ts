'use client'

// Ory session, client-side only. The site is a static export — every page ships the same HTML
// to everyone — so "logged in" is purely a browser-side fact: one GET to Ory's whoami endpoint
// (auth.ultrametric.ai, same apex as ultrametric.ai so the session cookie flows site-wide)
// per page load, cached in this module. Anything that goes wrong (401, network down, CORS not
// allowing this origin yet) degrades to 'anonymous' — the site stays fully open and unchanged
// for logged-out readers; login only ADDS the watchlist.
//
// Consumers: useSession() in components/AccountMenu.tsx (header chip / Log in link),
// components/WatchButton.tsx (☆/★ gate) and components/WatchlistGate.tsx (/watchlist gate).

import { useSyncExternalStore } from 'react'

export const ORY_URL = 'https://auth.ultrametric.ai'

export type Session =
  | { state: 'loading' }
  | { state: 'anonymous' }
  | { state: 'authenticated'; email?: string }

// Stable singletons — useSyncExternalStore compares snapshots by identity, so the store must
// hand back the same object until the state actually changes.
const LOADING: Session = { state: 'loading' }
const ANONYMOUS: Session = { state: 'anonymous' }

// Ory self-service browser flows. return_to brings the reader back to the exact PA page they
// were on; auth.ultrametric.ai allows ultrametric.ai URLs as redirect targets.
export function loginUrl(returnTo: string): string {
  return `${ORY_URL}/self-service/login/browser?return_to=${encodeURIComponent(returnTo)}`
}

export function registrationUrl(returnTo: string): string {
  return `${ORY_URL}/self-service/registration/browser?return_to=${encodeURIComponent(returnTo)}`
}

// Pull the email trait out of a whoami payload without trusting its shape — Ory's session
// object is deep and versioned, and a missing email is fine (the chip falls back to '?').
export function emailFromWhoami(payload: unknown): string | undefined {
  if (typeof payload !== 'object' || payload === null) return undefined
  const identity = (payload as { identity?: unknown }).identity
  if (typeof identity !== 'object' || identity === null) return undefined
  const traits = (identity as { traits?: unknown }).traits
  if (typeof traits !== 'object' || traits === null) return undefined
  const email = (traits as { email?: unknown }).email
  return typeof email === 'string' && email !== '' ? email : undefined
}

async function fetchSession(): Promise<Session> {
  try {
    const res = await fetch(`${ORY_URL}/sessions/whoami`, { credentials: 'include' })
    if (!res.ok) return ANONYMOUS // 401 = no session; anything else, treat the same
    const payload: unknown = await res.json()
    return { state: 'authenticated', email: emailFromWhoami(payload) }
  } catch {
    // Network/CORS failure — degrade to anonymous quietly (no rethrow, no logging: the
    // logged-out site is the fallback experience, not an error).
    return ANONYMOUS
  }
}

// In-memory store, one whoami per page load. First subscriber kicks off the fetch (so the
// request only ever happens in the browser); every star/menu/gate on the page shares the
// resolved snapshot.
let current: Session = LOADING
let started = false
const listeners = new Set<() => void>()

export function readSession(): Session {
  return current
}

export function subscribeSession(callback: () => void): () => void {
  if (!started) {
    started = true
    void fetchSession().then((session) => {
      current = session
      for (const listener of listeners) listener()
    })
  }
  listeners.add(callback)
  return () => {
    listeners.delete(callback)
  }
}

// Test-only: put the store back in its pre-fetch state so each test controls its own fetch mock.
export function resetSessionForTests(): void {
  current = LOADING
  started = false
  listeners.clear()
}

function getServerSnapshot(): Session {
  return LOADING
}

export function useSession(): Session {
  return useSyncExternalStore(subscribeSession, readSession, getServerSnapshot)
}

// Ory logout is two-step: ask /self-service/logout/browser for a one-time logout_url, then
// navigate there. Returns null on any failure (caller just leaves the session alone).
export async function fetchLogoutUrl(returnTo: string): Promise<string | null> {
  try {
    const res = await fetch(
      `${ORY_URL}/self-service/logout/browser?return_to=${encodeURIComponent(returnTo)}`,
      { credentials: 'include', headers: { Accept: 'application/json' } },
    )
    if (!res.ok) return null
    const payload: unknown = await res.json()
    const url = (payload as { logout_url?: unknown }).logout_url
    return typeof url === 'string' && url !== '' ? url : null
  } catch {
    return null
  }
}
