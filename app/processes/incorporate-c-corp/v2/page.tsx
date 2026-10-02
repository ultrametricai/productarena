import type { Metadata } from 'next'
import SharedProcessPreview from '@/components/shared-processes/SharedProcessPreview'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Incorporate C-Corp — Preview — Ultrametric',
  robots: { index: false, follow: false },
}

// Preserve the approved live URL; all process content uses the generic shared reader.
export default function IncorporationPreview() {
  return <SharedProcessPreview id="form_001" />
}
