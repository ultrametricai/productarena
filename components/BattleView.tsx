import VerdictBadge from '@/components/VerdictBadge'
import { type AppData, evidenceById, verdictFor } from '@/lib/data'
import type { BattleRecord } from '@/lib/schemas'

export default function BattleView({ data, battle }: { data: AppData; battle: BattleRecord }) {
  const productById = new Map(data.products.map((p) => [p.id, p]))
  const storyById = new Map(data.stories.map((s) => [s.id, s]))
  const evidence = evidenceById(data)
  const a = productById.get(battle.a)!
  const b = productById.get(battle.b)!
  const winnerName = battle.winner === 'draw' ? null : productById.get(battle.winner)!.name

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          {a.name} <span className="text-zinc-600">vs</span> {b.name}
        </h1>
        <p className="mt-2 text-amber-300">
          {winnerName ? `${winnerName} wins` : 'Draw'} · {battle.record.aWins}–{battle.record.bWins}
          {battle.record.draws > 0 ? ` (${battle.record.draws} drawn)` : ''}
        </p>
      </div>

      <ol className="space-y-3">
        {battle.rounds.map((round) => {
          const story = storyById.get(round.storyId)!
          const va = verdictFor(data, battle.a, round.storyId)
          const vb = verdictFor(data, battle.b, round.storyId)
          const roundWinner = round.winner === 'a' ? a.name : round.winner === 'b' ? b.name : 'draw'
          return (
            <li key={round.storyId} className="rounded-xl border border-zinc-800 p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-medium">{story.title}</h2>
                <span className="text-xs text-zinc-500">
                  {story.theme} · weight {story.weight} ·{' '}
                  {round.winner === 'draw' ? 'round drawn' : `round to ${roundWinner}`}
                </span>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {[{ p: a, v: va, won: round.winner === 'a' }, { p: b, v: vb, won: round.winner === 'b' }].map(
                  ({ p, v, won }) => (
                    <div key={p.id} className={`rounded-lg p-4 ring-1 ${won ? 'ring-amber-400/60 bg-amber-400/5' : 'ring-zinc-800'}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">{p.name}</span>
                        <span className="flex items-center gap-2">
                          <VerdictBadge verdict={v.verdict} />
                          <span className="font-mono text-sm tabular-nums text-zinc-400">{v.quality}/10</span>
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-zinc-400">{v.rationale}</p>
                      <ul className="mt-2 space-y-1">
                        {v.evidenceIds.map((id) => {
                          const e = evidence.get(id)!
                          return (
                            <li key={id} className="text-xs text-zinc-500">
                              <a href={e.url} target="_blank" rel="noopener noreferrer" className="underline decoration-zinc-700 hover:text-amber-300">
                                [{e.tier}]
                              </a>{' '}
                              "{e.excerpt.length > 140 ? e.excerpt.slice(0, 140) + '…' : e.excerpt}"
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  ),
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
