'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  probeResultLines, replayCharCount, type McpProbeResult, type TryItStory,
} from '@/lib/tryitReplay'

// The "Try it" microterminal: a locked-down terminal-styled window on the product page that
// (1) REPLAYS recorded proof transcripts character-paced — clearly labeled as recordings, and
// (2) optionally runs ONE real thing: a live MCP handshake against the product's own documented
// endpoint via the worker's /api/mcp-probe (static allowlist server-side — this component only
// ever sends {arena, product}, never a URL). A third, visibly disabled tab describes the
// designed-but-gated full sandbox (docs/TRY-IT.md).
//
// Same hardened-endpoint calling pattern as components/SubmitScan.tsx.
const PROBE_ENDPOINT = 'https://ultrametric.ai/productarena/api/mcp-probe'

const LIVE_ID = '__live-mcp__'

interface LiveProbe {
  arena: string
  product: string
  endpoint: string
}

export default function Microterminal({
  productName,
  stories,
  probe,
}: {
  productName: string
  stories: TryItStory[]
  probe: LiveProbe | null
}) {
  // The first recorded story starts replaying on mount (its transcript is the initial target;
  // the typing effect below stamps the start time lazily). The live probe NEVER auto-runs —
  // one real request per explicit click, not per page view.
  const firstId = stories[0]?.id ?? (probe ? LIVE_ID : null)
  const [activeId, setActiveId] = useState<string | null>(firstId)
  const [target, setTarget] = useState(() => stories[0]?.transcript ?? '') // text being typed toward
  const [shown, setShown] = useState(0) // how many chars are visible
  const [liveBusy, setLiveBusy] = useState(false)
  const startRef = useRef(0)
  const skippedRef = useRef(false)
  const runRef = useRef(0) // invalidates in-flight probe responses on story switch
  const preRef = useRef<HTMLPreElement>(null)

  const active = stories.find((s) => s.id === activeId) ?? null
  const isLive = activeId === LIVE_ID

  const beginRun = useCallback((text: string) => {
    startRef.current = performance.now()
    skippedRef.current = false
    setTarget(text)
    setShown(0)
  }, [])

  // Kick off (or re-run) the active story.
  const runStory = useCallback((id: string) => {
    runRef.current += 1
    const run = runRef.current
    setActiveId(id)
    if (id === LIVE_ID) {
      if (!probe) return
      setLiveBusy(true)
      beginRun(`$ mcp-probe ${probe.arena}/${probe.product}\n→ POST ${probe.endpoint}\n→ initialize (JSON-RPC 2.0, MCP 2025-06-18) …\n`)
      fetch(PROBE_ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ arena: probe.arena, product: probe.product }),
      })
        .then(async (resp) => (await resp.json()) as McpProbeResult)
        .catch(() => ({ error: 'could not reach our edge — try again in a moment' }) as McpProbeResult)
        .then((result) => {
          if (runRef.current !== run) return // user switched stories mid-flight
          setLiveBusy(false)
          setTarget((prev) => `${prev}${probeResultLines(result).join('\n')}\n`)
        })
    } else {
      setLiveBusy(false)
      const story = stories.find((s) => s.id === id)
      beginRun(story?.transcript ?? '')
    }
  }, [beginRun, probe, stories])

  // Character-paced typing (~8ms/char, lib/tryitReplay.ts). Skip renders everything at once.
  useEffect(() => {
    if (shown >= target.length) return
    if (skippedRef.current) {
      setShown(target.length)
      return
    }
    if (startRef.current === 0) startRef.current = performance.now() // mount-time replay start
    const timer = setInterval(() => {
      setShown(replayCharCount(performance.now() - startRef.current, target.length))
    }, 24)
    return () => clearInterval(timer)
  }, [shown, target])

  // Keep the newest output in view while typing.
  useEffect(() => {
    const el = preRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [shown])

  const skip = () => {
    skippedRef.current = true
    setShown(target.length)
  }

  const typing = shown < target.length || liveBusy
  const menuButton = (selected: boolean) =>
    `rounded-full border px-3 py-1 text-left text-xs transition ${
      selected
        ? 'border-emerald-400 bg-emerald-400/10 text-emerald-300'
        : 'border-zinc-800 text-zinc-400 hover:border-emerald-400/60 hover:text-emerald-300'
    }`

  return (
    <div className="space-y-3">
      {/* Story menu: the prefixed user stories each recording proves, plus the one live probe. */}
      <div className="flex flex-wrap items-center gap-2">
        {stories.map((story) => (
          <button key={story.id} type="button" onClick={() => runStory(story.id)} className={menuButton(activeId === story.id)}>
            {story.title}
          </button>
        ))}
        {probe && (
          <button type="button" onClick={() => runStory(LIVE_ID)} className={menuButton(isLive)}>
            Live MCP handshake
            <span className="ml-1.5 rounded border border-emerald-400/60 px-1 text-[9px] font-semibold uppercase tracking-wide text-emerald-300">
              live
            </span>
          </button>
        )}
        <button
          type="button"
          disabled
          title="Real E2B/Daytona-sandboxed sessions where you drive the CLI — coming online when sandbox capacity ships (design: docs/TRY-IT.md)."
          className="cursor-not-allowed rounded-full border border-zinc-800/70 px-3 py-1 text-xs text-zinc-600"
        >
          Run it yourself (sandboxed)
          <span className="ml-1.5 rounded border border-zinc-700 px-1 text-[9px] font-semibold uppercase tracking-wide">soon</span>
        </button>
      </div>

      {/* The terminal window. */}
      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-zinc-800 bg-zinc-900/60 px-3 py-2">
          <span aria-hidden className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
          </span>
          <code className="min-w-0 truncate font-mono text-xs text-zinc-300">
            <span className="mr-1.5 select-none text-emerald-400">$</span>
            {isLive ? `mcp-probe → ${probe?.endpoint ?? ''}` : active?.command ?? `try ${productName}`}
          </code>
          <span
            className={`ml-auto shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
              isLive ? 'border-emerald-400/60 text-emerald-300' : 'border-zinc-600 text-zinc-400'
            }`}
          >
            {isLive ? 'live — run just now from our edge' : 'recorded session — replayed, not live'}
          </span>
        </div>

        <pre
          ref={preRef}
          className="h-72 overflow-auto whitespace-pre-wrap break-words px-3 py-2.5 font-mono text-xs leading-relaxed text-zinc-200"
        >
          {isLive && target === '' && !liveBusy && (
            <span className="text-zinc-500">$ press ▶ run to send one JSON-RPC initialize from our edge{'\n'}</span>
          )}
          {target.slice(0, shown)}
          {liveBusy && shown >= target.length && <span className="text-zinc-500">…</span>}
          <span aria-hidden className="animate-pulse text-emerald-400">▋</span>
        </pre>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-zinc-800 px-3 py-1.5 text-[10px] text-zinc-500">
          {isLive ? (
            <span>one real JSON-RPC handshake against the vendor&rsquo;s documented MCP endpoint — nothing is signed in, nothing is written</span>
          ) : active ? (
            <span>
              recorded {active.recordedAt?.slice(0, 10)} · exit {active.exitCode} · captured verbatim by our probe harness, secrets redacted
            </span>
          ) : null}
          <span className="ml-auto flex shrink-0 gap-2">
            {typing && !liveBusy && (
              <button type="button" onClick={skip} className="rounded border border-zinc-700 px-2 py-0.5 text-zinc-400 transition hover:border-emerald-400 hover:text-emerald-300">
                skip ⏭
              </button>
            )}
            {!typing && activeId && (
              <button type="button" onClick={() => runStory(activeId)} className="rounded border border-zinc-700 px-2 py-0.5 text-zinc-400 transition hover:border-emerald-400 hover:text-emerald-300">
                {isLive && target === '' ? '▶ run' : isLive ? 'run again ▶' : 'replay ↺'}
              </button>
            )}
          </span>
        </div>
      </div>
    </div>
  )
}
