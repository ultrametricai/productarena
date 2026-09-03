import Image from 'next/image'
import { hasScreenshots, type ScreenshotKind } from '@/lib/screenshots'
import type { Product } from '@/lib/schemas'
import { withBase } from '@/lib/site'

const KIND_LABEL: Record<ScreenshotKind, string> = { home: 'homepage', docs: 'docs' }

// Screenshot files are written by the pipeline at OUTPUT_WIDTH=1200 from a 1440×900 capture
// (pipeline/stages/screenshots.ts), so the intrinsic aspect ratio is fixed at 1200×750.
const SHOT_WIDTH = 1200
const SHOT_HEIGHT = 750

function formatCaptured(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

/**
 * Server-only showcase gallery: renders up to two committed screenshots (homepage, docs) for a
 * product, or nothing at all when the screenshots stage hasn't captured any (blocked vendors
 * never get an empty frame). Availability is resolved at build time via lib/screenshots.ts's
 * fs check — same pattern as ProductLogo/lib/logos.ts.
 */
export default function ProductShowcase({ product }: { product: Product }) {
  const shots = hasScreenshots(product.id).slice(0, 2)
  if (shots.length === 0) return null

  return (
    <div>
      <h2 className="font-display leading-[1.1] mb-3 text-lg font-semibold">Showcase</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {shots.map((shot) => {
          const liveUrl = shot.kind === 'docs' && product.urls.docs ? product.urls.docs : product.urls.site
          return (
            <figure key={shot.kind} className="min-w-0">
              <a href={liveUrl} target="_blank" rel="noopener noreferrer" className="group block">
                <Image
                  src={withBase(shot.path)}
                  alt={`${product.name} ${KIND_LABEL[shot.kind]} screenshot`}
                  width={SHOT_WIDTH}
                  height={SHOT_HEIGHT}
                  unoptimized
                  loading="lazy"
                  className="h-auto w-full rounded-xl border border-zinc-800 bg-zinc-900 transition group-hover:border-emerald-400/60"
                />
              </a>
              <figcaption className="mt-1.5 text-xs text-zinc-500">
                {KIND_LABEL[shot.kind]} · captured {formatCaptured(shot.capturedAt)} ·{' '}
                <a
                  href={liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400/80 transition hover:text-emerald-300"
                >
                  view live ↗
                </a>
              </figcaption>
            </figure>
          )
        })}
      </div>
    </div>
  )
}
