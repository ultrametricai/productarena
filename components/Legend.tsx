import Link from 'next/link'

// Always-visible legend for the badge vocabulary used on arena pages, the story matrix, and
// battle views. Two labeled clusters instead of one undifferentiated pill strip — each cluster
// answers a different question (what the judge ruled / how strong the receipts are), so a
// reader can find the vocabulary they're actually squinting at. The compact glyphs (✓ ~ — !)
// live INSIDE the verdict chips — same five states, one legend entry — and the proof letters
// (T X C D) sit beside their word so the dense StoryMatrix letters are learnable here too.
// Deliberately terse: [the actual badge] + a 2–4 word gloss; full explanations on /methodology.
// (`defaultOpen` kept for call-site compatibility; the legend is always open now.)
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

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">{label}</span>
      {children}
    </div>
  )
}

export default function Legend({ id = 'legend' }: { id?: string; defaultOpen?: boolean }) {
  return (
    <div
      id={id}
      className="scroll-mt-4 flex flex-col gap-y-2 rounded-xl border border-zinc-800 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-8"
    >
      <Group label="Verdict">
        <Item chip={<Chip className="bg-emerald-950 text-emerald-300 ring-emerald-800">✓ full</Chip>} gloss="clear evidence" />
        <Item chip={<Chip className="bg-emerald-950 text-emerald-300 ring-emerald-800">~ partial</Chip>} gloss="with caveats" />
        <Item chip={<Chip className="bg-red-950 text-red-300 ring-red-800">! disputed</Chip>} gloss="evidence conflicts" />
        <Item chip={<Chip className="bg-zinc-900 text-zinc-500 ring-zinc-700">— none</Chip>} gloss="no evidence found" />
        <Item chip={<Chip className="bg-zinc-900 text-zinc-400 ring-zinc-800">n/a</Chip>} gloss="question doesn't apply to this kind of product" />
      </Group>
      <Group label="Proof">
        <Item chip={<Chip className="bg-emerald-950 text-emerald-300 ring-emerald-800">T probed</Chip>} gloss="tested by us" />
        <Item chip={<Chip className="bg-sky-950 text-sky-300 ring-sky-800">X community</Chip>} gloss="users back it" />
        <Item chip={<Chip className="bg-zinc-900 text-zinc-400 ring-zinc-700">C claimed</Chip>} gloss="vendor claim only" />
        <Item chip={<Chip className="bg-red-950 text-red-300 ring-red-800">D contradicted</Chip>} gloss="evidence disagrees" />
      </Group>
      <span className="text-[11px] text-zinc-500">
        quality 0–10 · Arena Score /100 ·{' '}
        <Link href="/methodology" className="underline decoration-zinc-700 hover:text-emerald-300">
          full guide
        </Link>
      </span>
    </div>
  )
}
