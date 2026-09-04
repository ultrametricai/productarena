// Open-source clarity pill — `product.type === 'oss'` is otherwise buried in a line of prose
// (see product page's vendor line); this makes it scannable at a glance on leaderboard rows,
// product pages, and the global ranking tables.
//
// `variant="compact"` renders "Open source" at a smaller size on one line — readable without
// the OSS abbreviation, still narrow enough for a table column. The full-size pill is reserved
// for the product page header, where there's room.
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
      className={`inline-flex w-fit items-center whitespace-nowrap rounded-full bg-emerald-950 font-medium text-emerald-300 ring-1 ring-emerald-800 ${
        variant === 'compact' ? 'px-1.5 py-px text-[9px] normal-case tracking-normal' : 'px-2 py-0.5 text-[10px] uppercase tracking-wide'
      } ${className}`}
    >
      {variant === 'compact' ? 'Open source' : 'Open Source'}
    </span>
  )
}
