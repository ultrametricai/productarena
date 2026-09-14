import Link from 'next/link'

// YC alumni pill — renders a product's verified `ycBatch` (e.g. "S22") as YC's signature orange
// chip. Verification happens upstream (pipeline/scripts/yc-cross-reference.ts matches by website
// domain, never by name — see data/yc-batches.json), so this component just displays whatever
// ycBatch a product carries; it renders nothing when absent, matching MomentumChip/OssPill's
// "no chip at all rather than an empty placeholder" convention for optional signals.
//
// The pill links to that batch's ranking (/yc/<batch>, app/yc/[batch]/page.tsx). Pass
// clickable={false} when the pill already sits inside another <Link> (nested anchors are
// invalid HTML) — e.g. app/yc/page.tsx's batch column.
export default function YcBadge({
  ycBatch,
  className = '',
  clickable = true,
}: {
  ycBatch: string | undefined
  className?: string
  clickable?: boolean
}) {
  if (!ycBatch) return null
  const pillClass = `inline-flex w-fit items-center rounded-full bg-orange-950 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-orange-300 ring-1 ring-orange-800 ${className}`
  if (!clickable) {
    return (
      <span title={`Y Combinator batch ${ycBatch}`} className={pillClass}>
        YC {ycBatch}
      </span>
    )
  }
  return (
    <Link
      href={`/yc/${ycBatch.toLowerCase()}`}
      title={`Y Combinator batch ${ycBatch}`}
      className={`${pillClass} transition hover:ring-orange-500 hover:text-orange-200`}
    >
      YC {ycBatch}
    </Link>
  )
}
