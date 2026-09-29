'use client'

import Link from 'next/link'
import { useState } from 'react'

// Top-bar install affordance (founder 2026-09-29): 'Install' links to the /v2 product page,
// and the clipboard button beside it copies the agent setup prompt directly — one click from
// any page to hand your agent the install instruction.
const AGENT_SETUP_PROMPT = 'set up https://ultrametric.ai/install'

export default function InstallNavAction() {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(AGENT_SETUP_PROMPT)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      /* clipboard unavailable — the Install page carries the same prompt */
    }
  }

  return (
    <span className="hidden shrink-0 items-center gap-1 sm:flex">
      <Link href="/v2" className="text-sm text-zinc-300 transition hover:text-emerald-300" title="Install Ultrametric — agent prompt, CLI, or MCP">
        Install
      </Link>
      <button
        type="button"
        onClick={copy}
        aria-label="Copy the agent setup prompt"
        title={copied ? 'Copied' : `Copy for your agent: ${AGENT_SETUP_PROMPT}`}
        className="flex items-center rounded p-0.5 text-zinc-500 transition hover:text-emerald-300"
      >
        {copied ? (
          <svg aria-hidden viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-none stroke-emerald-300" strokeWidth="1.6">
            <path d="M3 8.5 6.5 12 13 4.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg aria-hidden viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-none stroke-current" strokeWidth="1.4">
            <rect x="5" y="5" width="8" height="9" rx="1.5" />
            <path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-5A1.5 1.5 0 0 0 3 3.5v7A1.5 1.5 0 0 0 4.5 12H5" />
          </svg>
        )}
      </button>
    </span>
  )
}
