// Open-source clarity pill — `product.type === 'oss'` is otherwise buried in a line of prose
// (see product page's vendor line); this makes it scannable at a glance on leaderboard rows,
// product pages, and the global ranking tables.
//
// `variant="compact"` renders just "OSS" (full meaning in the title tooltip) — the table
// variant: never wraps, keeps the column narrow. The full "Open Source" wording is reserved for
// the product page header, where there's room.
export default function OssPill({
  variant = 'full',
  className = '',
}: {
  variant?: 'full' | 'compact'
  className?: string
}) {
  return (
    <span
      title="Open source — the product's code is publicly available"
      className={`inline-flex w-fit items-center whitespace-nowrap rounded-full bg-emerald-950 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-300 ring-1 ring-emerald-800 ${className}`}
    >
      {variant === 'compact' ? 'OSS' : 'Open Source'}
      {variant === 'compact' && <span className="sr-only"> — open source</span>}
    </span>
  )
}
