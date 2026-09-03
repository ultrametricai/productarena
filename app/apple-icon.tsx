import { ImageResponse } from 'next/og'

// apple-touch-icon (180×180) — the compact icon iMessage/WhatsApp/home-screens use. Same
// abstract arena mark as app/icon.svg (two contenders meeting at center), rendered mark-only
// so previews show the brand shape, not a platform default.
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
        <svg viewBox="0 0 32 32" width={148} height={148}>
          <path d="M6 7 L16 15.5 L6 24 Z" fill="#fbbf24" />
          <path d="M26 7 L16 15.5 L26 24 Z" fill="#d97706" />
        </svg>
      </div>
    ),
    size,
  )
}
