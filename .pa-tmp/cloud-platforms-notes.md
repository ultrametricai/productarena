# cloud-platforms corpus notes — verified live 2026-09-23

Fourth product decision: **oracle-cloud shipped** (not ibm-cloud). The OCI docs portal
(docs.oracle.com/en-us/iaas/*) serves full real content to keyless curl across every page tested
(home, CLI, SDKs, API concepts, IAM, budgets, free tier, release notes, terraform, GSG). Only the
US marketing landing `https://www.oracle.com/cloud/` (and `/cloud/index.html`) returns an Akamai
403 to curl regardless of UA/headers — every other oracle.com/cloud/* page tested (free, pricing,
costestimator, compute, sign-in, uk/cloud) returns 200 with real HTML. Per the scope rule that is
"a few walled marketing pages", not a walled docs portal, so the corpus is honest. The walled US
landing was dropped; `https://www.oracle.com/uk/cloud/` (same landing content, live 200) is used
as the site URL.

## Walls / negatives per product

- **aws** — no walls. `https://aws.amazon.com/llms.txt` is a 404 (soft HTML 404 page); the docs
  portal `https://docs.aws.amazon.com/llms.txt` is a real, structured llms.txt (probe hit).
  `https://health.aws.amazon.com/public/currentevents` answers keyless but in UTF-16 (mojibake
  through plain `head`), so the status probe candidate was skipped in favor of the HTML status page
  in the corpus.
- **google-cloud** — no walls. `https://cloud.google.com/llms.txt` soft-200s the SPA homepage HTML
  (no redirect, 200, HTML body) — effectively absent; `https://cloud.google.com/docs/llms.txt` is
  301 → 404 (probed as the honest negative). The gcloud install page documents no single one-liner;
  the interactive installer `curl https://sdk.cloud.google.com | bash` is documented at
  /sdk/docs/downloads-interactive.
- **azure** — no walls. `https://azure.microsoft.com/llms.txt` 404 and
  `https://learn.microsoft.com/llms.txt` 404 (both honest negatives; the azure one is probed).
  Status page: **both** `https://azure.status.microsoft/en-us/status` and
  `https://status.azure.com/en-us/status` answer 200 with the identical "Azure status" page;
  azure.status.microsoft is the canonical host used in the corpus. Its RSS feed
  `/en-us/status/feed/` answers keyless (`<title>Azure Status</title>`).
  `https://github.com/Azure/azure-mcp` is **archived** (README: "archived as of August 25, 2025");
  the live official Azure MCP Server is `https://github.com/microsoft/mcp`
  (servers/Azure.Mcp.Server) — corpus and probe point there.
- **oracle-cloud** — `https://www.oracle.com/cloud/` and `/cloud/index.html` 403 (Akamai) for
  keyless curl with any UA; dropped. `https://docs.oracle.com/en-us/iaas/Content/Billing/Concepts/costs_overview.htm`
  404s (dropped; budgets overview page kept). Everything else 200 with real content.
  `https://github.com/oracle/mcp` is a real official Oracle MCP server repo ("Oracle MCP Server
  Repository", reference implementations under src/).

## llms.txt findings (all four vendors, main + docs domains)

| URL | Result |
|---|---|
| aws.amazon.com/llms.txt | 404 |
| docs.aws.amazon.com/llms.txt | **200, real llms.txt** ("# Amazon Web Services (AWS) Documentation") |
| cloud.google.com/llms.txt | soft-200 (SPA HTML, not an llms.txt) |
| cloud.google.com/docs/llms.txt | 301 → 404 |
| azure.microsoft.com/llms.txt | 404 |
| learn.microsoft.com/llms.txt | 404 |
| www.oracle.com/llms.txt | 404 |
| docs.oracle.com/llms.txt | 404 |

AWS is the only hyperscaler with a docs-portal llms.txt.

## HN discussions (verified via https://hn.algolia.com/api/v1/items/<id>, all return JSON)

- **aws**
  - https://hn.algolia.com/api/v1/items/27044371 — "Please fix the AWS free tier before somebody gets hurt" (439 comments)
  - https://hn.algolia.com/api/v1/items/29332207 — "AWS free tier data transfer expansion" (172 comments)
- **google-cloud**
  - https://hn.algolia.com/api/v1/items/32547912 — "Tell HN: Google Cloud suspended our production projects at 1am on Saturday" (508 comments)
  - https://hn.algolia.com/api/v1/items/44260810 — "GCP Outage" (494 comments)
- **azure**
  - https://hn.algolia.com/api/v1/items/45748661 — "Tell HN: Azure outage" (806 comments)
- **oracle-cloud**
  - https://hn.algolia.com/api/v1/items/42901897 — "Oracle Cloud deleting active user accounts without possibility for data recovery" (110 comments)
  - https://hn.algolia.com/api/v1/items/36570158 — "Why yewtu.be was down: Data loss after being shut down by Oracle Cloud" (238 comments)
  - https://hn.algolia.com/api/v1/items/26418492 — "Oracle Cloud is unreachable" (241 comments)

## Official SDK packages (verified against registry endpoints)

- **aws**: pypi `boto3` (author "Amazon Web Services"); npm `@aws-sdk/client-s3` (modular AWS SDK v3 — the legacy monolith `aws-sdk` is v2)
- **google-cloud**: pypi `google-cloud-storage` (author "Google LLC"); npm `@google-cloud/storage`
- **azure**: pypi `azure-identity` (Microsoft Corporation); npm `@azure/identity`
- **oracle-cloud**: pypi `oci` (author "Oracle"); npm `oci-sdk` (latest 2.142.0)

## Other verification notes

- Terraform registry API (keyless JSON, download counts), verified: hashicorp/aws 6.66.0
  (7,681,501,972 downloads), hashicorp/google 8.4.0, hashicorp/azurerm 5.6.0, oracle/oci 9.2.0
  (namespace "oracle", owner "tf-oci-pub").
- Keyless auth-error surfaces verified: STS `MissingAuthenticationToken` XML (with
  Version=2011-06-15; without a Version param it returns an odd `InvalidAction`/AWSFault error),
  ARM `{"error":{"code":"AuthenticationFailed"...}}`, OCI `"code" : "NotAuthenticated"` (note the
  spaces around the colon in OCI's pretty-printed JSON).
- Install one-liners verified on the cited vendor docs pages: AWS CLI curl download
  (awscli-exe-linux-x86_64.zip), `brew update && brew install azure-cli`,
  `bash -c "$(curl -L https://raw.githubusercontent.com/oracle/oci-cli/master/scripts/install/install.sh)"`,
  and `sdk.cloud.google.com` interactive installer.
- Free-tier facts quoted from live pages: AWS "$100 in credits immediately … up to $200 over
  6 months"; GCP "$300 in free credits and free usage of 20+ products"; Azure "$200 credit";
  Oracle "Always Free" + "US$300 cloud credit" (30 days).
