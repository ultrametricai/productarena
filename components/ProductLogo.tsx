import Image from 'next/image'
import { hasLogo } from '@/lib/logos'
import type { Product } from '@/lib/schemas'

export default function ProductLogo({ product, size = 40 }: { product: Product; size?: number }) {
  if (hasLogo(product.id)) {
    return (
      <Image
        src={`/logos/${product.id}.png`}
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
      className="flex shrink-0 items-center justify-center rounded-lg bg-zinc-900 font-mono font-bold text-amber-300 ring-1 ring-zinc-800"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
    >
      {product.name.charAt(0).toUpperCase()}
    </div>
  )
}
