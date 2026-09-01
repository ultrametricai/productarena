// The AIness mark: a dark tile with an amber chevron ("A" legs) and a solid crossbar block
// standing in for the letterform's crossbar — a terminal cursor, arena-meets-terminal. Same
// shape as app/icon.svg (the favicon/app icon); this is the inline JSX version used next to the
// header wordmark. Deliberately no text baked into the mark itself.
export default function AinessMark({ size = 20 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      aria-hidden
      className="shrink-0"
    >
      <rect width="32" height="32" rx="7" fill="#09090b" />
      <path
        d="M8.5 24.5 L16 7.5 L23.5 24.5"
        fill="none"
        stroke="#fbbf24"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="11.4" y="15.3" width="9.2" height="3.6" rx="0.8" fill="#fbbf24" />
    </svg>
  )
}
