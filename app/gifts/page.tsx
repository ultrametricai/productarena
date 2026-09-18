import type { Metadata } from 'next'
import Link from 'next/link'
import { loadGifts, type GiftEntry, type GiftStatus } from '@/lib/gifts'

// UNLINKED founder-review page for the gift-PR program (drafts/outreach/ — see lib/gifts.ts
// for the data contract and the status.json lifecycle). Deliberately not in the sitemap, nav,
// command palette, or llms.txt, and noindexed below: outreach drafts are pre-send material,
// reviewable at a URL but never advertised. Everything rendered here is verbatim from the
// drafts tree — this page surfaces program state, it never invents any.

export const metadata: Metadata = {
  title: 'Gift program — founder review — ProductArena',
  description: 'Internal review page for the drafts/outreach gift-PR program.',
  robots: { index: false, follow: false },
}

// GIFT-LIST.md cells carry markdown bold for emphasis (**DCO sign-off enforced**) — rendered
// as plain text here, the asterisks are noise, so they're stripped for display only (the
// underlying list stays verbatim; backticks read fine as-is).
const stripBold = (s: string) => s.replaceAll('**', '')

const STATE_CHIP: Record<GiftStatus['state'], { label: string; className: string; title: string }> = {
  sent: {
    label: 'sent',
    className: 'bg-emerald-950 text-emerald-300 ring-emerald-800',
    title: 'The gift went out — status.json in the vendor dir carries the live URL and date',
  },
  drafted: {
    label: 'drafted',
    className: 'bg-amber-950 text-amber-300 ring-amber-800',
    title: 'Full send-ready draft exists in drafts/outreach/<vendor>/ — awaiting founder sign-off',
  },
  listed: {
    label: 'listed only',
    className: 'bg-zinc-900 text-zinc-400 ring-zinc-700',
    title: 'Ranked in GIFT-LIST.md but no full draft written yet',
  },
}

function StatusChip({ status }: { status: GiftStatus }) {
  const chip = STATE_CHIP[status.state]
  const body = (
    <span
      title={chip.title}
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${chip.className}`}
    >
      {chip.label}
      {status.date && <span className="ml-1 font-normal normal-case opacity-70">{status.date}</span>}
    </span>
  )
  return status.state === 'sent' && status.url ? (
    <a href={status.url} target="_blank" rel="noopener noreferrer" className="transition hover:brightness-125">
      {body}
    </a>
  ) : (
    body
  )
}

function Flag({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <span
      title={title}
      className="inline-flex min-w-0 max-w-full items-center rounded-full border border-zinc-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-400"
    >
      {children}
    </span>
  )
}

function GiftCard({ gift }: { gift: GiftEntry }) {
  return (
    <div className="rounded-xl border border-zinc-800 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="inline-flex items-center rounded-full bg-zinc-900 px-2 py-0.5 font-mono text-xs font-semibold tabular-nums text-zinc-300 ring-1 ring-zinc-800"
          title="Rank in GIFT-LIST.md — acceptance likelihood × visibility × score impact"
        >
          #{gift.rank}
        </span>
        <h2 className="font-display text-lg font-semibold leading-tight">{gift.product}</h2>
        <Link
          href={`/arena/${gift.arena}`}
          className="text-xs text-zinc-500 underline decoration-zinc-800 underline-offset-2 transition hover:text-emerald-300"
          title={`The arena where ${gift.product} competes — "${gift.standing}" is its rank/field @ Arena Score in the list's snapshot`}
        >
          {gift.arena}
          {gift.standing ? ` · ${gift.standing}` : ''}
        </Link>
        <span className="ml-auto">
          <StatusChip status={gift.status} />
        </span>
      </div>

      <p className="mt-2 break-words text-sm text-zinc-300">{stripBold(gift.gift)}</p>
      <p className="mt-1 break-words font-mono text-xs text-zinc-500" title="Target repo/venue, verbatim from GIFT-LIST.md (activity + license as of the list's re-verification date)">
        → {stripBold(gift.targetRepo)}
      </p>

      <p className="mt-2 break-words text-xs text-zinc-400">
        <span className="uppercase tracking-widest text-zinc-600" title="Our own verdict/certification product user stories that honestly improve if the gift lands and the surface goes live (re-judged only after a live re-probe)">
          Flips{' '}
        </span>
        {stripBold(gift.flips)}
      </p>

      <p className="mt-2 flex flex-wrap gap-1.5">
        <Flag title="Effort to produce and land the gift: S = one static file · M = wiring/config or two repos · L = needs infra/team buy-in">
          effort {gift.effort}
        </Flag>
        {gift.risk && gift.risk !== 'None' && (
          <Flag title="Risk / repo-policy notes, verbatim from GIFT-LIST.md (CLA/DCO, AI-disclosure policies, placement caveats)">
            <span className="min-w-0 max-w-[min(520px,100%)] truncate normal-case tracking-normal">{stripBold(gift.risk)}</span>
          </Flag>
        )}
      </p>

      {gift.status.state === 'sent' && gift.status.url && (
        <p className="mt-3 border-t border-zinc-800 pt-3 text-sm">
          <a
            href={gift.status.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-300 underline decoration-emerald-400/40 underline-offset-2 transition hover:text-emerald-200"
          >
            Live PR: {gift.status.url.replace('https://github.com/', '')} ↗
          </a>
          {gift.draft?.title && <span className="ml-2 text-xs text-zinc-500">“{gift.draft.title}”</span>}
        </p>
      )}

      {gift.draft?.body && (
        <details className="mt-3 border-t border-zinc-800 pt-3">
          <summary
            className="cursor-pointer text-sm text-zinc-400 transition hover:text-emerald-300"
            title={`Verbatim from drafts/outreach/${gift.draft.dir}/${gift.draft.bodyFile}`}
          >
            {gift.status.state === 'sent' ? 'Draft as sent' : 'Verbatim draft'}
            {gift.draft.bodyFile ? ` (${gift.draft.bodyFile})` : ''}
          </summary>
          {gift.draft.title && (
            <p className="mt-2 break-words font-mono text-sm text-zinc-200">{gift.draft.title}</p>
          )}
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words rounded-lg border border-zinc-800/70 bg-zinc-900/40 p-3 text-xs leading-relaxed text-zinc-300">
            {gift.draft.body}
          </pre>
        </details>
      )}

      {gift.draft?.artifact && (
        <details className="mt-2">
          <summary
            className="cursor-pointer text-sm text-zinc-400 transition hover:text-emerald-300"
            title={`The gift artifact itself — drafts/outreach/${gift.draft.dir}/${gift.draft.artifact.file}`}
          >
            Artifact: {gift.draft.artifact.file}{' '}
            <span className="font-mono text-xs text-zinc-600">({gift.draft.artifact.lineCount} lines)</span>
          </summary>
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words rounded-lg border border-zinc-800/70 bg-zinc-900/40 p-3 text-xs leading-relaxed text-zinc-400">
            {gift.draft.artifact.preview}
            {gift.draft.artifact.lineCount > gift.draft.artifact.preview.split('\n').length && '\n…'}
          </pre>
        </details>
      )}
    </div>
  )
}

export default function GiftsPage() {
  const gifts = loadGifts()
  const counts = { sent: 0, drafted: 0, listed: 0 }
  for (const g of gifts) counts[g.status.state]++

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-widest text-emerald-400">Founder review — unlinked</p>
        <h1 className="font-display leading-[1.1] mt-1 text-3xl font-bold tracking-tight">The gift list</h1>
        <p className="mt-2 max-w-2xl text-zinc-400">
          Ready-to-merge PR gifts to live projects — a real gap in our own evidence (missing
          llms.txt, no conventional OpenAPI), fixed for the project and distribution for us on
          merge. Ranked by acceptance likelihood × visibility × score impact.
        </p>
        <p className="mt-2 text-xs text-zinc-500" title="Lifecycle comes from drafts/outreach/<vendor>/status.json — see drafts/outreach/README.md for the contract">
          {gifts.length} candidates · <span className="text-emerald-300">{counts.sent} sent</span> ·{' '}
          <span className="text-amber-300">{counts.drafted} drafted</span> · {counts.listed} listed only ·
          source: <span className="font-mono">drafts/outreach/</span> — noindexed and linked from nowhere
        </p>
      </div>

      {gifts.length > 0 ? (
        <div className="space-y-3">
          {gifts.map((g) => (
            <GiftCard key={g.rank} gift={g} />
          ))}
        </div>
      ) : (
        <p className="text-sm italic text-zinc-500">
          No gift program state found — drafts/outreach/GIFT-LIST.md is missing from this build.
        </p>
      )}

      <p className="max-w-2xl text-xs text-zinc-500">
        Rules of engagement (full text in GIFT-LIST.md): a human sends, one at a time; re-verify
        the gap and the URL 200-check the day of sending; follow each repo&rsquo;s DCO/CLA/AI-disclosure
        policy exactly; gift-first tone, explicit easy-close invitation; scores only move after a
        live re-probe and re-judge of the affected story.
      </p>
    </div>
  )
}
