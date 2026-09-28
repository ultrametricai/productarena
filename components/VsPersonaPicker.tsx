'use client'

import { VS_PERSONAS, type VsPersonaId } from '@/lib/virtualStartupRun'

// Compact founder-persona segment for the Virtual Startup setup band (founder ask 2026-09-28:
// "make the examples, decisions and 'who is the founder' much more compact, so we can see the
// terminal above the fold"). A persona shifts which person-routed work is DIY vs delegated in
// the SIMULATED time model only (lib/virtualStartupRun.ts computeStackOutcome) — it never changes
// a judged verdict or a corpus estimate. The three options render as small segmented buttons:
// short visible labels, the canonical full label as the accessible name, and the blurb in the
// tooltip (components/InstantTooltip.tsx upgrades every title= site-wide). The active persona's
// named simulation assumption prints in the band's info line (components/VirtualStartup.tsx),
// and the full blurbs + icp-lens cross-references live in the band's "full setup guide" expand.
const SHORT_LABEL: Record<VsPersonaId, string> = {
  'solo-technical': 'Solo technical',
  'non-technical': 'Non-technical',
  'second-timer': 'Second-timer',
}

export default function VsPersonaPicker({
  persona,
  onSelect,
}: {
  persona: VsPersonaId
  onSelect: (id: VsPersonaId) => void
}) {
  return (
    <span
      data-testid="vs-persona-picker"
      role="group"
      aria-label="Who is the founder?"
      className="flex shrink-0 items-center gap-0.5 rounded-full border border-zinc-800/80 bg-zinc-900/30 py-0.5 pl-2 pr-1"
    >
      {/* No visible label — the setup band's grid label column says "Founder" (2026-09-28). */}
      {VS_PERSONAS.map((p) => (
        <button
          key={p.id}
          type="button"
          data-testid={`vs-persona-${p.id}`}
          aria-pressed={p.id === persona}
          aria-label={p.label}
          title={`${p.label} — ${p.blurb}`}
          onClick={() => onSelect(p.id)}
          className={`whitespace-nowrap rounded-full border px-2 py-0.5 text-xs transition ${
            p.id === persona
              ? 'border-emerald-400/60 bg-emerald-400/10 text-emerald-300'
              : 'border-transparent text-zinc-300 hover:text-zinc-100'
          }`}
        >
          {SHORT_LABEL[p.id]}
        </button>
      ))}
    </span>
  )
}
