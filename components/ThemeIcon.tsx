// Emoji shown next to a theme name (StoryMatrix, StoryMap, StoryVerdictsTable, compare rows,
// the product page's "By theme" cards) — one icon per concept, resolved by lib/icons.ts's
// keyword rules over the full live taxonomy, always with a tooltip naming the theme (IconChip).
// Same emoji family as the arena icons in data/arena-icons.json, so the whole site speaks one
// visual language.
import IconChip from '@/components/IconChip'
import { themeIcon, themeTooltip } from '@/lib/icons'

export default function ThemeIcon({ theme, className = '' }: { theme: string; className?: string }) {
  return <IconChip icon={themeIcon(theme)} title={themeTooltip(theme)} className={className} />
}
