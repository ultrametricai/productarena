# Vendors — evidence, not an endorsement list

This repo's largest asset lives one directory over: `data/<arena>/` holds dated, reproducible,
evidence-graded evaluations of 570+ products across 90+ arenas — judged verdicts over a shared
story taxonomy citing vendor docs, GitHub, community sources, and hands-on probes with recorded
transcripts; rankings carry HMAC-fingerprinted `_provenance` and recompute deterministically
(`pipeline/scripts/recompute-check.ts`). Owner-affiliated products (Foreloop, AFK, Ultrametric)
are disclosed on every surface and get adversarial bias audits; favorable flips without new
evidence are reverted (`governance/REVIEW_POLICY.md`).

`reviews/` holds the interchange format for scenario-scoped vendor evaluations
(`schemas/vendor-review.schema.json`): who tested it, when, what they actually did, dated cost
basis, limitations, affiliations. A vendor's own claims can be recorded but are never test
results; an unreviewed record has no ranking. `_blank-example.json` is the template in use.

Rubric for a review: functional fit, local legal coverage (jurisdictions!), security and
privacy, API/export quality, implementation burden, support, accessibility, total cost, lock-in
and portability, failure recovery, references. Include an exit/export test. Disclose referral
payments, equity, employment, and partnerships — payment can never change scores or inclusion.
Stage 2 of the corpus lift adds a generator that emits records in this format from the judged
arena data, so external consumers get the evidence layer in the interchange shape.
