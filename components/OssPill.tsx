// Open-source clarity pill — `product.type === 'oss'` is otherwise buried in a line of prose
// (see product page's vendor line); this makes it scannable at a glance on leaderboard rows,
// product pages, and the global Agentic Index table.
export default function OssPill({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex w-fit items-center rounded-full bg-emerald-950 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-300 ring-1 ring-emerald-800 ${className}`}
    >
      Open Source
    </span>
  )
}
