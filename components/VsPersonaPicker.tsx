'use client'

import Link from 'next/link'
import { VS_PERSONAS, type VsPersonaId } from '@/lib/virtualStartupRun'

// Founder persona picker for the Virtual Startup (v3 upgrade 2) — lives with the preset/decision
// controls above the terminal. A persona shifts which person-routed work is DIY vs delegated in
// the SIMULATED time model only (lib/virtualStartupRun.ts computeStackOutcome); each modifier is
// a named simulation assumption rendered right here, never dressed as judged data. Personas that
// match a data/icp-types.json buyer lens link it as a cross-reference.
export default function VsPersonaPicker({
  persona,
  onSelect,
}: {
  persona: VsPersonaId
  onSelect: (id: VsPersonaId) => void
}) {
  const active = VS_PERSONAS.find((p) => p.id === persona) ?? VS_PERSONAS[0]
  return (
    <section data-testid="vs-persona-picker" className="rounded-2xl border border-zinc-800 p-4 sm:p-5">
      <h2 className="font-display text-lg font-semibold tracking-tight">Who is the founder?</h2>
      <p className="mt-1 text-sm text-zinc-400">
        The persona shifts which steps the founder grinds through by hand in the simulated clock —
        it never changes a judged verdict or a corpus estimate, only the disclosed multipliers below.
      </p>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Founder persona">
        {VS_PERSONAS.map((p) => (
          <button
            key={p.id}
            type="button"
            data-testid={`vs-persona-${p.id}`}
            aria-pressed={p.id === persona}
            onClick={() => onSelect(p.id)}
            title={p.blurb}
            className={`rounded-full border px-3 py-1 text-sm transition ${
              p.id === persona
                ? 'border-emerald-400/60 bg-emerald-400/10 text-emerald-300'
                : 'border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-zinc-500">
        {active.blurb}
        {active.icpId && (
          <>
            {' '}
            · matches the{' '}
            <Link href={`/icp/${active.icpId}`} className="text-emerald-400 underline decoration-emerald-400/40 hover:text-emerald-300">
              {active.icpId}
            </Link>{' '}
            buyer lens
          </>
        )}
      </p>
      {active.assumption && (
        <p data-testid="vs-persona-assumption" className="mt-1.5 text-[11px] leading-snug text-amber-300/90">
          {active.assumption}
        </p>
      )}
    </section>
  )
}
