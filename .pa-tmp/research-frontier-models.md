# frontier-models — bring-up research notes (2026-09-22)

Founder ask: index **Jev — TypeSafe AI's "System One" frontier model** (the previous "Jev" ask
had resolved to Jeeves the fintech; THIS is the AI model). No arena existed for the model/API
layer — inference-providers, model-gateways, and local-llm-runtimes all judge hosting, not the
intelligence itself.

New arena: **Frontier Models** (`frontier-models`) — the model/API layer: the intelligence you
buy, judged on how agent-ready each vendor's PLATFORM is. Scoped to platform/docs surfaces —
the consumer chat apps (chatgpt, claude.ai) are judged in ai-assistants; this arena judges the
developer/model layer.

## Roster verification (all live 2026-09-22, keyless)

| product | platform surfaces | notes |
|---|---|---|
| jev | typesafe.ai 200 (Framer site); docs.typesafe.ai 200 (Mintlify: llms.txt 115 lines + .md mirror on every page); api.typesafe.ai live (keyless GET /v1/models → structured authentication_error) | jev.ai is Cloudflare-challenged (403) — typesafe.ai is the canonical domain. PyPI `typesafe-sdk` 0.7.1, npm `@typesafe-ai/sdk` 0.6.0, both MIT. GitHub org typesafe-ai: skills 1,774★, system-one-adapter-python 257★, typesafe-sdk-js 225★, typesafe-sdk-python 200★ |
| claude | docs.claude.com/llms.txt 200 → platform.claude.com .md mirrors (634 en pages) | anthropic.com 200 (pricing/claude/transparency) |
| gpt | developers.openai.com/llms.txt 200 + api/docs/*.md mirrors incl. pricing.md, models.md, deprecations.md | openai.com + platform.openai.com are curl-403 (WAF) — corpus scoped to developers.openai.com, same precedent as ai-coding/codex |
| gemini | ai.google.dev/gemini-api/docs/* all 200; NO llms.txt (404, recorded negative); generativelanguage.googleapis.com keyless → structured PERMISSION_DENIED | |
| llama | llama.com/docs 200; NO llms.txt (301→404, recorded negative); HF meta-llama org keyless API | llama.developer.meta.com 200 (Llama API) |
| deepseek | api-docs.deepseek.com 200 (Docusaurus); /llms.txt answers 200 but serves the HTML docs shell — recorded as the soft-404 it is; HF deepseek-ai org keyless | |
| mistral | docs.mistral.ai/llms.txt 200 (# MistralAI) — but its .md links 404 (stale index; live paths from sitemap.xml used instead); HF mistralai org | docs recently restructured (studio/inference/admin) |

## Jev ecosystem (the founder's emphasis — attributed carefully)

- **Official** (TypeSafe): docs corpus above; `POST /v1/systemone` evaluation endpoint +
  `GET /v1/models` discovery; three typed primitives (Choice/Score/Noul) returning typed
  answers + probabilities + confidence — structured output IS the product, no text generation;
  jev-1.13.0 at $0.042/Mtok input, output tokens free; 64k context (32k state+longest
  question); `jev-latest`/`jev-preview` aliases with documented pin-the-version guidance;
  model-jaggedness/jev-1.13 page documents 9 failure modes ("Jev isn't perfect") — a
  vendor-authored limitations page most of the roster lacks; agent-skill.md: official drop-in
  skill for Claude Code/Codex; console.typesafe.ai Playground; 16 cookbooks with measured
  numbers (12.2x cheaper batching, rerank top-1 5%→18%).
- **Community** (NOT TypeSafe products, attributed as ecosystem signal): yibie/awesome-jev
  1,253★ curated list (306 entries across 14 categories, explicit "curation is not
  endorsement" policy); HF replicas ZefanCai/Open-Jev-9B (30 likes) and Open-Jev-2B,
  AlexWortega/openjev (471 likes), kotobalabs open-jev-deberta-v3-large;
  0xNatoshi/jev-codex-router 216★; kerpopule/hermes-jev-skills 469★; HN: launch 1,959 pts/511
  comments (49717558), Kev clone wave 446 pts (49783999), "OpenAI well positioned to
  fast-follow" 136 pts (49802161), "I turned Jev into a (lousy) chatbot" 173 pts (49778162).

## HN seeds (all 22 ids fetched live via Algolia items API before seeding)

jev 49717558/49783999/49802161/49778162; claude 49038433 (Opus 5), 48311647 (4.8), 46037637
(4.5); gpt 48849066 (5.6), 47879092 (5.5), 48690101 (govt access gating — critical); gemini
49537553 (3.8 Flash), 45967211 (Gemini 3), 46991240 (Deep Think); llama 43595585 (Llama 4
herd), 43620452 (benchmark gaming — critical), 43835424 (LlamaCon); deepseek 47884971 (v4),
49639090 (v4.1 Flash), 42768072 (R1); mistral 46121889 (Mistral 3), 44236997 (Magistral),
37675496 (7B).

## Pipeline log

- taxonomy: manual 32 stories + 29 canon = 61 (assemble-manual-stories); 7 products = 427 cells.
- crawl: 204 pages saved, 0 WARN (every products.json URL live-verified first; 21 stale
  Mistral llms.txt .md paths pruned pre-crawl and replaced with sitemap-verified paths).
- extract ×2 (union-merge): jev 30, claude 47, gpt 22, gemini 20, llama 16, deepseek 14,
  mistral 29 evidence items before community/probe appends.
- collect-community: 10/14/12/9/20/20/19 items.
- probe (publish surfaces): 16 items incl. negatives (gemini/llama llms.txt 404s).
- probe-record: 23 PA_RECORD proofs, ALL PASSING (3 deliberate negatives: gemini + llama
  llms.txt absent, deepseek llms.txt soft-404 HTML shell). EXPECTED_TOTAL_PROBES 839 → 862.
- judge v3 sequential; na-harmonize; derive; intervals; popularity (registry-verified npm/pypi
  SDK downloads for jev/claude/gpt/gemini/mistral + GitHub for all; llama and deepseek carry
  no package entry — no official SDK on either registry, skipped honestly); logos.
- spikes: jev FIRST at --budget-urls 40 (founder emphasis): +40 urls, +11 evidence, 21 cells
  moved (11 kept / 10 reverted). Then sequentially at 20: claude +20 urls/+16 ev (8/6),
  gpt +20/+10 (8/10), gemini +0 urls (no llms.txt to discover from)/+13 ev (10/6),
  llama +0/+11 (15/13), deepseek +0/+3 (8/16), mistral +0/+9 (12/10). All SPIKE_OK,
  0 retries. One transient judge "no parseable JSON" abort during the base pass (cell 151),
  resumed from cache per the ≤3-retry policy.
- docs-evidence supplement (append-frontier-models-docs-evidence.py, the data-warehouses
  precedent): 40 verbatim items appended across the roster from crawled pages; the re-judge
  re-rolled all 427 cells (evidence-pack hash), so the wave churn policy was applied via
  revert-churn-frontier-models-supp-wave.ts (same rule as revert-churn-api-quality-wave.ts,
  prior state snapshot .pa-tmp/verdicts-pre-supp-wave.json): 96 flips KEPT (cite -supp-
  evidence), 87 pure re-rolls REVERTED, cache patched in place. Then na-harmonize (28 flips
  base wave + 7 post-supp), derive, intervals.

## Final leaderboard (aiEra order; PA / aiEra / agentReady / agenticApp / apiQ / evidence)

| # | product | PA | aiEra | agentReady | agenticApp | apiQ | evidence |
|---|---|---|---|---|---|---|---|
| 1 | claude | 43.3 | 40.8 | 69.3 | 60.4 | 22.9 | 88 |
| 2 | gpt | 36.1 | 31.3 | 52.9 | 33.8 | 29.7 | 53 |
| 3 | mistral | 34.4 | 30.2 | 41 | 54.4 | 8.6 | 63 |
| 4 | gemini | 27.1 | 22.6 | 31.9 | 28.9 | 20 | 48 |
| 5 | jev | 31 | 21.1 | 34.3 | 14.7 | 20 | 65 |
| 6 | deepseek | 19.4 | 17.3 | 27.1 | 14 | 17.1 | 41 |
| 7 | llama | 13 | 10.3 | 10.1 | 14 | 0 | 53 |

Jev's 16 full verdicts tell the founder's "what it can do" story: llms.txt agent docs (q9,
probe-backed), GET /v1/models discovery (q9), transparent token pricing $0.042/Mtok with free
output tokens (q9), auth-gated public API — POST /v1/systemone (q8, probe), official
Python+TS SDKs on both registries (q8, probes), official Claude Code/Codex agent skill (q8),
64k/32k context budgets documented precisely (q8), rate limits documented with honest
volatility warning (q8), the jev-1.13 jaggedness page — nine vendor-documented failure modes
(q8, known-limitations-honesty: the only vendor in the arena at full), natively typed
structured outputs — Choice/Score/Noul (q8), versioned IDs + alias-pinning policy (q8),
headless/API-first by design (q7), 16 measured cookbooks (q7), no-training-on-customer-data +
enterprise ZDR (q7), API parity (q7), Playground quickstart (q7). Honest lows kept: agenticApp
14.7 (Jev is deliberately NOT an agent/assistant — no NL commands, no automation engine),
weights-licensing 6 (weights closed; Open-Jev HF replicas are third-party and attributed as
such; no fine-tuning by design — "the same weights serve every account"), safety-usage-policy
16.8 (legal pages exist; no published safety evals), multimodal partial (text-only input,
honestly scoped). llama's 10.3 aiEra is measured, not editorial: its developer docs served an
SSO identity wall to keyless fetches (recorded honest negative), no llms.txt, no public API
platform — the weights live on HF but the PLATFORM surface is thin.
