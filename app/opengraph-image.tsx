import { ImageResponse } from 'next/og'

// OG share card (WhatsApp/iMessage/Twitter/Slack all read og:image). Rendered at build time —
// static-export safe. Wordmark-forward: "Product" (white) + "Arena" (amber), no mark/mascot.
export const alt = 'ProductArena — the unbiased, evidence-based arena for software in the AI era'
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
        <div style={{ display: 'flex', fontSize: 104, fontWeight: 800, color: '#fafafa' }}>
          Product<span style={{ color: '#fbbf24' }}>Arena</span>
        </div>
        <div style={{ display: 'flex', fontSize: 34, color: '#a1a1aa', textAlign: 'center' }}>
          The unbiased, evidence-based arena for software in the AI era
        </div>
        <div style={{ display: 'flex', fontSize: 26, color: '#71717a' }}>
          Evidence in, rankings out · ultrametric.ai/productarena
        </div>
      </div>
    ),
    size,
  )
}
