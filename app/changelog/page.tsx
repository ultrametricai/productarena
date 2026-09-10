import type { Metadata } from 'next'
import Link from 'next/link'
import {
  buildChangelog, capChangelog, groupByDay, SCORE_MOVE_THRESHOLD, type ChangeEvent,
  CHANGELOG_MAX_DAYS, CHANGELOG_MAX_EVENTS,
} from '@/lib/changelog'

// What changed, honestly: every event on this page is re-derived at build time from the
// committed data/{cat}/score-history.jsonl files (see lib/changelog.ts) — rank flips, big score
// moves, new products, new arenas. Nothing is hand-written and nothing is stored; the history
// files are the archive, this page is the recent window onto them.

export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'Changelog — ProductArena',
  description:
    'What changed across every arena — rank flips, PA Score moves, new products, and new arenas, derived from the committed score history. Nothing hand-written.',
}

function dayLabel(day: string): string {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

function fmtDelta(delta: number): string {
  return `${delta > 0 ? '+' : ''}${delta.toFixed(1)}`
}

const ARENA_LINK = 'text-zinc-300 underline decoration-zinc-700 underline-offset-2 transition hover:text-emerald-300'
const PRODUCT_LINK = 'font-medium text-zinc-100 underline decoration-zinc-700 underline-offset-2 transition hover:text-emerald-300'

function EventLine({ event }: { event: ChangeEvent }) {
  const arena = (
    <Link href={`/arena/${event.categoryId}`} className={ARENA_LINK}>
      {event.categoryName}
    </Link>
  )
  switch (event.kind) {
    case 'arena-launched':
      return (
        <span>
          <span aria-hidden className="mr-2 text-emerald-400">▸</span>
          {arena} arena launched ({event.productCount} {event.productCount === 1 ? 'product' : 'products'})
        </span>
      )
    case 'overtake':
      return (
        <span>
          <span aria-hidden className="mr-2 text-emerald-400">⇅</span>
          <Link href={`/arena/${event.categoryId}/product/${event.productId}`} className={PRODUCT_LINK}>
            {event.productName}
          </Link>{' '}
          overtook{' '}
          <Link href={`/arena/${event.categoryId}/product/${event.overtookId}`} className={PRODUCT_LINK}>
            {event.overtookName}
          </Link>{' '}
          in {arena}{' '}
          <span className="font-mono text-xs text-zinc-500">
            ({event.productAiEra.toFixed(1)} vs {event.overtookAiEra.toFixed(1)})
          </span>
        </span>
      )
    case 'score-move':
      return (
        <span>
          <span aria-hidden className={`mr-2 ${event.delta > 0 ? 'text-emerald-400' : 'text-zinc-500'}`}>
            {event.delta > 0 ? '▲' : '▼'}
          </span>
          <Link href={`/arena/${event.categoryId}/product/${event.productId}`} className={PRODUCT_LINK}>
            {event.productName}
          </Link>{' '}
          <span className={`font-mono text-sm ${event.delta > 0 ? 'text-emerald-400' : 'text-zinc-400'}`}>
            {fmtDelta(event.delta)}
          </span>{' '}
          PA Score in {arena}{' '}
          <span className="font-mono text-xs text-zinc-500">(→ {event.to.toFixed(1)})</span>
        </span>
      )
    case 'product-added':
      return (
        <span>
          <span aria-hidden className="mr-2 text-emerald-400">+</span>
          <Link href={`/arena/${event.categoryId}/product/${event.productId}`} className={PRODUCT_LINK}>
            {event.productName}
          </Link>{' '}
          entered the {arena} arena
        </span>
      )
  }
}

export default function ChangelogPage() {
  const { events, historyBegins } = buildChangelog()
  const capped = capChangelog(events)
  const days = groupByDay(capped)

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <p className="text-sm uppercase tracking-widest text-emerald-400">Changelog</p>
        <h1 className="font-display leading-[1.1] mt-1 text-3xl font-bold tracking-tight">What changed, honestly</h1>
        <p className="mt-2 max-w-2xl text-zinc-400">
          Rank flips, PA Score moves of {SCORE_MOVE_THRESHOLD.toFixed(1)}+ points, new products, and new arenas —
          derived at build time from the committed score history, never hand-written. Scores only move when evidence
          and verdicts are re-derived, so a quiet day means nothing changed.
        </p>
        {historyBegins && (
          <p className="mt-2 text-xs text-zinc-500">
            History begins {dayLabel(historyBegins)}, {historyBegins.slice(0, 4)} — the day score tracking started.
            Earlier movement isn&rsquo;t recorded, so it isn&rsquo;t shown. Showing the most recent {CHANGELOG_MAX_DAYS} days
            with activity (max {CHANGELOG_MAX_EVENTS} events).
          </p>
        )}
      </div>

      {days.length === 0 ? (
        <p className="text-sm italic text-zinc-500">No recorded changes yet.</p>
      ) : (
        <div className="space-y-6">
          {days.map(([day, dayEvents]) => (
            <section key={day}>
              <h2 className="font-display leading-[1.1] text-lg font-semibold">
                {dayLabel(day)} <span className="ml-1 font-mono text-xs font-normal text-zinc-500">{day}</span>
              </h2>
              <ul className="mt-2 space-y-1.5 border-l border-zinc-800 pl-4 text-sm text-zinc-400">
                {dayEvents.map((event, i) => (
                  <li key={`${event.kind}-${event.categoryId}-${i}`}>
                    <EventLine event={event} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
