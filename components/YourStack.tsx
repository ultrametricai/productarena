'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import ProductLogoView from '@/components/ProductLogoView'
import { useMyStackMap } from '@/components/useMyStackMap'
import {
  MY_STACK_KEY,
  parseStoredStack,
  stackAdvice,
  stackMapFromList,
  writeStack,
  type MyStackProduct,
  type StackMap,
} from '@/lib/myStack'
import { loginUrl, registrationUrl, useSession } from '@/lib/session'

// The signed-in half of /my-stack (founder ask: "in signed-in mode, allow the user to define
// their stack and get upgraded stack advice"): one product pick per arena, grouped by the
// header's arena sections, saved to the account via lib/myStack.ts's account-stack store (the
// exact watchlist localStorage+sync pattern). Anonymous readers get a sign-up prompt instead —
// the free-form tool below (MyStackBuilder) stays open to everyone.
//
// Advice: every number is the arena leaderboard's published PA / agent-ready score
// (lib/myStack.ts stackAdvice), and every cited score links to the product's /score receipt
// page where the evidence breakdown lives.

export interface StackSection {
  name: string
  arenaIds: string[]
}

const scoreText = (n: number | null) => (n === null ? 'n/a' : `${n.toFixed(0)}/100`)

function receiptHref(p: MyStackProduct): string {
  return `/arena/${p.arenaId}/product/${p.id}/score`
}

export default function YourStack({
  products,
  sections,
}: {
  products: MyStackProduct[]
  sections: StackSection[]
}) {
  const session = useSession()
  const stack = useMyStackMap()
  const [query, setQuery] = useState('')

  // Arena catalog: rows grouped per arena in leaderboard order, arenas keyed for the pickers.
  const byArena = useMemo(() => {
    const map = new Map<string, { arenaName: string; rows: MyStackProduct[] }>()
    for (const p of products) {
      const entry = map.get(p.arenaId) ?? { arenaName: p.arenaName, rows: [] }
      entry.rows.push(p)
      map.set(p.arenaId, entry)
    }
    for (const entry of map.values()) entry.rows.sort((a, b) => a.rank - b.rank)
    return map
  }, [products])

  // One-time seed from the free-form tool's device-local list ("prefilled from any existing
  // device-local state"): only when the account stack is still empty, first pick per arena.
  const seeded = useRef(false)
  useEffect(() => {
    if (session.state !== 'authenticated' || seeded.current) return
    seeded.current = true
    if (Object.keys(stack).length > 0) return
    let legacy: string[] = []
    try {
      legacy = parseStoredStack(window.localStorage.getItem(MY_STACK_KEY))
    } catch {
      return
    }
    const seed = stackMapFromList(legacy, products)
    if (Object.keys(seed).length > 0) writeStack(seed)
  }, [session.state, stack, products])

  if (session.state === 'loading') return null

  if (session.state === 'anonymous') {
    return (
      <section className="rounded-2xl border border-dashed border-zinc-800 p-5 text-sm text-zinc-400">
        <p>
          <span aria-hidden className="mr-2 text-zinc-500">▣</span>
          Sign up to save your stack to your account: pick your product per arena, get upgraded
          stack advice against every arena leaderboard, and run any process page with your own
          vendors.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href={registrationUrl('/productarena/my-stack')}
            onClick={(e) => {
              e.preventDefault()
              window.location.href = registrationUrl(window.location.href)
            }}
            className="inline-block rounded-lg border border-emerald-400/60 px-3 py-1.5 text-xs font-medium text-emerald-300 transition hover:bg-emerald-400/10"
          >
            Sign up to save your stack
          </a>
          <a
            href={loginUrl('/productarena/my-stack')}
            onClick={(e) => {
              e.preventDefault()
              window.location.href = loginUrl(window.location.href)
            }}
            className="inline-block rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 transition hover:border-emerald-400/40 hover:text-emerald-300"
          >
            Log in
          </a>
        </div>
      </section>
    )
  }

  const q = query.trim().toLowerCase()
  const arenaMatches = (arenaId: string): boolean => {
    if (q === '') return true
    const entry = byArena.get(arenaId)
    if (!entry) return false
    return (
      entry.arenaName.toLowerCase().includes(q) ||
      entry.rows.some((r) => r.name.toLowerCase().includes(q))
    )
  }

  function setPick(arenaId: string, productId: string) {
    const next: StackMap = { ...stack }
    if (productId === '') delete next[arenaId]
    else next[arenaId] = productId
    writeStack(next)
  }

  const advice = stackAdvice(stack, products)
  const pickCount = advice.picks.length

  return (
    <section className="space-y-6">
      <div>
        <h2 className="font-display leading-[1.1] text-xl font-semibold tracking-tight">Your stack</h2>
        <p className="mt-1 text-sm text-zinc-400">
          One pick per arena, saved to your account — process pages can then run with your own
          vendors. {pickCount === 0 ? 'Nothing picked yet.' : `${pickCount} arena${pickCount === 1 ? '' : 's'} picked.`}
        </p>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Filter arenas or products…"
        aria-label="Filter arenas or products"
        className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-400/60 focus:outline-none"
      />

      <div className="space-y-2">
        {sections.map((section) => {
          const arenas = section.arenaIds.filter((id) => byArena.has(id) && arenaMatches(id))
          if (arenas.length === 0) return null
          const sectionPicks = section.arenaIds.filter((id) => stack[id] && byArena.has(id)).length
          return (
            <details
              key={section.name}
              open={q !== '' || sectionPicks > 0}
              className="group rounded-2xl border border-zinc-800"
            >
              <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:bg-zinc-900/60 [&::-webkit-details-marker]:hidden">
                <span aria-hidden className="text-[9px] text-zinc-600 transition-transform group-open:rotate-90">▶</span>
                {section.name}
                {sectionPicks > 0 && (
                  <span className="rounded-full border border-emerald-400/40 px-1.5 py-px text-[10px] text-emerald-300">
                    {sectionPicks} picked
                  </span>
                )}
              </summary>
              <div className="grid gap-x-6 gap-y-2 border-t border-zinc-800/60 px-4 py-3 sm:grid-cols-2">
                {arenas.map((arenaId) => {
                  const entry = byArena.get(arenaId)!
                  return (
                    <label key={arenaId} className="flex items-center justify-between gap-3 text-sm">
                      <Link href={`/arena/${arenaId}`} className="min-w-0 truncate text-zinc-400 hover:text-emerald-300">
                        {entry.arenaName}
                      </Link>
                      <select
                        value={stack[arenaId] ?? ''}
                        onChange={(e) => setPick(arenaId, e.target.value)}
                        aria-label={`Your ${entry.arenaName} pick`}
                        className="w-44 shrink-0 rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 focus:border-emerald-400/60 focus:outline-none"
                      >
                        <option value="">—</option>
                        {entry.rows.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                            {r.aiEra !== null ? ` (${r.aiEra.toFixed(0)})` : ''}
                          </option>
                        ))}
                      </select>
                    </label>
                  )
                })}
              </div>
            </details>
          )
        })}
      </div>

      {pickCount > 0 && (
        <div className="space-y-3">
          <h3 className="font-display leading-[1.1] text-lg font-semibold tracking-tight">Upgraded stack advice</h3>
          {advice.stackScore !== null && (
            <p className="text-sm text-zinc-300">
              Stack score{' '}
              <span className="font-mono tabular-nums text-emerald-400">{advice.stackScore.toFixed(0)}</span>
              <span className="text-zinc-600">/100</span> vs best possible{' '}
              <span className="font-mono tabular-nums text-emerald-400">{(advice.bestPossible ?? 0).toFixed(0)}</span>
              <span className="text-zinc-600">/100</span>
              <span className="ml-1 text-xs text-zinc-500">
                — mean published PA Score of your scored picks vs those same arenas&rsquo; leaders.
              </span>
            </p>
          )}
          <ul className="space-y-2">
            {advice.picks.map((p) => (
              <li key={p.arenaId} className="rounded-2xl border border-zinc-800 p-3">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <ProductLogoView product={{ id: p.pick.id, name: p.pick.name }} size={18} hasLogo={p.pick.hasLogo} />
                  <Link href={`/arena/${p.arenaId}/product/${p.pick.id}`} className="font-medium text-zinc-100 hover:text-emerald-300">
                    {p.pick.name}
                  </Link>
                  <Link href={`/arena/${p.arenaId}`} className="text-xs text-zinc-500 hover:text-emerald-300">
                    {p.arenaName}
                  </Link>
                  <span className="text-xs text-zinc-500">
                    #{p.pick.rank} of {p.pick.fieldSize}
                  </span>
                  <span className="font-mono text-xs tabular-nums text-zinc-300" title="PA Score — the arena leaderboard's published headline score">
                    PA {scoreText(p.pick.aiEra)}
                  </span>
                  <Link href={receiptHref(p.pick)} className="text-[11px] text-zinc-500 underline decoration-zinc-700 hover:text-emerald-300">
                    score receipt
                  </Link>
                </div>
                {p.pick.id === p.leader.id ? (
                  <p className="mt-1.5 text-xs text-emerald-300/90">Leads its arena — nothing above it to upgrade to.</p>
                ) : (
                  <p className="mt-1.5 text-xs text-zinc-400">
                    {p.paDelta !== null && p.paDelta > 0 ? (
                      <>
                        Δ<span className="font-mono tabular-nums">{p.paDelta.toFixed(0)}</span> PA behind the
                        leader {p.leader.name}
                        {p.agentReadyDelta !== null && (
                          <>
                            {' '}(agent-ready Δ<span className="font-mono tabular-nums">{p.agentReadyDelta.toFixed(0)}</span>)
                          </>
                        )}
                        .
                      </>
                    ) : (
                      <>Level with the arena leader on the published scores.</>
                    )}
                  </p>
                )}
                {p.upgrades.length > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wide text-zinc-500">upgrade candidates:</span>
                    {p.upgrades.map((u) => (
                      <span key={u.product.id} className="flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/5 px-2 py-0.5 text-xs text-emerald-300">
                        <Link href={`/arena/${u.product.arenaId}/product/${u.product.id}`} className="hover:text-emerald-200">
                          {u.product.name}
                        </Link>
                        {u.paDelta !== null && (
                          <span className="font-mono tabular-nums" title={`PA ${scoreText(u.product.aiEra)} vs your ${scoreText(p.pick.aiEra)}${u.agentReadyDelta !== null ? `; agent-ready Δ${u.agentReadyDelta.toFixed(0)}` : ''}`}>
                            +{u.paDelta.toFixed(0)} PA
                          </span>
                        )}
                        <Link href={receiptHref(u.product)} className="text-[10px] text-emerald-400/70 underline decoration-emerald-400/30 hover:text-emerald-200">
                          receipt
                        </Link>
                      </span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
          <p className="text-xs text-zinc-500">
            Every number is the arena leaderboard&rsquo;s published score; each &ldquo;receipt&rdquo;
            link opens the score page where the judged evidence behind it lives.
          </p>
        </div>
      )}
    </section>
  )
}
