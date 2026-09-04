'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import OssPill from '@/components/OssPill'
import ProductLogoView from '@/components/ProductLogoView'
import {
  accessGlyphClass,
  encodeCompareParam,
  MAX_COMPARE,
  parseCompareParam,
  rowWinners,
  sharedThemes,
  themeLabel,
  type CompareProduct,
} from '@/lib/compare'

// /compare's client half: pick up to MAX_COMPARE products from anywhere on the site and see
// them side by side. Selection state lives in `?p=stripe,mercury,claude-code` — read via
// useSearchParams (the page wraps this in <Suspense>, so the subtree client-renders and the
// static export never needs the query server-side) and written back via history.replaceState
// (no history spam). The lean product list arrives as a server-built prop (lib/compareData.ts).

const MAX_SUGGESTIONS = 8

function ScoreCell({ value, winner }: { value: number | null; winner: boolean }) {
  if (value === null) return <span className="text-zinc-500">n/a</span>
  return (
    <span className={`font-mono tabular-nums ${winner ? 'font-semibold text-emerald-300' : 'text-zinc-300'}`}>
      {value.toFixed(0)}
      <span className={winner ? 'text-emerald-300/50' : 'text-zinc-600'}>/100</span>
    </span>
  )
}

export default function CompareBuilder({ products }: { products: CompareProduct[] }) {
  const searchParams = useSearchParams()
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products])
  const validIds = useMemo(() => new Set(products.map((p) => p.id)), [products])

  // Initial selection comes straight from `?p=` — a lazy initializer, not a mount effect:
  // useSearchParams already carries the real query on the first client render.
  const [ids, setIds] = useState<string[]>(() => parseCompareParam(searchParams.get('p'), validIds))
  const [query, setQuery] = useState('')
  const [copied, setCopied] = useState(false)

  // Mirror selection back into the URL (replaceState — no history spam). The first run
  // re-writes the same `?p=` it was initialized from, which is a harmless no-op.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (ids.length > 0) params.set('p', encodeCompareParam(ids))
    else params.delete('p')
    const qs = params.toString()
    window.history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`)
  }, [ids])

  const selected = useMemo(() => ids.map((id) => byId.get(id)).filter((p): p is CompareProduct => p !== undefined), [ids, byId])

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q === '') return []
    return products
      .filter((p) => !ids.includes(p.id) && (p.name.toLowerCase().includes(q) || p.arenaName.toLowerCase().includes(q)))
      .slice(0, MAX_SUGGESTIONS)
  }, [products, query, ids])

  function add(id: string) {
    setIds((prev) => (prev.includes(id) || prev.length >= MAX_COMPARE ? prev : [...prev, id]))
    setQuery('')
  }

  function remove(id: string) {
    setIds((prev) => prev.filter((x) => x !== id))
  }

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable (permissions/insecure context) — the URL bar still has the link */
    }
  }

  const crossArena = new Set(selected.map((p) => p.arenaId)).size > 1
  const themes = sharedThemes(selected)

  // Numeric rows in display order; each row's winner indices are computed once here.
  const numericRows: Array<{ label: string; values: Array<number | null> }> = [
    { label: 'Arena Score', values: selected.map((p) => p.aiEra) },
    { label: 'Agent-ready', values: selected.map((p) => p.agentReady) },
    { label: 'AI-native', values: selected.map((p) => p.agenticApp) },
    { label: 'API quality', values: selected.map((p) => p.apiQuality) },
    ...themes.map((t) => ({ label: themeLabel(t), values: selected.map((p) => p.themeScores[t] ?? null) })),
  ]

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="relative max-w-md">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              ids.length >= MAX_COMPARE ? `Up to ${MAX_COMPARE} products` : 'Add a product to compare…'
            }
            disabled={ids.length >= MAX_COMPARE}
            aria-label="Search products to compare"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-400/60 focus:outline-none disabled:opacity-60"
          />
          {suggestions.length > 0 && (
            <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 shadow-2xl">
              {suggestions.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => add(p.id)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-300 transition hover:bg-emerald-400/10 hover:text-emerald-300"
                >
                  <ProductLogoView product={{ id: p.id, name: p.name }} size={20} hasLogo={p.hasLogo} />
                  <span className="font-medium">{p.name}</span>
                  <span className="text-xs text-zinc-500">{p.arenaName}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {selected.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {selected.map((p) => (
              <span
                key={p.id}
                className="flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900 py-1 pl-1.5 pr-2 text-xs text-zinc-300"
              >
                <ProductLogoView product={{ id: p.id, name: p.name }} size={18} hasLogo={p.hasLogo} />
                {p.name}
                <button
                  type="button"
                  onClick={() => remove(p.id)}
                  aria-label={`Remove ${p.name} from comparison`}
                  className="text-zinc-500 transition hover:text-red-400"
                >
                  ×
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={copyShareLink}
              className="rounded-full border border-zinc-800 px-3 py-1 text-xs text-zinc-400 transition hover:border-emerald-400/40 hover:text-emerald-300"
            >
              {copied ? 'Copied ✓' : 'Copy share link'}
            </button>
          </div>
        )}
      </div>

      {selected.length === 0 ? (
        <p className="rounded-2xl border border-zinc-800 px-4 py-8 text-center text-sm text-zinc-500">
          Search above to add products — any product from any arena, up to {MAX_COMPARE} at once.
          Your selection lives in the URL, so the comparison is a link you can share.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-800">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-left">
                <th scope="col" className="px-3 py-3 text-[10px] font-normal uppercase tracking-widest text-zinc-400" />
                {selected.map((p) => (
                  <th key={p.id} scope="col" className="min-w-[140px] px-3 py-3 font-normal align-top">
                    <div className="flex flex-col items-start gap-1">
                      <Link
                        href={`/arena/${p.arenaId}/product/${p.id}`}
                        className="flex items-center gap-2 font-medium text-zinc-100 hover:text-emerald-300"
                      >
                        <ProductLogoView product={{ id: p.id, name: p.name }} size={28} hasLogo={p.hasLogo} />
                        {p.name}
                      </Link>
                      <Link href={`/arena/${p.arenaId}`} className="text-xs text-zinc-500 hover:text-emerald-300">
                        {p.arenaName}
                      </Link>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/70">
              {numericRows.map((row) => {
                const winners = new Set(rowWinners(row.values))
                return (
                  <tr key={row.label}>
                    <th scope="row" className="whitespace-nowrap px-3 py-2 text-left text-xs font-normal text-zinc-400">
                      {row.label}
                    </th>
                    {row.values.map((value, i) => (
                      <td key={selected[i].id} className="px-3 py-2">
                        <ScoreCell value={value} winner={winners.has(i)} />
                      </td>
                    ))}
                  </tr>
                )
              })}
              <tr>
                <th scope="row" className="whitespace-nowrap px-3 py-2 text-left text-xs font-normal text-zinc-400">
                  Access
                </th>
                {selected.map((p) => (
                  <td key={p.id} className="px-3 py-2">
                    <div className="flex items-center gap-2.5 font-mono text-xs">
                      {(['MCP', 'CLI', 'API'] as const).map((label) => (
                        <span key={label} className="flex items-center gap-1">
                          <span className="text-zinc-400">{label}</span>
                          <span className={accessGlyphClass(p.access[label])}>{p.access[label]}</span>
                        </span>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>
              <tr>
                <th scope="row" className="whitespace-nowrap px-3 py-2 text-left text-xs font-normal text-zinc-400">
                  Open source
                </th>
                {selected.map((p) => (
                  <td key={p.id} className="px-3 py-2">
                    {p.type === 'oss' ? <OssPill /> : <span className="text-zinc-600">—</span>}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {crossArena && (
        <p className="text-xs text-zinc-500">
          Note: scores are computed within each product&rsquo;s own arena — cross-arena comparison
          is directional, not exact.
        </p>
      )}
    </div>
  )
}
