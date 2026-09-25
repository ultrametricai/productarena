'use client'

import { useSyncExternalStore } from 'react'
import { ADMIN_FLAG_KEY, AFK_RUN_URL, isAdminEmail } from '@/components/DoViaAfk'
import { isCompanyEmail } from '@/components/OpsDashboard'
import { useSession } from '@/lib/session'

// Step-scoped computer-use trigger (founder 2026-09-25: "make 'do it yourself' able to trigger
// a computer-use session"). Renders next to the manual "do it yourself" link on actionUrl steps
// and opens AFK's run endpoint with this page's manifest plus a &node=<nodeId> scoping param —
// additive and harmless to the existing manifest consumer, which ignores params it doesn't know.
//
// STAFF-GATED, exactly the components/DoViaAfk.tsx pattern (NEXT_PUBLIC_ADMIN_EMAILS allowlist
// or the founder's pa-admin localStorage switch) PLUS the OpsDashboard @ultrametric.ai rule
// (isCompanyEmail — WorkOS verifies the address before issuing a session). Non-staff readers get
// literally NOTHING rendered — the localStorage/session halves read client-side with `false`
// server snapshots, so the static HTML never carries the chip.

// LAUNCH-DAY FLIP: AFK is pre-launch, so the chip is staff-only for now. When AFK launches,
// flip this single constant to true and the chip renders for every reader (the gate below is
// bypassed entirely) — nothing else needs to change.
export const AFK_STEP_TRIGGER_PUBLIC: boolean = false

// Pure so the URL contract is unit-testable: AFK consumes the manifest URL; the node param
// scopes the run to one step.
export function afkStepRunUrl(manifestUrl: string, nodeId: string): string {
  return `${AFK_RUN_URL}?manifest=${encodeURIComponent(manifestUrl)}&node=${encodeURIComponent(nodeId)}`
}

function readAdminFlag(): boolean {
  try {
    return window.localStorage.getItem(ADMIN_FLAG_KEY) === '1'
  } catch {
    // localStorage unavailable (privacy mode) — the flag path just stays off.
    return false
  }
}

function subscribeAdminFlag(callback: () => void): () => void {
  window.addEventListener('storage', callback)
  return () => window.removeEventListener('storage', callback)
}

const getServerAdminFlag = () => false

export default function StepAfkChip({ manifestUrl, nodeId }: {
  // Absolute URL of this page's manifest (process or chain) — the one artifact AFK consumes.
  manifestUrl: string
  // The DAG node id this run is scoped to.
  nodeId: string
}) {
  // Hooks run unconditionally (rules of hooks); the staff gate comes after.
  const session = useSession()
  const localFlag = useSyncExternalStore(subscribeAdminFlag, readAdminFlag, getServerAdminFlag)

  const staff =
    session.state === 'authenticated' &&
    (isAdminEmail(session.email, process.env.NEXT_PUBLIC_ADMIN_EMAILS) || isCompanyEmail(session.email))
  if (!AFK_STEP_TRIGGER_PUBLIC && !staff && !localFlag) return null

  return (
    <a
      href={afkStepRunUrl(manifestUrl, nodeId)}
      target="_blank"
      rel="noopener noreferrer"
      title="runs a computer-use session via AFK — an Ultrametric product (ours)"
      className="inline-flex items-center gap-1 rounded-md border border-emerald-400/50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-300 transition hover:border-emerald-400 hover:bg-emerald-400/10"
    >
      ⚡ run with AFK
    </a>
  )
}
