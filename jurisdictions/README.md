# Jurisdictions — registry and overlays

`registry.json` lists the jurisdictions the workflow layer knows about, each with an explicit,
narrow scope statement. Jurisdiction is multidimensional — entity formation (US-DE), federal
tax (US-FED), work site, hiring jurisdiction, customer market, individual tax residency — and
the matcher (`lib/founderOps.ts` `planFounderOps`) uses exact dimensions only: an unknown
combination is `unsupported`, never inherited from a neighboring jurisdiction.

Stage 2 of the corpus lift (2026-09-28) consolidated the vendor region-availability evidence
here: `vendor-geo.json` (moved from `data/vendor-geo.json`, byte-identical) holds one dated,
source-cited row per (product, country) for the top vendors of the geo-sensitive arenas —
loader `lib/vendorGeo.ts`, crawl method in `pipeline/scripts/build-vendor-geo.py`, rendered as
the "Where it works" line on product pages. Evidence only, deliberately not a score.

Site-side overlays that still live beside the site code: the process pages' CA/multi-state
conditional steps (`lib/jurisdictions.ts`, `?juris=` toggle) and the geo-scope work marking
which operational processes are US-centric vs global (`geoScope` in `processes/corpus.json`).
