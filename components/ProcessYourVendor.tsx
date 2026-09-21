'use client'

import Link from 'next/link'
import ProductLogoView from '@/components/ProductLogoView'
import { useMyStackMap } from '@/components/useMyStackMap'

// Lean serialized leaderboard row for the client-side "you run X" banner — built server-side by
// components/ProcessLeaderboard.tsx from the FULL (uncapped) processLeaderboard entries, so the
// reader's pick is findable wherever it ranks.
export interface YourVendorEntry {
  productId: string
  name: string
  arenaId: string
  hasLogo: boolean
  rank: number
  processScore: number
  stepsServed: number
}

// "You run <vendor>" banner above the process leaderboard (founder 2026-09-21). Same static-HTML
// contract as StepYourPick: server snapshot of the stack is '{}' so this renders nothing in the
// static page; it hydrates in only for readers with an "I'm using" pick that appears in one of
// the process's covering arenas. Numbers are the leaderboard's own — re-arranged, not recomputed.
export default function ProcessYourVendor({
  entries,
  rankableSteps,
  mineHref,
}: {
  entries: YourVendorEntry[]
  rankableSteps: number
  mineHref: string
}) {
  const stack = useMyStackMap()
  // First match in leaderboard order = the reader's best-ranked pick for this process.
  const yours = entries.find((e) => stack[e.arenaId] === e.productId)
  if (!yours) return null
  const leader = entries[0]
  const isLeader = yours.rank === 1
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 rounded-xl border border-emerald-400/40 bg-emerald-400/[0.07] px-3.5 py-2 text-[13px]">
      <span className="flex min-w-0 items-center gap-1.5 text-zinc-100">
        <ProductLogoView product={{ id: yours.productId, name: yours.name }} size={18} hasLogo={yours.hasLogo} />
        <span>
          You run <span className="font-medium">{yours.name}</span> —{' '}
          <span className="text-emerald-300">#{yours.rank}</span> for this process, {yours.stepsServed} of{' '}
          {rankableSteps} steps, score{' '}
          <span className="font-mono tabular-nums text-emerald-300">{yours.processScore.toFixed(0)}</span>
        </span>
      </span>
      {!isLeader && leader && (
        <span className="text-zinc-400">
          (#1 is {leader.name} at <span className="font-mono tabular-nums">{leader.processScore.toFixed(0)}</span>)
        </span>
      )}
      <Link
        href={mineHref}
        className="text-emerald-300 underline decoration-emerald-400/40 underline-offset-2 transition hover:text-emerald-200"
      >
        run it with your whole stack →
      </Link>
    </div>
  )
}
