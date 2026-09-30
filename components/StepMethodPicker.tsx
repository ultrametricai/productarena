'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import ProductLogoView from '@/components/ProductLogoView'
import { GEO_PREF_META, getGeoSelection, subscribeGeoSelection } from '@/lib/geoPreference'
import { formatMinutes } from '@/lib/processSim'
import {
  DEFAULT_METHOD_ID, methodSelection, setMethodSelection, subscribeMethodSelections,
  type StepMethodChipView, type StepMethodSubStepView, type StepMethodView, type StepRoute,
} from '@/lib/stepMethods'

// The method selector for one method-bearing DAG step (founder 2026-09-30: "certain processes
// have steps that are just ONE way to do it when there are multiple methods depending on
// context — get multiple options selectable by context"). House listbox pattern
// (GeoDropdown/SimRolePicker family — never a native <select>).
//
// Selecting a variant swaps the step's displayed route/vendors/calls/time: the panel below
// renders the variant's own route badge, market chips, calls, honest time, and — where the
// method genuinely decomposes — its 2–5-step mini-DAG, indented; meanwhile the step's
// default-method content hides (components/StepMethodDefault.tsx shares the selection store).
//
// Geo auto-preselect: while the reader hasn't clicked a method themselves, a non-US geo
// selection (lib/geoPreference.ts shared store) auto-selects the geo method covering that
// country; clearing the geo (or picking a country no method covers) returns to the default.
//
// Honesty: every committed number on the page keeps describing the DEFAULT method (the static
// HTML renders it byte-identically). A variant's recomputed process ceiling — precomputed
// server-side with the same computeCeiling math (lib/stepMethodData.ts) — renders explicitly
// labelled "with this method", with the default alongside (the JurisdictionToggle precedent).

// Client-side copy of ProcessDag's route visual language (that module is server-only: node:fs).
const ROUTE_BADGE: Record<StepRoute, { cls: string; label: string }> = {
  agent: { cls: 'bg-emerald-400/10 text-emerald-300', label: 'agent' },
  form: { cls: 'bg-amber-400/10 text-amber-300', label: 'manual form' },
  person: { cls: 'bg-sky-400/10 text-sky-300', label: 'human or computer use' },
}
const SIGNATURE_BADGE = { cls: 'bg-violet-400/10 text-violet-300', label: '✍ signature — legally human' }
const ROUTE_BLOCK: Record<StepRoute, string> = {
  agent: 'border-emerald-400/40 bg-emerald-400/[0.06]',
  form: 'border-amber-400/40 bg-amber-400/[0.05]',
  person: 'border-sky-400/40 bg-sky-400/[0.05]',
}

const KIND_META = {
  situational: { tag: 'context', title: 'Situational method — the right one depends on what you are building' },
  geo: { tag: 'geo', title: 'Geo method — applies in the tagged countries (auto-selected by your geo choice)' },
  vendor: { tag: 'vendor', title: 'Vendor-specific method — a different supplier shape for the same step' },
} as const

// One vendor chip, the client-safe mirror of ProcessDag's VendorChip: tracked vendors link to
// our judged product page; untracked ones render as honest unlinked chips.
function MethodChip({ chip }: { chip: StepMethodChipView }) {
  const body = (
    <>
      <ProductLogoView product={{ id: chip.productId ?? chip.vendor, name: chip.label }} size={28} hasLogo={chip.hasLogo} />
      <span className="truncate">{chip.label}</span>
      {chip.agentReady !== null && (
        <span className="font-mono text-[10px] tabular-nums text-emerald-400/80">{chip.agentReady.toFixed(0)}</span>
      )}
    </>
  )
  if (chip.productId && chip.arenaId) {
    return (
      <Link
        href={`/arena/${chip.arenaId}/product/${chip.productId}`}
        title={`${chip.label} — #${chip.rank} by agent-readiness in ${chip.arenaName ?? chip.arenaId} — see the judged product page`}
        className="inline-flex min-w-0 items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900/60 py-0.5 pl-0.5 pr-2 text-zinc-200 transition hover:border-emerald-400/60 hover:text-emerald-300"
      >
        {body}
      </Link>
    )
  }
  return (
    <span
      title={`${chip.label} — not yet judged on Ultrametric`}
      className="inline-flex min-w-0 items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 py-0.5 pl-0.5 pr-2 text-zinc-400"
    >
      {body}
    </span>
  )
}

// The variant's mini sub-DAG: an indented, route-coded 2–5-step flow (corpus-committed, never
// nested further) — the compact analog of the main diagram's block spine.
function SubStepFlow({ subSteps }: { subSteps: StepMethodSubStepView[] }) {
  return (
    <ol className="mt-2 space-y-1.5 border-l border-zinc-700/80 pl-3">
      {subSteps.map((s, i) => {
        const badge = s.legalSignature ? SIGNATURE_BADGE : ROUTE_BADGE[s.route]
        return (
          <li key={s.id} className={`rounded-md border p-2 ${ROUTE_BLOCK[s.route]}`}>
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 text-xs font-medium text-zinc-100">
                <span className="mr-1.5 font-mono text-[10px] tabular-nums text-zinc-500">
                  {String(i + 1).padStart(2, '0')}
                </span>
                {s.label}
              </p>
              <span className={`mt-px shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${badge.cls}`}>
                {badge.label}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-zinc-500">
              <span>{formatMinutes(s.estimatedMinutes)}</span>
              {s.async && <span title="Async — waits on a third party">⏳ async</span>}
              {s.actionUrl && (
                <a
                  href={s.actionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-400 underline decoration-zinc-700 underline-offset-2 transition hover:text-emerald-300"
                >
                  {s.actionLabel ?? 'do it yourself'} ↗
                </a>
              )}
              {s.chips.map((c) => (
                <MethodChip key={c.vendor} chip={c} />
              ))}
            </div>
            {s.calls.length > 0 && (
              <ul className="mt-1 space-y-0.5">
                {s.calls.map((call) => (
                  <li key={call} className="truncate font-mono text-[10px] text-zinc-500">{call}</li>
                ))}
              </ul>
            )}
          </li>
        )
      })}
    </ol>
  )
}

export default function StepMethodPicker({
  nodeKey,
  defaultView,
  methods,
}: {
  nodeKey: string
  defaultView: StepMethodView
  methods: StepMethodView[]
}) {
  const selectedId = useSyncExternalStore(
    subscribeMethodSelections,
    () => methodSelection(nodeKey),
    () => DEFAULT_METHOD_ID,
  )
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  // A reader's explicit click wins over the geo auto-preselect for the rest of the tab session.
  const manualRef = useRef(false)

  // Geo auto-preselect: follow the shared geo store while the reader hasn't picked manually.
  // GeoSwitcher seeds the store from ?geo=/localStorage on ITS mount; the subscription catches
  // that seed regardless of mount order.
  useEffect(() => {
    const sync = () => {
      if (manualRef.current) return
      const geo = getGeoSelection()
      const hit = geo
        ? methods.find((m) => m.context?.kind === 'geo' && m.context.countries.includes(geo))
        : undefined
      setMethodSelection(nodeKey, hit ? hit.id : DEFAULT_METHOD_ID)
    }
    sync()
    return subscribeGeoSelection(sync)
  }, [nodeKey, methods])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const apply = (id: string) => {
    manualRef.current = true
    setMethodSelection(nodeKey, id)
    setOpen(false)
  }

  const selected = methods.find((m) => m.id === selectedId) ?? null
  const options: StepMethodView[] = [defaultView, ...methods]
  const kindTag = (m: StepMethodView) =>
    m.context === null ? null : (
      <span
        title={m.context.kind === 'geo'
          ? `${KIND_META.geo.title} — ${m.context.when}`
          : `${KIND_META[m.context.kind].title} — ${m.context.when}`}
        className="ml-auto shrink-0 rounded border border-zinc-700/80 px-1 py-px text-[9px] uppercase tracking-wide text-zinc-500"
      >
        {m.context.kind === 'geo'
          ? m.context.countries.map((c) => GEO_PREF_META[c].flag).join('')
          : KIND_META[m.context.kind].tag}
      </span>
    )
  const badge = selected
    ? ROUTE_BADGE[selected.route]
    : ROUTE_BADGE[defaultView.route]

  return (
    <div ref={rootRef} className="relative mt-2">
      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
        <span
          className="text-[10px] uppercase tracking-wide text-zinc-500"
          title={`${methods.length + 1} ways to run this step — the default is what every committed number describes; pick the one your context calls for`}
        >
          method:
        </span>
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900/60 px-2 py-0.5 text-zinc-200 transition hover:border-emerald-400/60 hover:text-emerald-300"
        >
          <span className="truncate">{selected ? selected.label : 'Default'}</span>
          <span aria-hidden className="text-[10px] text-zinc-500">▾</span>
        </button>
        <span className="text-zinc-500">{methods.length + 1} ways</span>
      </div>
      {open && (
        <ul
          role="listbox"
          aria-label="Method for this step"
          className="absolute left-0 z-40 mt-1 w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 py-1 shadow-2xl"
        >
          {options.map((m) => {
            const active = m.id === selectedId
            return (
              <li key={m.id} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => apply(m.id)}
                  title={m.context?.when ?? 'The default method — the one every committed number on this page describes'}
                  className={`flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs transition ${
                    active ? 'bg-emerald-400/10 text-emerald-300' : 'text-zinc-300 hover:bg-zinc-800 hover:text-emerald-300'
                  }`}
                >
                  <span className="min-w-0 truncate">
                    {m.id === DEFAULT_METHOD_ID ? 'Default' : m.label}
                  </span>
                  {kindTag(m)}
                  {active && <span aria-hidden className="shrink-0">✓</span>}
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {selected && (
        <div className="mt-2 rounded-lg border border-zinc-700/80 bg-zinc-900/40 p-2.5">
          <div className="flex items-start justify-between gap-2">
            <p className="min-w-0 text-xs font-medium text-zinc-100">{selected.label}</p>
            <span className={`mt-px shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badge.cls}`}>
              {badge.label}
            </span>
          </div>
          {selected.context && (
            <p className="mt-1 text-[11px] text-zinc-500">
              <span className="text-[10px] uppercase tracking-wide">when:</span>{' '}
              {selected.context.kind === 'geo' && (
                <span aria-hidden className="mr-1">
                  {selected.context.countries.map((c) => GEO_PREF_META[c].flag).join(' ')}
                </span>
              )}
              {selected.context.when}
            </p>
          )}
          {selected.summary && <p className="mt-1 text-[11px] leading-relaxed text-zinc-400">{selected.summary}</p>}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-zinc-500">
            {selected.estimatedMinutes !== null && (
              <span title="Honest time only: committed in the corpus or derived from the sub-steps — never invented">
                ~{formatMinutes(selected.estimatedMinutes)}
              </span>
            )}
            {selected.actionUrl && (
              <a
                href={selected.actionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md border border-zinc-700/80 px-1.5 py-0.5 text-[10px] text-zinc-300 transition hover:border-emerald-400/60 hover:text-emerald-300"
              >
                do it yourself: {selected.actionLabel ?? selected.actionUrl} ↗
              </a>
            )}
            {selected.chips.map((c) => (
              <MethodChip key={c.vendor} chip={c} />
            ))}
          </div>
          {selected.calls.length > 0 && (
            <ul className="mt-1.5 space-y-0.5 border-l border-zinc-800 pl-3">
              {selected.calls.map((call) => (
                <li key={call} className="truncate font-mono text-[11px] text-zinc-400">{call}</li>
              ))}
            </ul>
          )}
          {selected.subSteps.length > 0 && <SubStepFlow subSteps={selected.subSteps} />}
          {selected.ceiling && defaultView.ceiling && (
            <p className="mt-2 text-[11px] text-zinc-400">
              Ceiling with this method:{' '}
              <span className="font-medium text-emerald-300">{selected.ceiling.pct}%</span>{' '}
              <span className="text-zinc-500">
                — an agent can run {selected.ceiling.agentSteps} of {selected.ceiling.totalSteps} steps
                (default method: {defaultView.ceiling.pct}%, {defaultView.ceiling.agentSteps} of{' '}
                {defaultView.ceiling.totalSteps}). Every committed number on this page describes the default.
              </span>
            </p>
          )}
        </div>
      )}
    </div>
  )
}
