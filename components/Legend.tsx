import Link from 'next/link'

// Always-visible, single-strip legend for the badge vocabulary used on arena pages, the story
// matrix, and battle views. Deliberately terse — every item is [the actual badge] + a 2–4 word
// gloss; the full explanations live on /methodology. (`defaultOpen` kept for call-site
// compatibility; the strip is always open now.)
function Chip({ className, children }: { className: string; children: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-1.5 py-px text-[10px] font-medium ring-1 ${className}`}
    >
      {children}
    </span>
  )
}

function Item({ chip, gloss }: { chip: React.ReactNode; gloss: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      {chip}
      <span className="text-[11px] text-zinc-400">{gloss}</span>
    </span>
  )
}

const SEP = <span aria-hidden className="mx-1 text-zinc-700">|</span>

export default function Legend({ id = 'legend' }: { id?: string; defaultOpen?: boolean }) {
  return (
    <div
      id={id}
      className="scroll-mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-zinc-800 px-4 py-2.5"
    >
      <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
        Legend
      </span>
      <Item chip={<Chip className="bg-emerald-950 text-emerald-300 ring-emerald-800">full</Chip>} gloss="clear evidence" />
      <Item chip={<Chip className="bg-amber-950 text-amber-300 ring-amber-800">partial</Chip>} gloss="with caveats" />
      <Item chip={<Chip className="bg-red-950 text-red-300 ring-red-800">disputed</Chip>} gloss="evidence conflicts" />
      <Item chip={<Chip className="bg-zinc-900 text-zinc-500 ring-zinc-700">none</Chip>} gloss="no evidence found" />
      <Item chip={<Chip className="bg-zinc-900 text-zinc-400 ring-zinc-800">n/a</Chip>} gloss="wrong axis, unscored" />
      {SEP}
      <Item chip={<Chip className="bg-zinc-900 text-zinc-400 ring-zinc-700">C</Chip>} gloss="vendor claim only" />
      <Item chip={<Chip className="bg-sky-950 text-sky-300 ring-sky-800">X</Chip>} gloss="community-backed" />
      <Item chip={<Chip className="bg-emerald-950 text-emerald-300 ring-emerald-800">T</Chip>} gloss="probed by us" />
      <Item chip={<Chip className="bg-red-950 text-red-300 ring-red-800">D</Chip>} gloss="claim contradicted" />
      {SEP}
      <span className="font-mono text-[11px]">
        <span className="text-emerald-400">✓</span>
        <span className="text-zinc-400"> full · </span>
        <span className="text-amber-400">~</span>
        <span className="text-zinc-400"> partial · </span>
        <span className="text-zinc-500">—</span>
        <span className="text-zinc-400"> none · </span>
        <span className="text-red-400">!</span>
        <span className="text-zinc-400"> disputed</span>
      </span>
      {SEP}
      <span className="text-[11px] text-zinc-400">
        quality 0–10 · Arena Score /100 ·{' '}
        <Link href="/methodology" className="underline decoration-zinc-700 hover:text-amber-300">
          full guide
        </Link>
      </span>
    </div>
  )
}
