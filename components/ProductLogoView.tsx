import Image from 'next/image'
import type { Product } from '@/lib/schemas'
import { withBase } from '@/lib/site'

// Pure rendering half of ProductLogo, split out so it can be safely imported from CLIENT
// components (ArenaTable, StoryMatrix) without dragging lib/logos.ts's `node:fs` import into
// the browser bundle — Turbopack hard-errors ("chunking context does not support external
// modules") if a client-reachable module statically imports a Node builtin, even if unused at
// runtime. Server call sites keep using ProductLogo (which resolves `hasLogo` itself via
// lib/logos.ts); client call sites resolve `hasLogo` server-side ahead of time and pass it in
// as a plain boolean prop instead.
export default function ProductLogoView({
  product,
  size = 40,
  hasLogo,
}: {
  product: Pick<Product, 'id' | 'name'>
  size?: number
  hasLogo: boolean
}) {
  if (hasLogo) {
    return (
      <Image
        src={withBase(`/logos/${product.id}.png`)}
        alt={`${product.name} logo`}
        width={size}
        height={size}
        unoptimized
        className="shrink-0 rounded-lg bg-zinc-900 object-contain ring-1 ring-zinc-800"
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <div
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-lg bg-zinc-900 font-mono font-bold text-emerald-300 ring-1 ring-zinc-800"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
    >
      {product.name.charAt(0).toUpperCase()}
    </div>
  )
}
