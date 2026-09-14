import Link from 'next/link'

// Tiny "?" affordance beside data tables: column-header tooltips (title=) don't exist on touch,
// so every table gets one tappable route to the plain-English definitions on /methodology.
// Server-safe (no hooks) — rendered from server pages and client tables alike.
export default function ColumnsHelpLink({ className = '' }: { className?: string }) {
  return (
    <Link
      href="/methodology"
      title="What do these columns mean?"
      aria-label="What do these columns mean? See the methodology"
      className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-zinc-700 text-[11px] font-semibold text-zinc-400 transition hover:border-emerald-400/60 hover:text-emerald-300 ${className}`}
    >
      ?
    </Link>
  )
}
