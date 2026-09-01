// The AI-Era Index's lead badge — deliberately more prominent than AgenticBadge (bigger type,
// solid amber ring) since v2.4 re-prioritizes the whole site around this number. See README's
// "AI-Era Index" section for the blend formula and weights.
export default function AiEraBadge({ value, size = 'md' }: { value: number | null; size?: 'md' | 'sm' }) {
  const sizeClass = size === 'md' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs'
  if (value === null) {
    return (
      <span
        className={`inline-flex w-fit items-center rounded-full bg-zinc-900 font-semibold italic text-zinc-600 ring-1 ring-zinc-800 ${sizeClass}`}
      >
        AI-ERA n/a
      </span>
    )
  }
  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full bg-amber-400 font-bold text-zinc-950 ring-1 ring-amber-300 ${sizeClass}`}
    >
      AI-ERA <span className="font-mono tabular-nums">{value.toFixed(0)}</span>
    </span>
  )
}
