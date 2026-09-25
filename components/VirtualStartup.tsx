'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import CeilingBar from '@/components/CeilingBar'
import ProcessSimulator from '@/components/ProcessSimulator'
import { formatMinutes, type SimStep, type VendorRole } from '@/lib/processSim'
import {
  buildJourneyArtifacts,
  comboKey,
  dayOf,
  DECISIONS,
  DEFAULT_CHOICES,
  journeyPhases,
  journeyStats,
  MONTH_LABELS,
  synthCompany,
  yearRows,
  yearStats,
  type Choices,
  type SyntheticArtifact,
  type TopVendorPick,
  type VirtualTaskPayload,
  type VsChain,
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

export default function VirtualStartup({
  chains,
  tasks,
  roles,
  yearCandidates,
}: {
  chains: VsChain[]
  // Precomputed payload for every task any decision combo can reach, keyed by corpus task id.
  tasks: Record<string, VirtualTaskPayload>
  // Union vendor roles (lib/processes.ts vendorRoles over the union tasks) — filtered per
  // journey below before handing to the reused ProcessSimulator.
  roles: VendorRole[]
  // Every possible year-view rhythm row (lib/virtualStartup.ts buildYearCandidates, built
  // server-side from the corpus cadence data) — gated per journey client-side.
  yearCandidates: YearCandidate[]
}) {
  const [choices, setChoices] = useState<Choices>(DEFAULT_CHOICES)
  const [revealed, setRevealed] = useState(0)
  const [running, setRunning] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => () => { if (timer.current) clearInterval(timer.current) }, [])

  const key = comboKey(choices)
  const co = useMemo(() => synthCompany(choices), [choices])
  const phases = useMemo(() => journeyPhases(choices, chains), [choices, chains])

  const { rows, steps, stats } = useMemo(() => {
    const taskIds = phases.flatMap((p) => p.taskIds)
    const artifacts = buildJourneyArtifacts(choices, taskIds)
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
  }, [phases, tasks, choices])

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

  const done = revealed >= rows.length

  function stop() {
    if (timer.current) clearInterval(timer.current)
    timer.current = null
    setRunning(false)
  }

  function pickChoice(id: keyof Choices, value: string) {
    stop()
    setRevealed(0)
    setChoices((c) => ({ ...c, [id]: value }) as Choices)
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

      {/* Year one — the operating rhythm the company now runs, once the launch journey lands. */}
      {done && (
        <section className="rounded-2xl border border-zinc-800 p-4 sm:p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-lg font-semibold tracking-tight">Year one — the operating rhythm</h2>
            <span className="text-[11px] uppercase tracking-widest text-zinc-500">
              the recurring runs (&ldquo;cron jobs&rdquo;) the company now owns
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-400">
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
                {year.rhythm.map((row) => (
                  <YearRhythmRow key={row.taskId} row={row} />
                ))}
              </tbody>
            </table>
          </div>
          <p data-testid="vs-year-summary" className="mt-4 border-t border-zinc-800 pt-3 text-sm text-zinc-300">
            Your virtual company&apos;s year: <span className="font-mono tabular-nums">{year.stats.totalRuns}</span> recurring
            runs · <span className="font-mono tabular-nums">{year.stats.stepRuns}</span> step-executions,{' '}
            <span className="font-mono tabular-nums text-emerald-300">{year.stats.agentStepRuns}</span> of them
            agent-runnable ({year.stats.stepRuns > 0 ? Math.round((year.stats.agentStepRuns / year.stats.stepRuns) * 100) : 0}%).
          </p>
        </section>
      )}

      {/* The reused playbook simulator over the exact selected journey — swap any market role and
          the transcript stays honest about whose API was actually recorded. Keyed by the decision
          combo so its picker state resets with the journey. */}
      <ProcessSimulator key={key} steps={steps} roles={journeyRoles} multiTask />
    </div>
  )
}
