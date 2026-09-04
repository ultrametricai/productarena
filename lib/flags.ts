// Build-time feature flags. Static-export site, so these are compile-time constants — flipping
// one re-ships the whole affected UI, there is no runtime toggle.

// Watchlist (☆/★ stars, /watchlist page, header link). Hidden until login lands: today the list
// is localStorage-only, which reads as a half-feature next to the rest of the site. Flips on
// when Ultrametric login lands and the list can sync to an account. All watchlist code paths
// (WatchButton, WatchlistClient, lib/watchlist.ts) are kept intact behind this flag.
export const WATCHLIST_ENABLED = false
