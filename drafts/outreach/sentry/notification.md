---
vendor: Sentry (Functional Software, Inc.)
arena: observability
product_id: sentry
venue: https://github.com/getsentry/sentry/discussions
venue_note: GitHub Discussions confirmed enabled (HTTP 200) on 2026-09-10
suggested_title: "ProductArena carries 4 'disputed' verdicts on Sentry (self-hosting/licensing) — official response channel, if you want it"
status: draft — requires founder sign-off, NOT POSTED
---
<!--
DRAFT — NOT POSTED. For human review before sending.
Verbatim message below this comment.
-->

Hi — we maintain ProductArena, an open, evidence-based tracker of developer products. This is a courtesy notification that Sentry's page in our observability arena carries 4 verdicts in our `disputed` tier — all around self-hosting and licensing — and a pointer to the official response channel if the team ever wants it. No action is expected; feel free to ignore or close this.

**What "disputed" means on our site.** Every (product, user-story) cell is judged by an LLM from a committed evidence pack (vendor docs, GitHub, community reports, hands-on probes). `disputed` is defined as: "Vendor claims it, but community/hands-on evidence contradicts — must cite both sides." It is not "doesn't work" — it means the record shows both a first-party claim and concrete contradicting reports, side by side. Disputed cells score at a 0.3 factor (vs 1.0 full / 0.6 partial), which currently matters: Sentry sits at 32.8 in the arena, 0.1 points ahead of the next product. All evidence and rationales are public in the repo (`data/observability/verdicts.json`, `data/observability/evidence/sentry.json`).

**The 4 disputed cells:** local-dev-instance, openness-open-license, openness-self-host, production-self-host.

**Representative examples.** Your self-hosted docs claim "How you can run all of Sentry on your own server, without paying anything" (develop.sentry.dev/self-hosted/, fetched 2026-09-05). The contradicting side in our evidence pack includes your own founder's public comment — "its 100% a valid complaint that the entire thing is awful today to self-host, and most people dont need a lot of the functionality we ship" — and an operator report: "Each release would unleash more containers and consume more memory until we couldn't run anything on the 32gb server except Sentry" (both at https://hn.algolia.com/api/v1/items/43725815). On openness-open-license, the pack contains a community comment citing the licensing change as a reason to leave ("I refuse to rely on closed-source software," https://news.ycombinator.com/item?id=21466967), and our committed rationale states what's missing: "a clear, current OSI-approved license statement in the evidence pack and resolution of the licensing controversy" — a short official statement on the current license would put that on the record. Full per-cell rationales: https://ultrametric.ai/productarena/arena/observability/product/sentry

**How to respond officially, if you want to.** We run a CVE-style vendor-response lane (deliberately modeled on the vendor-statement convention CVE databases use): a short official statement (≤1200 chars), verified as actually coming from the vendor, published verbatim next to the specific verdict — even if it flatly disagrees with us. It never changes a verdict by itself; it enters the evidence pool for the next re-judge. Process: https://github.com/ultrametricai/productarena/blob/main/docs/VENDOR-RESPONSES.md — intake form: https://github.com/ultrametricai/productarena/issues/new?template=vendor-response.yml. If a point is demonstrable with keyless deterministic commands (e.g. a lightweight dev-instance quickstart), a *Prove a story* submission is stronger than a statement: https://github.com/ultrametricai/productarena/blob/main/docs/PROVE-IT.md

No expectation attached — the verdicts stand on the public evidence either way, and silence carries no penalty. If this isn't useful, please just close this and sorry for the noise.
