import ProductLogoView from '@/components/ProductLogoView'
import { hasLogo } from '@/lib/logos'
import type { Product } from '@/lib/schemas'

// Server-only convenience wrapper: resolves hasLogo() via lib/logos.ts's fs check, then
// delegates to the pure ProductLogoView for rendering. Use this from server components; client
// components must precompute the hasLogo booleans server-side and use ProductLogoView directly
// (see components/ArenaTable.tsx / components/StoryMatrix.tsx for why).
export default function ProductLogo({ product, size = 40 }: { product: Product; size?: number }) {
  return <ProductLogoView product={product} size={size} hasLogo={hasLogo(product.id)} />
}
