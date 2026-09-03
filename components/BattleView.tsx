import Link from 'next/link'
import AgenticBadge from '@/components/AgenticBadge'
import { BusinessModelLine } from '@/components/BusinessModel'
import ContestLink from '@/components/ContestLink'
import VerdictBadge from '@/components/VerdictBadge'
import VerificationBadge from '@/components/VerificationBadge'
import { evidenceById, groupInOrder, type CategoryData, verdictFor } from '@/lib/data'
import type { BattleRecord } from '@/lib/schemas'
import { strongestEvidence, verificationLevel } from '@/lib/verification'

type Round = BattleRecord['rounds'][number]

export default function BattleView({ data, battle }: { data: CategoryData; battle: BattleRecord }) {
  const productById = new Map(data.products.map((p) => [p.id, p]))
  const storyById = new Map(data.stories.map((s) => [s.id, s]))
  const entryById = new Map(data.rankings.leaderboard.map((e) => [e.productId, e]))
  const evidence = evidenceById(data)
  const a = productById.get(battle.a)!
  const b = productById.get(battle.b)!
  const winnerName = battle.winner === 'draw' ? null : productById.get(battle.winner)!.name

  const decided = battle.rounds.filter((r) => r.winner !== 'na')
  const naRounds = battle.rounds.filter((r) => r.winner === 'na')
  const byTheme = groupInOrder(decided, (r) => storyById.get(r.storyId)!.theme)

  const renderRound = (round: Round) => {
    const story = storyById.get(round.storyId)!
    const va = verdictFor(data, battle.a, round.storyId)
    const vb = verdictFor(data, battle.b, round.storyId)
    const roundWinner =
      round.winner === 'a' ? a.name : round.winner === 'b' ? b.name : round.winner === 'draw' ? 'draw' : null
    return (
      <li key={round.storyId} className="rounded-xl border border-zinc-800 p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h4 className="font-medium">{story.title}</h4>
          <span className="text-xs text-zinc-500">
            weight {story.weight} ·{' '}
            {roundWinner === null ? 'not comparable' : roundWinner === 'draw' ? 'round drawn' : `round to ${roundWinner}`}
          </span>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {[
            { p: a, v: va, won: round.winner === 'a' },
            { p: b, v: vb, won: round.winner === 'b' },
          ].map(({ p, v, won }) => {
            const proof = strongestEvidence(v, evidence)
            return (
              <div key={p.id} className={`rounded-xl p-4 ring-1 ${won ? 'ring-emerald-400/60 bg-emerald-400/5' : 'ring-zinc-800'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{p.name}</span>
                  <span className="flex items-center gap-2">
                    <VerdictBadge verdict={v.verdict} />
                    <VerificationBadge level={verificationLevel(v, evidence)} />
                    {v.verdict !== 'na' && (
                      <span className="font-mono text-sm tabular-nums text-zinc-400">{v.quality}/10</span>
                    )}
                  </span>
                </div>
                <p className="mt-2 text-sm text-zinc-400">{v.rationale}</p>
                <ul className="mt-2 space-y-1">
                  {v.evidenceIds.map((id) => {
                    const e = evidence.get(id)!
                    return (
                      <li key={id} className="text-xs text-zinc-500">
                        <a href={e.url} target="_blank" rel="noopener noreferrer" className="underline decoration-zinc-700 hover:text-emerald-300">
                          [{e.tier}]
                        </a>{' '}
                        &ldquo;{e.excerpt.length > 140 ? e.excerpt.slice(0, 140) + '…' : e.excerpt}&rdquo;
                      </li>
                    )
                  })}
                </ul>
                <div className="mt-2 flex items-center justify-end gap-3">
                  {proof && (
                    <a
                      href={proof.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-zinc-500 hover:text-emerald-300"
                    >
                      proof ↗
                    </a>
                  )}
                  <ContestLink category={data.category.id} productId={p.id} storyId={round.storyId} verdict={v} />
                </div>
              </div>
            )
          })}
        </div>
      </li>
    )
  }

  const aEntry = entryById.get(a.id)
  const bEntry = entryById.get(b.id)

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="font-display leading-[1.1] text-3xl font-bold tracking-tight">
          {a.name} <span className="text-zinc-400">vs</span> {b.name}
        </h1>
        <div className="mt-1 flex items-center justify-center gap-2 text-xs text-zinc-400">
          <BusinessModelLine product={a} />
          <span className="text-zinc-700">·</span>
          <BusinessModelLine product={b} />
        </div>
        <p className="mt-1">
          <Link
            href={`/arena/${data.category.id}#legend`}
            className="text-xs text-zinc-400 underline decoration-zinc-700 hover:text-emerald-300"
          >
            How to read this: legend →
          </Link>
        </p>
        <p className="mt-2 text-emerald-300">
          {winnerName ? `${winnerName} wins` : 'Draw'} · {battle.record.aWins}–{battle.record.bWins}
          {battle.record.draws > 0 ? ` (${battle.record.draws} drawn)` : ''}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-6 rounded-xl border border-zinc-800 p-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-400">{a.name}</span>
          <AgenticBadge kind="agent-ready" value={aEntry?.agentReady ?? null} />
          <AgenticBadge kind="agentic-app" value={aEntry?.agenticApp ?? null} />
        </div>
        <span className="text-xs uppercase tracking-widest text-zinc-400">Agenticness</span>
        <div className="flex items-center gap-2">
          <AgenticBadge kind="agent-ready" value={bEntry?.agentReady ?? null} />
          <AgenticBadge kind="agentic-app" value={bEntry?.agenticApp ?? null} />
          <span className="text-sm text-zinc-400">{b.name}</span>
        </div>
      </div>

      <div className="space-y-8">
        {byTheme.map(([theme, rounds]) => {
          const byGroup = groupInOrder(rounds, (r) => storyById.get(r.storyId)!.group)
          return (
            <div key={theme}>
              <h2 className="sticky top-0 z-10 -mx-5 border-b border-zinc-800 bg-zinc-950/95 px-5 py-2 text-sm font-semibold uppercase tracking-widest text-emerald-400 backdrop-blur">
                {theme}
              </h2>
              <div className="mt-4 space-y-6">
                {byGroup.map(([group, groupRounds]) => (
                  <div key={group}>
                    {group !== theme && <p className="mb-2 text-xs text-zinc-500">{group}</p>}
                    <ol className="space-y-3">{groupRounds.map(renderRound)}</ol>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {naRounds.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">Not comparable on these axes</h2>
          <ol className="mt-4 space-y-3 opacity-60">{naRounds.map(renderRound)}</ol>
        </div>
      )}
    </div>
  )
}
