'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  activeJurisdictionSteps,
  ceilingWithJurisdictions,
  JURIS_PARAM,
  JURIS_STORAGE_KEY,
  JURISDICTION_META,
  JURISDICTIONS,
  parseJuris,
  serializeJuris,
  type Jurisdiction,
  type JurisdictionStepView,
} from '@/lib/jurisdictions'
import { formatMinutes } from '@/lib/processSim'
import { readParam, setParams } from '@/lib/urlState'

// The jurisdiction control (founder 2026-09-25: "allow more options for the processes — ie
// multi-state situations or California included — so we can see how the processes change").
// Rendered ONLY on /processes/[slug] pages whose process has jurisdiction-conditional steps
// (the server page checks). Pills: [Delaware-only] [+ California] [+ Multi-state] — CA and
// multi-state toggle independently; Delaware-only is the default and clears both.
//
// Static-HTML/hydration contract (the components/HomeModes.tsx precedent): the server snapshot
// always renders the Delaware-only default — conditional steps and the recomputed ceiling only
// appear after the mount effect reads ?juris= (lib/urlState.ts conventions; the URL wins) or
// the localStorage copy (pa-jurisdiction). Toggling writes both; the default never appears in
// the URL and clears the stored copy.
//
// Honesty: every judged number on the page is the Delaware-only default — the recomputed
// ceiling below is explicitly labelled as the with-jurisdiction view, same arithmetic as
// lib/processes.ts computeCeiling (lib/jurisdictions.ts ceilingWithJurisdictions).

const ROUTE_COLOR: Record<JurisdictionStepView['route'], string> = {
  agent: 'text-emerald-300',
  form: 'text-amber-300',
  person: 'text-sky-300',
}

const ROUTE_LABEL: Record<JurisdictionStepView['route'], string> = {
  agent: 'agent',
  form: 'manual form/portal',
  person: 'human or computer use',
}

export default function JurisdictionToggle({
  steps,
  base,
}: {
  steps: JurisdictionStepView[]
  base: { agentSteps: number; totalSteps: number; pct: number }
}) {
  const [active, setActive] = useState<Jurisdiction[]>([])
  /* eslint-disable react-hooks/set-state-in-effect -- one-time post-hydration sync FROM the URL
     and the stored preference (external systems). The static HTML must render the Delaware-only
     default, so this cannot be a useState initializer (hydration mismatch); it runs once and
     renders at most one extra pass. */
  useEffect(() => {
    const fromUrl = readParam(JURIS_PARAM)
    if (fromUrl !== null) setActive(parseJuris(fromUrl))
    else setActive(parseJuris(window.localStorage.getItem(JURIS_STORAGE_KEY)))
    // Mount-only: the URL (else the stored copy) is the INITIAL view.
  }, [])
  /* eslint-enable react-hooks/set-state-in-effect */

  const apply = (next: Jurisdiction[]) => {
    const canonical = JURISDICTIONS.filter((j) => next.includes(j))
    setActive(canonical)
    const serialized = serializeJuris(canonical)
    setParams({ [JURIS_PARAM]: serialized })
    if (serialized === null) window.localStorage.removeItem(JURIS_STORAGE_KEY)
    else window.localStorage.setItem(JURIS_STORAGE_KEY, serialized)
  }
  const toggle = (j: Jurisdiction) =>
    apply(active.includes(j) ? active.filter((a) => a !== j) : [...active, j])

  const shown = activeJurisdictionSteps(steps, active)
  const ceiling = ceilingWithJurisdictions(base, steps, active)
  const countFor = (j: Jurisdiction) => steps.filter((s) => s.jurisdictions.includes(j)).length
  const activeNoun = active.map((j) => JURISDICTION_META[j].noun).join(' + ')

  const pill = (isActive: boolean, label: string, title: string, onClick: () => void) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={isActive}
      className={`whitespace-nowrap rounded-full px-2 py-1 text-xs transition sm:px-3 ${
        isActive
          ? 'bg-emerald-400/15 font-medium text-emerald-300 ring-1 ring-emerald-400/50'
          : 'text-zinc-400 hover:text-zinc-200'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="mt-4 rounded-2xl border border-zinc-800 p-4 sm:p-5">
      <p className="text-[10px] uppercase tracking-widest text-zinc-400">Jurisdiction</p>
      <div className="mt-2 inline-flex flex-wrap items-center gap-0.5 rounded-full border border-zinc-800 p-1 sm:gap-1">
        {pill(
          active.length === 0,
          'Delaware-only',
          'The default every number on this page is computed from — no state-specific steps',
          () => apply([]),
        )}
        {JURISDICTIONS.map((j) =>
          <span key={j}>{pill(active.includes(j), JURISDICTION_META[j].pill, JURISDICTION_META[j].title, () => toggle(j))}</span>,
        )}
      </div>
      {active.length === 0 ? (
        <p className="mt-2 text-xs text-zinc-500">
          Delaware-only view — this process gains
          {JURISDICTIONS.filter((j) => countFor(j) > 0).map((j, i) => (
            <span key={j}>
              {i > 0 && ' and'} {countFor(j)} {JURISDICTION_META[j].noun} step{countFor(j) === 1 ? '' : 's'}
            </span>
          ))}{' '}
          when those situations apply.
        </p>
      ) : (
        <>
          <ul className="mt-3 space-y-2 text-sm">
            {shown.map((s) => (
              <li key={`${s.jurisdictions.join('-')}:${s.label}`} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                {s.jurisdictions.map((j) => (
                  <span
                    key={j}
                    className="rounded-full border border-zinc-700 px-1.5 py-px text-[10px] uppercase tracking-wide text-zinc-300"
                    title={JURISDICTION_META[j].title}
                  >
                    {JURISDICTION_META[j].badge}
                  </span>
                ))}
                <span className="text-zinc-200">{s.label}</span>
                <span className={`text-xs ${ROUTE_COLOR[s.route]}`}>{ROUTE_LABEL[s.route]}</span>
                <span className="text-xs text-zinc-500">
                  {formatMinutes(s.estimatedMinutes)}
                  {s.async && ' ⏳'}
                </span>
                {s.actionUrl && (
                  <a
                    href={s.actionUrl}
                    className="text-xs text-zinc-400 underline decoration-zinc-600 underline-offset-2 transition hover:text-emerald-300"
                    title={s.actionLabel ?? s.actionUrl}
                  >
                    {s.actionLabel ?? 'do it yourself'} ↗
                  </a>
                )}
                {s.processHref && (
                  <Link
                    href={s.processHref}
                    className="text-xs text-emerald-300 underline decoration-emerald-400/40 underline-offset-2 transition hover:text-emerald-200"
                    title={`This work is its own process — see ${s.processTitle}`}
                  >
                    {s.processTitle} →
                  </Link>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-zinc-300">
            Ceiling with {activeNoun} steps:{' '}
            <span className="font-medium text-emerald-300">{ceiling.pct}%</span>{' '}
            <span className="text-zinc-500">
              — an agent can run {ceiling.agentSteps} of {ceiling.totalSteps} steps (Delaware-only
              default: {base.pct}%, {base.agentSteps} of {base.totalSteps}).
            </span>
          </p>
        </>
      )}
    </div>
  )
}
