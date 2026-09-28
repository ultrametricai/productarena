# Jurisdictions — registry and overlays

`registry.json` lists the jurisdictions the workflow layer knows about, each with an explicit,
narrow scope statement. Jurisdiction is multidimensional — entity formation (US-DE), federal
tax (US-FED), work site, hiring jurisdiction, customer market, individual tax residency — and
the matcher (`lib/founderOps.ts` `planFounderOps`) uses exact dimensions only: an unknown
combination is `unsupported`, never inherited from a neighboring jurisdiction.

Site-side overlays that already exist and will consolidate here in stage 2: the process pages'
CA/multi-state conditional steps (`lib/jurisdictions.ts`, `?juris=` toggle) and the geo-scope
work marking which operational processes are US-centric vs global, with vendor region
availability (India / UK / EU) recorded as dated evidence.
