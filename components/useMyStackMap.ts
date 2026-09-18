'use client'

import { useMemo, useSyncExternalStore } from 'react'
import { parseStackMap, readStackRaw, subscribeStack, type StackMap } from '@/lib/myStack'

// Shared hook over the account-stack store (lib/myStack.ts) — the exact useWatchlist pattern
// (components/WatchButton.tsx): the raw stored string is the snapshot ('{}' server-side, so
// static HTML always hydrates from the empty state), parsed once per change.

function getServerSnapshot(): string {
  return '{}'
}

export function useMyStackMap(): StackMap {
  const raw = useSyncExternalStore(subscribeStack, readStackRaw, getServerSnapshot)
  return useMemo(() => parseStackMap(raw), [raw])
}
