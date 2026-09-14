# Try-it demo accounts (sandbox tier)

The Try-it microterminal has three credential tiers (see `docs/TRY-IT.md` and
`infra/cloudflare-proxy/worker.js` → `/api/mcp-probe`):

1. **Keyless** — live handshake for every allowlisted endpoint, plus ONE curated read-only demo
   tool call where the server answers keyless (`data/mcp-demo-calls.json`). Live today.
2. **BYO-key** — the visitor pastes their own credential; it is forwarded once, never logged or
   stored. Live today.
3. **Sandbox accounts** — *our* per-vendor demo credentials, held as wrangler secrets, so any
   visitor can run an authenticated handshake (and, once a demo call is curated for that
   endpoint, a real tool call) against an account we control. **The mechanism is shipped; this
   document is the activation checklist.** Nothing appears in the UI until a secret exists.

## How activation works

The worker looks for a secret named `DEMO_CRED_<PRODUCTID>` (product id uppercased, dashes →
underscores — `payments/stripe` → `DEMO_CRED_STRIPE`, `scheduling/cal-com` →
`DEMO_CRED_CAL_COM`). When present:

- the keyless probe response advertises `sandboxAvailable: true`, and the microterminal shows
  **"▶ use our sandbox account"** on auth-gated results;
- a probe/call with `useSandbox: true` sends the secret as the `Authorization` header
  (`Bearer <value>`, or verbatim if the stored value already starts with `Bearer `/`Basic `)
  to that product's single allowlisted endpoint — the same never-logged, response-scrubbed
  path as visitor keys (`__tests__/mcp-demo-call.test.ts`).

Per endpoint, activation is:

```bash
# 1. create the vendor account and mint the most restricted credential it offers
#    (test mode / read-only / sandbox scope — rules below)
# 2. store it:
cd infra/cloudflare-proxy
wrangler secret put DEMO_CRED_STRIPE     # paste the credential when prompted
# 3. verify on the product page: run the live handshake → "use our sandbox account" appears;
#    the authenticated handshake succeeding IS the verification
# 4. once verified, curate a read-only demo call for the endpoint in data/mcp-demo-calls.json,
#    re-run `node scripts/generate-mcp-demo-calls.mjs`, paste into worker.js, deploy
```

## Non-negotiable provisioning rules

- **Test/sandbox mode only.** Never a production credential. Stripe: TEST-MODE key
  (`sk_test_…` / restricted `rk_test_…`) — test keys move no real money by construction.
- **Least privilege.** Read-only or the vendor's most restricted scope. If a vendor's MCP can
  write with the only credential shape it accepts, provision it only if the account is
  disposable and empty of anything that matters.
- **Assume public.** Anything reachable through the sandbox tier is effectively public: seed
  the account only with demo data you'd put on the site.
- **Revocable + labeled.** Name each credential `productarena-tryit-demo` vendor-side so it can
  be identified and revoked in one click.
- **Bearer-token reality check.** Several vendor MCPs are OAuth-only (they reject static API
  keys). Verify with one authenticated probe *before* provisioning ceremony; if only OAuth
  works, that vendor needs a periodically-refreshed token — defer it, the copy-paste client
  config already covers those visitors honestly.

## Top 10 endpoints worth provisioning (in order)

| # | Endpoint (arena/product) | Secret name | Credential to mint | Why this one |
|---|---|---|---|---|
| 1 | `payments/stripe` | `DEMO_CRED_STRIPE` | **Test-mode** restricted key (`rk_test_…`, read-only on core resources) from a dedicated Stripe sandbox account | Flagship arena, #1 agent-ready product; mcp.stripe.com accepts bearer API keys; test mode carries zero real-money risk. The demo call to curate after: a read-only `list`-style tool against seeded test data. |
| 2 | `error-tracking/sentry` (+ `observability/sentry`, same endpoint) | `DEMO_CRED_SENTRY` | User auth token, scoped `org:read`/`project:read`, on a free org seeded with a sample error | One secret lights up TWO product pages; Sentry's MCP is the best-known in the arena. |
| 3 | `payments/paypal` | `DEMO_CRED_PAYPAL` | Sandbox (not live) REST credential from developer.paypal.com | Same "test money only" property as Stripe; big-name wow factor. |
| 4 | `serverless-databases/neon` | `DEMO_CRED_NEON` | API key on a free project holding one demo database | DB reads demo brilliantly in a terminal (`list projects`, `describe branch`). |
| 5 | `search-infra/algolia` | `DEMO_CRED_ALGOLIA` | **Search-only** API key on a free app with one seeded index | Search-only keys are read-only by construction — the safest credential class on this list. |
| 6 | `backend-as-a-service/supabase` | `DEMO_CRED_SUPABASE` | PAT on a free org with one demo project | Popular with exactly our audience; `list_projects`/`get_project` style reads. |
| 7 | `observability/honeycomb` | `DEMO_CRED_HONEYCOMB` | API key (read scopes) on a free team with sample events | Observability queries look great streaming into the terminal. |
| 8 | `scheduling/cal-com` | `DEMO_CRED_CAL_COM` | API key on a free account with one public event type | Scheduling reads (`list event types`, availability) are instantly legible to non-developers. |
| 9 | `api-platforms/postman` | `DEMO_CRED_POSTMAN` | API key on a free workspace with one demo collection | Meta-appeal: an API tool's own MCP listing its collections. |
| 10 | `email/agentmail` | `DEMO_CRED_AGENTMAIL` | API key on a sandbox inbox | Agent-native vendor, small blast radius, inbox reads are a natural demo. |

Worth watching but deferred: `incident-management/pagerduty` and `incident-management/rootly`
(free trials expire → the button would silently rot), `design-tools/figma` and
`meeting-ai/granola` (OAuth-only walls at last probe).

## Operational notes

- Secrets live only in Cloudflare (`wrangler secret put`); nothing in the repo, nothing in CI.
  `wrangler secret list` shows names, never values.
- Removing a tier is one command: `wrangler secret delete DEMO_CRED_STRIPE` — the button
  disappears on the next probe.
- Rotate on any suspicion; the credential is design-for-disclosure (test data only), but
  rotation hygiene is free.
- Rate limits: the sandbox tier rides the same 10 req / 5 min / IP budget as every probe, so a
  hot page can't hammer a vendor sandbox from our IPs unbounded.
