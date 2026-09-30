'use client'

import { useRef, useState } from 'react'

// The Ultrametric CLI/MCP install module — the /v2 product page's boxed three-method tabs
// (Prompt for agent / CLI / MCP), extracted as ONE shared component (founder 2026-09-29:
// port /v2 into the app; the page's inline module carried more polish than the old
// InstallBanner markup, so both now render this instead of duplicating):
// - components/InstallBanner.tsx — the sitewide bottom-of-every-page banner;
// - app/v2/page.tsx — the ported product page's hero.
// The /v2 module's polish is preserved: aria-pressed tab group, per-method note lines
// (Node version for the CLI, remote-server hint for MCP), an aria-live sr-only copy label
// that announces "Copied"/"Copy failed" and reverts after 2s, and the $-prompted multi-line
// CLI panel. Values are the /v2 product's (npm `ultrametric`, api.ultrametric.ai/mcp) —
// distinct from this repo.
export const METHODS = [
  {
    id: 'prompt',
    label: 'Prompt for agent',
    value: 'set up https://ultrametric.ai/install',
    copyName: 'Copy prompt',
    lines: [{ text: 'set up https://ultrametric.ai/install' }],
    note: null,
  },
  {
    id: 'cli',
    label: 'CLI',
    value: 'npm install -g ultrametric && ultrametric init',
    copyName: 'Copy CLI commands',
    lines: [
      { prompt: true, text: 'npm install -g ultrametric' },
      { prompt: true, text: 'ultrametric init' },
    ],
    note: null,
  },
  {
    id: 'mcp',
    label: 'MCP',
    value: 'https://api.ultrametric.ai/mcp',
    copyName: 'Copy MCP server URL',
    lines: [{ text: 'https://api.ultrametric.ai/mcp' }],
    note: null,
  },
] as const

export type MethodId = (typeof METHODS)[number]['id']

const COPY_RESET_MS = 2000

export default function InstallMethods({ className = 'mx-auto w-full max-w-2xl' }: { className?: string }) {
  const [active, setActive] = useState<MethodId>('prompt')
  // The sr-only live label mirrors the /v2 module: the active method's copy-name at rest,
  // "Copied"/"Copy failed" for 2s after a copy attempt.
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const method = METHODS.find((m) => m.id === active)!

  function settle(state: 'copied' | 'failed') {
    if (resetTimer.current) clearTimeout(resetTimer.current)
    setCopyState(state)
    resetTimer.current = setTimeout(() => setCopyState('idle'), COPY_RESET_MS)
  }

  function selectTab(id: MethodId) {
    if (resetTimer.current) clearTimeout(resetTimer.current)
    setActive(id)
    setCopyState('idle')
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(method.value)
      settle('copied')
    } catch {
      // clipboard unavailable (insecure context) — the value stays selectable text.
      settle('failed')
    }
  }

  const copied = copyState === 'copied'

  return (
    <div className={className}>
      <div className="flex overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 text-left">
        <div className="flex min-w-0 flex-1 flex-col sm:flex-row sm:items-center">
          <div className="flex px-1 pt-1 sm:gap-1 sm:px-2 sm:pt-0" role="group" aria-label="Install method">
            {METHODS.map((m) => (
              <button
                key={m.id}
                type="button"
                aria-pressed={m.id === active}
                onClick={() => selectTab(m.id)}
                className={`min-h-11 min-w-11 cursor-pointer whitespace-nowrap px-2 text-sm font-medium transition-colors sm:px-3 ${
                  m.id === active
                    ? 'text-zinc-100 underline decoration-emerald-400 decoration-2 underline-offset-8'
                    : 'text-zinc-400 hover:text-zinc-100'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <div className="min-w-0 flex-1 py-3 pl-5 pr-5 sm:pr-3">
            <code className="flex flex-col gap-1 font-mono text-sm leading-7 text-zinc-100 sm:text-base">
              {method.lines.map((line) => (
                <span key={line.text} className="flex gap-3">
                  {'prompt' in line && line.prompt ? (
                    <span aria-hidden className="select-none text-emerald-400">
                      $
                    </span>
                  ) : null}
                  <span className="min-w-0 [overflow-wrap:anywhere]">{line.text}</span>
                </span>
              ))}
            </code>
          </div>
        </div>
        <div className="flex items-center pr-1 sm:pr-3">
          <button
            type="button"
            onClick={copy}
            className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-lg text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-zinc-100 sm:bg-zinc-800"
          >
            {copied ? (
              <svg className="size-4" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M4 12.5l5 5L20 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg className="size-4" viewBox="0 0 24 24" fill="none" aria-hidden>
                <rect x="9" y="9" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            )}
            <span className="sr-only" aria-live="polite">
              {copyState === 'idle' ? method.copyName : copyState === 'copied' ? 'Copied' : 'Copy failed'}
            </span>
          </button>
        </div>
      </div>
      {method.note ? <p className="mt-3 text-sm text-zinc-400">{method.note}</p> : null}
    </div>
  )
}
