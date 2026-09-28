'use client'

import { useState } from 'react'
import { formatMinutes } from '@/lib/processSim'
import { setParams } from '@/lib/urlState'
import { dayOf } from '@/lib/virtualStartup'
import {
  encodeRunState,
  FOUNDER_HOURS_MULTIPLIER,
  personaById,
  VS_ASSUMPTIONS,
  type StackOutcome,
  type VsBurnSummary,
  type VsEventResolution,
  type VsPersonaId,
  type VsRunState,
} from '@/lib/virtualStartupRun'

// The end-of-run scorecard (v3 upgrade 4) — prints as the terminal's final output block.
// Every number's provenance is stated inline:
//   - time-to-launch / % agent-run — recomputed corpus estimates under the DISCLOSED simulation
//     assumptions (lib/virtualStartupRun.ts computeStackOutcome), incl. decided event effects;
//   - simulated burn — the picked vendors' PUBLISHED pricing facts (lib/pricing.ts, verbatim
//     extractions), cited per vendor; vendors without extracted pricing say so honestly;
//   - founder-hours saved — vs the all-manual baseline, same disclosed multiplier;
//   - events survived — the run's decided branches.
// The whole run state is shareable: "copy run link" encodes (combo, preset, yc, persona, picks,
// event choices, seed) into a compact ?run= param that replays this exact run.
export default function VsScorecard({
  outcome,
  optimal,
  resolution,
  burn,
  personaId,
  runState,
}: {
  outcome: StackOutcome
  optimal: StackOutcome
  resolution: VsEventResolution
  burn: VsBurnSummary
  personaId: VsPersonaId
  runState: VsRunState
}) {
  const [copied, setCopied] = useState(false)
  const persona = personaById(personaId)
  const launchDay = dayOf(outcome.launchMinutes + resolution.deltaMinutes)
  const savedHours = Math.round(outcome.founderHoursSavedMinutes / 60)
  const assumptions = VS_ASSUMPTIONS.filter(
    (a) =>
      a.id === 'founder-hours' ||
      (a.id === 'persona-non-technical' && personaId === 'non-technical') ||
      (a.id === 'persona-second-timer' && personaId === 'second-timer'),
  )

  async function copyRunLink() {
    const encoded = encodeRunState(runState)
    // Keep the address bar in sync with what was copied (urlState conventions: replaceState,
    // patch-only). pathname already carries the basePath.
    setParams({ run: encoded })
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?run=${encoded}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard unavailable (insecure context) — the URL is already set, still shareable.
    }
  }

  return (
    <div data-testid="vs-scorecard" className="mt-4 border-t border-zinc-800 pt-3 text-[13px] text-zinc-300">
      <p className="flex flex-wrap items-center gap-1.5">
        <span className="font-semibold tracking-tight text-zinc-200">Run scorecard</span>
        <span className="shrink-0 rounded border border-fuchsia-400/50 px-1 py-px text-[9px] uppercase tracking-widest text-fuchsia-300">
          simulated
        </span>
        {persona && <span className="text-[11px] text-zinc-500">persona: {persona.label}</span>}
      </p>

      {/* The stack-vs-optimal comparison line (v3 upgrade 1). */}
      <p data-testid="vs-outcome-line" className="mt-2 font-mono text-xs text-emerald-300">
        Your stack: {outcome.agentRunPct}% agent-run → launch day {launchDay} · agents-first optimal
        stack: day {optimal.launchDay}
      </p>
      <p className="mt-0.5 text-[11px] text-zinc-500">
        agent-run = steps whose picked vendor has a judged MCP/CLI surface (canonical verdicts) or
        that no swappable vendor serves; the optimal stack is computed — the top MCP/CLI-bearing
        vendor per role from the real arena ranking, before events.
      </p>

      <ul className="mt-3 space-y-1.5">
        <li data-testid="vs-score-launch">
          <span className="text-zinc-500">Time to launch:</span>{' '}
          <span className="font-mono tabular-nums">day {launchDay}</span>
          {resolution.deltaMinutes > 0 && (
            <span className="text-[11px] text-zinc-500"> (incl. +{formatMinutes(resolution.deltaMinutes)} from event decisions)</span>
          )}
        </li>
        <li data-testid="vs-score-agentrun">
          <span className="text-zinc-500">Agent-run:</span>{' '}
          <span className="font-mono tabular-nums">{outcome.agentRunSteps}/{outcome.totalSteps} steps ({outcome.agentRunPct}%)</span>
        </li>
        <li data-testid="vs-score-saved">
          <span className="text-zinc-500">Founder-hours saved vs all-manual:</span>{' '}
          <span className="font-mono tabular-nums">~{savedHours} h</span>{' '}
          <span className="text-[11px] text-zinc-500">
            (all-manual = every agent step at ×{FOUNDER_HOURS_MULTIPLIER} founder-hours — simulation assumption)
          </span>
        </li>
        <li data-testid="vs-score-events">
          <span className="text-zinc-500">Events:</span>{' '}
          {resolution.events.length === 0 ? (
            <span className="text-zinc-400">none drawn this run</span>
          ) : (
            <>
              <span className="font-mono tabular-nums">
                {resolution.decided}/{resolution.events.length} decided
                {resolution.dealsLost > 0 && ` · ${resolution.dealsLost} simulated deal${resolution.dealsLost === 1 ? '' : 's'} lost`}
              </span>
              <ul className="mt-0.5 space-y-0.5 pl-4 text-[11px] text-zinc-500">
                {resolution.events.map((e) => (
                  <li key={e.def.id}>
                    day {e.day} — {e.def.title}: {e.choice ? e.choice.label : 'undecided'}
                  </li>
                ))}
              </ul>
            </>
          )}
        </li>
      </ul>

      {/* Simulated burn — published pricing only, cited; gaps stay gaps. */}
      <div data-testid="vs-score-burn" className="mt-3">
        <p className="text-zinc-500">
          Simulated burn — from vendors&rsquo; published pricing (lib-extracted, cited per vendor):
        </p>
        {burn.monthlyUsd !== null && burn.monthlyUsd > 0 ? (
          <p className="mt-0.5 font-mono tabular-nums">
            ${burn.monthlyUsd}/mo <span className="text-[11px] text-zinc-500">(entry-plan sticker prices, summed as printed)</span>
          </p>
        ) : (
          <p className="mt-0.5 text-[11px] text-zinc-500">
            no monthly entry-plan prices to sum — the priced picks below are usage-based, and usage
            rates are never blended into an invented monthly figure
          </p>
        )}
        <ul className="mt-1 space-y-0.5 text-[11px]">
          {burn.lines
            .filter((l) => l.info !== null)
            .map((l) => (
              <li key={`${l.arenaId}:${l.productId}`} data-testid="vs-burn-line" className="text-zinc-400">
                {l.productName} ({l.arenaName}):{' '}
                {l.info!.kind === 'fact' ? (
                  <>
                    <span className="font-mono">{l.info!.label}</span> {l.info!.unit} —{' '}
                    <a
                      href={l.info!.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid="vs-burn-cite"
                      className="text-emerald-400 underline decoration-emerald-400/40 hover:text-emerald-300"
                    >
                      vendor pricing page
                    </a>{' '}
                    <span className="text-zinc-600">as of {l.info!.asOf}</span>
                  </>
                ) : (
                  <span className="text-zinc-500">pricing unclear — {l.info!.reason}</span>
                )}
              </li>
            ))}
          {burn.noPricingVendors > 0 && (
            <li data-testid="vs-burn-gap" className="text-zinc-500">
              {burn.noPricingVendors} picked vendor{burn.noPricingVendors === 1 ? '' : 's'}: no published pricing extracted — shown as a gap, never a guess
            </li>
          )}
        </ul>
      </div>

      {/* Every simulation constant this scorecard leaned on, named. */}
      <ul data-testid="vs-assumptions" className="mt-3 space-y-0.5 text-[11px] text-amber-300/80">
        {assumptions.map((a) => (
          <li key={a.id}>{a.text}</li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          data-testid="vs-copy-run-link"
          onClick={copyRunLink}
          className={`rounded-full border px-3 py-1 text-xs transition ${
            copied
              ? 'border-emerald-400/60 text-emerald-300'
              : 'border-zinc-800 text-zinc-300 hover:border-emerald-400/60 hover:text-emerald-300'
          }`}
        >
          <span aria-live="polite">{copied ? 'Copied ✓' : 'copy run link'}</span>
        </button>
        <span className="text-[11px] text-zinc-500">
          the link replays this exact run — decisions, persona, vendor picks, event choices, seed
        </span>
      </div>
    </div>
  )
}
