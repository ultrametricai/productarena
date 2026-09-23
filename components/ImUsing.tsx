'use client'

import { useMyStackMap } from '@/components/useMyStackMap'
import { useSession } from '@/lib/session'
import { isPicked, stackPicks, togglePick, writeStack } from '@/lib/myStack'

// "I'm using" toggle on vendor pages (founder 2026-09-18; multi-vendor 2026-09-22): one click
// records this product as ONE OF the reader's picks for this arena in their stack
// (lib/myStack.ts — device-local always, synced to the account when signed in, same store
// /my-stack and /account edit). Toggling membership never removes the reader's OTHER picks in
// the arena — readers really run several vendors per function (Mercury AND Brex). Anonymous
// readers can still set it (device-local, like the watchlist); the button quietly reflects state.
export default function ImUsing({ arenaId, productId, productName }: { arenaId: string; productId: string; productName: string }) {
  const stack = useMyStackMap()
  const session = useSession()
  const using = isPicked(stack, arenaId, productId)
  const othersCount = stackPicks(stack, arenaId).length - (using ? 1 : 0)

  return (
    <button
      type="button"
      onClick={() => writeStack(togglePick(stack, arenaId, productId))}
      title={
        using
          ? othersCount > 0
            ? `${productName} is one of your ${othersCount + 1} ${arenaId} picks — click to remove it (your other picks stay). Manage your whole stack at /my-stack.`
            : `${productName} is set as your ${arenaId} pick — click to unset. Manage your whole stack at /my-stack.`
          : `Add ${productName} to YOUR picks for this arena — you can keep several vendors per function; powers your stack advice and personalized process runs${session.state === 'authenticated' ? '' : ' (saved on this device; sign up to sync)'}`
      }
      className={`shrink-0 rounded-full border px-2.5 py-1 text-xs transition ${
        using
          ? 'border-emerald-400/70 bg-emerald-400/15 text-emerald-300'
          : 'border-zinc-700 text-zinc-400 hover:border-emerald-400/50 hover:text-emerald-300'
      }`}
    >
      {using ? (othersCount > 0 ? '✓ one of my picks' : "✓ I'm using this") : "I'm using this"}
    </button>
  )
}
