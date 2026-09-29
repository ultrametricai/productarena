'use client'

import { useState } from 'react'

// The sitewide install banner (founder 2026-09-29): the exact bottom-of-/v2 module — "Your AI
// native company starts here" + the three install methods — rendered at the end of every
// content page (app/layout.tsx, above the footer). Values mirror the /v2 product page; the
// MCP endpoint and CLI package are the dedicated /v2 product (npm `ultrametric`), distinct
// from this repo.
const METHODS = [
  { id: 'prompt', label: 'Prompt for agent', value: 'set up https://ultrametric.ai/install', copyName: 'Copy prompt' },
  { id: 'cli', label: 'CLI', value: 'npm install -g ultrametric && ultrametric init', copyName: 'Copy CLI commands' },
  { id: 'mcp', label: 'MCP', value: 'https://api.ultrametric.ai/mcp', copyName: 'Copy MCP endpoint' },
] as const

type MethodId = (typeof METHODS)[number]['id']

export default function InstallBanner() {
  const [active, setActive] = useState<MethodId>('prompt')
  const [copied, setCopied] = useState(false)
  const method = METHODS.find((m) => m.id === active)!

  async function copy() {
    try {
      await navigator.clipboard.writeText(method.value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      /* clipboard unavailable — the value is selectable text */
    }
  }

  return (
    <section id="install" aria-label="Set up Ultrametric" className="scroll-mt-4 border-t border-zinc-800">
      <div className="mx-auto max-w-7xl px-5 py-10">
        <h2 className="font-display text-xl font-semibold tracking-tight">Your AI native company starts here</h2>
        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Install method">
          {METHODS.map((m) => (
            <button
              key={m.id}
              type="button"
              aria-pressed={m.id === active}
              onClick={() => {
                setActive(m.id)
                setCopied(false)
              }}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                m.id === active
                  ? 'border-emerald-400/60 bg-emerald-400/10 text-emerald-300'
                  : 'border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="mt-3 flex max-w-2xl items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5">
          <code className="min-w-0 flex-1 select-all truncate font-mono text-xs text-zinc-200">{method.value}</code>
          <button
            type="button"
            onClick={copy}
            aria-label={method.copyName}
            title={method.copyName}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-800 px-2.5 py-1 text-xs text-zinc-300 transition hover:border-emerald-400/60 hover:text-emerald-300"
          >
            {copied ? (
              <>
                <svg aria-hidden viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-none stroke-emerald-300" strokeWidth="1.6">
                  <path d="M3 8.5 6.5 12 13 4.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Copied
              </>
            ) : (
              <>
                <svg aria-hidden viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-none stroke-current" strokeWidth="1.4">
                  <rect x="5" y="5" width="8" height="9" rx="1.5" />
                  <path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-5A1.5 1.5 0 0 0 3 3.5v7A1.5 1.5 0 0 0 4.5 12H5" />
                </svg>
                Copy
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  )
}
