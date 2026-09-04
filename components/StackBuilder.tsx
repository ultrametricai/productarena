'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import ProductLogoView from '@/components/ProductLogoView'
import type { CompareProduct } from '@/lib/compare'
import {
  buildStack,
  encodeStackParams,
  parseStackParams,
  STACK_METRIC_LABELS,
  STACK_PRESETS,
  STACK_ROLES,
  stackAgentReadiness,
  type StackConstraints,
  type StackMetric,
} from '@/lib/stackBuilder'

// /stacks/builder's client half: choose roles + constraints, get an evidence-backed stack —
// every pick is the live leaderboard winner of its role's arena under the chosen constraints
// (lib/stackBuilder.ts), annotated with its honest rank in the full field. State lives in
// `?roles=…&oss=1&sh=1&metric=…` — read via Suspense-wrapped useSearchParams, written back via
// history.replaceState — same static-export-safe pattern as components/CompareBuilder.tsx.

const METRIC_OPTIONS: Array<{ metric: StackMetric; label: string }> = [
  { metric: 'agentReady', label: 'Most agent-ready' },
  { metric: 'aiEra', label: 'Highest Arena Score' },
]

export default function StackBuilder({ products }: { products: CompareProduct[] }) {
  const searchParams = useSearchParams()
  // Lazy initializers, not a mount effect: useSearchParams already carries the real query on
  // the first client render (the page's <Suspense> boundary makes this subtree client-rendered).
  const [roles, setRoles] = useState<string[]>(() => parseStackParams(searchParams).roles)
  const [constraints, setConstraints] = useState<StackConstraints>(() => parseStackParams(searchParams).constraints)
  const [copied, setCopied] = useState(false)

  // Mirror state back into the URL — the first run re-writes what it was initialized from
  // (harmless no-op); after that, every toggle keeps the share link current.
  useEffect(() => {
    const qs = encodeStackParams({ roles, constraints })
    window.history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`)
  }, [roles, constraints])

  const results = useMemo(() => buildStack(products, roles, constraints), [products, roles, constraints])
  const readiness = stackAgentReadiness(results)
  const picks = results.filter((r) => r.pick !== null)

  function toggleRole(id: string) {
    setRoles((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]))
  }

  function applyPreset(presetId: string) {
    const preset = STACK_PRESETS.find((p) => p.id === presetId)
    if (!preset) return
    setRoles(preset.roles)
    setConstraints(preset.constraints)
  }

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable — the URL bar still has the link */
    }
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3 rounded-2xl border border-zinc-800 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-zinc-400">Presets</span>
          {STACK_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset.id)}
              title={preset.description}
              className="rounded-full border border-zinc-800 px-3 py-1 text-xs text-zinc-300 transition hover:border-emerald-400/40 hover:text-emerald-300"
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <div className="flex items-center gap-1 rounded-lg border border-zinc-800 p-0.5">
            {METRIC_OPTIONS.map((opt) => (
              <button
                key={opt.metric}
                type="button"
                onClick={() => setConstraints((c) => ({ ...c, metric: opt.metric }))}
                className={`rounded-md px-2.5 py-1 text-xs transition ${
                  constraints.metric === opt.metric
                    ? 'bg-emerald-400/10 text-emerald-300'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-300">
            <input
              type="checkbox"
              checked={constraints.ossOnly}
              onChange={(e) => setConstraints((c) => ({ ...c, ossOnly: e.target.checked }))}
              className="accent-emerald-400"
            />
            Open-source only
          </label>
          <label
            className="flex cursor-pointer items-center gap-2 text-xs text-zinc-300"
            title="We don't score self-hostability directly — the openness theme score (leave/inspect/self-host stories) is the proxy; picks are re-ordered by a 70/30 blend of the metric and openness."
          >
            <input
              type="checkbox"
              checked={constraints.selfHostPreferred}
              onChange={(e) => setConstraints((c) => ({ ...c, selfHostPreferred: e.target.checked }))}
              className="accent-emerald-400"
            />
            Self-hostable preferred
            <span className="text-zinc-500">(openness proxy)</span>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3 lg:grid-cols-4">
          {STACK_ROLES.map((role) => (
            <label key={role.id} className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={roles.includes(role.id)}
                onChange={() => toggleRole(role.id)}
                className="accent-emerald-400"
              />
              {role.label}
            </label>
          ))}
        </div>
      </section>

      {roles.length === 0 ? (
        <p className="rounded-2xl border border-zinc-800 px-4 py-8 text-center text-sm text-zinc-500">
          Pick roles above (or start from a preset) — each role&rsquo;s winner is resolved live
          from its arena&rsquo;s leaderboard under your constraints.
        </p>
      ) : (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display leading-[1.1] text-xl font-semibold tracking-tight">Your stack</h2>
            <div className="flex items-center gap-3">
              {readiness !== null && picks.length > 0 && (
                <span
                  className="font-mono text-sm tabular-nums text-zinc-300"
                  title="Mean of the picks' agent-ready scores — how drivable this stack is for an agent overall."
                >
                  stack agent-readiness <span className="font-semibold text-emerald-300">{readiness.toFixed(1)}</span>
                  <span className="text-zinc-600">/100</span>
                </span>
              )}
              <button
                type="button"
                onClick={copyShareLink}
                className="rounded-full border border-zinc-800 px-3 py-1 text-xs text-zinc-400 transition hover:border-emerald-400/40 hover:text-emerald-300"
              >
                {copied ? 'Copied ✓' : 'Copy share link'}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-zinc-800">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-left text-[10px] uppercase tracking-widest text-zinc-400">
                  <th scope="col" className="px-3 py-2 font-normal">Role</th>
                  <th scope="col" className="px-3 py-2 font-normal">Pick</th>
                  <th scope="col" className="px-3 py-2 font-normal">Evidence</th>
                  <th scope="col" className="hidden px-3 py-2 font-normal sm:table-cell">Runner-up</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/70">
                {results.map(({ role, pick, emptyReason }) => (
                  <tr key={role.id} className="transition hover:bg-zinc-900/50">
                    <td className="whitespace-nowrap px-3 py-2.5 align-top font-medium">{role.label}</td>
                    {pick ? (
                      <>
                        <td className="px-3 py-2.5 align-top">
                          <Link
                            href={`/arena/${pick.product.arenaId}/product/${pick.product.id}`}
                            className="flex items-center gap-2 hover:text-emerald-300"
                          >
                            <ProductLogoView
                              product={{ id: pick.product.id, name: pick.product.name }}
                              size={24}
                              hasLogo={pick.product.hasLogo}
                            />
                            <span className="font-medium">{pick.product.name}</span>
                          </Link>
                        </td>
                        <td className="px-3 py-2.5 align-top">
                          <span className="whitespace-nowrap font-mono text-xs">
                            <span className="text-emerald-400">{pick.metricValue.toFixed(0)}</span>
                            <span className="text-zinc-500">/100 · </span>
                            <span className="text-zinc-400">
                              #{pick.rank} of {pick.fieldSize} in{' '}
                              <Link
                                href={`/arena/${pick.product.arenaId}`}
                                className="underline decoration-zinc-700 hover:text-emerald-300"
                              >
                                {pick.product.arenaName}
                              </Link>{' '}
                              by {STACK_METRIC_LABELS[constraints.metric]}
                            </span>
                          </span>
                        </td>
                        <td className="hidden px-3 py-2.5 align-top text-xs text-zinc-500 sm:table-cell">
                          {pick.runnerUp ? pick.runnerUp.name : '—'}
                        </td>
                      </>
                    ) : (
                      <td colSpan={3} className="px-3 py-2.5 align-top text-xs italic text-zinc-500">
                        {emptyReason}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-zinc-500">
            Ranks are within each pick&rsquo;s full arena field on the chosen metric — a
            constraint can pick a lower-ranked product, and the annotation says so honestly.
          </p>
        </section>
      )}
    </div>
  )
}
