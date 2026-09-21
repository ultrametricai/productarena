// Shutdown gating — founder rule (2026-09-15 Pulley precedent; 2026-09-21: "if pulley doesnt
// exist anymore and shutting down, have a tag for 'shutdown' and dont offer it"): a product
// whose verified `shutdown` note is set (lib/schemas.ts ProductSchema) keeps its row, verdicts
// and score history everywhere — the record is preserved until the shutdown date passes — but
// from the moment it is marked it is never OFFERED: never a stack pick or runner-up, never a
// gap-closer or step-vendor option, never an upgrade candidate, suggested rival, or "best"
// slot. List/rank surfaces keep the row and tag it (components/ShutdownBadge.tsx);
// pick/recommend surfaces skip it and promote the next product.
//
// Deliberately client-safe (no node builtins): imported by lib/ engines and components alike.

export function isShutdown(p: { shutdown?: string }): boolean {
  return typeof p.shutdown === 'string' && p.shutdown.length > 0
}

// Tooltip copy for the compact shutdown tag on rows outside the product's own page: the dated
// vendor note itself when present (it names the date and the verification), else a generic
// honest line for lean serialized rows that only carry the boolean-ish flag.
export function SHUTDOWN_TAG_TITLE(p: { shutdown?: string }): string {
  return p.shutdown ?? 'The vendor has announced this product is shutting down — not offered as a pick.'
}
