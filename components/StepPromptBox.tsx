'use client'

import { useState, type ReactNode } from 'react'
import { isPicked } from '@/lib/myStack'
import { useProcessLens } from '@/lib/processLens'

// The step's "Do it with AI" action row (founder 2026-09-25: make the process steps AI-centric —
// the generated agent prompt is the PRIMARY affordance). Founder 2026-09-30 compaction: the
// prompt renders in a SMALLER always-open box (max-h ~160px, internal scroll — the 'hide
// prompt' toggle is gone), headed just 'prompt' with an icon-only copy button top-right (the
// house clipboard svg; aria-label 'Copy prompt' kept for the tests and screen readers); the
// "for X — set yours via I'm using" fallback line is gone too. "Open in Claude / ChatGPT" open
// the assistant with the prompt in the ?q= param AND copy it in the same click — belt and
// braces, because a 2026-09-25 curl -I check of both https://claude.ai/new?q=… and
// https://chatgpt.com/?q=… hit a Cloudflare challenge (403, cf-mitigated: challenge), so ?q=
// prefill could not be verified headlessly; with the copy in the same user gesture the reader
// can always paste if prefill doesn't take.
//
// The generated prompt (data/step-prompts.json) carries a literal {{vendor}} placeholder; here
// it resolves in the process lens's order (lib/processLens.ts): the vendor the reader CLICKED
// on this page, else their "I'm using" stack pick, else the step's top-ranked vendor — so the
// same static prompt is personalized client-side without touching the SEO HTML (server lens and
// stack snapshots are both '{}', so SSR always renders the default top-vendor view).
//
// `children` carry the step's OTHER action affordances (the staff-gated AFK trigger, the manual
// "do it yourself" link) so the whole row reads AI path first, manual path last, and the
// expanded prompt preview lands below the entire row.
export interface PromptVendor {
  productId: string
  arenaId: string
  name: string
}

// Assistant prefill endpoints — both accept a ?q= prompt param. Exported (with the URL builders)
// so tests pin the exact link contract.
export const CLAUDE_PREFILL_BASE = 'https://claude.ai/new'
export const CHATGPT_PREFILL_BASE = 'https://chatgpt.com/'

export function claudePromptUrl(prompt: string): string {
  return `${CLAUDE_PREFILL_BASE}?q=${encodeURIComponent(prompt)}`
}

export function chatgptPromptUrl(prompt: string): string {
  return `${CHATGPT_PREFILL_BASE}?q=${encodeURIComponent(prompt)}`
}

export default function StepPromptBox({
  prompt,
  vendors,
  lensKey,
  legalSignature = false,
  children,
}: {
  prompt: string
  vendors: PromptVendor[]
  lensKey?: string
  // Legally-required signature steps keep the prompt row (the generated prompts prep-and-stop),
  // but the row says out loud that the signing human is not replaced.
  legalSignature?: boolean
  children?: ReactNode
}) {
  const { lens, stack } = useProcessLens(lensKey)
  const [copied, setCopied] = useState(false)
  const viaLens = vendors.find((v) => lens.picks[v.arenaId] === v.productId)
  // vendors arrive in the step's ranked order, so the first that is A pick (multi-vendor
  // stacks, lib/myStack.ts isPicked) is the best-ranked vendor the reader runs.
  const yours = viaLens ?? vendors.find((v) => isPicked(stack, v.arenaId, v.productId))
  const vendorName = yours?.name ?? vendors[0]?.name ?? 'your vendor'
  const resolved = prompt.replaceAll('{{vendor}}', vendorName)

  // Shared by the copy chip AND the open links (the same-click copy fallback documented above).
  const copyResolved = () => {
    navigator.clipboard?.writeText(resolved).then(
      () => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      },
      () => {
        // Clipboard refused (permissions) — for the open links the ?q= prefill still carries
        // the prompt; for the copy chip the reader can expand the preview and copy manually.
      },
    )
  }

  const linkClass =
    'inline-flex items-center gap-1 rounded-md border border-zinc-700 px-1.5 py-0.5 text-[10px] text-zinc-300 transition hover:border-emerald-400/60 hover:text-emerald-300'

  return (
    <div className="mt-2 text-[11px]">
      <div className="flex flex-wrap items-center gap-1.5">
        <span
          className="text-[10px] uppercase tracking-wide text-zinc-500"
          title="A generated agent prompt for this step — copy it, or open it directly in an assistant"
        >
          🪄 do it with AI:
        </span>
        {/* The row's 'Copy prompt' text button moved into the prompt box header as the
            icon-only copy control (founder 2026-09-30). */}
        <a
          href={claudePromptUrl(resolved)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={copyResolved}
          title="Opens Claude with the prompt prefilled (?q=) — the same click also copies it, so you can paste if prefill doesn't take"
          className={linkClass}
        >
          Open in Claude ↗
        </a>
        <a
          href={chatgptPromptUrl(resolved)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={copyResolved}
          title="Opens ChatGPT with the prompt prefilled (?q=) — the same click also copies it, so you can paste if prefill doesn't take"
          className={linkClass}
        >
          Open in ChatGPT ↗
        </a>
        {/* A resolved personal pick still announces itself; the no-pick "for X — set yours via
            'I'm using'" fallback line is gone (founder 2026-09-30). */}
        {yours && (
          <span
            className="rounded bg-emerald-400/10 px-1 py-px text-[9px] font-semibold text-emerald-300"
            title={viaLens ? 'Resolved to the vendor you selected on this page' : 'Resolved to your "I\'m using" stack pick'}
          >
            {viaLens ? `✓ via ${yours.name}` : `set for ${yours.name}`}
          </span>
        )}
        {children}
      </div>
      {legalSignature && (
        <p className="mt-1 text-[10px] text-violet-300/80">
          ✍ the prompt preps the paperwork and stops — the signature itself is legally yours to give.
        </p>
      )}
      {/* The compact always-open prompt box (founder 2026-09-30): no hide/view toggle, header
          just 'prompt', the copy control top-right as the icon only, and the prompt text capped
          at ~160px with its own scroll. */}
      <div className="mt-1.5 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/60">
        <div className="flex items-center justify-between gap-2 border-b border-zinc-800/70 bg-zinc-900 px-2.5 py-1">
          <span className="text-[9px] uppercase tracking-widest text-zinc-500">prompt</span>
          <button
            type="button"
            onClick={copyResolved}
            aria-label={copied ? 'Copied' : 'Copy prompt'}
            title={`Copies the step's agent prompt, resolved for ${vendorName}, to your clipboard`}
            className="rounded p-0.5 text-emerald-400/80 transition hover:bg-emerald-400/10 hover:text-emerald-300"
          >
            {/* House clipboard icon (founder 2026-09-25: "make the copy icon nice") — swaps to
                a check on success. */}
            {copied ? (
              <svg viewBox="0 0 16 16" width={12} height={12} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M2.5 8.5l3.5 3.5 7-8" />
              </svg>
            ) : (
              <svg viewBox="0 0 16 16" width={12} height={12} fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="5" y="5" width="8.5" height="9" rx="1.5" />
                <path d="M10.5 5V3.5A1.5 1.5 0 0 0 9 2H4a1.5 1.5 0 0 0-1.5 1.5V11A1.5 1.5 0 0 0 4 12.5h1" />
              </svg>
            )}
          </button>
        </div>
        <pre className="max-h-40 overflow-y-auto whitespace-pre-wrap break-words p-2.5 font-mono text-[11px] leading-relaxed text-zinc-300">
          {resolved}
        </pre>
      </div>
    </div>
  )
}
