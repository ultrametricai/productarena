// The one way a functional icon renders on the site: glyph + a REQUIRED `title` tooltip naming
// the concept (founder rule — an unexplained icon is noise). Pure and client-safe; get the
// icon/tooltip pair from lib/icons.ts (themeIcon/themeTooltip, metricIcon/metricTooltip) or
// lib/processIcons.ts (processIcon/phaseIcon/chainIcon) so the same concept always shows the
// same icon everywhere.
//
// Two icon vocabularies flow through here (founder ask 2026-09-30): house icon TOKENS from
// lib/processIcons.ts (`pi:<glyph>:<hue>`) render as hand-authored duotone SVG via
// components/icons/ProcessIcon.tsx; every other non-empty string (arena emoji, theme emoji)
// keeps rendering as text. That makes this file the single choke point: every consumer —
// tables, DAG, search, sim — upgraded to the custom set the moment the maps switched tokens,
// with zero layout edits.
import ProcessIcon from '@/components/icons/ProcessIcon'
import { parseProcessIconToken } from '@/lib/processIcons'

// The bare glyph, no tooltip wrapper — ONLY for render sites whose parent element already
// carries the concept-naming title/aria-label (DAG node buttons, linked table rows). Everything
// else goes through IconChip below, which enforces the title.
export function IconGlyph({ icon, className }: { icon: string; className?: string }) {
  const token = parseProcessIconToken(icon)
  if (token) return <ProcessIcon id={token.glyph} hue={token.hue} className={className} />
  return <>{icon}</>
}

export default function IconChip({
  icon,
  title,
  className = '',
}: {
  icon: string
  /** Tooltip naming the concept, e.g. "Privacy posture — data-handling and privacy stories". */
  title: string
  className?: string
}) {
  if (icon === '') return null
  return (
    <span title={title} className={`inline-flex shrink-0 items-center ${className}`}>
      <span aria-hidden>
        <IconGlyph icon={icon} />
      </span>
      <span className="sr-only">{title}</span>
    </span>
  )
}
