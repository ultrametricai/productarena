// The INIT Score's lead badge — deliberately more prominent than AgenticBadge (bigger type,
// solid amber ring) since v2.4 re-prioritizes the whole site around this number. Internally
// still keyed on the `aiEra` field/formula (see README's "INIT Score (formerly AI-Era Index)"
// section for the blend formula and weights) — only the display label changed.
//
// The pill itself renders a bare number (`32/100`, mono/bold) with no "INIT" prefix — the
// surrounding heading/column-header/label is responsible for saying "INIT Score" once so a
// bare number is never ambiguous in context (see callers). The tooltip still carries the full
// formula + component breakdown regardless.

export interface AiEraComponents {
  agentReady: number | null
  apiQuality: number | null
  openness: number | null
  agenticApp: number | null
  automation: number | null
}

const FORMULA =
  'INIT Score (0–100): agent-ready ×0.30 · API quality ×0.20 · openness ×0.20 · agentic app ×0.15 · automation ×0.15 (n/a components excluded, weights renormalized). Every component is evidence-judged — see /methodology.'

function tooltip(components?: AiEraComponents): string {
  if (!components) return FORMULA
  const fmt = (n: number | null) => (n === null ? 'n/a' : n.toFixed(0))
  return (
    `Agent-ready ${fmt(components.agentReady)} · API quality ${fmt(components.apiQuality)} · ` +
    `Openness ${fmt(components.openness)} · Agentic app ${fmt(components.agenticApp)} · ` +
    `Automation ${fmt(components.automation)}\n${FORMULA}`
  )
}

export default function AiEraBadge({
  value,
  size = 'md',
  components,
}: {
  value: number | null
  size?: 'md' | 'sm'
  components?: AiEraComponents
}) {
  const sizeClass = size === 'md' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs'
  if (value === null) {
    return (
      <span
        title={tooltip(components)}
        className={`inline-flex w-fit items-center rounded-full bg-zinc-900 font-mono font-semibold italic text-zinc-400 ring-1 ring-zinc-800 ${sizeClass}`}
      >
        n/a
      </span>
    )
  }
  return (
    <span
      title={tooltip(components)}
      className={`inline-flex w-fit cursor-help items-center rounded-full bg-amber-400 font-mono font-bold text-zinc-950 ring-1 ring-amber-300 tabular-nums ${sizeClass}`}
    >
      {value.toFixed(0)}
      <span className="font-medium opacity-60">/100</span>
    </span>
  )
}
