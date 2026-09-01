// The INIT mark: an original geometric golden-labrador head, side profile, facing right —
// redesigned (v2.5, "clearer at 16px" pass) to be bolder and fill ~75-80% of the 32×32 tile
// instead of ~50%, since the previous cut was too small/fussy to read as a dog at favicon size.
// Exactly three flat shapes, no gradients/strokes/cartoon details:
//   (a) one chunky amber (#fbbf24) silhouette combining rounded skull + blunt snout + thick
//       neck as a single path — the "stop" (the small concave notch around x=19,y=8) is the
//       only bit of internal contour, and it's what makes the snout read as a distinct
//       protrusion off the skull rather than one undifferentiated blob.
//   (b) one darker-amber (#d97706) drop ear, layered on top of the skull's rear (its bounding
//       box sits inside the silhouette's, which is what makes it read as depth/an ear rather
//       than a separate floating shape) — hangs down clearly past the neck line.
//   (c) one dark eye dot (r=2, up from r=1.15) sitting just behind the stop, on the forehead.
// Verified path geometry (bounding boxes, eye/ear containment, no self-intersecting gaps) with
// a scratch polygon rasterizer during design — see repo history / ui-feedback report for the
// ASCII renders used to sanity-check legibility at a simulated 16px grid before committing.
// Same shape as app/icon.svg (the favicon/app icon); this is the inline JSX version used next
// to the header wordmark.
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
        d="M5,29 Q3,20 5,12 Q5,6 10,4 Q16,3.5 19,8 Q18,10 22,10.5 Q26,10.2 28,13.5 Q29,16 27,18.5 Q24,20.5 19,20 Q15,19.5 13,23 Q11.5,26 14,28.5 Q15,29.5 9,29.3 Q6,29.5 5,29 Z"
        fill="#fbbf24"
      />
      <path
        d="M10.5,5.5 Q6.5,7 6,13 Q5.5,18 8.5,21 Q10.5,18 10.5,12 Q11,8.5 10.5,5.5 Z"
        fill="#d97706"
      />
      <circle cx="17" cy="10" r="2" fill="#09090b" />
    </svg>
  )
}
