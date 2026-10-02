import Link from 'next/link'
import type { ArtifactChipRows } from '@/lib/processDeps'

// The typed-I/O header rows on /processes/[slug] (founder depth wave part 2, 2026-10-01):
// 'Needs:' names the registry artifacts this process consumes, 'Produces:' the ones it brings
// into existence — the machine-truth layer (produces/requires in processes/corpus.json against
// processes/artifacts.json) rendered as the house chip idiom. Each chip links to the artifact's
// CANONICAL producer process (a Needs chip answers "where do I get this?"; a Produces chip on a
// documented exception producer — the LLC page's EIN — points back at the canonical page).
// Chips for artifacts this very page produces render unlinked: the producer is right here.
// Purely presentational and serializable — props come from lib/processDeps.ts artifactChipRows.

const CHIP =
  'rounded-full border border-zinc-700 px-2 py-0.5 text-zinc-300'
const LINKED_CHIP =
  `${CHIP} transition hover:border-emerald-400/60 hover:text-emerald-300`

function ChipRow({ heading, title, chips }: {
  heading: string
  title: string
  chips: ArtifactChipRows['needs']
}) {
  if (chips.length === 0) return null
  return (
    <p className="flex flex-wrap items-center gap-1.5">
      <span title={title} className="text-[10px] uppercase tracking-widest text-zinc-400">
        {heading}
      </span>
      {chips.map((c) =>
        c.producedHere ? (
          <span key={c.id} title={`${c.description} Produced right here, by this process.`} className={CHIP}>
            {c.label}
          </span>
        ) : (
          <Link
            key={c.id}
            href={c.producerHref}
            title={`${c.description} Produced by ${c.producerTitle} →`}
            className={LINKED_CHIP}
          >
            {c.label}
          </Link>
        ),
      )}
    </p>
  )
}

export default function ArtifactChips({ rows }: { rows: ArtifactChipRows }) {
  if (rows.needs.length === 0 && rows.produces.length === 0) return null
  return (
    <div className="mt-3 space-y-1.5 text-xs">
      <ChipRow
        heading="Needs:"
        title="Business artifacts this process consumes — each chip links to the process that produces it (the typed layer behind the prose: processes/artifacts.json)"
        chips={rows.needs}
      />
      <ChipRow
        heading="Produces:"
        title="Business artifacts this process brings into existence — the step where each one is born carries it in the flow below"
        chips={rows.produces}
      />
    </div>
  )
}
