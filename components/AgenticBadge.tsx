export default function AgenticBadge({ value }: { value: number | null }) {
  if (value === null) {
    return (
      <span className="inline-flex w-fit items-center rounded-full bg-zinc-900 px-2 py-0.5 text-xs font-medium italic text-zinc-600 ring-1 ring-zinc-800">
        AGENTIC n/a
      </span>
    )
  }
  const style =
    value >= 66
      ? 'bg-amber-950 text-amber-300 ring-amber-800'
      : value >= 33
        ? 'bg-amber-950/70 text-amber-400/90 ring-amber-900'
        : 'bg-zinc-900 text-amber-700 ring-zinc-800'
  return (
    <span className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${style}`}>
      AGENTIC <span className="font-mono tabular-nums">{value.toFixed(0)}</span>
    </span>
  )
}
