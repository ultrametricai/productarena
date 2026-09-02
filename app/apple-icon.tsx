import { ImageResponse } from 'next/og'

// apple-touch-icon (180×180) — the compact icon iMessage/WhatsApp/home-screens use. Same
// golden-lab geometry as app/icon.svg, rendered dog-only so previews show the mascot, not a
// platform default.
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#09090b',
          borderRadius: 36,
        }}
      >
        <svg viewBox="0 0 32 32" width={164} height={164}>
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
      </div>
    ),
    size,
  )
}
