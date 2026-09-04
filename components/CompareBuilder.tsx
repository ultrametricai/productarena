'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import ProductLogoView from '@/components/ProductLogoView'
import VerdictBadge from '@/components/VerdictBadge'
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
import {
  DEFAULT_KEY_STORY_ROWS,
  encodeStoriesParam,
  MAX_COMPARE_STORIES,
  parseStoriesParam,
  searchStories,
  sharedKeyStories,
  storyCell,
  storyUnion,
  toArenaStoryData,
  type ArenaFetchState,
  type ArenaStoryData,
  type StoryCellState,
} from '@/lib/compareStories'
import { stripPersonaPrefix } from '@/lib/data-helpers'
import { withBase } from '@/lib/site'

// /compare's client half: pick up to MAX_COMPARE products from anywhere on the site and see
// them side by side. Selection state lives in `?p=stripe,mercury,claude-code` — read via
// useSearchParams (the page wraps this in <Suspense>, so the subtree client-renders and the
// static export never needs the query server-side) and written back via history.replaceState
// (no history spam). The lean product list arrives as a server-built prop (lib/compareData.ts).
//
// Story-level rows are different: verdict data is never server-serialized into this page.
// When products are selected, the component fetches each selected arena's static
// stories.json + verdicts.json (public/data mirrors, CDN'd — see scripts/copy-data.mjs) at
// runtime, only for the arenas actually selected, and caches per arena in-memory below. Key
// stories (scope 'global', shared by every selected arena, weight-3 first) render by default;
// `?s=storyId1,storyId2` carries user-added story rows the same replaceState way `?p=` does.

const MAX_SUGGESTIONS = 8

// Module-level per-arena cache: one in-flight/settled promise per arenaId, shared across
// re-renders and re-mounts. Failed fetches are evicted so a later selection change can retry.
const arenaStoryCache = new Map<string, Promise<ArenaStoryData>>()

function fetchArenaStories(arenaId: string): Promise<ArenaStoryData> {
  const hit = arenaStoryCache.get(arenaId)
  if (hit) return hit
  const promise = (async () => {
    const [storiesRes, verdictsRes] = await Promise.all([
      fetch(withBase(`/data/${arenaId}/stories.json`)),
      fetch(withBase(`/data/${arenaId}/verdicts.json`)),
    ])
    if (!storiesRes.ok || !verdictsRes.ok) throw new Error(`failed to load story data for ${arenaId}`)
    const [storiesJson, verdictsJson] = await Promise.all([storiesRes.json(), verdictsRes.json()])
    return toArenaStoryData(storiesJson, verdictsJson)
  })()
  arenaStoryCache.set(arenaId, promise)
  promise.catch(() => arenaStoryCache.delete(arenaId))
  return promise
}

function ScoreCell({ value, winner }: { value: number | null; winner: boolean }) {
  if (value === null) return <span className="text-zinc-500">n/a</span>
  return (
    <span className={`font-mono tabular-nums ${winner ? 'font-semibold text-emerald-300' : 'text-zinc-300'}`}>
      {value.toFixed(0)}
      <span className={winner ? 'text-emerald-300/50' : 'text-zinc-600'}>/100</span>
    </span>
  )
}

function formatQuality(q: number): string {
  return Number.isInteger(q) ? String(q) : q.toFixed(1)
}

// One product's cell in a story row. Real verdicts reuse the site-wide chip (VerdictBadge)
// plus quality n/10, and link to the product page's #story-<id> anchor. The three non-verdict
// states are rendered honestly: skeleton while loading, an explicit failure message on fetch
// error (never a fake verdict), and "n/a — different arena's story" when the story simply
// doesn't exist in the product's arena.
function StoryCellView({ cell, product, storyId }: { cell: StoryCellState; product: CompareProduct; storyId: string }) {
  if (cell.kind === 'loading') {
    return <span className="inline-block h-4 w-16 animate-pulse rounded bg-zinc-800" aria-hidden />
  }
  if (cell.kind === 'error') {
    return <span className="text-xs text-zinc-500">couldn&rsquo;t load story data</span>
  }
  if (cell.kind === 'other-arena') {
    return (
      <span
        className="text-xs italic text-zinc-500"
        title={`This story belongs to a different arena — ${product.name} (${product.arenaName}) was never judged on it.`}
      >
        n/a — different arena&rsquo;s story
      </span>
    )
  }
  return (
    <Link
      href={`/arena/${product.arenaId}/product/${product.id}#story-${storyId}`}
      className="group inline-flex items-center gap-1.5"
      title={`See ${product.name}'s evidence for this story`}
    >
      <VerdictBadge verdict={cell.verdict} />
      {cell.verdict !== 'none' && cell.verdict !== 'na' && (
        <span className="font-mono text-xs tabular-nums text-zinc-400 transition group-hover:text-emerald-300">
          {formatQuality(cell.quality)}
          <span className="text-zinc-600">/10</span>
        </span>
      )}
    </Link>
  )
}

export default function CompareBuilder({ products }: { products: CompareProduct[] }) {
  const searchParams = useSearchParams()
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products])
  const validIds = useMemo(() => new Set(products.map((p) => p.id)), [products])

  // Initial selection comes straight from `?p=` — a lazy initializer, not a mount effect:
  // useSearchParams already carries the real query on the first client render.
  const [ids, setIds] = useState<string[]>(() => parseCompareParam(searchParams.get('p'), validIds))
  // User-added story rows from `?s=` — unlike `?p=`, story ids can't be validated here (arena
  // data arrives async), so unknown ids are pruned later, once every selected arena has loaded.
  const [storyIds, setStoryIds] = useState<string[]>(() => parseStoriesParam(searchParams.get('s')))
  const [query, setQuery] = useState('')
  const [storyQuery, setStoryQuery] = useState('')
  const [copied, setCopied] = useState(false)
  const [showAllKeyStories, setShowAllKeyStories] = useState(false)
  const [arenaStates, setArenaStates] = useState<Record<string, ArenaFetchState>>({})

  const selected = useMemo(() => ids.map((id) => byId.get(id)).filter((p): p is CompareProduct => p !== undefined), [ids, byId])
  const selectedArenaIds = useMemo(() => [...new Set(selected.map((p) => p.arenaId))], [selected])

  // Kick off story-data fetches for newly-selected arenas ONLY (payload stays proportional to
  // the selection, and the module-level cache makes repeats free). The startedArenas ref keeps
  // this effect from re-dispatching on its own state updates; a failed arena is removed from it
  // so any later selection change retries the fetch.
  const startedArenasRef = useRef<Set<string>>(new Set())
  useEffect(() => {
    for (const arenaId of selectedArenaIds) {
      if (startedArenasRef.current.has(arenaId)) continue
      startedArenasRef.current.add(arenaId)
      setArenaStates((prev) => ({ ...prev, [arenaId]: { status: 'loading' } }))
      fetchArenaStories(arenaId).then(
        (data) => setArenaStates((prev) => ({ ...prev, [arenaId]: { status: 'ready', data } })),
        () => {
          startedArenasRef.current.delete(arenaId)
          setArenaStates((prev) => ({ ...prev, [arenaId]: { status: 'error' } }))
        },
      )
    }
  }, [selectedArenaIds])

  const readyArenaEntries = useMemo(
    () =>
      selectedArenaIds.flatMap((arenaId) => {
        const state = arenaStates[arenaId]
        return state?.status === 'ready' ? [{ arenaId, data: state.data }] : []
      }),
    [selectedArenaIds, arenaStates],
  )
  const anyStoryLoading = selectedArenaIds.some((id) => (arenaStates[id]?.status ?? 'loading') === 'loading')
  const allStoriesReady = selectedArenaIds.length > 0 && readyArenaEntries.length === selectedArenaIds.length

  // Key stories: global-scope stories every LOADED arena shares (weight-3 first). Computed over
  // ready arenas only — an errored arena's columns render honest per-cell failures instead of
  // silently shrinking the row set.
  const keyStories = useMemo(() => sharedKeyStories(readyArenaEntries.map((e) => e.data)), [readyArenaEntries])
  const visibleKeyStories = showAllKeyStories ? keyStories : keyStories.slice(0, DEFAULT_KEY_STORY_ROWS)
  const visibleKeyIds = new Set(visibleKeyStories.map((s) => s.id))

  const union = useMemo(() => storyUnion(readyArenaEntries), [readyArenaEntries])
  const unionById = useMemo(() => new Map(union.map((s) => [s.id, s])), [union])

  // Stale/unknown `?s=` ids (dead share links) prune themselves DERIVED, not via setState-in-
  // effect — but only once every selected arena has loaded: pruning against a partial union
  // would drop a legitimate id just because its arena's fetch failed. The add/remove handlers
  // below also physically drop stale ids at the next interaction.
  const effectiveStoryIds = useMemo(
    () => (allStoriesReady ? storyIds.filter((id) => unionById.has(id)) : storyIds),
    [allStoriesReady, storyIds, unionById],
  )

  // User-added rows: ids whose story is known, skipping any already visible as a key row.
  const addedStories = effectiveStoryIds.flatMap((id) => {
    const s = unionById.get(id)
    return s && !visibleKeyIds.has(id) ? [s] : []
  })

  const storySuggestions = useMemo(() => {
    const exclude = new Set([...keyStories.map((s) => s.id), ...effectiveStoryIds])
    return searchStories(union, storyQuery, exclude, MAX_SUGGESTIONS)
  }, [union, storyQuery, keyStories, effectiveStoryIds])

  const arenaNameById = useMemo(() => new Map(selected.map((p) => [p.arenaId, p.arenaName])), [selected])

  // Mirror selection back into the URL (replaceState — no history spam). The first run
  // re-writes the same `?p=`/`?s=` it was initialized from, which is a harmless no-op; once
  // all arena data is in, stale story ids fall out of the URL via effectiveStoryIds.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (ids.length > 0) params.set('p', encodeCompareParam(ids))
    else params.delete('p')
    if (effectiveStoryIds.length > 0) params.set('s', encodeStoriesParam(effectiveStoryIds))
    else params.delete('s')
    const qs = params.toString()
    window.history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`)
  }, [ids, effectiveStoryIds])

  function addStory(id: string) {
    setStoryIds((prev) => {
      const base = allStoriesReady ? prev.filter((x) => unionById.has(x)) : prev
      return base.includes(id) || base.length >= MAX_COMPARE_STORIES ? base : [...base, id]
    })
    setStoryQuery('')
  }

  function removeStory(id: string) {
    setStoryIds((prev) => prev.filter((x) => x !== id && (!allStoriesReady || unionById.has(x))))
  }

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
        <>
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
                {/* Row header already says "Open source" — a labeled pill here would repeat it,
                    so the cell is a bare yes/no mark. */}
                {selected.map((p) => (
                  <td key={p.id} className="px-3 py-2">
                    {p.type === 'oss' ? (
                      <span className="text-emerald-400" title="Open source — the product's code is publicly available">
                        ✓<span className="sr-only"> open source</span>
                      </span>
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* --- Story-level rows: key stories every selected arena shares --- */}
              <tr>
                <th
                  colSpan={selected.length + 1}
                  scope="colgroup"
                  className="bg-zinc-900/40 px-3 py-2 text-left text-[10px] font-normal uppercase tracking-widest text-zinc-400"
                >
                  Key stories
                </th>
              </tr>
              {anyStoryLoading ? (
                [0, 1, 2].map((i) => (
                  <tr key={`story-skeleton-${i}`}>
                    <th scope="row" className="px-3 py-2 text-left">
                      <span className="inline-block h-4 w-44 animate-pulse rounded bg-zinc-800" aria-hidden />
                      <span className="sr-only">loading story data</span>
                    </th>
                    {selected.map((p) => (
                      <td key={p.id} className="px-3 py-2">
                        <span className="inline-block h-4 w-16 animate-pulse rounded bg-zinc-800" aria-hidden />
                      </td>
                    ))}
                  </tr>
                ))
              ) : keyStories.length === 0 ? (
                <tr>
                  <td colSpan={selected.length + 1} className="px-3 py-3 text-xs text-zinc-500">
                    {readyArenaEntries.length === 0
                      ? 'couldn’t load story data'
                      : 'no shared key stories across this selection'}
                  </td>
                </tr>
              ) : (
                <>
                  {visibleKeyStories.map((story) => (
                    <tr key={story.id}>
                      <th
                        scope="row"
                        className="min-w-[200px] max-w-[280px] px-3 py-2 text-left text-xs font-normal text-zinc-400"
                      >
                        {stripPersonaPrefix(story.title)}
                      </th>
                      {selected.map((p) => (
                        <td key={p.id} className="px-3 py-2">
                          <StoryCellView cell={storyCell(arenaStates[p.arenaId], p.id, story.id)} product={p} storyId={story.id} />
                        </td>
                      ))}
                    </tr>
                  ))}
                  {keyStories.length > DEFAULT_KEY_STORY_ROWS && (
                    <tr>
                      <td colSpan={selected.length + 1} className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => setShowAllKeyStories((v) => !v)}
                          className="text-xs text-zinc-400 transition hover:text-emerald-300"
                        >
                          {showAllKeyStories
                            ? 'Show fewer stories'
                            : `Show all ${keyStories.length} shared stories`}
                        </button>
                      </td>
                    </tr>
                  )}
                </>
              )}

              {/* --- User-added story rows (`?s=`) --- */}
              {addedStories.length > 0 && (
                <>
                  <tr>
                    <th
                      colSpan={selected.length + 1}
                      scope="colgroup"
                      className="bg-zinc-900/40 px-3 py-2 text-left text-[10px] font-normal uppercase tracking-widest text-zinc-400"
                    >
                      Added stories
                    </th>
                  </tr>
                  {addedStories.map((story) => (
                    <tr key={story.id}>
                      <th
                        scope="row"
                        className="min-w-[200px] max-w-[280px] px-3 py-2 text-left text-xs font-normal text-zinc-400"
                      >
                        <span className="flex items-start gap-1.5">
                          <button
                            type="button"
                            onClick={() => removeStory(story.id)}
                            aria-label={`Remove story "${stripPersonaPrefix(story.title)}" from comparison`}
                            className="text-zinc-600 transition hover:text-red-400"
                          >
                            ×
                          </button>
                          <span>{stripPersonaPrefix(story.title)}</span>
                        </span>
                      </th>
                      {selected.map((p) => (
                        <td key={p.id} className="px-3 py-2">
                          <StoryCellView cell={storyCell(arenaStates[p.arenaId], p.id, story.id)} product={p} storyId={story.id} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Add-story search: union of the selected products' arenas' stories, title substring. */}
        <div className="relative max-w-md">
          <input
            value={storyQuery}
            onChange={(e) => setStoryQuery(e.target.value)}
            placeholder={
              anyStoryLoading
                ? 'Loading story data…'
                : union.length === 0
                  ? 'Story data unavailable'
                  : effectiveStoryIds.length >= MAX_COMPARE_STORIES
                    ? `Up to ${MAX_COMPARE_STORIES} added stories`
                    : 'Add a story to compare…'
            }
            disabled={anyStoryLoading || union.length === 0 || effectiveStoryIds.length >= MAX_COMPARE_STORIES}
            aria-label="Search stories to add to the comparison"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-400/60 focus:outline-none disabled:opacity-60"
          />
          {storySuggestions.length > 0 && (
            <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 shadow-2xl">
              {storySuggestions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => addStory(s.id)}
                  className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm text-zinc-300 transition hover:bg-emerald-400/10 hover:text-emerald-300"
                >
                  <span className="font-medium">{stripPersonaPrefix(s.title)}</span>
                  {s.arenaIds.length < selectedArenaIds.length && (
                    <span className="text-xs text-zinc-500">
                      {s.arenaIds.map((id) => arenaNameById.get(id) ?? id).join(', ')} only — other arenas will show n/a
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        </>
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
