// Shutdown pill — renders for products whose verified `shutdown` note is set (see the Product
// schema comment in lib/schemas.ts: vendor announced it is closing; data and verdicts are kept,
// the chip is the honesty marker). Amber, matching the site's caution color. Renders nothing
// when absent, per the YcBadge/OssPill no-empty-placeholder convention.
export default function ShutdownBadge({
  shutdown,
  source,
  className = '',
}: {
  shutdown: string | undefined
  source?: string
  className?: string
}) {
  if (!shutdown) return null
  const pill = (
    <span
      title={shutdown}
      className={`inline-flex w-fit items-center rounded-full border border-amber-400/60 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300 ${className}`}
    >
      Closing
    </span>
  )
  if (!source) return pill
  return (
    <a href={source} target="_blank" rel="noopener noreferrer" title={shutdown} className="inline-flex">
      {pill}
    </a>
  )
}
