import { verdictFor, type CategoryData } from '@/lib/data'

const STORY_ID = 'agentic-builtin-assistant'

// Derived badge (no new scoring) — surfaces the canonical `agentic-builtin-assistant` verdict
// (theme agenticness, group agentic-features, injected into every category) as a single glance-
// able signal: does this product have a built-in AI assistant you can delegate tasks to? Shown
// only when the verdict is full/partial; `none`/`na`/`disputed` render nothing so the badge
// never has to explain a negative.
export default function AiModeBadge({
  data,
  productId,
  href,
  className = '',
}: {
  data: CategoryData
  productId: string
  href: string
  className?: string
}) {
  if (!data.stories.some((s) => s.id === STORY_ID)) return null
  const v = verdictFor(data, productId, STORY_ID)
  if (v.verdict !== 'full' && v.verdict !== 'partial') return null
  return (
    <a
      href={href}
      title={`Has a built-in AI assistant you can delegate tasks to (${v.verdict}). ${v.rationale}`}
      className={`inline-flex w-fit items-center gap-1 rounded-full bg-violet-950 px-2 py-0.5 text-xs font-medium text-violet-300 ring-1 ring-violet-800 transition hover:ring-violet-600 ${className}`}
    >
      <span aria-hidden>✨</span> Built-in AI assistant
    </a>
  )
}
