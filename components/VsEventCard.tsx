'use client'

import Link from 'next/link'
import { formatMinutes } from '@/lib/processSim'
import type { ResolvedVsEvent } from '@/lib/virtualStartupRun'

// One mid-run event card, printed INSIDE the Virtual Startup terminal flow (v3 upgrade 3).
// Honesty contract: the event is SIMULATED (visible chip — the same label contract as the
// artifacts) but grounded in a REAL corpus process ("grounded in:" links its process page) and
// gated by that process's committed risk score plus the run's decisions. Both branches are
// deterministic: real corpus minutes, or a wait constant that names itself a simulation
// assumption. Choices re-toggle freely — the run recomputes, nothing is hidden state.
export default function VsEventCard({
  event,
  groundedTitle,
  groundedSlug,
  risk,
  onChoose,
}: {
  event: ResolvedVsEvent
  groundedTitle: string
  groundedSlug: string
  // The grounded process's corpus risk score (1–5) — shown so the plausibility gate is visible.
  risk: number
  onChoose: (eventId: string, choiceId: string) => void
}) {
  const { def, day, choice } = event
  return (
    <div data-testid="vs-run-event" className="my-2 rounded-lg border border-amber-400/30 bg-amber-400/5 px-3 py-2 text-[13px]">
      <p className="flex flex-wrap items-center gap-1.5">
        <span
          className="shrink-0 rounded border border-fuchsia-400/50 px-1 py-px text-[9px] uppercase tracking-widest text-fuchsia-300"
        >
          simulated
        </span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-amber-300/90">⚡ event · day {day}</span>
        <span className="font-medium text-zinc-200">{def.title}</span>
      </p>
      <p className="mt-1 text-zinc-400">{def.blurb}</p>
      <p className="mt-1 text-[11px] text-zinc-500">
        grounded in:{' '}
        <Link href={`/processes/${groundedSlug}`} className="text-emerald-400 underline decoration-emerald-400/40 hover:text-emerald-300">
          {groundedTitle}
        </Link>{' '}
        · corpus risk {risk}/5
      </p>
      <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label={`Decision: ${def.title}`}>
        {def.choices.map((c) => (
          <button
            key={c.id}
            type="button"
            data-testid={`vs-event-choice-${def.id}-${c.id}`}
            aria-pressed={choice?.id === c.id}
            onClick={() => onChoose(def.id, c.id)}
            className={`rounded-full border px-3 py-1 text-xs transition ${
              choice?.id === c.id
                ? 'border-amber-400/60 bg-amber-400/10 text-amber-200'
                : 'border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>
      {choice ? (
        <div className="mt-2 text-[11px] leading-snug">
          <p className="text-zinc-300">→ {choice.outcome}</p>
          {choice.effect.kind === 'wait-days' && (
            <p data-testid="vs-event-assumption" className="mt-0.5 text-amber-300/90">{choice.effect.assumption}</p>
          )}
          {(choice.effect.kind === 'redo-tasks' || choice.effect.kind === 'add-chain-time' || choice.effect.kind === 'switch-vendor') && (
            <p className="mt-0.5 text-zinc-500">{choice.effect.blurb}</p>
          )}
          {choice.effect.kind === 'lose-deal' && <p className="mt-0.5 text-red-300/90">{choice.effect.note}</p>}
          {event.deltaMinutes > 0 && (
            <p className="mt-0.5 font-mono text-zinc-400">clock +{formatMinutes(event.deltaMinutes)}</p>
          )}
        </div>
      ) : (
        <p className="mt-2 text-[11px] text-zinc-500">
          undecided — the scorecard counts this event only once you choose (pending decisions add no time)
        </p>
      )}
    </div>
  )
}
