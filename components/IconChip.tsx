// The one way a functional emoji icon renders on the site: icon + a REQUIRED `title` tooltip
// naming the concept (founder rule — an unexplained icon is noise). Pure and client-safe; get
// the icon/tooltip pair from lib/icons.ts (themeIcon/themeTooltip, metricIcon/metricTooltip) so
// the same concept always shows the same emoji everywhere.
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
      <span aria-hidden>{icon}</span>
      <span className="sr-only">{title}</span>
    </span>
  )
}
