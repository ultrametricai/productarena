// Tiny muted chip naming the persona a user story is told from — the "As a {persona}," frame
// that lib/storyText.ts's parseStoryPersona splits off the title so lists lead with the action
// instead of repeating the frame on every row. Same visual family as StoryVerdictsTable's
// [G]/[C]/[P] ScopeChip: bordered, zinc-toned, font-mono, deliberately quieter than the action
// text. Server-safe (no hooks, no client APIs); a null persona renders nothing so callers can
// pass parseStoryPersona(...).persona straight through.
export default function PersonaChip({ persona, className = '' }: { persona: string | null; className?: string }) {
  if (!persona) return null
  return (
    <span
      title="Told from this persona's perspective"
      className={`inline-flex max-w-full shrink-0 items-center rounded border border-zinc-800 bg-zinc-900/60 px-1.5 py-0.5 align-middle font-mono text-[10px] leading-4 text-zinc-500 ${className}`}
    >
      <span className="truncate">{persona}</span>
    </span>
  )
}
