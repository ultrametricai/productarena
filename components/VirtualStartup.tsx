'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import CeilingBar from '@/components/CeilingBar'
import IconChip from '@/components/IconChip'
import ProcessSimulator from '@/components/ProcessSimulator'
import VsGeoSelector from '@/components/VsGeoSelector'
import VsStateGraph, { type VsPanelEvent } from '@/components/VsStateGraph'
import { GEO_GLOBAL, GEO_PREF_META, type GeoChoice, type GeoSelection, type VendorGeoLookup } from '@/lib/geoPreference'
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
// ── v3 run layer (founder-approved 2026-09-28): vendor picks drive outcomes, founder personas,
// seeded corpus-grounded events, scorecard + shareable ?run= permalink. All logic lives in
// lib/virtualStartupRun.ts (pure, deterministic); the UI pieces are separate components.
import VsEventCard from '@/components/VsEventCard'
import VsPersonaPicker from '@/components/VsPersonaPicker'
import VsScorecard from '@/components/VsScorecard'
import {
  computeStackOutcome,
  corpusLaunchDay,
  decodeRunState,
  drawVsEvents,
  eligibleVsEvents,
  eventSeedKey,
  journeyOutcomeInputs,
  optimalSelections,
  resolveVsEvents,
  taskMinutesById,
  computeBurn,
  VS_PERSONAS,
  type VsAccessMap,
  type VsPersonaId,
  type VsPricingMap,
  type VsRunState,
} from '@/lib/virtualStartupRun'

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

// Terminal-follow slack: how close (px) to the bottom still counts as "at the bottom" — the
// standard terminal behavior, so a stray one-line scroll doesn't silently unpin the follow.
const FOLLOW_SLACK_PX = 24

type Row =
  | { kind: 'phase'; key: string; title: string; chainId: string; chainName: string; note: string | null }
  | { kind: 'task'; key: string; task: VirtualTaskPayload }
  | { kind: 'day'; key: string; day: number }
  // v3: outNote names the outcome-model rule applied to this step's simulated minutes (null =
  // corpus estimate as-is); outMinutes is the effective clock advance the day markers use.
  | { kind: 'step'; key: string; step: SimStep; top: TopVendorPick | null; outNote: string | null; outMinutes: number }
  | { kind: 'artifact'; key: string; artifact: SyntheticArtifact }
  // v3: a seeded mid-run event, printed inside the terminal flow at its simulated day.
  | { kind: 'vsevent'; key: string; eventId: string }

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

// Compact-band display copy (founder ask 2026-09-28: the setup controls compress into one tight
// band so the terminal sits above the fold). Short labels are DISPLAY ONLY — every option button
// keeps its canonical full label as the accessible name (aria-label) and full label + corpus
// mapping in the tooltip, so nothing about the decision semantics or the a11y/test contract moves.
// Control icons (founder batch 2026-09-29, item 1): small leading icons so the setup band's
// labeled rows and the nine decision groups read at a glance. House style — emoji through
// components/IconChip.tsx (required tooltip naming the concept), reusing lib/icons.ts vocabulary
// where the concept already has an icon (incorporation 📜, fundraising 🏦, billing 🧾,
// compliance ⚖️). Icons are decoration on top of the existing labels: every control keeps its
// canonical accessible name (the decision groups' aria-label, the options' full-label
// aria-labels) — tests assert nothing moved.
const ROW_ICONS: Record<'example' | 'founder' | 'geo' | 'decisions', { icon: string; title: string }> = {
  example: { icon: '🏢', title: 'Example companies — one-tap preset setups' },
  founder: { icon: '👤', title: 'Founder persona — who runs the simulated work' },
  geo: { icon: '🌍', title: 'Country view — annotate the run with committed geo evidence' },
  decisions: { icon: '🎛️', title: 'Starting decisions — which real processes make up the journey' },
}

const DECISION_ICONS: Record<keyof Choices, string> = {
  entity: '📜',
  team: '👥',
  funding: '🏦',
  product: '🧾',
  ordering: '🔀',
  hire: '🧑‍💼',
  compliance: '⚖️',
  enterprise: '🤝',
  ph: '🚀',
}

const DECISION_SHORT: Record<keyof Choices, { title: string; options: Record<string, string> }> = {
  entity: { title: 'Entity', options: { 'c-corp': 'C-Corp', llc: 'LLC' } },
  team: { title: 'Team', options: { cofounders: 'Cofounders', solo: 'Solo' } },
  funding: { title: 'Funding', options: { seed: 'Seed', bootstrap: 'Bootstrap' } },
  product: { title: 'Model', options: { subscriptions: 'SaaS', invoices: 'Invoices' } },
  ordering: { title: 'Order', options: { 'name-first': 'Name', 'build-first': 'Build' } },
  hire: { title: 'Hire', options: { yes: 'Yes', no: 'No' } },
  compliance: { title: 'Compliance', options: { now: 'Early', later: 'Later' } },
  enterprise: { title: 'Enterprise', options: { no: 'No', yes: 'Yes' } },
  ph: { title: 'Launch', options: { yes: 'PH', no: 'Quiet' } },
}

export default function VirtualStartup({
  chains,
  tasks,
  roles,
  yearCandidates,
  eventExamples,
  access,
  pricing,
  taskRisks,
  vendorGeo = {},
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
  // v3 payloads (lib/virtualStartupData.ts): canonical MCP/CLI verdicts per swap option, the
  // picked vendors' published-pricing headlines, and the corpus risk axis for the event gates.
  access: VsAccessMap
  pricing: VsPricingMap
  taskRisks: Record<string, number>
  // In-sim GEO (founder batch 2026-09-29, item 2): committed (product, country) availability
  // cells (lib/vendorGeo.ts vendorGeoLookup — non-US cells only, evidence or absent). Optional
  // additive prop: {} = no vendor geo warnings ever render (honest degrade).
  vendorGeo?: VendorGeoLookup
}) {
  const [choices, setChoices] = useState<Choices>(DEFAULT_CHOICES)
  const [preset, setPreset] = useState<PresetId | null>(null)
  const [yc, setYc] = useState(false)
  // ── v3 state: founder persona, the reader's vendor picks (shared with ProcessSimulator below,
  // controlled), decided event branches, and the run seed — together with the combo/preset/yc
  // this is the WHOLE run state the ?run= permalink encodes.
  const [persona, setPersona] = useState<VsPersonaId>('solo-technical')
  const [picks, setPicks] = useState<Record<string, string>>({})
  const [eventChoices, setEventChoices] = useState<Record<string, string>>({})
  const [runSeed, setRunSeed] = useState(0)
  const [win, setWin] = useState<WindowTab>('d30')
  // ── In-sim GEO selection (founder batch 2026-09-29): null = the 🇺🇸 US default (never stored,
  // never in the URL), 'GLOBAL' = explicit geo-neutral (no marks), else a country. ANNOTATION
  // ONLY, derived from committed data — it never changes rows, scores, ranks, or the clock, so
  // switching mid-run simply annotates the already-revealed lines. VsGeoSelector owns the
  // ?geo=/pa-geo sync (mount-read + writes), the same contract as components/GeoSwitcher.tsx.
  const [geo, setGeo] = useState<GeoChoice | null>(null)
  const [revealed, setRevealed] = useState(0)
  const [running, setRunning] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)
  // The terminal viewport (founder ask 2026-09-28): the run prints INSIDE this fixed-height
  // scroll box, so the page never grows mid-run. followRef is the terminal-follow flag — pinned
  // to the newest line unless the reader scrolled up inside the terminal; scrolling back to
  // (near) the bottom re-engages it. pendingTopRef is the one-shot "show the whole timeline"
  // override: fill instantly, then read from the top.
  const termRef = useRef<HTMLDivElement>(null)
  const followRef = useRef(true)
  const pendingTopRef = useRef(false)

  useEffect(() => () => { if (timer.current) clearInterval(timer.current) }, [])

  // After every reveal commit: pin the terminal to its newest line while following, or honor the
  // one-shot scroll-to-top after an instant fill. Reading scrollHeight post-commit is the whole
  // point — this cannot run inside the click/tick handlers, the new rows aren't in the DOM yet.
  useEffect(() => {
    const el = termRef.current
    if (!el) return
    if (pendingTopRef.current) {
      pendingTopRef.current = false
      el.scrollTop = 0
      return
    }
    // An emptied terminal (restart / decision change) rests at its top, never "the bottom".
    if (revealed === 0) {
      el.scrollTop = 0
      return
    }
    if (followRef.current) el.scrollTop = el.scrollHeight
  }, [revealed])

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

  // ── v3: one-time ?run= restore — a run link carries the WHOLE state (combo, preset, yc,
  // persona, picks, event choices, seed) and replays the exact run, so it wins over ?preset/?yc
  // (this effect runs after the one above; a malformed param decodes to null and changes nothing).
  /* eslint-disable react-hooks/set-state-in-effect -- same one-time post-hydration URL sync
     contract as the preset/yc effect above. */
  useEffect(() => {
    const run = decodeRunState(readParam('run'))
    if (!run) return
    setChoices(run.choices)
    setPreset(run.preset)
    setYc(run.yc)
    setPersona(run.persona)
    setPicks(run.picks)
    setEventChoices(run.eventChoices)
    setRunSeed(run.seed)
  }, [])
  /* eslint-enable react-hooks/set-state-in-effect */

  const identity = useMemo(() => presetById(preset)?.company ?? null, [preset])
  const key = `${comboKey(choices)}|yc:${yc ? '1' : '0'}`
  const co = useMemo(() => synthCompany(choices, identity), [choices, identity])
  const phases = useMemo(() => journeyPhases(choices, chains, { yc }), [choices, chains, yc])

  // ── v3 outcome model (lib/virtualStartupRun.ts): the reader's picks + persona recompute the
  // simulated clock over the same corpus estimates — the day markers below use these minutes.
  const outcomeInputs = useMemo(() => journeyOutcomeInputs(phases, tasks), [phases, tasks])
  const outcome = useMemo(
    () => computeStackOutcome(outcomeInputs, picks, roles, access, persona),
    [outcomeInputs, picks, roles, access, persona],
  )
  const optimalPicks = useMemo(() => optimalSelections(roles, access), [roles, access])
  // ── v3 event engine: seeded, corpus-grounded, plausibility-gated; deterministic from
  // (combo, preset, yc, persona, seed) — the day span comes from the raw corpus estimates so
  // vendor picks never reshuffle which events fire.
  const drawnEvents = useMemo(
    () =>
      drawVsEvents(
        eligibleVsEvents(choices, phases.flatMap((p) => p.taskIds), taskRisks),
        eventSeedKey(choices, preset, yc, persona, runSeed),
        corpusLaunchDay(outcomeInputs),
      ),
    [choices, phases, taskRisks, preset, yc, persona, runSeed, outcomeInputs],
  )
  const taskMinutes = useMemo(() => taskMinutesById(tasks), [tasks])
  const eventResolution = useMemo(
    () => resolveVsEvents(drawnEvents, eventChoices, { roles, selections: picks, taskMinutes, chains }),
    [drawnEvents, eventChoices, roles, picks, taskMinutes, chains],
  )
  // Post-event stack (a switch-vendor branch re-picks from the real arena ranking) — the
  // scorecard and burn read this; the timeline keeps the reader's own picks.
  const effectivePicks = useMemo(
    () => ({ ...picks, ...eventResolution.pickOverrides }),
    [picks, eventResolution],
  )
  const finalOutcome = useMemo(
    () => computeStackOutcome(outcomeInputs, effectivePicks, roles, access, persona),
    [outcomeInputs, effectivePicks, roles, access, persona],
  )
  const optimalOutcome = useMemo(
    () => computeStackOutcome(outcomeInputs, optimalPicks, roles, access, persona),
    [outcomeInputs, optimalPicks, roles, access, persona],
  )

  const { rows, steps, stats } = useMemo(() => {
    const taskIds = phases.flatMap((p) => p.taskIds)
    const artifacts = buildJourneyArtifacts(choices, taskIds, { identity, yc })
    const rows: Row[] = []
    const steps: SimStep[] = []
    let cum = 0
    let lastDay = 0
    // v3: seeded mid-run events print inside the terminal flow at their simulated day
    // (drawnEvents is day-sorted, so this is a simple cursor flush).
    let evIdx = 0
    const flushEvents = (uptoDay: number) => {
      while (evIdx < drawnEvents.length && drawnEvents[evIdx].day <= uptoDay) {
        rows.push({ kind: 'vsevent', key: `vsevent-${drawnEvents[evIdx].def.id}`, eventId: drawnEvents[evIdx].def.id })
        evIdx += 1
      }
    }
    for (const phase of phases) {
      rows.push({ kind: 'phase', key: `phase-${phase.id}`, title: phase.title, chainId: phase.chainId, chainName: phase.chainName, note: phase.note })
      for (const taskId of phase.taskIds) {
        const task = tasks[taskId]
        if (!task) continue // defensive: the server precomputes the full union, so this never fires
        rows.push({ kind: 'task', key: `task-${taskId}`, task })
        task.steps.forEach((step, i) => {
          const day = dayOf(cum)
          if (day !== lastDay) {
            flushEvents(day - 1)
            lastDay = day
            rows.push({ kind: 'day', key: `day-${day}-${taskId}-${i}`, day })
            flushEvents(day)
          }
          // v3: the clock advances by the outcome model's effective minutes (picks + persona,
          // disclosed simulation assumptions) — falling back to the raw corpus estimate.
          const outStep = outcome.steps[steps.length]
          const outMinutes = outcome.minutesByKey[`${taskId}:${i}`] ?? step.estimatedMinutes
          rows.push({ kind: 'step', key: `step-${taskId}-${i}`, step, top: task.tops[i] ?? null, outNote: outStep?.note ?? null, outMinutes })
          steps.push(step)
          cum += outMinutes
        })
        for (const [j, artifact] of (artifacts[taskId] ?? []).entries()) {
          rows.push({ kind: 'artifact', key: `artifact-${taskId}-${j}`, artifact })
        }
      }
    }
    flushEvents(Number.POSITIVE_INFINITY)
    return { rows, steps, stats: journeyStats(steps) }
  }, [phases, tasks, choices, identity, yc, outcome, drawnEvents])

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

  // ── v3 render lookups: the resolved event per id (choice + time delta), the journey's burn
  // lines (journey roles only — the vendors this run actually picks), and the permalink state.
  const resolvedEventById = useMemo(
    () => new Map(eventResolution.events.map((e) => [e.def.id, e])),
    [eventResolution],
  )
  const burn = useMemo(() => computeBurn(journeyRoles, effectivePicks, pricing), [journeyRoles, effectivePicks, pricing])
  const runState: VsRunState = useMemo(
    () => ({ choices, preset, yc, persona, picks, eventChoices, seed: runSeed }),
    [choices, preset, yc, persona, picks, eventChoices, runSeed],
  )
  function chooseEventBranch(eventId: string, choiceId: string) {
    setEventChoices((prev) => ({ ...prev, [eventId]: choiceId }))
  }

  // ── In-sim GEO (2026-09-29): the selected non-US country, or null for both the US default and
  // the explicit 🌐 Global choice — Global is geo-neutral by definition, so no marks render.
  const geoCountry: GeoSelection | null = geo !== null && geo !== GEO_GLOBAL ? geo : null
  // Whether a task's process is US-scoped (corpus geoScope 'us'/'us-state') — the only tasks the
  // country marks and analog lines ever attach to.
  const usScoped = (taskId: string) => {
    const scope = tasks[taskId]?.geoScope
    return scope === 'us' || scope === 'us-state'
  }

  // ── State-graph panel data (founder batch 2026-09-29, item 3) — DERIVED from the exact same
  // revealed-row state the terminal prints from (no separate timers): the panel fills with the
  // run, resets with clearRun, and replays deterministically with the rows.
  const panel = useMemo(() => {
    const artifacts: SyntheticArtifact[] = []
    const vendors: TopVendorPick[] = []
    const seenVendors = new Set<string>()
    const events: VsPanelEvent[] = []
    for (const row of rows.slice(0, revealed)) {
      if (row.kind === 'artifact') {
        artifacts.push(row.artifact)
      } else if (row.kind === 'step' && row.top && !seenVendors.has(row.top.productId)) {
        seenVendors.add(row.top.productId)
        vendors.push(row.top)
      } else if (row.kind === 'vsevent') {
        const resolved = resolvedEventById.get(row.eventId)
        if (resolved) {
          events.push({
            id: resolved.def.id,
            title: resolved.def.title,
            day: resolved.day,
            choiceLabel: resolved.choice?.label ?? null,
            outcome: resolved.choice?.outcome ?? null,
          })
        }
      }
    }
    return { artifacts, vendors, events }
  }, [rows, revealed, resolvedEventById])
  const panelDecisions = useMemo(
    () =>
      DECISIONS.map((d) => ({
        id: d.id,
        title: d.title,
        icon: DECISION_ICONS[d.id],
        label: d.options.find((o) => o.value === choices[d.id])?.label ?? String(choices[d.id]),
      })),
    [choices],
  )

  // The active persona's named simulation assumption prints in the band's info line (the compact
  // picker itself only carries the blurbs, in tooltips).
  const activePersona = VS_PERSONAS.find((p) => p.id === persona) ?? VS_PERSONAS[0]

  // The title-bar run identity: "agentloop — virtual run" style, derived from the (SIMULATED)
  // company display name — lowercased, entity suffix dropped, terminal-slugged.
  const termName = co.display.replace(/(,\s*Inc\.?|\s+LLC)$/i, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  function stop() {
    if (timer.current) clearInterval(timer.current)
    timer.current = null
    setRunning(false)
  }

  // Empty the terminal and re-arm the follow — every decision/preset/mode change and every
  // restart goes through here so the viewport starts clean at its top.
  function clearRun() {
    stop()
    setRevealed(0)
    followRef.current = true
    pendingTopRef.current = false
    if (termRef.current) termRef.current.scrollTop = 0
  }

  // v3: a decision/preset/mode change is a NEW run — decided event branches reset (the drawn
  // event set changes with the combo); vendor picks deliberately survive (they are the reader's
  // stack, not run state), and a plain restart keeps both so a shared ?run= replays intact.
  function clearRunState() {
    setEventChoices({})
  }

  // Terminal-follow: any scroll (the reader's or our own pin) re-derives the flag from where
  // the viewport actually is — up = paused, back within FOLLOW_SLACK_PX of the bottom = following.
  function onTermScroll() {
    const el = termRef.current
    if (!el) return
    followRef.current = el.scrollTop + el.clientHeight >= el.scrollHeight - FOLLOW_SLACK_PX
  }

  function showAll() {
    stop()
    followRef.current = false
    if (revealed >= rows.length) {
      // Already fully printed — the reveal effect won't re-fire, scroll directly.
      if (termRef.current) termRef.current.scrollTop = 0
      return
    }
    pendingTopRef.current = true
    setRevealed(rows.length)
  }

  function pickChoice(id: keyof Choices, value: string) {
    clearRun()
    clearRunState()
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
    clearRun()
    clearRunState()
    setPreset(p.id)
    // YC mode applies ON TOP of any preset — the calibration wins where they disagree.
    setChoices(yc ? applyYcCalibration(p.choices) : p.choices)
    setParams({ preset: p.id })
  }

  function toggleYc() {
    clearRun()
    clearRunState()
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
    clearRun()
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
      {/* ── The compact setup band (founder ask 2026-09-28: "make the examples, decisions and
          'who is the founder' much more compact, so we can see the terminal above the fold").
          Same state, same URL params, same determinism as the verbose cards it replaces — the
          explanations moved into tooltips (components/InstantTooltip.tsx upgrades every title=)
          and the "full setup guide" expand at the band's foot. The hardware/biotech honesty
          disclosures stay reachable BEFORE any run via the amber ⓘ on the pill (tooltip +
          screen-reader text; tests assert it) and verbatim in the expand. The band and the
          terminal share a tight space-y-3 group so the terminal's top edge lands above the fold
          (~420px on a 1440×900 desktop, within ~50vh of the component top on mobile); the old
          mobile-sticky run bar is gone because the run now prints inside the fixed terminal at
          the very top of the page — Run/Restart is one flick away, never a long timeline away. */}
      <div className="space-y-3">
      <section data-testid="vs-setup" aria-label="Set up the virtual startup" className="rounded-2xl border border-zinc-800 p-3">
        {/* The control panel as a labeled form grid (founder 2026-09-28: the crammed single-row
            band was "poorly designed layout wise") — one aligned label column (Example / Founder
            / Decisions), one content column, and a footer bar holding the company info + the Run
            CTA. Rows keep horizontal scroll on mobile, wrap from sm up. */}
        <div className="grid grid-cols-1 gap-y-2 sm:grid-cols-[72px_minmax(0,1fr)] sm:items-center sm:gap-x-3">
          <span className="text-[10px] uppercase tracking-wider text-zinc-400 sm:text-right">
            <IconChip icon={ROW_ICONS.example.icon} title={ROW_ICONS.example.title} className="mr-1" />
            Example
          </span>
          <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto pb-0.5 sm:flex-wrap sm:overflow-visible sm:pb-0">
            {/* One-tap preset companies (founder ask 2026-09-25), compacted to pills: identity
                stays SIMULATED-chipped on the pill itself; the product tagline rides in the
                tooltip; the hardware/biotech corpus disclosure is the amber ⓘ. */}
            {VS_PRESETS.map((p) => {
              const active = preset === p.id
              return (
                <button
                  key={p.id}
                  type="button"
                  data-testid={`vs-preset-${p.id}`}
                  aria-pressed={active}
                  onClick={() => applyPreset(p)}
                  title={`${p.label}: ${p.company.name} — ${p.product} (${p.company.descriptor}). One tap prefills every decision; change any decision afterwards and the setup stays, but the preset deselects.`}
                  className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs transition ${
                    active ? 'border-emerald-400/60 bg-emerald-400/10' : 'border-zinc-800 hover:border-zinc-600'
                  }`}
                >
                  <span className="text-zinc-500">{p.label}</span>
                  <span className="font-medium text-zinc-200">{p.company.name}</span>
                  {p.disclosure && (
                    <span data-testid="vs-preset-disclosure" title={p.disclosure} className="text-amber-300/90">
                      <span aria-hidden>ⓘ</span>
                      <span className="sr-only">{p.disclosure}</span>
                    </span>
                  )}
                </button>
              )
            })}
            {/* YC batch mode — a calibration applied on top of any setup, never a new process;
                its full disclosure prints in the info line below while the mode is on. */}
            <button
              type="button"
              data-testid="vs-yc-toggle"
              aria-pressed={yc}
              onClick={toggleYc}
              title="Calibrates any setup to the publicly known YC batch shape — Demo-Day raise, launch-early pressure. Simulated; not affiliated with or endorsed by Y Combinator."
              className={`shrink-0 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs transition ${
                yc
                  ? 'border-orange-400/60 bg-orange-400/10 text-orange-300'
                  : 'border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
              }`}
            >
              YC batch mode
            </button>
          </div>
          {/* v3: founder persona — a persona change is a new run (the event stream is seeded
              by it). */}
          <span className="text-[10px] uppercase tracking-wider text-zinc-400 sm:text-right">
            <IconChip icon={ROW_ICONS.founder.icon} title={ROW_ICONS.founder.title} className="mr-1" />
            Founder
          </span>
          <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto pb-0.5 sm:flex-wrap sm:overflow-visible sm:pb-0">
            <VsPersonaPicker
              persona={persona}
              onSelect={(id) => {
                clearRun()
                clearRunState()
                setPersona(id)
              }}
            />
          </div>
          {/* The in-sim Geo row (founder batch 2026-09-29, item 2): 🌐 Global · 🇺🇸 USA (default)
              · 🇬🇧 UK · 🇮🇳 IN · 🇩🇪 DE · 🇫🇷 FR — the same ?geo=/pa-geo contract the process and
              product pages read (components/VsGeoSelector.tsx). Annotation only: a selection
              never changes rows, scores, ranks, or the simulated clock. */}
          <span className="text-[10px] uppercase tracking-wider text-zinc-400 sm:text-right">
            <IconChip icon={ROW_ICONS.geo.icon} title={ROW_ICONS.geo.title} className="mr-1" />
            Geo
          </span>
          <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto pb-0.5 sm:flex-wrap sm:overflow-visible sm:pb-0">
            <VsGeoSelector value={geo} onChange={setGeo} />
          </div>
          {/* The nine starting decisions as a tight segmented strip — short labels, current
              value highlighted, canonical full label as the accessible name and full label +
              corpus mapping in the tooltip. Each choice still only swaps, reorders, or skips
              corpus processes. */}
          <span className="text-[10px] uppercase tracking-wider text-zinc-400 sm:self-start sm:pt-1.5 sm:text-right">
            <IconChip icon={ROW_ICONS.decisions.icon} title={ROW_ICONS.decisions.title} className="mr-1" />
            Decisions
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 sm:flex-wrap sm:overflow-visible sm:pb-0">
          {DECISIONS.map((d) => (
            <div
              key={d.id}
              role="group"
              aria-label={d.title}
              className="flex shrink-0 items-center gap-0.5 rounded-full border border-zinc-800/80 bg-zinc-900/30 py-0.5 pl-2 pr-1"
            >
              <IconChip icon={DECISION_ICONS[d.id]} title={`${d.title} — starting decision`} className="mr-1 text-[11px]" />
              <span className="mr-1 text-[10px] uppercase tracking-wider text-zinc-300">{DECISION_SHORT[d.id].title}</span>
              {d.options.map((o) => {
                const active = choices[d.id] === o.value
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => pickChoice(d.id, o.value)}
                    aria-label={o.label}
                    title={`${o.label} — ${o.detail}`}
                    aria-pressed={active}
                    className={`whitespace-nowrap rounded-full border px-2 py-0.5 text-xs transition ${
                      active
                        ? 'border-emerald-400/60 bg-emerald-400/10 text-emerald-300'
                        : 'border-transparent text-zinc-300 hover:text-zinc-100'
                    }`}
                  >
                    {DECISION_SHORT[d.id].options[o.value]}
                  </button>
                )
              })}
            </div>
          ))}
          </div>
        </div>

        {/* Footer bar: the virtual company + run size on the left, the Run CTA on the right
            (founder 2026-09-25: CTA before any timeline content). The skip-animation link is
            gone (founder 2026-09-28); the loud SIMULATED chips left the band the same day —
            "virtual company" says it in prose, and the honesty tags stay where they're
            load-bearing: the terminal title bar and every generated artifact inside the run. */}
        <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-2 border-t border-zinc-800/70 pt-2.5 text-xs">
          <span className="text-zinc-500">Your virtual company:</span>
          <span className="font-medium text-zinc-200">{co.display}</span>
          {co.descriptor && <span className="text-zinc-400">— making {co.descriptor}</span>}
          <button
            type="button"
            onClick={start}
            disabled={running}
            className="ml-auto rounded-full bg-emerald-500 px-6 py-2 font-display text-base font-semibold tracking-tight text-zinc-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 disabled:opacity-60"
          >
            {running ? 'Running…' : done ? '▶ Run it again' : '▶ Run this startup'}
          </button>
        </div>
        {yc && (
          <p data-testid="vs-yc-disclosure" className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-400">
            <span>
              {YC_BATCH.disclosure} Batch calendar: {YC_BATCH.calendar}. The raise compresses to
              Demo-Day timing on the standard published deal; PH launch and build-first turn on.
            </span>
          </p>
        )}
        {activePersona?.assumption && (
          <p data-testid="vs-persona-assumption" className="mt-1.5 text-[11px] leading-snug text-amber-300/90">
            {activePersona.assumption}
          </p>
        )}

        {/* The "setup" expand — the previous verbose card copy for readers who want the
            explanations, in one place and off the critical path to the terminal. */}
        <details className="mt-2">
          <summary className="cursor-pointer select-none text-[11px] text-zinc-500 transition hover:text-zinc-300">
            full setup guide — what the example companies, decisions, and founder personas mean
          </summary>
          <div className="mt-3 grid gap-x-6 gap-y-4 text-[13px] text-zinc-400 sm:grid-cols-2">
            <div>
              <h3 className="text-[10px] uppercase tracking-widest text-zinc-500">Example companies</h3>
              <p className="mt-1 text-[11px] text-zinc-500">
                One tap prefills every decision with a themed example company — then hit ▶ Run.
                Change any decision afterwards and the setup stays, but the preset deselects.
                Identities are fixed, clearly-fictional, and always tagged simulated.
              </p>
              <ul className="mt-1.5 space-y-1.5">
                {VS_PRESETS.map((p) => (
                  <li key={p.id}>
                    <span className="text-zinc-300">{p.label} — {p.company.name}</span>: {p.product},{' '}
                    {p.company.descriptor}.
                    {p.disclosure && (
                      <span className="block text-[11px] leading-snug text-amber-300/90">{p.disclosure}</span>
                    )}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] text-zinc-500">
                YC batch mode calibrates any setup to the publicly known YC batch shape — Demo-Day
                raise, launch-early pressure — applied on top of the current decisions, never a
                new process.
              </p>
              <h3 className="mt-3 text-[10px] uppercase tracking-widest text-zinc-500">Who is the founder?</h3>
              <p className="mt-1 text-[11px] text-zinc-500">
                The persona shifts which steps the founder grinds through by hand in the simulated
                clock — it never changes a judged verdict or a corpus estimate, only the disclosed
                multipliers.
              </p>
              <ul className="mt-1.5 space-y-1.5">
                {VS_PERSONAS.map((p) => (
                  <li key={p.id}>
                    <span className="text-zinc-300">{p.label}</span> — {p.blurb}
                    {p.icpId && (
                      <>
                        {' '}· matches the{' '}
                        <Link href={`/icp/${p.icpId}`} className="text-emerald-400 underline decoration-emerald-400/40 hover:text-emerald-300">
                          {p.icpId}
                        </Link>{' '}
                        buyer lens
                      </>
                    )}
                    {p.assumption && (
                      <span className="block text-[11px] leading-snug text-amber-300/90">{p.assumption}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-[10px] uppercase tracking-widest text-zinc-500">Starting decisions</h3>
              <p className="mt-1 text-[11px] text-zinc-500">
                Each choice selects which real processes and playbooks make up the journey —
                nothing is invented, options only swap, reorder, or skip corpus processes. Same
                choices, same company: everything synthetic is deterministic from the decisions.
              </p>
              <ul className="mt-1.5 space-y-1.5">
                {DECISIONS.map((d) => (
                  <li key={d.id}>
                    <span className="text-zinc-300">{d.title}.</span>{' '}
                    {d.options.map((o) => `${o.label}: ${o.detail}`).join(' · ')}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </details>
      </section>

      {/* The state graph + the terminal (founder batch 2026-09-29, item 3): the compact tabbed
          panel of objects-coming-into-existence sits ABOVE the terminal on mobile (capped
          scroll box, terminal stays dominant) and BESIDE it — a narrow left column — from lg
          up. Both render off the same revealed-row state; nothing here has its own timer. */}
      <div className="space-y-3 lg:grid lg:grid-cols-[minmax(240px,300px)_minmax(0,1fr)] lg:items-start lg:gap-3 lg:space-y-0">
      <VsStateGraph
        started={revealed > 0}
        artifacts={panel.artifacts}
        vendors={panel.vendors}
        decisions={panelDecisions}
        events={panel.events}
      />

      {/* The terminal — the page's visual centerpiece (founder ask 2026-09-28: "have the
          terminal at the top so it prints the timeline in that terminal up top"). The run
          prints INSIDE this fixed-height viewport with terminal-follow autoscroll, so the page
          itself never grows mid-run; the chrome matches the site's terminal precedent
          (components/TryIt/Microterminal.tsx: dark window, dots, title bar, mono body). */}
      <section
        data-testid="vs-terminal"
        aria-label="Virtual run terminal"
        className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950"
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-zinc-800 bg-zinc-900/60 px-3 py-2">
          <span aria-hidden className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
          </span>
          <code className="min-w-0 truncate font-mono text-xs text-zinc-300">
            <span className="mr-1.5 select-none text-emerald-400">$</span>
            {termName}
          </code>
          {/* Founder 2026-09-29 terminal declutter: no 'virtual run' suffix, no title-bar chip,
              no 'idle' — the status only speaks while something happens; the honesty tags live
              on every generated artifact (terminal + state panel). */}
          <span data-testid="vs-terminal-status" className="ml-auto shrink-0 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            {running ? 'running…' : revealed > 0 && done ? '✓ complete' : ''}
          </span>
        </div>

        <div
          ref={termRef}
          onScroll={onTermScroll}
          data-testid="vs-terminal-body"
          className="h-[50vh] overflow-y-auto overscroll-contain px-3 py-2.5 font-mono text-xs leading-relaxed sm:h-[60vh]"
        >
          {revealed === 0 && (
            <p className="text-zinc-500">
              <span aria-hidden className="select-none text-emerald-400">$</span>
            </p>
          )}
          <ol className="space-y-1.5">
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
                // In-sim GEO (2026-09-29): under a non-US selection, a US-scoped process prints
                // its committed country analog (processes/corpus.json geoNotes — summary +
                // verified actionUrl, the ProcessGeoBanner data) or the honest "no mapping yet".
                // Annotation only, and never for 🌐 Global / the US default (geoCountry null).
                const geoNote =
                  geoCountry !== null && usScoped(row.task.id)
                    ? { meta: GEO_PREF_META[geoCountry], note: (row.task.geoNotes ?? []).find((n) => n.country === geoCountry) ?? null }
                    : null
                return (
                  <li key={row.key} className="pt-2">
                    <Link
                      href={`/processes/${row.task.slug}`}
                      className="text-[13px] font-medium text-zinc-300 hover:text-emerald-300"
                    >
                      {row.task.title}
                    </Link>
                    {geoNote &&
                      (geoNote.note ? (
                        <p data-testid="vs-geo-analog" className="mt-0.5 pl-2 text-[11px] leading-snug text-zinc-500">
                          <span aria-hidden className="mr-1">{geoNote.meta.flag}</span>
                          in {geoNote.meta.prose} this is: <span className="text-zinc-400">{geoNote.note.summary}</span>{' '}
                          <a
                            href={geoNote.note.actionUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-400/90 underline decoration-emerald-400/40 underline-offset-2 hover:text-emerald-300"
                            title={`${geoNote.meta.label} — the canonical portal for this work (verified live)`}
                          >
                            {geoNote.note.actionLabel} ↗
                          </a>
                        </p>
                      ) : (
                        <p data-testid="vs-geo-analog-missing" className="mt-0.5 pl-2 text-[11px] leading-snug text-zinc-500">
                          <span aria-hidden className="mr-1">🇺🇸</span>
                          no {geoNote.meta.label} mapping yet — this process is US-specific
                        </p>
                      ))}
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
                // In-sim GEO (2026-09-29): under a non-US selection, steps of US-scoped
                // processes carry the quiet 🇺🇸 mark (the components/GeoStepMark.tsx language),
                // and a top judged pick whose committed jurisdictions/vendor-geo.json cell says
                // 'unavailable' there prints its honest warning — recorded note verbatim, source
                // linked, scores and ranks untouched.
                const stepUsScoped = geoCountry !== null && usScoped(row.step.taskId)
                const geoCell =
                  geoCountry !== null && row.top ? vendorGeo[row.top.productId]?.[geoCountry] ?? null : null
                const geoWarn = geoCell?.status === 'unavailable' ? geoCell : null
                return (
                  <li key={row.key} className="flex flex-wrap items-center gap-x-2 gap-y-0.5 pl-4 text-sm text-zinc-400">
                    <span className={`rounded border px-1.5 py-px text-[10px] ${badge.cls}`}>{badge.text}</span>
                    <span className="text-zinc-300">{row.step.label}</span>
                    {stepUsScoped && geoCountry !== null && (
                      <span
                        aria-hidden
                        data-testid="vs-geo-step-mark"
                        className="text-[10px] opacity-60"
                        title={`US-specific step — this flow is written around US law/agencies; you are viewing the run from ${GEO_PREF_META[geoCountry].prose}`}
                      >
                        🇺🇸
                      </span>
                    )}
                    <span className="font-mono text-[11px] text-zinc-600">
                      {formatMinutes(row.step.estimatedMinutes)}
                      {row.step.async ? ' ⏳' : ''}
                    </span>
                    {/* v3: the outcome model changed this step's simulated clock — say so, with
                        the named rule (always a disclosed simulation assumption) in the title. */}
                    {row.outNote && (
                      <span
                        data-testid="vs-step-outnote"
                        title={row.outNote}
                        className="rounded border border-amber-400/40 px-1 py-px font-mono text-[10px] text-amber-300/90"
                      >
                        sim {formatMinutes(row.outMinutes)}
                      </span>
                    )}
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
                    {geoWarn && row.top && geoCountry !== null && (
                      <span data-testid="vs-geo-vendor-warning" className="w-full pl-1 text-[11px] leading-snug text-amber-300/90">
                        <span aria-hidden className="mr-1">⚠</span>
                        {row.top.name} — unavailable in {GEO_PREF_META[geoCountry].prose}: {geoWarn.note}{' '}
                        <a
                          href={geoWarn.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-amber-300/70 underline decoration-amber-400/40 underline-offset-2 hover:text-amber-200"
                          title="The vendor's own page this availability row rests on (verified live)"
                        >
                          source ↗
                        </a>
                      </span>
                    )}
                  </li>
                )
              }
              if (row.kind === 'vsevent') {
                // v3: a seeded mid-run event interrupts the terminal flow — SIMULATED-chipped,
                // grounded in a real corpus process, with deterministic branching choices.
                const resolved = resolvedEventById.get(row.eventId)
                if (!resolved) return null
                const grounded = tasks[resolved.def.groundedIn]
                return (
                  <li key={row.key}>
                    <VsEventCard
                      event={resolved}
                      groundedTitle={grounded?.title ?? resolved.def.groundedIn}
                      groundedSlug={grounded?.slug ?? ''}
                      risk={taskRisks[resolved.def.groundedIn] ?? 0}
                      onChoose={chooseEventBranch}
                    />
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
          {running && <span aria-hidden className="animate-pulse text-emerald-400">▋</span>}
          {/* The completion summary prints as the terminal's final output — the page below the
              terminal only ever grows AFTER the run completes (the rhythm section under it). */}
          {revealed > 0 && done && (
            <div className="mt-4 border-t border-zinc-800 pt-3 text-[13px] text-zinc-300">
              <p>
                ✓ journey complete — {stats.totalSteps} steps: {stats.agentSteps} agent-runnable,{' '}
                {stats.formSteps} manual form{stats.formSteps === 1 ? '' : 's'}, {stats.personSteps} human
                {stats.legalSignatures > 0 && <> (incl. {stats.legalSignatures} legal signature{stats.legalSignatures === 1 ? '' : 's'})</>},{' '}
                {stats.approvals} approval gate{stats.approvals === 1 ? '' : 's'}
              </p>
              <p className="mt-1 text-[11px] text-zinc-500">
                Corpus time estimate: {formatMinutes(stats.totalMinutes)} (~{dayOf(stats.totalMinutes)} simulated days,
                incl. {stats.asyncSteps} async wait{stats.asyncSteps === 1 ? '' : 's'}) — from each step&apos;s recorded
                estimate, not invented.
              </p>
            </div>
          )}
          {/* ── v3: the run scorecard prints as the terminal's final output block (time-to-launch,
              agent-run share, cited published-pricing burn, events survived, copy-run-link). */}
          {revealed > 0 && done && (
            <VsScorecard
              outcome={finalOutcome}
              optimal={optimalOutcome}
              resolution={eventResolution}
              burn={burn}
              personaId={persona}
              runState={runState}
            />
          )}
        </div>

      </section>
      </div>
      </div>

      {/* The operating rhythm the company now runs, once the launch journey lands — first 30
          days, first 90 days, and year one. */}
      {done && (
        <section className="rounded-2xl border border-zinc-800 p-4 sm:p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-lg font-semibold tracking-tight">The operating rhythm</h2>
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
          combo so its transcript resets with the journey. v3: the role picks are CONTROLLED —
          the same picks drive the outcome model (day markers, scorecard, burn) above. */}
      <ProcessSimulator
        key={key}
        steps={steps}
        roles={journeyRoles}
        multiTask
        selections={picks}
        onSelectionsChange={setPicks}
      />
    </div>
  )
}
