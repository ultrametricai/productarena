// YC alumni pill — renders a product's verified `ycBatch` (e.g. "S22") as YC's signature orange
// chip. Verification happens upstream (pipeline/scripts/yc-cross-reference.ts matches by website
// domain, never by name — see data/yc-batches.json), so this component just displays whatever
// ycBatch a product carries; it renders nothing when absent, matching MomentumChip/OssPill's
// "no chip at all rather than an empty placeholder" convention for optional signals.
export default function YcBadge({ ycBatch, className = '' }: { ycBatch: string | undefined; className?: string }) {
  if (!ycBatch) return null
  return (
    <span
      title={`Y Combinator batch ${ycBatch}`}
      className={`inline-flex w-fit items-center rounded-full bg-orange-950 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-orange-300 ring-1 ring-orange-800 ${className}`}
    >
      YC {ycBatch}
    </span>
  )
}
