import { isPopulated, loadCategory } from '../data'
import { hasLogo } from '../logos'
import { loadVendorRegistry, vendorLabel, vendorProductId } from '../processes'
import type { Reference } from './schema'

export function isServiceCandidate(ref: Reference) {
  return (ref.kind === 'vendor' && ref.role === 'candidate') ||
    (ref.kind === 'product' && ref.role === 'additional-candidate')
}

export interface ServiceCandidate {
  id: string
  name: string
  logoId: string | null
  href: string | null
}

// Enrich only the candidates actually named by the shared record. No rankings,
// inferred alternatives, or graph semantics enter this presentation lookup.
export function resolveServiceCandidates(references: Reference[]): ServiceCandidate[] {
  const registry = loadVendorRegistry()
  const candidates: ServiceCandidate[] = []
  const seen = new Set<string>()
  for (const ref of references) {
    if (!isServiceCandidate(ref) || ref.kind === 'url') continue
    const entry = ref.kind === 'vendor' ? registry[ref.id] : undefined
    const productRef = ref.kind === 'product' ? ref.id.split('/') : undefined
    const arenaId = entry?.arenaId ?? (productRef?.length === 2 ? productRef[0] : undefined)
    const productId = ref.kind === 'vendor' ? vendorProductId(ref.id) : productRef?.[1]
    const product = arenaId && /^[a-zA-Z0-9_-]+$/.test(arenaId) && productId && isPopulated(arenaId)
      ? loadCategory(arenaId).products.find(item => item.id === productId)
      : undefined
    const name = product?.name ?? (ref.kind === 'vendor' ? vendorLabel(ref.id) : ref.id)
    const id = product ? `${arenaId}/${product.id}` : `${ref.kind}/${ref.id}`
    if (seen.has(id)) continue
    seen.add(id)
    const href = product ? `/arena/${arenaId}/product/${product.id}` : null
    candidates.push({
      id,
      name,
      logoId: productId && /^[a-zA-Z0-9_-]+$/.test(productId) && hasLogo(productId) ? productId : null,
      href,
    })
  }
  return candidates
}
