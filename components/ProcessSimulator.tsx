'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import SimRolePicker from '@/components/SimRolePicker'
import type { SimLine, SimStep, VendorRole } from '@/lib/processSim'
import { buildSimRun } from '@/lib/processSim'

// Client-side dry-run theater over the mapped process data — no network calls are ever made.
// The user picks a product per swappable market role (each role is one arena, defaulting to the
// DAG's canonical vendor — components/SimRolePicker.tsx renders each role as a logo-bearing
// card + popover listbox), hits Run, and a transcript reveals step-by-step at ~600ms cadence.
// The transcript itself is built by lib/processSim.ts's buildSimRun (pure + unit-tested):
// agent steps as their recorded API/tool calls, approval gates as pauses, already-made vendor
// decisions as ✓ decided lines, and the remaining non-agent steps as explicit GAP handoffs.

const CADENCE_MS = 600

export default function ProcessSimulator({
  steps,
  roles,
  multiTask = false,
}: {
  steps: SimStep[]
  roles: VendorRole[]
  multiTask?: boolean
}) {
  const [selections, setSelections] = useState<Record<string, string>>(
    () => Object.fromEntries(roles.map((r) => [r.arenaId, r.defaultProductId])),
  )
  const [lines, setLines] = useState<SimLine[]>([])
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => () => { if (timer.current) clearInterval(timer.current) }, [])

  const run = useMemo(() => buildSimRun(steps, selections, roles, multiTask), [steps, selections, roles, multiTask])

  function start() {
    if (timer.current) clearInterval(timer.current)
    const transcript = run.lines
    setLines([])
    setDone(false)
    setRunning(true)
    let i = 0
    timer.current = setInterval(() => {
      i += 1
      setLines(transcript.slice(0, i))
      if (i >= transcript.length) {
        if (timer.current) clearInterval(timer.current)
        setRunning(false)
        setDone(true)
      }
    }, CADENCE_MS)
  }

  const { stats } = run
  const roleNames = roles.map(
    (r) => r.alternatives.find((o) => o.id === (selections[r.arenaId] ?? r.defaultProductId))?.name ?? r.defaultProductName,
  )

  const lineClass: Record<SimLine['kind'], string> = {
    agent: 'text-emerald-300',
    call: 'pl-6 text-zinc-400',
    approval: 'pl-4 text-amber-300',
    decision: 'text-sky-300/90',
    // Human handoffs read calm (founder 2026-09-21: human work is not an error state) —
    // the ⚠/✍ glyphs carry the distinction from ✓ decided lines.
    gap: 'text-sky-300/90',
    workaround: 'pl-4 text-emerald-300/80',
    task: 'pt-2 text-zinc-500',
    done: 'text-zinc-300',
  }

  return (
    <section className="rounded-2xl border border-zinc-800 p-4 sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-lg font-semibold tracking-tight">
          {multiTask ? 'Simulate this playbook' : 'Simulate this process'}
        </h2>
        <span className="text-[11px] uppercase tracking-widest text-zinc-500">
          simulated dry run from the mapped process — no real calls are made
        </span>
      </div>

      {roles.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => (
            <SimRolePicker
              key={role.arenaId}
              role={role}
              selectedId={selections[role.arenaId] ?? role.defaultProductId}
              onSelect={(id) => setSelections((s) => ({ ...s, [role.arenaId]: id }))}
            />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={start}
        disabled={running}
        className="mt-4 rounded-full border border-emerald-400/50 px-4 py-1.5 text-sm text-emerald-300 transition hover:border-emerald-400 hover:bg-emerald-400/10 disabled:opacity-50"
      >
        {running ? 'Running…' : done ? 'Run again' : 'Run'}
      </button>

      {lines.length > 0 && (
        <div className="mt-4 space-y-1 break-words rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 font-mono text-xs leading-relaxed">
          {lines.map((line, i) => (
            <p key={i} className={lineClass[line.kind]}>{line.text}</p>
          ))}
          {done && (
            <div className="mt-3 border-t border-zinc-800 pt-3 text-zinc-300">
              <p>
                ✓ dry run complete — agent ran {stats.agentSteps} of {stats.totalSteps} steps,{' '}
                {stats.decidedSteps > 0 && <>{stats.decidedSteps} decision{stats.decidedSteps === 1 ? '' : 's'} already made, </>}
                {stats.gaps} human handoff{stats.gaps === 1 ? '' : 's'}, {stats.approvals} approval
                gate{stats.approvals === 1 ? '' : 's'}, {stats.apiCalls} API call{stats.apiCalls === 1 ? '' : 's'} made
              </p>
              {roleNames.length > 0 && (
                <p className="mt-1 text-zinc-500">products: {roleNames.join(', ')}</p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
