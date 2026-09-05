'use client'

import { useEffect, useRef, useState } from 'react'
import type { SimStep, VendorRole } from '@/lib/processSim'
import { formatMinutes } from '@/lib/processSim'

// Client-side dry-run theater over the mapped process data — no network calls are ever made.
// The user picks a product per swappable market role (each role is one arena, defaulting to the
// DAG's canonical vendor), hits Run, and a transcript reveals step-by-step at ~600ms cadence:
// agent steps as their recorded API/tool calls, approval gates as pauses, non-agent steps as
// explicit GAP handoffs. When a role is swapped off the canonical vendor we stay honest: the
// recorded call names belong to the canonical vendor, so swapped steps are annotated as
// "equivalent operation on <product>" rather than pretending we recorded that product's API.

const CADENCE_MS = 600

interface Line {
  kind: 'agent' | 'gap' | 'workaround' | 'approval' | 'task' | 'call' | 'done'
  text: string
  mono?: boolean
}

function buildTranscript(
  steps: SimStep[],
  selections: Record<string, string>,
  roles: VendorRole[],
  multiTask: boolean,
): Line[] {
  const roleByArena = new Map(roles.map((r) => [r.arenaId, r]))
  const lines: Line[] = []
  let lastTask = ''
  for (const step of steps) {
    if (multiTask && step.taskId !== lastTask) {
      lines.push({ kind: 'task', text: `── ${step.taskTitle} ──` })
      lastTask = step.taskId
    }
    const role = step.arenaId ? roleByArena.get(step.arenaId) : undefined
    const picked = role ? selections[role.arenaId] ?? role.defaultProductId : null
    const pickedName = role ? role.alternatives.find((o) => o.id === picked)?.name ?? picked : null
    const swapped = Boolean(role && picked !== role.canonicalVendor)
    const actor = pickedName ?? step.vendorLabel

    if (step.route === 'agent') {
      const suffix = step.async ? ' ⏳' : ''
      const calls = step.calls.length > 0 ? step.calls : step.toolCall ? [step.toolCall] : []
      if (calls.length === 0) {
        lines.push({ kind: 'agent', text: `→ [agent] ${actor ? `${actor}: ` : ''}${step.label}${suffix}` })
      } else {
        lines.push({ kind: 'agent', text: `→ [agent] ${actor ? `${actor} — ` : ''}${step.label}${suffix}` })
        for (const call of calls) {
          lines.push({
            kind: 'call',
            mono: true,
            text: swapped ? `${call}  (equivalent operation on ${pickedName})` : call,
          })
        }
      }
      if (step.approvalRequired) {
        lines.push({
          kind: 'approval',
          text: `⏸ approval required${step.riskLevel ? ` — ${step.riskLevel} risk` : ''} — a human signs off before this runs`,
        })
      }
    } else {
      const why = step.route === 'person' ? 'needs a human' : 'manual form/portal — no API path'
      lines.push({
        kind: 'gap',
        text: `⚠ GAP: ${step.label} — ${why} — agent hands off${step.async ? ' ⏳' : ''}`,
      })
      // Pre-resolved server-side (lib/gapClosers.ts) — the client never runs the rule engine.
      if (step.gap?.kind === 'closer') {
        const { blurb, topProduct, caution } = step.gap.closer
        lines.push({
          kind: 'workaround',
          text: `  ⚡ workaround: ${blurb} (top: ${topProduct.name})${caution ? ` — ${caution}` : ''}`,
        })
      }
    }
  }
  return lines
}

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
  const [lines, setLines] = useState<Line[]>([])
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => () => { if (timer.current) clearInterval(timer.current) }, [])

  function run() {
    if (timer.current) clearInterval(timer.current)
    const transcript = buildTranscript(steps, selections, roles, multiTask)
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

  const agentSteps = steps.filter((s) => s.route === 'agent')
  const gaps = steps.filter((s) => s.route !== 'agent')
  const approvals = agentSteps.filter((s) => s.approvalRequired)
  const apiCalls = agentSteps.reduce((n, s) => n + (s.calls.length || (s.toolCall ? 1 : 0)), 0)
  const agentMinutes = agentSteps.reduce((n, s) => n + s.estimatedMinutes, 0)
  const roleNames = roles.map(
    (r) => r.alternatives.find((o) => o.id === (selections[r.arenaId] ?? r.defaultProductId))?.name ?? r.defaultProductName,
  )

  const lineClass: Record<Line['kind'], string> = {
    agent: 'text-emerald-300',
    call: 'pl-6 text-zinc-400',
    approval: 'pl-4 text-amber-300',
    gap: 'text-red-300/90',
    workaround: 'pl-4 text-emerald-300/80',
    task: 'pt-2 text-zinc-500',
    done: 'text-zinc-300',
  }

  return (
    <section className="rounded-2xl border border-zinc-800 p-4 sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-lg font-semibold tracking-tight">Simulate this process</h2>
        <span className="text-[11px] uppercase tracking-widest text-zinc-500">
          simulated dry run from the mapped process — no real calls are made
        </span>
      </div>

      {roles.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-3">
          {roles.map((role) => (
            <label key={role.arenaId} className="flex min-w-0 max-w-full flex-col gap-1 text-xs text-zinc-400">
              <span>
                {role.arenaName}
                {selections[role.arenaId] !== role.canonicalVendor && (
                  <span className="ml-1 text-amber-400/90">(swapped)</span>
                )}
              </span>
              <select
                value={selections[role.arenaId] ?? role.defaultProductId}
                onChange={(e) => setSelections((s) => ({ ...s, [role.arenaId]: e.target.value }))}
                className="min-w-0 max-w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-200 focus:border-emerald-400/60 focus:outline-none"
              >
                {role.alternatives.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                    {o.agentReady !== null ? ` — ${o.agentReady.toFixed(0)}/100 agent-ready` : ''}
                    {o.id === role.canonicalVendor ? ' (canonical)' : ''}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={run}
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
                ✓ dry run complete — agent ran {agentSteps.length} of {steps.length} steps,{' '}
                {gaps.length} human handoff{gaps.length === 1 ? '' : 's'}, {approvals.length} approval
                gate{approvals.length === 1 ? '' : 's'}, {apiCalls} API call{apiCalls === 1 ? '' : 's'} made
              </p>
              <p className="mt-1 text-zinc-500">
                est. agent time {formatMinutes(agentMinutes)} of{' '}
                {formatMinutes(steps.reduce((n, s) => n + s.estimatedMinutes, 0))} total
                {roleNames.length > 0 ? ` · products: ${roleNames.join(', ')}` : ''}
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
