// The INIT mark: an original geometric golden-labrador head, side profile, facing right — drop
// ear (amber-600, layered over the head so it reads as depth rather than an outline), a gentle
// rounded snout (not a beak or a point — kept short and thick on purpose), and a single punched
// eye dot. Exactly three flat shapes, no gradients/strokes/cartoon details (no pupils-with-
// highlights, no tongue) so it stays legible down to a 16px favicon. Same shape as app/icon.svg
// (the favicon/app icon); this is the inline JSX version used next to the header wordmark.
export default function InitMark({ size = 20 }: { size?: number }) {
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
        d="M9,11 Q8,7 13,6.5 Q16.5,6.2 19,8.5 Q21.5,10 23,12.5 Q23.8,14.2 22,15 L20,15.5 Q18.5,16.3 17.5,15.7 Q15,16.6 13.5,19 Q12.5,21.3 9.3,21 Q7,20.5 7,17 Q7,13 9,11 Z"
        fill="#fbbf24"
      />
      <path
        d="M11,10 Q8,10.5 7.5,15 Q7.3,18 9,19.5 Q10.5,17.5 11,14 Q11.3,12 11,10 Z"
        fill="#d97706"
      />
      <circle cx="18.2" cy="9.6" r="1.15" fill="#09090b" />
    </svg>
  )
}
