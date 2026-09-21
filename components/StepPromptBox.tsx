'use client'

import { useState } from 'react'
import { useMyStackMap } from '@/components/useMyStackMap'

// Copy-pasteable agent prompt for one process step (founder pilot 2026-09-21: "generate prompts
// for each step"). The generated prompt (data/step-prompts.json) carries a literal {{vendor}}
// placeholder; here it resolves to the reader's own "I'm using" pick when their stack covers one
// of the step's market arenas, else the step's top-ranked vendor — so the same static prompt is
// personalized client-side without touching the SEO HTML (server stack snapshot is '{}').
export interface PromptVendor {
  productId: string
  arenaId: string
  name: string
}

export default function StepPromptBox({ prompt, vendors }: { prompt: string; vendors: PromptVendor[] }) {
  const stack = useMyStackMap()
  const [copied, setCopied] = useState(false)
  const yours = vendors.find((v) => stack[v.arenaId] === v.productId)
  const vendorName = yours?.name ?? vendors[0]?.name ?? 'your vendor'
  const resolved = prompt.replaceAll('{{vendor}}', vendorName)

  return (
    <details className="group mt-2">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 text-[11px] text-zinc-500 transition hover:text-zinc-300 [&::-webkit-details-marker]:hidden">
        <span aria-hidden className="inline-block text-[9px] transition-transform group-open:rotate-90">▶</span>
        🪄 agent prompt
        {yours ? (
          <span className="rounded bg-emerald-400/10 px-1 py-px text-[9px] font-semibold text-emerald-300">
            set for {yours.name}
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
