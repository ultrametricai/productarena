# Sources — primary authorities

`registry.json` holds every primary source the rule cards cite: publisher, exact provision
locator, `issued_on` where known, `checked_on` (the date a human last verified it), and an
HTTPS link. A legal rule card may only cite `primary-*` sources; provider blogs can explain
practice but cannot establish law (`kind: secondary-practice`).

This is the legal-layer sibling of the evidence provenance the vendor layer already runs on:
every judged verdict in `data/<arena>/` cites evidence IDs, recorded probes and proofs carry
transcripts, and `_provenance` blocks in the committed rankings are HMAC-fingerprinted and
recomputable (`pipeline/scripts/recompute-check.ts`). Same doctrine, two record shapes: nothing
is asserted without a dated, checkable source.
