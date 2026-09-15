'use client'

// WorkOS AuthKit session, client-side only. The site is a static export — every page ships the
// same HTML to everyone — so "logged in" is purely a browser-side fact: one same-origin GET to
// the Cloudflare worker's /productarena/auth/me (infra/cloudflare-proxy/worker.js — the worker
// IS the auth backend; it verifies our HMAC-signed pa_session cookie) per page load, cached in
// this module. Anything that goes wrong (401, worker not configured, or the page being served
// off productarena.vercel.app where the worker doesn't exist) degrades to 'anonymous' — the
// site stays fully open and unchanged for logged-out readers; login only ADDS the watchlist.
//
// Consumers: useSession() in components/AccountMenu.tsx (header chip / Log in link),
// components/WatchButton.tsx (☆/★ gate) and components/WatchlistGate.tsx (/watchlist gate).

import { useSyncExternalStore } from 'react'
import { syncWatchlistFromServer } from './watchlist'

// Same-origin path — the worker only exists on ultrametric.ai, and relative URLs mean the
// session cookie flows with no CORS at all (simpler than the old cross-origin Ory setup).
export const AUTH_BASE = '/productarena/auth'

export type Session =
  | { state: 'loading' }
  | { state: 'anonymous' }
  | { state: 'authenticated'; email?: string }

// Stable singletons — useSyncExternalStore compares snapshots by identity, so the store must
// hand back the same object until the state actually changes.
const LOADING: Session = { state: 'loading' }
const ANONYMOUS: Session = { state: 'anonymous' }

// Worker login flow (302 to the WorkOS AuthKit hosted page). return_to brings the reader back
// to the exact PA page they were on; the worker only honors ultrametric.ai paths.
export function loginUrl(returnTo: string): string {
  return `${AUTH_BASE}/login?return_to=${encodeURIComponent(returnTo)}`
}

// Same flow — AuthKit's hosted page handles sign-up too; screen_hint just lands on that tab.
export function registrationUrl(returnTo: string): string {
  return `${AUTH_BASE}/login?screen_hint=sign-up&return_to=${encodeURIComponent(returnTo)}`
}

// Pull the email out of an /auth/me payload without trusting its shape — a missing email is
// fine (the chip falls back to '?').
export function emailFromMe(payload: unknown): string | undefined {
  if (typeof payload !== 'object' || payload === null) return undefined
  const email = (payload as { email?: unknown }).email
  return typeof email === 'string' && email !== '' ? email : undefined
}

async function fetchSession(): Promise<Session> {
  try {
    const res = await fetch(`${AUTH_BASE}/me`, { credentials: 'include' })
    if (!res.ok) return ANONYMOUS // 401 = no session; anything else (404/500), treat the same
    const payload: unknown = await res.json()
    return { state: 'authenticated', email: emailFromMe(payload) }
  } catch {
    // Network failure — degrade to anonymous quietly (no rethrow, no logging: the logged-out
    // site is the fallback experience, not an error).
    return ANONYMOUS
  }
}

// In-memory store, one /auth/me per page load. First subscriber kicks off the fetch (so the
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
      // Logged-in readers get their account watchlist merged in (lib/watchlist.ts) — one GET
      // per page load, fire-and-forget, silently a no-op wherever the worker route is absent.
      if (session.state === 'authenticated') void syncWatchlistFromServer()
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

// Logout is a plain navigation: the worker's /auth/logout clears the pa_session cookie and
// bounces through WorkOS's logout URL back to return_to. Kept async-with-null (the old Ory
// contract needed a network round-trip here) so callers don't churn.
export async function fetchLogoutUrl(returnTo: string): Promise<string | null> {
  return `${AUTH_BASE}/logout?return_to=${encodeURIComponent(returnTo)}`
}
