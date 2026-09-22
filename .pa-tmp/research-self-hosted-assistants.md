# self-hosted-assistants — bring-up research notes (2026-09-21)

Founder ask: "add in openclaw type arena and what it can do."

New arena: **Self-Hosted AI Assistants** — open-source, self-hosted personal AI assistant
RUNTIMES. Distinct from ai-assistants (hosted consumer: chatgpt/claude/muse), agent-frameworks
(developer libraries), and local-llm-runtimes (model servers: ollama/vllm). These are shipped,
installable assistant products where self-hosting is the point.

## Roster verification (all live 2026-09-21, keyless)

| product | site | stars | license | registries / channels |
|---|---|---|---|---|
| openclaw | openclaw.ai 200 | 390,222 (openclaw/openclaw) | NOASSERTION (custom file) | npm `openclaw` 2026.9.5, **2.72M weekly downloads**; installer openclaw.ai/install.sh 200 |
| open-webui | openwebui.com 200 | 152,740 | NOASSERTION (Open WebUI License, BSD-3-based + branding clause — HN 43901575) | PyPI `open-webui` 0.11.4, 347k weekly |
| librechat | librechat.ai 200 | 44,581 | MIT | docker/helm/npm; **acquired by ClickHouse** (HN 45877770) |
| anythingllm | anythingllm.com 200 | 66,309 | MIT | Docker Hub mintplexlabs/anythingllm 4.4M pulls; **YC S22** (domain-verified in YC directory) |
| khoj | khoj.dev 200 | 37,460 | AGPL-3.0 | PyPI `khoj` 1.42.10; **YC S23** (domain-verified); repo push 51 days stale |
| lobe-chat | lobehub.com 200 | 82,733 (repo redirects lobehub/lobe-chat → lobehub/lobehub) | NOASSERTION | Docker Hub lobehub/lobe-chat 6.1M pulls |

Considered and NOT rostered: openhands (already rostered in software-factory — coding
agent, not a personal assistant runtime); jan/localai/lm-studio (already local-llm-runtimes —
model servers, not assistant runtimes).

LobeChat honesty note: the GitHub repo now redirects to lobehub/lobehub ("Chief Agent
Operator" positioning, cloud-first), but the OSS product remains self-hostable
(docs/self-hosting/* live, Docker Hub image maintained) — rostered as the OSS LobeChat with
vendor LobeHub.

## Agent-era docs surfaces (probed keylessly, recorded in data/self-hosted-assistants/proofs/)

- openclaw: llms.txt on BOTH openclaw.ai and docs.openclaw.ai (1,355 lines, ~840 unique doc
  pages); every docs page mirrors to clean Markdown at `.md` — crawl used the .md mirrors.
- open-webui: docs.openwebui.com/llms.txt 200 (+ llms-full).
- librechat: librechat.ai/llms.txt 200 + .md page mirrors.
- lobe-chat: lobehub.com/llms.txt 200 with an explicit "When to use this site (AI agents)"
  section, `/.well-known/mcp` WebMCP discovery (recorded), `/api/agent-readiness` bootstrap.
- HONEST NEGATIVES (recorded): docs.anythingllm.com/llms.txt 404, docs.khoj.dev/llms.txt 404.

## OpenClaw depth (the founder's "what it can do")

Verified from its own docs (all .md mirrors fetched into the corpus):
- Messaging: WhatsApp/Telegram/Discord/iMessage/Signal/Slack/Teams/Matrix/Zalo/IRC channels +
  A2A 1.0 JSON-RPC for external agents; sender allowlists, DM policies, mention gating.
- Computer use: `nodes/computer-use` — "Capability-based control of Gateway and paired node
  desktops through the computer tool"; paired phone/desktop nodes (camera, screenshots, voice
  wake); browser control (`tools/browser`), exec with approvals (`tools/exec`,
  exec-approvals).
- Skills: ClawHub registry with keyless public HTTP API — recorded probes:
  GET /api/v1/search (steipete/weather, 170,039 downloads) and
  GET /api/v1/skills/weather?owner=steipete. VoltAgent/awesome-openclaw-skills: 52,708 stars,
  "5,400+ skills filtered and categorized from the official OpenClaw Skills Registry".
- APIs: gateway OpenAI-compatible HTTP API + OpenResponses API + tools-invoke HTTP API;
  `openclaw mcp` CLI (MCP client + serve); Prometheus/OTel observability.
- Security posture is a real, documented axis: gateway/security, sandboxing (Docker/VM),
  secrets store, permission modes, multi-tenant hosting; docs.openclaw.ai/security/ section
  incl. formal-verification and incident-response pages. Community counterweight seeded
  honestly: HN 47479962 "OpenClaw is a security nightmare dressed up as a daydream" (397
  pts) + privilege-escalation vuln thread 47628608.
- Automation: cron jobs, inbound webhooks, Gmail PubSub triggers, hooks, standing orders
  (permanent operating authority for autonomous programs), Task Flow.
- Memory: markdown-file memory + active-memory subsystem (search, provenance, compaction).
- Models: 60+ provider pages (Anthropic/OpenAI/Google/Bedrock/Ollama/vLLM/LM Studio…),
  model failover, local-model services.

## HN seeds (all ids returned live by Algolia search API)

openclaw 46820783 (rename saga, 667), 46893970 ("what Apple intelligence should have been",
518), 47479962 (security critique, 397); open-webui 43901575 (relicensing, 73), 39415771,
42893411; librechat 45877770 (ClickHouse acquisition, 118), 38502805, 45554692; anythingllm
41457633 (368), 40090530, 43652908; khoj 36933452 (565), 36641542, 32833310; lobe-chat
41070091, 45343741 (only two substantive on-topic threads — seeded thin, not padded).

## Pipeline log

- crawl: 162 pages saved, 1 WARN (lobehub.com/features 404 → removed from products.json,
  lobe-chat recrawled clean).
- extract ×2 (union-merge): openclaw 52, khoj 36, lobe-chat 44, open-webui 32, librechat 23,
  anythingllm 13 evidence items before community/probe appends.
- collect-community: 10/8/8/11/15/1 items.
- probe (publish surfaces): 20 items incl. negatives.
- probes recorded: 17 PA_RECORD proofs, all passing (3 deliberate negatives:
  anythingllm + khoj llms.txt 404s; openclaw clawhub-skills-api list endpoint replaced with
  skill-detail endpoint after the bare list call proved pagination-flaky on page 1).
- judge v3, then na-harmonize, derive, intervals, popularity (registry-verified npm/pypi),
  logos. YC stamps: anythingllm S22, khoj S23.
- spike-engine deep passes, sequential (never two in-arena at once):
  - openclaw pass 1 (--budget-urls 40): +40 urls, +15 evidence, 31 cells moved (17 kept /
    14 reverted). Two transient judge "no parseable JSON" aborts mid-pass, resumed from the
    committed judge cache (retry ≤3 policy) — no cells lost.
  - open-webui (20): +20 urls, +17 evidence, 22 moved (16/6). librechat (20): +13 urls,
    +18 evidence, 23 moved (17/6). anythingllm (20): +0 urls (no llms.txt to discover from —
    the recorded 404 negative), +0 evidence, 0 moved. khoj (20): +0 urls (same), +7 evidence,
    18 moved (10/8). lobe-chat (20): +8 urls, +11 evidence, 20 moved (12/8).
  - openclaw pass 2 (40, founder emphasis): +40 more urls, +5 evidence, 23 cells moved and
    ALL 23 reverted by the churn policy (pure re-roll churn, no new-evidence citations) —
    corpus deepened, scores stable; a natural stopping point.

## Final leaderboard (aiEra order; PA / aiEra / agentReady / agenticApp / apiQuality)

| # | product | PA | aiEra | agentReady | agenticApp | apiQ | evidence |
|---|---|---|---|---|---|---|---|
| 1 | openclaw | 42.5 | 45.1 | 54.8 | 71.1 | 5.1 | 129 |
| 2 | lobe-chat | 30.8 | 41.3 | 49.0 | 56.9 | 25.7 | 60 |
| 3 | librechat | 31.0 | 38.6 | 45.1 | 49.3 | 30.9 | 53 |
| 4 | open-webui | 36.3 | 33.9 | 37.9 | 65.6 | 0 | 59 |
| 5 | khoj | 20.8 | 23.9 | 0 | 77.8 | 0 | 60 |
| 6 | anythingllm | 20.0 | 16.7 | 14.9 | 39.3 | 0 | 27 |

OpenClaw's 19 full verdicts (q7-q9) span exactly the founder's "what it can do" list:
llms.txt agent docs (q9, probe-backed), NL-command chat assistant (q9), mainstream messenger
channels (q9), self-hosting (q9), A2A/subagents/swarm collaboration (q8), autonomous
scheduled automations (q8), MCP client AND `openclaw mcp serve` server (q8, probe), official
CLI (q8, probe), rules-engine + scheduled jobs (q8), SKILL.md custom skills (q8), paired-
device control incl. computer-use (q8), shell/file exec (q8), ClawHub one-command skill
install (q8), browser automation (q7), multiple named agents (q7), one-command install (q7,
probe). Honest lows kept: apiQuality 5.1 (no OpenAPI spec/interactive reference/versioning
policy — probes 404), credential-security theme 19.1 (sandboxing disputed: docs-vs-community
split citing the HN security threads), privacy-posture 12 (no no-training/telemetry-optout
statements found). khoj agentReady 0 (no agent-drivable CLI/API/MCP surface in evidence)
and open-webui/anythingllm/khoj apiQuality 0 are measured, not editorial.

Gates: recompute-check ALL DETERMINISTIC (84 arenas), tsc clean, vitest 1631/1631 (155
files, no flakes), stats 84 arenas / 524 products / 30,020 verdicts. EXPECTED_TOTAL_PROBES
822 → 839.
