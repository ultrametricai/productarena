import type { Metadata } from 'next'
import Link from 'next/link'
import ProductLogoView from '@/components/ProductLogoView'
import { loadAll } from '@/lib/data'
import { hasLogo } from '@/lib/logos'
import { metricLabel, resolveAllStacks } from '@/lib/aiStacks'

export const metadata: Metadata = {
  title: 'AI Stacks — ProductArena',
  description:
    'Best evidence-backed pairings for going agentic: OS, local model runtime, coding agent, and the founder ops layer — every scored pick resolved live from arena rankings.',
}

// Cross-arena curated stacks: each scored slot is resolved at build time from the current arena
// leaderboards (see lib/aiStacks.ts), so the picks on this page move whenever the evidence
// moves — nothing here is a hand-maintained claim except the clearly-labeled editorial slots.
export default function StacksPage() {
  const categories = loadAll()
  const stacks = resolveAllStacks(categories)

  return (
    <div className="space-y-12">
      <section className="mx-auto max-w-3xl text-center">
        <h1 className="font-display leading-[1.1] mt-1 text-3xl font-bold tracking-tight">AI Stacks</h1>
        <p className="mx-auto mt-3 max-w-2xl text-zinc-400">
          The best pairings for going agentic — picked by evidence, not vibes. Every scored slot
          below is the current #1 of its arena on the named metric, resolved live from the same
          rankings as the rest of the site; slots we can&rsquo;t score yet are labeled as
          editorial picks.
        </p>
      </section>

      {stacks.map((stack) => (
        <section key={stack.id} id={stack.id} className="scroll-mt-4">
          <h2 className="font-display leading-[1.1] text-xl font-semibold tracking-tight">{stack.name}</h2>
          <p className="mt-1 text-sm text-zinc-400">{stack.tagline}</p>
          <p className="mt-0.5 text-xs text-zinc-500">For: {stack.audience}</p>
          <div className="mt-4 rounded-2xl border border-zinc-800">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-left text-[10px] uppercase tracking-widest text-zinc-400">
                  <th scope="col" className="px-3 py-2 font-normal">Layer</th>
                  <th scope="col" className="px-3 py-2 font-normal">Pick</th>
                  <th scope="col" className="hidden px-3 py-2 font-normal md:table-cell">Why this pick</th>
                  <th scope="col" className="hidden px-3 py-2 font-normal sm:table-cell">Evidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/70">
                {stack.slots.map((slot) => (
                  <tr key={slot.role} className="transition hover:bg-zinc-900/50">
                    <td className="px-3 py-2.5 align-top">
                      <span className="font-medium">{slot.role}</span>
                      <p className="mt-0.5 max-w-[220px] text-xs text-zinc-500">{slot.why}</p>
                    </td>
                    <td className="px-3 py-2.5 align-top">
                      {slot.kind !== 'editorial' && slot.productId && slot.arenaId ? (
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <Link
                            href={`/arena/${slot.arenaId}/product/${slot.productId}`}
                            className="flex items-center gap-2 hover:text-emerald-300"
                          >
                            <ProductLogoView
                              product={{ id: slot.productId, name: slot.productName ?? slot.productId }}
                              size={24}
                              hasLogo={hasLogo(slot.productId)}
                            />
                            <span className="font-medium">{slot.productName}</span>
                          </Link>
                          {slot.coPick && (
                            <>
                              <span className="text-xs text-zinc-500">or</span>
                              <Link
                                href={`/arena/${slot.arenaId}/product/${slot.coPick.productId}`}
                                className="flex items-center gap-2 hover:text-emerald-300"
                              >
                                <ProductLogoView
                                  product={{ id: slot.coPick.productId, name: slot.coPick.productName }}
                                  size={24}
                                  hasLogo={hasLogo(slot.coPick.productId)}
                                />
                                <span className="font-medium">{slot.coPick.productName}</span>
                              </Link>
                            </>
                          )}
                        </div>
                      ) : (
                        <a
                          href={slot.editorialUrl ?? '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium hover:text-emerald-300"
                        >
                          {slot.editorialName} ↗
                        </a>
                      )}
                      {slot.kind === 'arena-top' && slot.coPick && (
                        <p className="mt-0.5 text-xs text-zinc-500">
                          too close to call (Δ{((slot.metricValue ?? 0) - slot.coPick.metricValue).toFixed(1)}) — either is a strong pick
                        </p>
                      )}
                      {slot.kind === 'arena-top' && !slot.coPick && slot.runnerUpName && (
                        <p className="mt-0.5 text-xs text-zinc-500">runner-up: {slot.runnerUpName}</p>
                      )}
                    </td>
                    <td className="hidden max-w-[280px] px-3 py-2.5 align-top text-xs text-zinc-400 md:table-cell">
                      {slot.kind === 'arena-top' &&
                        `${slot.coPick ? 'top two' : '#1'} of ${slot.fieldSize} in ${slot.arenaName} by ${metricLabel(slot.metric ?? '')}`}
                      {slot.kind === 'product' && slot.curatedNote}
                      {slot.kind === 'editorial' && slot.editorialNote}
                    </td>
                    <td className="hidden px-3 py-2.5 align-top sm:table-cell">
                      {slot.kind !== 'editorial' && slot.arenaId ? (
                        <span className="whitespace-nowrap font-mono text-xs">
                          <span className="text-emerald-400">{slot.metricValue?.toFixed(0)}</span>
                          <span className="text-zinc-500">/100 · </span>
                          {slot.kind === 'product' && (
                            <span className="text-zinc-500">#{slot.rank} of {slot.fieldSize} · </span>
                          )}
                          <Link href={`/arena/${slot.arenaId}`} className="text-zinc-400 underline decoration-zinc-700 hover:text-emerald-300">
                            full arena
                          </Link>
                        </span>
                      ) : (
                        <span className="rounded-full border border-amber-800/60 px-2 py-0.5 text-[10px] uppercase tracking-wide text-amber-400/90">
                          editorial
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <section className="mx-auto max-w-3xl text-center text-sm text-zinc-500">
        <p>
          Disagree with a pick? Every scored slot traces to an arena leaderboard — contest the
          underlying verdicts and the stack updates itself.{' '}
          <Link href="/" className="text-emerald-400 underline decoration-emerald-400/40 hover:text-emerald-300">
            See all rankings →
          </Link>
        </p>
      </section>
    </div>
  )
}
