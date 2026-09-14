export default function ScoreBar({ score, className = '' }: { score: number; className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-800">
        <div className="h-full rounded-full bg-emerald-400" style={{ width: `${score}%` }} />
      </div>
      {/* N/100 with dimmed /100 — the house score convention (AiEraBadge, table cells). */}
      <span className="whitespace-nowrap text-right font-mono text-sm tabular-nums text-emerald-300">
        {score.toFixed(1)}
        <span className="text-zinc-600">/100</span>
      </span>
    </div>
  )
}
