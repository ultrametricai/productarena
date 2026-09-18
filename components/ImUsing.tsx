'use client'

import { useMyStackMap } from '@/components/useMyStackMap'
import { useSession } from '@/lib/session'
import { writeStack } from '@/lib/myStack'

// "I'm using" toggle on vendor pages (founder 2026-09-18): one click records this product as
// the reader's pick for this arena in their stack (lib/myStack.ts — device-local always, synced
// to the account when signed in, same store /my-stack edits). Anonymous readers can still set
// it (device-local, like the watchlist); the button quietly reflects state.
export default function ImUsing({ arenaId, productId, productName }: { arenaId: string; productId: string; productName: string }) {
  const stack = useMyStackMap()
  const session = useSession()
  const using = stack[arenaId] === productId

  return (
    <button
      type="button"
      onClick={() => {
        const next = { ...stack }
        if (using) delete next[arenaId]
        else next[arenaId] = productId
        writeStack(next)
      }}
      title={
        using
          ? `${productName} is set as your ${arenaId} pick — click to unset. Manage your whole stack at /my-stack.`
          : `Set ${productName} as YOUR pick for this arena — powers your stack advice and personalized process runs${session.state === 'authenticated' ? '' : ' (saved on this device; sign up to sync)'}`
      }
      className={`shrink-0 rounded-full border px-2.5 py-1 text-xs transition ${
        using
          ? 'border-emerald-400/70 bg-emerald-400/15 text-emerald-300'
          : 'border-zinc-700 text-zinc-400 hover:border-emerald-400/50 hover:text-emerald-300'
      }`}
    >
      {using ? "✓ I'm using this" : "I'm using this"}
    </button>
  )
}
