'use client'

import { useState } from 'react'
import { isPicked } from '@/lib/myStack'
import { useProcessLens } from '@/lib/processLens'

// Copy-pasteable agent prompt for one process step (founder pilot 2026-09-21: "generate prompts
// for each step"). The generated prompt (data/step-prompts.json) carries a literal {{vendor}}
// placeholder; here it resolves in the process lens's order (lib/processLens.ts): the vendor
// the reader CLICKED on this page, else their "I'm using" stack pick, else the step's
// top-ranked vendor — so the same static prompt is personalized client-side without touching
// the SEO HTML (server lens and stack snapshots are both '{}').
export interface PromptVendor {
  productId: string
  arenaId: string
  name: string
}

export default function StepPromptBox({
  prompt,
  vendors,
  lensKey,
}: {
  prompt: string
  vendors: PromptVendor[]
  lensKey?: string
}) {
  const { lens, stack } = useProcessLens(lensKey)
  const [copied, setCopied] = useState(false)
  const viaLens = vendors.find((v) => lens.picks[v.arenaId] === v.productId)
  // vendors arrive in the step's ranked order, so the first that is A pick (multi-vendor
  // stacks, lib/myStack.ts isPicked) is the best-ranked vendor the reader runs.
  const yours = viaLens ?? vendors.find((v) => isPicked(stack, v.arenaId, v.productId))
  const vendorName = yours?.name ?? vendors[0]?.name ?? 'your vendor'
  const resolved = prompt.replaceAll('{{vendor}}', vendorName)

  return (
    <details className="group mt-2">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 text-[11px] text-zinc-500 transition hover:text-zinc-300 [&::-webkit-details-marker]:hidden">
        <span aria-hidden className="inline-block text-[9px] transition-transform group-open:rotate-90">▶</span>
        🪄 agent prompt
        {yours ? (
          <span
            className="rounded bg-emerald-400/10 px-1 py-px text-[9px] font-semibold text-emerald-300"
            title={viaLens ? 'Resolved to the vendor you selected on this page' : 'Resolved to your "I\'m using" stack pick'}
          >
            {viaLens ? `✓ via ${yours.name}` : `set for ${yours.name}`}
          </span>
        ) : (
          vendors[0] && <span className="text-zinc-600">for {vendors[0].name} — set yours via “I&rsquo;m using”</span>
        )}
      </summary>
      <div className="mt-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 p-2.5">
        <pre className="whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-zinc-300">
          {resolved}
        </pre>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(resolved).then(() => {
              setCopied(true)
              setTimeout(() => setCopied(false), 1500)
            })
          }}
          className="mt-2 rounded-md border border-zinc-700 px-2 py-0.5 text-[11px] text-zinc-300 transition hover:border-emerald-400/60 hover:text-emerald-300"
        >
          {copied ? '✓ copied' : 'copy prompt'}
        </button>
      </div>
    </details>
  )
}
