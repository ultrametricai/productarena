'use client'

import Link from 'next/link'
import { useMyStackMap } from '@/components/useMyStackMap'
import { STEP_UPGRADE_DELTA, yoursForStep, type ProcessCheckStep } from '@/lib/processCheck'

// Per-step "your stack" line on the PUBLIC process page (founder 2026-09-21: "if a user selects
// the vendor they have, the processes change based on the vendor they have"). Client-only over
// the same pre-serialized rows as "Check my process" (lib/processCheckData.ts) — the server
// snapshot of the stack is '{}', so the static SEO HTML is byte-identical for readers without a
// stack; the line hydrates in only for readers who set "I'm using" picks. Scores are the same
// story-derived stepVendorScore the page already publishes — resolved, never recomputed.
export default function StepYourPick({ step, mineHref }: { step: ProcessCheckStep; mineHref: string }) {
  const stack = useMyStackMap()
  const yours = yoursForStep(step, stack)
  if (!yours) return null
  const delta = Math.round((step.best.score - yours.score) * 10) / 10
  const behind = yours.productId !== step.best.productId && delta > STEP_UPGRADE_DELTA
  return (
    <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px]">
      <span
        className="rounded-md border border-emerald-400/50 bg-emerald-400/10 px-1.5 py-0.5 text-emerald-300"
        title={`Your ${yours.arenaName} pick — judged ${yours.score.toFixed(0)}/100 on the ${step.storyCount} stories mapped to this step`}
      >
        ✓ yours: {yours.name} · {yours.score.toFixed(0)}
      </span>
      {behind && (
        <Link
          href={mineHref}
          title={`${step.best.name} scores ${step.best.score.toFixed(0)}/100 on this step — ${delta.toFixed(0)} points ahead of your pick. Run the whole process against your stack.`}
          className="text-amber-300/90 underline decoration-amber-400/40 underline-offset-2 transition hover:text-amber-200"
        >
          best here: {step.best.name} {step.best.score.toFixed(0)} (+{delta.toFixed(0)}) — check my process →
        </Link>
      )}
    </p>
  )
}
