'use client'

import { useEffect, useState } from 'react'
import ProductLogoView from '@/components/ProductLogoView'
import type { CompareProduct } from '@/lib/compare'
import { withBase } from '@/lib/site'

// "Most compared" strip on /compare — honest, measured popularity: the Cloudflare worker that
// proxies every ultrametric.ai request counts normalized ?p= pairs into Workers KV (pairs only,
// no IPs/UAs — see infra/cloudflare-proxy/worker.js "Compare popularity counter") and serves
// the top pairs from this keyless endpoint. Same absolute-URL pattern as SubmitScan's
// SCAN_ENDPOINT: the endpoint only exists on the worker, not on the Vercel origin.
const POPULAR_ENDPOINT = 'https://ultrametric.ai/productarena/api/popular-compares'

// Render nothing below this many resolvable pairs — a two-entry "leaderboard" is noise.
const MIN_PAIRS = 3
const MAX_SHOWN = 8

interface PopularPair {
  a: string
  b: string
  count: number
}

export default function PopularCompares({ products }: { products: CompareProduct[] }) {
  const [pairs, setPairs] = useState<PopularPair[] | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const resp = await fetch(POPULAR_ENDPOINT)
        if (!resp.ok) return
        const body = (await resp.json()) as { ok?: boolean; pairs?: PopularPair[] }
        if (!cancelled && body.ok && Array.isArray(body.pairs)) setPairs(body.pairs)
      } catch {
        /* endpoint unreachable (e.g. preview deploys without the worker) — render nothing */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (!pairs) return null
  // The worker counts raw pairs (it has no product catalog) — resolve here and drop anything
  // that isn't two live products. Fewer than MIN_PAIRS resolvable pairs: honest empty, no strip.
  const byId = new Map(products.map((p) => [p.id, p]))
  const shown = pairs
    .flatMap((pair) => {
      const a = byId.get(pair.a)
      const b = byId.get(pair.b)
      return a && b ? [{ a, b, count: pair.count }] : []
    })
    .slice(0, MAX_SHOWN)
  if (shown.length < MIN_PAIRS) return null

  return (
    <section className="mx-auto max-w-3xl text-center">
      <p className="flex flex-wrap items-center justify-center gap-2 text-xs text-zinc-400">
        <span
          className="uppercase tracking-widest text-zinc-500"
          title="What visitors actually compare here — pair counts measured by our proxy (pairs only, no visitor data stored)"
        >
          Most compared
        </span>
        {shown.map(({ a, b, count }) => (
          // Plain <a> like the starter chips above: CompareBuilder reads ?p= in a lazy state
          // initializer, so only a full navigation applies the selection.
          <a
            key={`${a.id}|${b.id}`}
            href={withBase(`/compare?p=${a.id},${b.id}`)}
            title={`${a.name} vs ${b.name} — compared ${count} ${count === 1 ? 'time' : 'times'}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 py-1 pl-2 pr-3 text-zinc-300 transition hover:border-emerald-400/60 hover:text-emerald-300"
          >
            <ProductLogoView product={{ id: a.id, name: a.name }} size={16} hasLogo={a.hasLogo} />
            {a.name}
            <span className="text-zinc-600">vs</span>
            <ProductLogoView product={{ id: b.id, name: b.name }} size={16} hasLogo={b.hasLogo} />
            {b.name}
          </a>
        ))}
      </p>
    </section>
  )
}
