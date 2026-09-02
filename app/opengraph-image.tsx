import { ImageResponse } from 'next/og'

// OG share card (WhatsApp/iMessage/Twitter/Slack all read og:image). Rendered at build time —
// static-export safe. Reuses the exact InitMark dog geometry at large scale.
export const alt = 'INIT — evidence-tested rankings of how AI-ready every product is'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#09090b',
          gap: 36,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
          <svg viewBox="0 0 32 32" width={180} height={180}>
            <rect width="32" height="32" rx="7" fill="#18181b" />
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
          <div style={{ display: 'flex', fontSize: 120, fontWeight: 800, color: '#fafafa' }}>
            INIT<span style={{ color: '#fbbf24' }}>.dog</span>
          </div>
        </div>
        <div style={{ display: 'flex', fontSize: 34, color: '#a1a1aa', textAlign: 'center' }}>
          Evidence-tested rankings of how AI-ready every product is
        </div>
        <div style={{ display: 'flex', fontSize: 26, color: '#71717a' }}>
          Evidence in, rankings out · init.dog
        </div>
      </div>
    ),
    size,
  )
}
