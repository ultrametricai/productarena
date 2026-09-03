import { isUncertain, type Agreement } from '@/lib/uncertainty'

// Small "±" marker for a story-verdict cell whose tier isn't stable under multi-judge re-
// sampling — see pipeline/scripts/uncertainty-pass.ts and lib/schemas.ts's UncertaintyEntrySchema.
// Renders nothing for the overwhelming majority of cells (no recorded entry, or a stable '3/3'),
// so it never adds visual noise to a confident verdict. Product pages only for now (see
// app/arena/[category]/product/[id]/page.tsx) — the arena table and battle view aren't wired up
// yet.
export default function UncertaintyMarker({ agreement }: { agreement: Agreement | undefined }) {
  if (!isUncertain(agreement)) return null
  return (
    <span
      title={`judges split ${agreement} — treat as uncertain`}
      className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-950 text-xs font-bold text-amber-300 ring-1 ring-amber-800"
    >
      ±
    </span>
  )
}
