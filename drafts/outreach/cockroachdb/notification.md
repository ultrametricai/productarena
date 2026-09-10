---
vendor: Cockroach Labs
arena: serverless-databases
product_id: cockroachdb
venue: https://github.com/cockroachdb/cockroach/discussions
venue_note: GitHub Discussions confirmed enabled (HTTP 200) on 2026-09-10
suggested_title: "ProductArena carries 5 'disputed' verdicts on CockroachDB (licensing/backups/compat) — official response channel, if you want it"
status: draft — requires founder sign-off, NOT POSTED
---
<!--
DRAFT — NOT POSTED. For human review before sending.
Verbatim message below this comment.
-->

Hi — we maintain ProductArena, an open, evidence-based tracker of developer products. This is a courtesy notification that CockroachDB's page in our serverless-databases arena carries 5 verdicts in our `disputed` tier — mostly around licensing, free-tier feature gating, and Postgres compatibility — and a pointer to the official response channel if the team ever wants it. Several of the contradicting reports are dated and may describe your old licensing model, which is exactly the kind of thing a vendor response can put on the record. No action is expected; feel free to ignore or close this.

**What "disputed" means on our site.** Every (product, user-story) cell is judged by an LLM from a committed evidence pack (vendor docs, GitHub, community reports, hands-on probes). `disputed` is defined as: "Vendor claims it, but community/hands-on evidence contradicts — must cite both sides." It is not "doesn't work" — it means the record shows both a first-party claim and concrete contradicting reports, side by side. Disputed cells score at a 0.3 factor (vs 1.0 full / 0.6 partial). All evidence and rationales are public in the repo (`data/serverless-databases/verdicts.json`, `data/serverless-databases/evidence/cockroachdb.json`).

**The 5 disputed cells:** automated-backups, engine-compatibility, free-tier-depth, openness-full-export, openness-open-license.

**Representative examples.** Your docs describe full/incremental backups ("You can create full or incremental backups... Taking regular backups of your data is an operational best practice," docs.cockroachlabs.com backup-and-restore-overview, fetched 2026-09-06), while a community report in the pack says "the backup/restore feature... is currently locked behind their enterprise version" (https://hn.algolia.com/api/v1/items/20097077). On compatibility, your repo states "CockroachDB supports the PostgreSQL wire protocol, so you can use any available PostgreSQL client drivers," while a community report says "it's a non-starter for my use case since it lacks array columns, which Postgres supports" (https://hn.algolia.com/api/v1/items/14308189). On licensing: "I don't like the fact that even free users need an annual license key" (https://hn.algolia.com/api/v1/items/41256222). Our committed rationales spell out what's missing in each case — e.g. for openness-open-license: "explicit license text/OSI-approval evidence... and resolution of the license-key requirement contradiction." One report in the pack already refers to "the old licensing model," so if the current model has moved on from what these reports describe, current first-party clarification would carry real weight at the next re-judge. Full per-cell rationales: https://ultrametric.ai/productarena/arena/serverless-databases/product/cockroachdb

**How to respond officially, if you want to.** We run a CVE-style vendor-response lane: a short official statement (≤1200 chars), verified as actually coming from the vendor, published verbatim next to the specific verdict — even if it flatly disagrees with us. It never changes a verdict by itself; it enters the evidence pool for the next re-judge. Process: https://github.com/ultrametricai/productarena/blob/main/docs/VENDOR-RESPONSES.md — intake form: https://github.com/ultrametricai/productarena/issues/new?template=vendor-response.yml. Where a point is demonstrable with keyless deterministic commands (e.g. a free-tier `BACKUP`/`RESTORE` round-trip or an open-format export), a *Prove a story* submission is stronger than a statement: https://github.com/ultrametricai/productarena/blob/main/docs/PROVE-IT.md

No expectation attached — the verdicts stand on the public evidence either way, and silence carries no penalty. If this isn't useful, please just close this and sorry for the noise.
