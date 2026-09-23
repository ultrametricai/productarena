'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { loginUrl, useSession } from '@/lib/session'
import { SITE_URL } from '@/lib/site'

// Sign-up gate for self-logging actions (founder 2026-09-23: "'I'm using this' in the
// unsigned-in version should go to signup/in to record it… there should be a modal telling
// them 'Do you want to sign up or in to record this' before they are thrown to the login
// screen"). Anonymous clicks no longer write silently to the device: they open this modal,
// which sets expectations (your vendors + watchlist live on your account; process pages run
// personalized), then deep-links through login back to the SAME page — where the stashed
// intent is applied automatically, so the click the reader made is never lost.

const PENDING_KEY = 'pa-pending-action'

export interface PendingAction {
  kind: 'im-using' | 'watch'
  arenaId?: string
  productId: string
}

export function stashPendingAction(action: PendingAction) {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(action))
  } catch {
    /* storage unavailable — the reader just clicks again after login */
  }
}

// One-shot: returns the stashed action if it matches, and clears it. Callers check the match
// themselves (kind + ids) so an unrelated page never consumes another surface's intent.
export function takePendingAction(match: PendingAction): boolean {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY)
    if (!raw) return false
    const a = JSON.parse(raw) as PendingAction
    if (a.kind === match.kind && a.productId === match.productId && a.arenaId === match.arenaId) {
      sessionStorage.removeItem(PENDING_KEY)
      return true
    }
  } catch {
    /* fall through */
  }
  return false
}

function currentUrl(): string {
  return typeof window === 'undefined' ? SITE_URL : window.location.href
}

export function useSignupGate() {
  const session = useSession()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState<PendingAction | null>(null)

  // requireAuth(action, stash): authenticated → run it; anonymous → stash the intent and open
  // the modal; loading → treat as anonymous (the modal's login link is correct either way, and
  // a signed-in session will have resolved before a human can click through it).
  const requireAuth = useCallback(
    (run: () => void, stash: PendingAction): boolean => {
      if (session.state === 'authenticated') {
        run()
        return true
      }
      setPending(stash)
      setOpen(true)
      return false
    },
    [session.state],
  )

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const modal: ReactNode = open ? (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="signup-gate-title"
    >
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => setOpen(false)}
        className="absolute inset-0 cursor-default bg-zinc-950/70 backdrop-blur-[2px]"
      />
      <div className="relative w-full max-w-sm rounded-2xl border border-emerald-400/30 bg-zinc-900 p-5 shadow-2xl shadow-black/50">
        <p className="text-[10px] uppercase tracking-widest text-emerald-400/80">Save this to your account</p>
        <h2 id="signup-gate-title" className="font-display mt-1 text-lg font-semibold tracking-tight text-zinc-100">
          Sign up or log in to record this
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-zinc-400">
          <li className="flex gap-2">
            <span aria-hidden className="text-emerald-400">✓</span>
            Your vendors and watchlist live on your account — on every device, not just this one.
          </li>
          <li className="flex gap-2">
            <span aria-hidden className="text-emerald-400">✓</span>
            Every process page runs customized to your stack: your vendor drives each step, with
            honest upgrade advice where a rival is materially ahead.
          </li>
        </ul>
        <div className="mt-4 flex items-center gap-3">
          <a
            href={loginUrl(currentUrl())}
            onClick={() => {
              if (pending) stashPendingAction(pending)
            }}
            className="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300"
          >
            Sign up / Log in →
          </a>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="cursor-pointer text-sm text-zinc-500 transition hover:text-zinc-300"
          >
            Not now
          </button>
        </div>
        <p className="mt-3 text-[11px] text-zinc-600">
          You&rsquo;ll come straight back here — and the thing you clicked will be recorded.
        </p>
      </div>
    </div>
  ) : null

  return { requireAuth, modal, session }
}
