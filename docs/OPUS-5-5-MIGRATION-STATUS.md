# Opus 5.5 judge-migration status — live tracker

_Last updated 2026-10-01T21:16:02.255Z by the migration lane. Deleted when the migration doc (docs/JUDGE-MIGRATION-2026-09-30.md) supersedes it, or kept as the wave record._

| | |
|---|---|
| Arenas done / remaining | 52 ingested+committed / 42 in flight (of 94; ai-coding included in done) |
| Cells re-judged so far | 17,707 |
| Cumulative ingested spend | $295.48 (hard stop $800) |
| Projected fleet ingest total | ~$581 (+ interactive fallbacks + ~$10–25 uncertainty re-measure) |
| Fleet exact agreement vs sonnet-5 (running) | 76.5% (4,169 flips / 17,707 comparable cells) |
| Batch requests / interactive fallbacks | 16,671 / 8 |

Churn-policy flag: the no-new-evidence revert rule is deliberately NOT applied to this wave
(README §7); every flip is labeled `judge model migration` via the score-history `note`.
Protected human adjudications (18 cells) re-applied per docs/JUDGE-MIGRATION-2026-09-30-worklist.json.

## Ingested arenas

| Arena | cells | flips | exact agr. | spend |
|---|---|---|---|---|
| agent-sandboxes | 408 | 107 | 73.8% | $6.94 |
| agentic-commerce | 392 | 136 | 65.3% | $9.07 |
| ai-coding | 1036 | 265 | 74.4% | $0.00 |
| ai-memory | 342 | 68 | 80.1% | $6.91 |
| ai-research-agents | 258 | 69 | 73.3% | $3.98 |
| ai-search-apis | 250 | 64 | 74.4% | $4.21 |
| ai-support-agents | 318 | 65 | 79.6% | $5.38 |
| api-platforms | 285 | 82 | 71.2% | $5.82 |
| applicant-tracking | 260 | 51 | 80.4% | $3.66 |
| auth-platforms | 280 | 80 | 71.4% | $6.79 |
| authenticator-apps | 440 | 108 | 75.5% | $6.67 |
| backend-as-a-service | 204 | 39 | 80.9% | $4.47 |
| banking-as-a-service | 318 | 96 | 69.8% | $4.69 |
| banking-data-apis | 371 | 87 | 76.5% | $5.55 |
| billing-subscriptions | 371 | 64 | 82.7% | $5.89 |
| browser-agents | 364 | 93 | 74.5% | $5.81 |
| card-issuing | 265 | 71 | 73.2% | $3.99 |
| cloud-platforms | 196 | 49 | 75% | $3.62 |
| cloud-storage | 196 | 48 | 75.5% | $3.25 |
| code-hosting | 288 | 64 | 77.8% | $5.66 |
| compliance-automation | 324 | 63 | 80.6% | $5.32 |
| crm | 204 | 47 | 77% | $4.32 |
| customer-data-platforms | 255 | 57 | 77.6% | $4.99 |
| data-pipelines | 265 | 59 | 77.7% | $5.66 |
| data-warehouses | 216 | 44 | 79.6% | $6.04 |
| desktop-os | 390 | 104 | 73.3% | $6.15 |
| docs-platforms | 265 | 68 | 74.3% | $5.22 |
| email-marketing | 348 | 66 | 81% | $5.34 |
| fraud-prevention | 270 | 68 | 74.8% | $3.81 |
| identity-verification | 318 | 83 | 73.9% | $4.84 |
| incident-management | 270 | 48 | 82.2% | $5.79 |
| infra-as-code | 216 | 63 | 70.8% | $3.76 |
| local-llm-runtimes | 736 | 196 | 73.4% | $10.99 |
| mobile-payments | 208 | 50 | 76% | $3.36 |
| notes-knowledge | 330 | 71 | 78.5% | $5.94 |
| observability | 324 | 74 | 77.2% | $5.72 |
| payments | 540 | 132 | 75.6% | $12.49 |
| payroll | 216 | 47 | 78.2% | $4.14 |
| processors | 352 | 75 | 78.7% | $5.52 |
| product-analytics | 212 | 52 | 75.5% | $4.98 |
| product-feedback | 260 | 44 | 83.1% | $3.52 |
| scheduling | 275 | 60 | 78.2% | $5.47 |
| search-infra | 265 | 69 | 74% | $5.40 |
| security-scanners | 330 | 93 | 71.8% | $6.26 |
| serverless-databases | 336 | 71 | 78.9% | $7.32 |
| terminals | 324 | 106 | 67.3% | $6.07 |
| vector-databases | 371 | 77 | 79.2% | $5.88 |
| vibe-coding | 312 | 68 | 78.2% | $5.36 |
| virtual-mailboxes | 200 | 53 | 73.5% | $2.56 |
| voice-agents | 549 | 94 | 82.9% | $9.35 |
| web-scraping | 768 | 144 | 81.3% | $11.13 |
| workflow-automation | 616 | 117 | 81% | $10.42 |

## Batches in flight

`accounting` msgbatch_01QyvyRnSWgicsiv7D5VR3DZ (583) · `agent-frameworks` msgbatch_0182S9ahmeGKRUJJmYyx7JuS (459) · `agent-skills` msgbatch_01HYHek5Z23gQb13u1gj3uQm (312) · `ai-assistants` msgbatch_012xTeP6QjdVPqJhz2U11eJp (520) · `ai-code-review` msgbatch_01DpLWbMwBVHUdbNAhEZThyS (318) · `design-tools` msgbatch_01HxHJ9wNU6oJsgwcLPuqVBv (424) · `document-extraction` msgbatch_01KMTyTjtTpLowRinMepCtGe (318) · `domain-registrars` msgbatch_013QB7CJKgXAvyFnSkSz2Afv (294) · `durable-workflows` msgbatch_019ptwiYRXzYpMvzVeywHjg4 (318) · `ecommerce-platforms` msgbatch_01HRfwoCCeoWR7Q7oR7Nn2A3 (270) · `edge-platforms` msgbatch_016F5ueZLZLKfowkrzSFGQMe (576) · `email` msgbatch_01MGnQpJmkG3aDVLaktHWTmE (378) · `email-apis` msgbatch_019oLJFMCHcPocQxpVpq3baM (260) · `equity-management` msgbatch_011Ln9oYycfZK4t3r7KsRSw7 (336) · `error-tracking` msgbatch_01MA6WFY74HDMtiHEhwBg8tA (330) · `expense-management` msgbatch_01EVLYevsABYxwJNV9t5HvXZ (265) · `feature-flags` msgbatch_01UWjXfy43h86JZ7B7UBHZ6y (270) · `frontend-frameworks` msgbatch_01UB9d68qM5ULGfYSYxjYmqr (425) · `frontier-models` msgbatch_011riJv1zhtWTuNBSnmn9suv (488) · `game-engines` msgbatch_01EWuEfAvvVMZ1d32KXG9kQP (456) · `gpu-clouds` msgbatch_014WBHavScgXF2VzxEe7p4Jj (270) · `gpus` msgbatch_01STPZTdPvsJ9NzFGdwKj8Gi (344) · `inference-providers` msgbatch_01C5aF11fVbiMhyWn3PQmgX8 (371) · `legal-ops` msgbatch_01TtKLdJENCBh61ZFTwuemfy (378) · `llm-evals-observability` msgbatch_01G85A1ownraAsrasbUkHYPb (416) · `marketplace-payments` msgbatch_01YNtTLKzneiP4gtYhmUdUum (318) · `mcp-infrastructure` msgbatch_01GygcLmTLRoH4JWsq3ueEqZ (364) · `meeting-ai` msgbatch_01JQwNNka9VPbKZ5n7gP7mfG (270) · `mobile-dev` msgbatch_0116gwS9uaQqUAgsqdZRdTV7 (414) · `model-gateways` msgbatch_019cpaXyRptoFAMV9kEkvWiF (350) · `package-managers` msgbatch_01ReRXVJGFWkLN71yLPmYYKe (324) · `project-management` msgbatch_01B5iFcjoEvZGd1kLXBQJJf5 (498) · `robotics-platforms` msgbatch_01C9XDeamNfo99Y2bALm36ru (270) · `security-keys` msgbatch_01AFCHtGXDeFWxVyYaRLPSmQ (324) · `self-hosted-assistants` msgbatch_01CgjT55Ht9eF57N3nw9kF7i (342) · `software-factory` msgbatch_014nMhpNfkxSSYPMcYEMgEvV (730) · `sso-identity` msgbatch_01B6kWRpLc9dTm6a7m7WWCzk (250) · `stablecoin-payments` msgbatch_01BMCNTKEdnUFRBR4JBigeJt (318) · `startup-banking` msgbatch_01Uf7GeQZ8HMjub3R31qrWEK (518) · `startup-law-firms` msgbatch_01AADoLUJuMwjW44Y8HKPgc6 (840) · `tax-automation` msgbatch_01KZTSHpquJRNwWpjqkqWB7J (318) · `team-chat` msgbatch_01Bp1rNYryt1kAL2Zpm2PgF4 (255)

