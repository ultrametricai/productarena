---
vendor: Logseq
arena: notes-knowledge
product_id: logseq
venue: https://github.com/logseq/logseq/discussions
venue_note: GitHub Discussions confirmed enabled (HTTP 200) on 2026-09-10
suggested_title: "ProductArena carries 7 'disputed' verdicts on Logseq — official response channel, if you want it"
status: draft — requires founder sign-off, NOT POSTED
---
<!--
DRAFT — NOT POSTED. For human review before sending.
Verbatim message below this comment.
-->

Hi — we maintain ProductArena, an open, evidence-based tracker of developer products. This is a courtesy notification that Logseq's page in our notes-knowledge arena currently carries 7 verdicts in our `disputed` tier — several tied to the DB-version transition — and a pointer to the official response channel if the team ever wants it. No action is expected; feel free to ignore or close this.

**What "disputed" means on our site.** Every (product, user-story) cell is judged by an LLM from a committed evidence pack (vendor docs, GitHub, community reports, hands-on probes). `disputed` is defined as: "Vendor claims it, but community/hands-on evidence contradicts — must cite both sides." It is not "doesn't work" — it means the record shows both a first-party claim and concrete contradicting reports, side by side. Disputed cells score at a 0.3 factor (vs 1.0 full / 0.6 partial), which currently matters: Logseq sits at 21.5 in the arena, 0.3 points ahead of the next product. All evidence and rationales are public in the repo (`data/notes-knowledge/verdicts.json`, `data/notes-knowledge/evidence/logseq.json`).

**The 7 disputed cells:** agent-reads-writes-notes, e2ee-sync-devices, full-export-portability, full-text-search-filters, open-format-longevity, openness-api-parity, rich-markdown-editing.

**Representative examples.** On agent access, your docs describe the "local HTTP server to access logseq's graph" (Local Http server page, fetched 2026-09-05), but a community report contradicts it working in the current version: "Not being able to use Claude or codex anymore to write or update pages is a real deal breaker for me" (https://hn.algolia.com/api/v1/items/48896229). On portability, your Export docs claim export "in various formats, including text, HTML, OPML, PNG, EDN, JSON, and standard Markdown," while community reports say "The MarkDown files it generates aren't compatible with other similar programs (Obsidian for instance)" (https://news.ycombinator.com/item?id=33218561) and, on the DB version, "so I can no longer keep all my data as markdown files?" (https://hn.algolia.com/api/v1/items/48896229). Our committed rationale flags exactly what would resolve these: "confirmation the HTTP API still supports write access post-DB-migration, an official MCP server" and "clarity on whether DB-version graphs can still export to plain markdown." Full per-cell rationales: https://ultrametric.ai/productarena/arena/notes-knowledge/product/logseq

**How to respond officially, if you want to.** We run a CVE-style vendor-response lane: a short official statement (≤1200 chars), verified as actually coming from the vendor, published verbatim next to the specific verdict — even if it flatly disagrees with us. It never changes a verdict by itself; it enters the evidence pool for the next re-judge. Process: https://github.com/ultrametricai/productarena/blob/main/docs/VENDOR-RESPONSES.md — intake form: https://github.com/ultrametricai/productarena/issues/new?template=vendor-response.yml. If a point is demonstrable with keyless deterministic commands (e.g. HTTP-API write on a DB-version graph, or a lossless markdown export), a *Prove a story* submission is stronger than a statement: https://github.com/ultrametricai/productarena/blob/main/docs/PROVE-IT.md

No expectation attached — the verdicts stand on the public evidence either way, and silence carries no penalty. If this isn't useful, please just close this and sorry for the noise.
