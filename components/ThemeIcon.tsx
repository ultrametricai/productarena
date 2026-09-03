// Small inline glyph shown next to a theme heading (StoryMatrix, product page theme groups).
// Deliberately not emoji — tiny monochrome inline SVGs (currentColor) so they inherit whatever
// text color the caller applies (emerald-400 on headings, zinc-500 elsewhere) and stay crisp at
// any zoom level. Bucketed by keyword substring match over the ~60 theme ids in data/ rather
// than an exhaustive 1:1 map — new themes fall back to the generic `Dot` glyph automatically.

type IconProps = { className?: string }

function Shield({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width="1em" height="1em" className={className} fill="none" aria-hidden>
      <path
        d="M8 1.5 13 3.4v4.1c0 3.4-2.2 5.9-5 7-2.8-1.1-5-3.6-5-7V3.4L8 1.5Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Bolt({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width="1em" height="1em" className={className} aria-hidden>
      <path d="M8.6 1 3 9.2h3.4L6.2 15 13 6.3H9.4L8.6 1Z" fill="currentColor" />
    </svg>
  )
}

function DownloadArrow({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width="1em" height="1em" className={className} fill="none" aria-hidden>
      <path d="M8 2v7.5M8 9.5 5 6.5M8 9.5l3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 12.5h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function Brackets({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width="1em" height="1em" className={className} fill="none" aria-hidden>
      <path d="M6 2.5 2.5 8 6 13.5M10 2.5 13.5 8 10 13.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Dot({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width="1em" height="1em" className={className} fill="none" aria-hidden>
      <circle cx="8" cy="8" r="3.4" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  )
}

const RULES: Array<{ test: RegExp; Icon: (p: IconProps) => React.JSX.Element }> = [
  { test: /security|privacy|safety|governance|anti-bot/, Icon: Shield },
  { test: /agentic|automation|autonomy|running-agents/, Icon: Bolt },
  { test: /install|setup|deploy|onboarding|offline/, Icon: DownloadArrow },
  { test: /api|integration|ecosystem|serving/, Icon: Brackets },
]

export default function ThemeIcon({ theme, className = 'text-zinc-500' }: { theme: string; className?: string }) {
  const Icon = RULES.find((r) => r.test.test(theme))?.Icon ?? Dot
  return <Icon className={className} />
}
