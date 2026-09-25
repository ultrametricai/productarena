'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import CeilingBar from '@/components/CeilingBar'
import ProcessSimulator from '@/components/ProcessSimulator'
import { formatMinutes, type SimStep, type VendorRole } from '@/lib/processSim'
import { readParam, setParams } from '@/lib/urlState'
import {
  applyYcCalibration,
  buildJourneyArtifacts,
  comboKey,
  dayOf,
  DECISIONS,
  DEFAULT_CHOICES,
  eventRows,
  journeyPhases,
  journeyStats,
  MONTH_LABELS,
  presetById,
  synthCompany,
  VS_PRESETS,
  windowRows,
  YC_BATCH,
  YC_CALIBRATION,
  yearRows,
  yearStats,
  type Choices,
  type EventExample,
  type PresetId,
  type SyntheticArtifact,
  type TopVendorPick,
  type VirtualTaskPayload,
  type VsChain,
  type VsPreset,
  type WindowRow,
  type YearCandidate,
  type YearRow,
} from '@/lib/virtualStartup'

// The Virtual Startup timeline (see lib/virtualStartup.ts for the honesty contract): the reader
// picks the starting decisions, then a synthetic company replays the REAL selected processes in
// time order — each step with its real route, its top JUDGED vendor where a ranking exists, and
// corpus time estimates — while clearly-labeled SIMULATED artifacts show what each step produces.
// When the launch journey completes, a year-one operating-rhythm calendar shows the recurring
// runs ("cron jobs") the company now owns, derived from the corpus cadence axis. Everything is
// precomputed/deterministic; the ~cadenced reveal is presentation only (the same pattern as
// components/ProcessSimulator.tsx, which is also reused below for the full dry-run transcript
// over the selected journey).

const CADENCE_MS = 240

type Row =
  | { kind: 'phase'; key: string; title: string; chainId: string; chainName: string; note: string | null }
  | { kind: 'task'; key: string; task: VirtualTaskPayload }
  | { kind: 'day'; key: string; day: number }
  | { kind: 'step'; key: string; step: SimStep; top: TopVendorPick | null }
  | { kind: 'artifact'; key: string; artifact: SyntheticArtifact }

// The visible synthetic-data label — rendered beside EVERY generated artifact (and the company
// banner). Tests assert one of these per artifact node; nothing synthetic ships without it.
function SimChip() {
  return (
    <span className="shrink-0 rounded border border-fuchsia-400/50 px-1 py-px text-[9px] uppercase tracking-widest text-fuchsia-300">
      simulated
    </span>
  )
}

function routeBadge(step: SimStep): { text: string; cls: string } {
  if (step.route === 'agent') return { text: 'agent', cls: 'border-emerald-400/40 text-emerald-300' }
  if (step.route === 'form') return { text: 'manual form', cls: 'border-amber-400/40 text-amber-300' }
  if (step.legalSignature) return { text: '✍ signature', cls: 'border-violet-400/40 text-violet-300' }
  return { text: 'human / computer use', cls: 'border-sky-400/40 text-sky-300' }
}

// One rhythm row of the year-one calendar: the process, its cadence, the 12-month strip, and
// its route mix / agent ceiling. Seeded (non-corpus) calendar slots carry the SIMULATED chip.
function YearRhythmRow({ row }: { row: YearRow }) {
  const active = new Set(row.months)
  return (
    <tr data-testid="vs-year-row" data-month-source={row.monthSource} className="align-top">
      <td className="max-w-[260px] py-2 pr-3">
        <Link href={`/processes/${row.slug}`} className="text-[13px] font-medium text-zinc-300 hover:text-emerald-300">
          {row.title}
        </Link>
        {row.monthNote && (
          <p className="mt-0.5 flex flex-wrap items-center gap-1 text-[10px] text-zinc-500">
            {row.monthSource === 'seeded' && <SimChip />}
            {row.monthNote}
          </p>
        )}
      </td>
      <td className="whitespace-nowrap py-2 pr-3 text-xs text-zinc-500">{row.cadenceLabel}</td>
      <td className="py-2 pr-3">
        <span className="flex gap-1">
          {MONTH_LABELS.map((label, i) => {
            const on = active.has(i + 1)
            return (
              <span
                key={label}
                title={`${label}${on ? ` — ${row.title} runs` : ''}`}
                className={`h-2 w-2 rounded-full ${
                  on ? (row.monthSource === 'seeded' ? 'bg-fuchsia-400/80' : 'bg-emerald-400/80') : 'bg-zinc-800'
                }`}
              />
            )
          })}
        </span>
      </td>
      <td className="whitespace-nowrap py-2 pr-3 text-right font-mono text-xs tabular-nums text-zinc-400">
        ×{row.runsPerYear}
      </td>
      <td
        className="whitespace-nowrap py-2 pr-3 text-xs text-zinc-500"
        title={row.routes.legalSignature > 0 ? `${row.routes.legalSignature} legally-human signature step(s)` : undefined}
      >
        <span className="text-emerald-300/90">{row.routes.agent} agent</span>
        {row.routes.form > 0 && <> · <span className="text-amber-300/90">{row.routes.form} form</span></>}
        {row.routes.person > 0 && <> · <span className="text-sky-300/90">{row.routes.person} human</span></>}
      </td>
      <td className="py-2">
        <CeilingBar pct={row.ceilingPct} />
      </td>
    </tr>
  )
}

type WindowTab = 'd30' | 'd90' | 'year'

// One row of the first-30/first-90-days view: the process, its cadence-math first-run day, and
// how many runs fit the window. Day intervals are conventions (month ≈ 30d), never corpus dates.
function WindowRhythmRow({ row }: { row: WindowRow }) {
  return (
    <tr data-testid="vs-window-row" className="align-top">
      <td className="max-w-[260px] py-2 pr-3">
        <Link href={`/processes/${row.slug}`} className="text-[13px] font-medium text-zinc-300 hover:text-emerald-300">
          {row.title}
        </Link>
      </td>
      <td className="whitespace-nowrap py-2 pr-3 text-xs text-zinc-500">{row.cadenceLabel}</td>
      <td className="whitespace-nowrap py-2 pr-3 text-right font-mono text-xs tabular-nums text-zinc-400">
        day {row.firstRunDay}
      </td>
      <td className="whitespace-nowrap py-2 pr-3 text-right font-mono text-xs tabular-nums text-zinc-400">
        ×{row.runsInWindow}
      </td>
      <td className="whitespace-nowrap py-2 pr-3 text-xs text-zinc-500">
        <span className="text-emerald-300/90">{row.routes.agent} agent</span>
        {row.routes.form > 0 && <> · <span className="text-amber-300/90">{row.routes.form} form</span></>}
        {row.routes.person > 0 && <> · <span className="text-sky-300/90">{row.routes.person} human</span></>}
      </td>
      <td className="py-2">
        <CeilingBar pct={row.ceilingPct} />
      </td>
    </tr>
  )
}

const RHYTHM_TABS: { id: WindowTab; label: string }[] = [
  { id: 'd30', label: 'First 30 days' },
  { id: 'd90', label: 'First 90 days' },
  { id: 'year', label: 'Year one' },
]

export default function VirtualStartup({
  chains,
  tasks,
  roles,
  yearCandidates,
  eventExamples,
}: {
  chains: VsChain[]
  // Precomputed payload for every task any decision combo can reach, keyed by corpus task id.
  tasks: Record<string, VirtualTaskPayload>
  // Union vendor roles (lib/processes.ts vendorRoles over the union tasks) — filtered per
  // journey below before handing to the reused ProcessSimulator.
  roles: VendorRole[]
  // Every possible year-view rhythm row (lib/virtualStartup.ts buildYearCandidates, built
  // server-side from the corpus cadence data) — gated per journey/sweep-gate client-side.
  yearCandidates: YearCandidate[]
  // Event-driven examples (lib/virtualStartup.ts buildEventExamples) — gated per combo below.
  eventExamples: EventExample[]
}) {
  const [choices, setChoices] = useState<Choices>(DEFAULT_CHOICES)
  const [preset, setPreset] = useState<PresetId | null>(null)
  const [yc, setYc] = useState(false)
  const [win, setWin] = useState<WindowTab>('d30')
  const [revealed, setRevealed] = useState(0)
  const [running, setRunning] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => () => { if (timer.current) clearInterval(timer.current) }, [])

  /* eslint-disable react-hooks/set-state-in-effect -- one-time post-hydration sync FROM the URL
     (external system). The static HTML must render the default view, so this cannot be a
     useState initializer (hydration mismatch); it runs once and renders at most one extra pass. */
  useEffect(() => {
    const p = presetById(readParam('preset'))
    const ycOn = readParam('yc') === '1'
    if (!p && !ycOn) return
    if (p) setPreset(p.id)
    if (ycOn) setYc(true)
    const base = p ? p.choices : DEFAULT_CHOICES
    setChoices(ycOn ? applyYcCalibration(base) : base)
    // Mount-only: the URL is the INITIAL view.
  }, [])
  /* eslint-enable react-hooks/set-state-in-effect */

  const identity = useMemo(() => presetById(preset)?.company ?? null, [preset])
  const key = `${comboKey(choices)}|yc:${yc ? '1' : '0'}`
  const co = useMemo(() => synthCompany(choices, identity), [choices, identity])
  const phases = useMemo(() => journeyPhases(choices, chains, { yc }), [choices, chains, yc])

  const { rows, steps, stats } = useMemo(() => {
    const taskIds = phases.flatMap((p) => p.taskIds)
    const artifacts = buildJourneyArtifacts(choices, taskIds, { identity, yc })
    const rows: Row[] = []
    const steps: SimStep[] = []
    let cum = 0
    let lastDay = 0
    for (const phase of phases) {
      rows.push({ kind: 'phase', key: `phase-${phase.id}`, title: phase.title, chainId: phase.chainId, chainName: phase.chainName, note: phase.note })
      for (const taskId of phase.taskIds) {
        const task = tasks[taskId]
        if (!task) continue // defensive: the server precomputes the full union, so this never fires
        rows.push({ kind: 'task', key: `task-${taskId}`, task })
        task.steps.forEach((step, i) => {
          const day = dayOf(cum)
          if (day !== lastDay) {
            lastDay = day
            rows.push({ kind: 'day', key: `day-${day}-${taskId}-${i}`, day })
          }
          rows.push({ kind: 'step', key: `step-${taskId}-${i}`, step, top: task.tops[i] ?? null })
          steps.push(step)
          cum += step.estimatedMinutes
        })
        for (const [j, artifact] of (artifacts[taskId] ?? []).entries()) {
          rows.push({ kind: 'artifact', key: `artifact-${taskId}-${j}`, artifact })
        }
      }
    }
    return { rows, steps, stats: journeyStats(steps) }
  }, [phases, tasks, choices, identity, yc])

  // Only the roles whose arena the selected journey actually touches — the transcript resolves
  // picks via step.arenaId / step.choiceArenaId, so this filter loses nothing it uses.
  const journeyRoles = useMemo(() => {
    const arenas = new Set<string>()
    for (const s of steps) {
      if (s.arenaId) arenas.add(s.arenaId)
      if (s.choiceArenaId) arenas.add(s.choiceArenaId)
    }
    return roles.filter((r) => arenas.has(r.arenaId))
  }, [roles, steps])

  // Year one — deterministic from the same decision combo (seeded months for annuals the
  // corpus doesn't date; those render with the SIMULATED chip).
  const year = useMemo(() => {
    const rhythm = yearRows(choices, phases.flatMap((p) => p.taskIds), yearCandidates)
    return { rhythm, stats: yearStats(rhythm) }
  }, [choices, phases, yearCandidates])

  // First 30 / first 90 days — the same rhythm rows sliced by cadence-math day intervals; the
  // launch journey's own day span comes from the corpus estimates (dayOf(stats.totalMinutes)).
  const windows = useMemo(
    () => ({ d30: windowRows(year.rhythm, 30), d90: windowRows(year.rhythm, 90) }),
    [year],
  )
  // Event-driven examples — real corpus processes that run when triggered, not on a calendar.
  const events = useMemo(() => eventRows(choices, eventExamples), [choices, eventExamples])

  const done = revealed >= rows.length

  function stop() {
    if (timer.current) clearInterval(timer.current)
    timer.current = null
    setRunning(false)
  }

  function pickChoice(id: keyof Choices, value: string) {
    stop()
    setRevealed(0)
    // Manual toggle: the preset no longer describes the combo — ?preset clears, the combo stays.
    setPreset(null)
    // A manual value contradicting the YC calibration turns YC mode off; other toggles keep it.
    const calibrated = (YC_CALIBRATION as Partial<Record<keyof Choices, string>>)[id]
    const nextYc = yc && (calibrated === undefined || calibrated === value)
    setYc(nextYc)
    setChoices((c) => ({ ...c, [id]: value }) as Choices)
    setParams({ preset: null, yc: nextYc ? '1' : null })
  }

  function applyPreset(p: VsPreset) {
    stop()
    setRevealed(0)
    setPreset(p.id)
    // YC mode applies ON TOP of any preset — the calibration wins where they disagree.
    setChoices(yc ? applyYcCalibration(p.choices) : p.choices)
    setParams({ preset: p.id })
  }

  function toggleYc() {
    stop()
    setRevealed(0)
    const next = !yc
    setYc(next)
    if (next) setChoices((c) => applyYcCalibration(c))
    else {
      // Leaving YC mode with a preset active restores that preset's own combo.
      const p = presetById(preset)
      if (p) setChoices(p.choices)
    }
    setParams({ yc: next ? '1' : null })
  }

  function start() {
    stop()
    setRevealed(0)
    setRunning(true)
    let i = 0
    timer.current = setInterval(() => {
      i += 1
      setRevealed(i)
      if (i >= rows.length) stop()
    }, CADENCE_MS)
  }

  return (
    <div className="space-y-8">
      {/* Try an example — one-tap preset companies (founder ask 2026-09-25). Every journey runs
          the same real software-company process corpus; the hardware/biotech cards say so out
          loud. Identities are fixed, clearly-fictional, and SIMULATED-chipped. */}
      <section className="rounded-2xl border border-zinc-800 p-4 sm:p-5">
        <h2 className="font-display text-lg font-semibold tracking-tight">Try an example</h2>
        <p className="mt-1 text-sm text-zinc-400">
          One tap prefills every decision with a themed example company — then hit ▶ Run. Change
          any decision afterwards and the setup stays, but the preset deselects.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {VS_PRESETS.map((p) => {
            const active = preset === p.id
            return (
              <button
                key={p.id}
                type="button"
                data-testid={`vs-preset-${p.id}`}
                aria-pressed={active}
                onClick={() => applyPreset(p)}
                className={`rounded-xl border p-3 text-left transition ${
                  active ? 'border-emerald-400/60 bg-emerald-400/10' : 'border-zinc-800 hover:border-zinc-600'
                }`}
              >
                <span className="text-[10px] uppercase tracking-widest text-zinc-500">{p.label}</span>
                <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
                  <span className="font-medium text-zinc-200">{p.company.name}</span>
                  <SimChip />
                </span>
                <span className="mt-0.5 block text-sm text-zinc-400">
                  {p.product} — {p.company.descriptor}
                </span>
                {p.disclosure && (
                  <span data-testid="vs-preset-disclosure" className="mt-1.5 block text-[11px] leading-snug text-amber-300/90">
                    {p.disclosure}
                  </span>
                )}
              </button>
            )
          })}
        </div>
        {/* YC batch mode — a calibration applied on top of any setup, never a new process. */}
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-zinc-800 pt-3">
          <button
            type="button"
            data-testid="vs-yc-toggle"
            aria-pressed={yc}
            onClick={toggleYc}
            className={`rounded-full border px-3 py-1 text-sm transition ${
              yc
                ? 'border-orange-400/60 bg-orange-400/10 text-orange-300'
                : 'border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
            }`}
          >
            YC batch mode
          </button>
          {yc ? (
            <p data-testid="vs-yc-disclosure" className="flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-400">
              <SimChip />
              <span>
                {YC_BATCH.disclosure} Batch calendar: {YC_BATCH.calendar}. The raise compresses to
                Demo-Day timing on the standard published deal; PH launch and build-first turn on.
              </span>
            </p>
          ) : (
            <span className="text-[11px] text-zinc-500">
              calibrates any setup to the publicly known YC batch shape — Demo-Day raise, launch-early pressure
            </span>
          )}
        </div>
      </section>

      {/* Starting decisions */}
      <section className="rounded-2xl border border-zinc-800 p-4 sm:p-5">
        <h2 className="font-display text-lg font-semibold tracking-tight">Starting decisions</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Each choice selects which real processes and playbooks make up the journey — nothing is
          invented, options only swap, reorder, or skip corpus processes.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DECISIONS.map((d) => (
            <fieldset key={d.id}>
              <legend className="text-[10px] uppercase tracking-widest text-zinc-500">{d.title}</legend>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {d.options.map((o) => {
                  const active = choices[d.id] === o.value
                  return (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => pickChoice(d.id, o.value)}
                      title={o.detail}
                      aria-pressed={active}
                      className={`rounded-full border px-3 py-1 text-sm transition ${
                        active
                          ? 'border-emerald-400/60 bg-emerald-400/10 text-emerald-300'
                          : 'border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                      }`}
                    >
                      {o.label}
                    </button>
                  )
                })}
              </div>
              <p className="mt-1 text-[11px] text-zinc-500">
                {d.options.find((o) => o.value === choices[d.id])?.detail}
              </p>
            </fieldset>
          ))}
        </div>

        {/* The virtual company — synthetic from the first pixel, labeled as such. */}
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3 text-sm">
          <span className="text-zinc-500">Your virtual company:</span>
          <span className="font-medium text-zinc-200">{co.display}</span>
          {co.descriptor && <span className="text-zinc-400">— making {co.descriptor}</span>}
          <SimChip />
          <span className="text-xs text-zinc-500">
            — same choices, same company: everything synthetic is deterministic from the decisions above.
          </span>
        </div>
      </section>

      {/* The run CTA — big, unmistakable, before any timeline content (founder 2026-09-25:
          "make the run button clearer and put it at the top"). Sticky on mobile so Run/Restart
          stays reachable while scrolling the long timeline; static from sm up. */}
      <div className="sticky top-2 z-30 -mx-2 rounded-2xl border border-zinc-800 bg-zinc-950/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-0">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <button
            type="button"
            onClick={start}
            disabled={running}
            className="rounded-full bg-emerald-500 px-8 py-3 font-display text-base font-semibold tracking-tight text-zinc-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 disabled:opacity-60"
          >
            {running ? 'Running…' : done ? '▶ Run it again' : '▶ Run this startup'}
          </button>
          <span className="text-xs text-zinc-500">
            {phases.length} phases · {steps.length} steps · corpus estimate {formatMinutes(stats.totalMinutes)}
          </span>
          <button
            type="button"
            onClick={() => { stop(); setRevealed(rows.length) }}
            className="text-xs text-zinc-500 underline decoration-zinc-700 underline-offset-2 transition hover:text-zinc-300"
          >
            skip the animation — show the whole timeline
          </button>
        </div>
      </div>

      {/* Timeline */}
      {revealed > 0 && (
        <section className="rounded-2xl border border-zinc-800 p-4 sm:p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-lg font-semibold tracking-tight">Timeline</h2>
            <span className="text-[11px] uppercase tracking-widest text-zinc-500">
              real processes & judged vendors · fuchsia-tagged data is simulated
            </span>
          </div>
          <ol className="mt-4 space-y-1.5">
            {rows.slice(0, revealed).map((row) => {
              if (row.kind === 'phase') {
                return (
                  <li key={row.key} className="pt-4 first:pt-0">
                    <p className="border-b border-zinc-800 pb-1 text-sm font-semibold tracking-tight text-zinc-200">
                      {row.title}
                      <Link
                        href={`/processes/chains/${row.chainId}`}
                        className="ml-2 text-[11px] font-normal text-zinc-500 hover:text-emerald-300"
                      >
                        from the {row.chainName} playbook →
                      </Link>
                    </p>
                    {row.note && <p className="mt-0.5 text-[11px] text-zinc-500">{row.note}</p>}
                  </li>
                )
              }
              if (row.kind === 'task') {
                return (
                  <li key={row.key} className="pt-2">
                    <Link
                      href={`/processes/${row.task.slug}`}
                      className="text-[13px] font-medium text-zinc-300 hover:text-emerald-300"
                    >
                      {row.task.title}
                    </Link>
                  </li>
                )
              }
              if (row.kind === 'day') {
                return (
                  <li key={row.key} aria-hidden className="pl-2 font-mono text-[10px] uppercase tracking-widest text-zinc-600">
                    — day {row.day} —
                  </li>
                )
              }
              if (row.kind === 'step') {
                const badge = routeBadge(row.step)
                return (
                  <li key={row.key} className="flex flex-wrap items-center gap-x-2 gap-y-0.5 pl-4 text-sm text-zinc-400">
                    <span className={`rounded border px-1.5 py-px text-[10px] ${badge.cls}`}>{badge.text}</span>
                    <span className="text-zinc-300">{row.step.label}</span>
                    <span className="font-mono text-[11px] text-zinc-600">
                      {formatMinutes(row.step.estimatedMinutes)}
                      {row.step.async ? ' ⏳' : ''}
                    </span>
                    {row.step.approvalRequired && (
                      <span className="text-[11px] text-amber-300/90" title="A human signs off before this runs">⏸ approval</span>
                    )}
                    {row.top && (
                      <Link
                        href={`/arena/${row.top.arenaId}/product/${row.top.productId}`}
                        title={`Top judged vendor for this step — ${row.top.arenaName}, scored over the step's mapped stories`}
                        className="rounded-full border border-zinc-700 px-2 py-px text-[11px] text-zinc-300 hover:border-emerald-400/60 hover:text-emerald-300"
                      >
                        {row.top.name} · {row.top.score.toFixed(0)}
                      </Link>
                    )}
                  </li>
                )
              }
              return (
                <li
                  key={row.key}
                  data-testid="vs-artifact"
                  className="ml-8 flex flex-wrap items-center gap-2 rounded-lg border border-fuchsia-400/20 bg-fuchsia-400/5 px-2.5 py-1 text-[13px]"
                >
                  <SimChip />
                  <span className="text-zinc-400">{row.artifact.label}:</span>
                  <span className="font-mono text-xs text-zinc-200">{row.artifact.value}</span>
                </li>
              )
            })}
          </ol>
          {done && (
            <div className="mt-4 border-t border-zinc-800 pt-3 text-sm text-zinc-300">
              <p>
                ✓ journey complete — {stats.totalSteps} steps: {stats.agentSteps} agent-runnable,{' '}
                {stats.formSteps} manual form{stats.formSteps === 1 ? '' : 's'}, {stats.personSteps} human
                {stats.legalSignatures > 0 && <> (incl. {stats.legalSignatures} legal signature{stats.legalSignatures === 1 ? '' : 's'})</>},{' '}
                {stats.approvals} approval gate{stats.approvals === 1 ? '' : 's'}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Corpus time estimate: {formatMinutes(stats.totalMinutes)} (~{dayOf(stats.totalMinutes)} simulated days,
                incl. {stats.asyncSteps} async wait{stats.asyncSteps === 1 ? '' : 's'}) — from each step&apos;s recorded
                estimate, not invented.
              </p>
            </div>
          )}
        </section>
      )}

      {/* The operating rhythm the company now runs, once the launch journey lands — first 30
          days, first 90 days, and year one. */}
      {done && (
        <section className="rounded-2xl border border-zinc-800 p-4 sm:p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-lg font-semibold tracking-tight">The operating rhythm</h2>
            <span className="text-[11px] uppercase tracking-widest text-zinc-500">
              the recurring runs (&ldquo;cron jobs&rdquo;) the company now owns
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Rhythm window">
            {RHYTHM_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                aria-pressed={win === t.id}
                onClick={() => setWin(t.id)}
                className={`rounded-full border px-3 py-1 text-sm transition ${
                  win === t.id
                    ? 'border-emerald-400/60 bg-emerald-400/10 text-emerald-300'
                    : 'border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {win === 'year' ? (
            <>
              <p className="mt-3 text-sm text-zinc-400">
                Derived from each process&apos;s corpus cadence — the same axis as the{' '}
                <Link href="/processes/operating-rhythm" className="text-emerald-400 underline decoration-emerald-400/40 hover:text-emerald-300">
                  operating rhythm
                </Link>
                . Monthly and quarterly slots are cadence math; the tax dates are the corpus&apos;s own; fuchsia
                slots are seeded demo scheduling, tagged simulated.
              </p>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 text-left text-[10px] uppercase tracking-widest text-zinc-400">
                      <th scope="col" className="py-2 pr-3 font-normal">Process</th>
                      <th scope="col" className="py-2 pr-3 font-normal">Cadence</th>
                      <th scope="col" className="py-2 pr-3 font-normal">
                        <span className="flex gap-1" aria-label="January through December">
                          {MONTH_LABELS.map((m) => (
                            <span key={m} title={m} className="w-2 text-center normal-case">{m[0]}</span>
                          ))}
                        </span>
                      </th>
                      <th scope="col" className="py-2 pr-3 text-right font-normal"><span title="Runs per year">Runs/yr</span></th>
                      <th scope="col" className="py-2 pr-3 font-normal">Route mix</th>
                      <th scope="col" className="py-2 font-normal">Agent ceiling</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/70">
                    {yc && (
                      <tr data-testid="vs-yc-oh-row" className="align-top">
                        <td className="max-w-[260px] py-2 pr-3">
                          <span className="flex flex-wrap items-center gap-1.5 text-[13px] font-medium text-zinc-300">
                            <SimChip />
                            {YC_BATCH.officeHours.title}
                          </span>
                          <p className="mt-0.5 text-[10px] text-zinc-500">
                            synthetic YC-mode row — not a corpus process; excluded from the totals below
                          </p>
                        </td>
                        <td className="whitespace-nowrap py-2 pr-3 text-xs text-zinc-500">{YC_BATCH.officeHours.cadenceLabel}</td>
                        <td className="py-2 pr-3">
                          <span className="flex gap-1">
                            {MONTH_LABELS.map((label, i) => (
                              <span
                                key={label}
                                title={`${label}${YC_BATCH.officeHours.months.includes(i + 1) ? ' — batch month' : ''}`}
                                className={`h-2 w-2 rounded-full ${
                                  YC_BATCH.officeHours.months.includes(i + 1) ? 'bg-fuchsia-400/80' : 'bg-zinc-800'
                                }`}
                              />
                            ))}
                          </span>
                        </td>
                        <td className="whitespace-nowrap py-2 pr-3 text-right font-mono text-xs tabular-nums text-zinc-400">
                          ×{YC_BATCH.officeHours.runsPerBatch}
                        </td>
                        <td className="whitespace-nowrap py-2 pr-3 text-xs text-zinc-600">—</td>
                        <td className="py-2 text-xs text-zinc-600">—</td>
                      </tr>
                    )}
                    {(() => {
                      const nodes: ReactNode[] = []
                      let lastCadence: string | null = null
                      for (const row of year.rhythm) {
                        if (row.cadenceLabel !== lastCadence) {
                          lastCadence = row.cadenceLabel
                          nodes.push(
                            <tr key={`group-${row.cadenceLabel}`} data-testid="vs-cadence-group" className="bg-zinc-900/40">
                              <th colSpan={6} scope="colgroup" className="py-1.5 pr-3 text-left text-[10px] font-normal uppercase tracking-widest text-zinc-500">
                                {row.cadenceLabel}
                              </th>
                            </tr>,
                          )
                        }
                        nodes.push(<YearRhythmRow key={row.taskId} row={row} />)
                      }
                      return nodes
                    })()}
                  </tbody>
                </table>
              </div>
              <p data-testid="vs-year-summary" className="mt-4 border-t border-zinc-800 pt-3 text-sm text-zinc-300">
                Your virtual company&apos;s year: <span className="font-mono tabular-nums">{year.stats.totalRuns}</span> recurring
                runs · <span className="font-mono tabular-nums">{year.stats.stepRuns}</span> step-executions,{' '}
                <span className="font-mono tabular-nums text-emerald-300">{year.stats.agentStepRuns}</span> of them
                agent-runnable ({year.stats.stepRuns > 0 ? Math.round((year.stats.agentStepRuns / year.stats.stepRuns) * 100) : 0}%).
              </p>
            </>
          ) : (
            (() => {
              const windowDays = win === 'd30' ? 30 : 90
              const wrows = win === 'd30' ? windows.d30 : windows.d90
              const journeyEndDay = dayOf(stats.totalMinutes)
              return (
                <>
                  <p className="mt-3 text-sm text-zinc-400">
                    The launch journey itself spans day 1–{journeyEndDay} (corpus step estimates
                    {journeyEndDay > windowDays ? ' — it overruns this window' : ''}). Recurring first
                    runs below are cadence math (a month ≈ day 30, a quarter ≈ day 90) — no invented dates.
                  </p>
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-zinc-800 text-left text-[10px] uppercase tracking-widest text-zinc-400">
                          <th scope="col" className="py-2 pr-3 font-normal">Process</th>
                          <th scope="col" className="py-2 pr-3 font-normal">Cadence</th>
                          <th scope="col" className="py-2 pr-3 text-right font-normal">First run</th>
                          <th scope="col" className="py-2 pr-3 text-right font-normal">Runs in window</th>
                          <th scope="col" className="py-2 pr-3 font-normal">Route mix</th>
                          <th scope="col" className="py-2 font-normal">Agent ceiling</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/70">
                        {yc && (
                          <tr data-testid="vs-yc-oh-window-row" className="align-top">
                            <td className="max-w-[260px] py-2 pr-3">
                              <span className="flex flex-wrap items-center gap-1.5 text-[13px] font-medium text-zinc-300">
                                <SimChip />
                                {YC_BATCH.officeHours.title}
                              </span>
                              <p className="mt-0.5 text-[10px] text-zinc-500">synthetic YC-mode row — not a corpus process</p>
                            </td>
                            <td className="whitespace-nowrap py-2 pr-3 text-xs text-zinc-500">{YC_BATCH.officeHours.cadenceLabel}</td>
                            <td className="whitespace-nowrap py-2 pr-3 text-right font-mono text-xs tabular-nums text-zinc-400">
                              day {YC_BATCH.officeHours.intervalDays}
                            </td>
                            <td className="whitespace-nowrap py-2 pr-3 text-right font-mono text-xs tabular-nums text-zinc-400">
                              ×{Math.min(Math.floor(windowDays / YC_BATCH.officeHours.intervalDays), YC_BATCH.officeHours.runsPerBatch)}
                            </td>
                            <td className="whitespace-nowrap py-2 pr-3 text-xs text-zinc-600">—</td>
                            <td className="py-2 text-xs text-zinc-600">—</td>
                          </tr>
                        )}
                        {wrows.map((row) => (
                          <WindowRhythmRow key={row.taskId} row={row} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-3 text-xs text-zinc-500">
                    Annual processes carry no day here — the simulation&apos;s day 1 isn&apos;t anchored to a
                    calendar date, so they live on the Year one view (where the corpus&apos;s own tax dates show).
                  </p>
                </>
              )
            })()
          )}

          {/* Event-driven examples — real corpus processes that run when triggered. A trigger is
              not a cron job: no months, no runs/yr, and they never enter the totals. */}
          {events.length > 0 && (
            <div className="mt-5 border-t border-zinc-800 pt-3">
              <h3 className="text-[11px] uppercase tracking-widest text-zinc-500">
                Event-driven — runs when triggered, not on a calendar
              </h3>
              <ul className="mt-2 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
                {events.map((e) => (
                  <li key={e.taskId} data-testid="vs-event-row" className="flex flex-wrap items-baseline gap-x-2 text-[13px]">
                    <Link href={`/processes/${e.slug}`} className="font-medium text-zinc-300 hover:text-emerald-300">
                      {e.title}
                    </Link>
                    <span className="text-[11px] text-zinc-500">when {e.trigger}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* The reused playbook simulator over the exact selected journey — swap any market role and
          the transcript stays honest about whose API was actually recorded. Keyed by the decision
          combo so its picker state resets with the journey. */}
      <ProcessSimulator key={key} steps={steps} roles={journeyRoles} multiTask />
    </div>
  )
}
