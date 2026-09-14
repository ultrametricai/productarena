// 🔥 "hot right now" marker — renders next to a product name when lib/hotProducts.ts flagged
// it as exploding in interest (top-decile tracked star growth, a young-rocket repo, or a
// curated override — see lib/popularRanking.ts). The tooltip IS the receipt: every flag
// carries its concrete reason string. Deliberately tiny and un-badge-like: this is registry
// adoption data, not a judged verdict, and must never read as part of the PA Score (same
// stance as components/MomentumChip.tsx).
export default function HotChip({ reason }: { reason: string }) {
  return (
    <span
      title={`Hot right now: ${reason} — from public registry data, not part of the PA Score.`}
      aria-label={`Hot right now: ${reason}`}
      className="shrink-0 cursor-help text-[11px] leading-none saturate-[0.85]"
    >
      🔥
    </span>
  )
}
