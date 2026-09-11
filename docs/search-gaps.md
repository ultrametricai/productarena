# Search gaps — classic queries with no honest home

Companion to `data/search-aliases.json`. Everything below is a query people classically type
into a "best X" search that today has **no arena, stack, or page it can honestly land on** —
aliasing it anywhere would break the "aliases must be honest fits" rule. This is the new-arena
feed: each row has a suggested disposition. Where an existing arena description already promises
the arena ("left to a future arena"), that's cited.

No arenas were created for this report.

| # | Classic query | Closest today | Suggested disposition |
|---|---|---|---|
| 1 | email marketing / newsletter platforms | `email` arena explicitly excludes it | **Future arena** (Mailchimp, Loops, beehiiv, Kit) |
| 2 | transactional email API | `email` arena explicitly excludes it | **Future arena** (Resend, Postmark, SendGrid) — very agent-relevant |
| 3 | help desk / ticketing | `ai-support-agents` covers the AI agents, not the desks | **Future arena** (Zendesk, Front, Plain); `email` description also calls it a separate arena |
| 4 | uptime monitoring / status monitoring | aliased to `observability` as nearest honest fit | **Future arena** — `incident-management` description literally says "uptime monitoring left to a future arena" (Better Stack uptime, Checkly) |
| 5 | data orchestration | `data-pipelines` (Dagster anchors it) | **Future arena** — its description says "a broader data-orchestration arena (Airflow, Prefect) remains on the roadmap" |
| 6 | static site generators | `docs-platforms` (Docusaurus only) | **Future arena** — its description says Astro Starlight "was left for a future static-site-generator arena" |
| 7 | website builders | `ecommerce-platforms` excludes them | **Future arena** (Framer, Webflow, Wix) — distinct from vibe-coding's prompt-to-app |
| 8 | password manager / secrets management | none | **Future arena** — two related arenas: consumer/team password managers (1Password, Bitwarden) and dev secrets (Doppler, Infisical, Vault); the latter is more on-thesis (agents need scoped secrets) |
| 9 | cap table management | `legal-ops` is adjacent but doesn't score it | **Future arena** (Carta, Pulley) — pairs with the incorporation-day stack |
| 10 | error tracking / crash reporting | `observability` is metrics/logs/traces | **Future arena** (Sentry, Rollbar) or fold into observability at next refresh with an explicit boundary note |
| 11 | CI/CD platforms (standalone) | `code-hosting` scores CI only as a hosting feature | **Future arena** (Buildkite, CircleCI, GitHub Actions-as-product) — agents queue builds all day |
| 12 | feature stores / ML feature platforms | none (`feature-flags` is a false friend people will hit) | **Future arena or ignore** — classic MLOps query (Tecton, Feast); lower AI-era momentum than agent infra |
| 13 | fine-tuning / model training platforms | `inference-providers` scores fine-tune *serving* only | **Future arena** (Modal training, Together fine-tuning, Axolotl-hosting) |
| 14 | text-to-speech / speech-to-text APIs | `voice-agents` uses them but doesn't rank them | **Future arena** (ElevenLabs, Deepgram, Cartesia) — agents speak; strong fit |
| 15 | image / video generation | none | **Future arena** (fal, Replicate media side) or **ignore** if the site stays builder-infra-focused |
| 16 | business intelligence / dashboards | `data-warehouses` is adjacent | **Future arena** (Metabase, Looker, Evidence) — "BI tools" is a top-tier classic query |
| 17 | VPN / private networking / zero trust | Tailscale appears only as a stack pick | **Future arena** (Tailscale, ZeroTier) — the mobile-agentic stack already leans on it |
| 18 | container orchestration / kubernetes platforms | `infra-as-code` provisions it, doesn't rank it | **Future arena or ignore** — huge query, weak agent angle so far |
| 19 | domain registrar / DNS | none | **Ignore for now** — commodity; revisit if a founder-ops arena wave lands |
| 20 | spreadsheets / Airtable-style databases | `project-management` is a false neighbor | **Future arena** (Airtable, Rows, Grist) — agents read/write tables constantly |
| 21 | AI browsers | `browser-agents` is agents-driving-browsers, not browsers-with-AI | **Future arena** (Dia, Comet, Fellou) — watch the category settle first |
| 22 | data labeling / annotation | none | **Ignore / watch** (Labelbox, Scale) — enterprise-ML skew, off the current builder thesis |
| 23 | embedding & reranking APIs | `vector-databases` stores them, `inference-providers` serves some | **Future arena or stack slot** (Voyage, Cohere, Jina) — could start as a slot in an agent-builder stack |
| 24 | video conferencing | `meeting-ai` rides on top of it | **Ignore** — Zoom/Meet duopoly, no evidence angle we score |
| 25 | marketing automation | `crm` + `customer-data-platforms` cover fragments | **Ignore until email-marketing arena exists**, then evaluate as its sibling |

## Notes

- Rows 4-6 are pre-committed by existing arena descriptions — cheapest wins if the founder wants
  quick coverage.
- When any row becomes an arena, add its alias block to `data/search-aliases.json` in the same
  change (the integrity test in `lib/__tests__/search-matching.test.ts` will fail the build if
  the new arena ships without 3-8 aliases).
