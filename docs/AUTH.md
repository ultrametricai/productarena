# Auth: WorkOS AuthKit via the Cloudflare worker

ProductArena is a static export — there is no Next server — so the Cloudflare worker that
proxies `ultrametric.ai/productarena/*` (`infra/cloudflare-proxy/worker.js`, "Auth backend"
section) is the auth backend. Login goes through the WorkOS AuthKit hosted page; the callback
mints **our own** session cookie (`pa_session`, HMAC-SHA256-signed, HttpOnly, Secure,
SameSite=Lax, `Domain=ultrametric.ai; Path=/productarena`, expiry capped at 30 days, no PII
beyond the email). The client hook (`lib/session.ts`) asks `GET /productarena/auth/me` — same
origin, no CORS — and everything degrades to anonymous if auth is unreachable or unconfigured.

Routes (all under `https://ultrametric.ai/productarena/auth/`):

| Route | Does |
| --- | --- |
| `/login?return_to=…` | 302 → WorkOS AuthKit authorize URL (CSRF nonce in `pa_state` cookie + OAuth `state`) |
| `/callback?code=…&state=…` | CSRF check → code exchange → set `pa_session` → 302 back to `return_to` |
| `/me` | `{email}` from a valid cookie, else 401 |
| `/logout?return_to=…` | clear `pa_session` → 302 through WorkOS's logout URL → back to `return_to` |

`return_to` is only ever honored as an `ultrametric.ai` path; anything else falls back to
`/productarena`.

## What login unlocks: the watchlist

The account feature is the ☆/★ watchlist (`/productarena/watchlist`,
`components/WatchButton.tsx` stars on product pages and tables). Starred ids live in
localStorage for instant UI, and for logged-in readers they sync to the account through the
worker's session-gated `GET`/`PUT /productarena/api/watchlist` (worker.js "Watchlist API"):
one KV value per account (`watchlist:<WorkOS user id>` in the `PA_COMPARE_STATS` namespace —
prefix-separated from the compare counters, so **no new KV setup is needed**; bind a dedicated
`PA_WATCHLIST` namespace later if wanted). First sync after login merges (union) the account
list with the device list; every star/unstar afterwards PUTs the full list. Anonymous readers
get the "log in to keep a watchlist" prompt (`components/WatchlistGate.tsx`) and their stars
stay device-local. All failures are fail-open to device-local — the sync layer is
`lib/watchlist.ts`.

## One-time setup (founder)

1. **WorkOS dashboard** (the existing UM-email account), in the environment you want to use:
   - AuthKit: make sure AuthKit is activated (Authentication → AuthKit).
   - **Redirects → Sign-in redirect URIs**: register exactly
     `https://ultrametric.ai/productarena/auth/callback`
   - **Redirects → Logout redirect URIs** (a.k.a. app homepage / allowed logout URIs): add
     `https://ultrametric.ai/productarena` (WorkOS only honors `return_to` on its logout URL if
     it is allowlisted; PA sends `https://ultrametric.ai/productarena…` pages there).
   - Copy the **Client ID** (`client_…`) and an **API key** (`sk_…`) from API Keys.

2. **Worker config** — from `infra/cloudflare-proxy/`:
   - Paste the client ID into `wrangler.toml` → `[vars] WORKOS_CLIENT_ID`.
   - `wrangler secret put WORKOS_API_KEY` — paste the `sk_…` key.
   - `wrangler secret put PA_SESSION_KEY` — paste a fresh random key, e.g.
     `openssl rand -base64 48`. (Rotating this key logs everyone out; that is the kill switch.)
   - `wrangler deploy`

Until all three are set, every `/auth/*` route fails closed with an explicit
`auth not configured: …` 500 naming the missing value. The site itself never breaks — the
client hook treats any non-200 from `/auth/me` as anonymous.

## Testing locally with mock mode (no secrets, today)

`WORKOS_MOCK=1` turns `/auth/login` into an immediate dev session for `test@ultrametric.ai` —
no WorkOS account, no secrets, full flow. From `infra/cloudflare-proxy/`:

```sh
wrangler dev --var WORKOS_MOCK:1
```

Then open `http://localhost:8787/productarena` (the worker proxies the live Vercel site), and
in the browser console:

```js
localStorage['pa-auth-test'] = '1'   // reveal the hidden "Log in" link, then reload
```

Click **Log in** → you are instantly `test@ultrametric.ai` (account chip appears) → star some
products → open **Watchlist** from the chip menu (list syncs through the local KV simulation)
→ **Log out** → chip gone, `/watchlist` shows the log-in prompt again. That is the entire
go-live flow minus the WorkOS hosted page.

Mock mode is dev-only **by construction**, twice over:

1. `WORKOS_MOCK` must never be added to `wrangler.toml` `[vars]` (the file carries the same
   warning) — it exists only as a per-run `wrangler dev --var`.
2. Hard host guard: `isMockAuth()` in worker.js refuses mock mode for any request on
   `ultrametric.ai`, so even a mistaken deploy of the var cannot fake logins in production
   (asserted by tests). The mock cookie is also signed with a throwaway dev key, worthless
   against a production `PA_SESSION_KEY`.

## Testing invisibly to users (`pa-auth-test`)

The header's "Log in" link stays hidden for everyone (founder call) until the flow is signed
off. To reveal it just for yourself, in the browser console on any PA page:

```js
localStorage['pa-auth-test'] = '1'
```

Reload — the quiet "Log in" link appears in the header (only in your browser). Full check:
log in via AuthKit, confirm the account chip + Watchlist appear, star a product, log out.
`delete localStorage['pa-auth-test']` to hide the link again. (You can always drive the flow
directly at `/productarena/auth/login` too — the flag only gates the link, not the routes.)

## Go-live checklist (founder, ~5 minutes)

Everything else is built, tested, and merged — these are the only remaining steps, in order:

1. **WorkOS dashboard** (existing UM-email account, chosen environment):
   - Authentication → AuthKit: activated.
   - Redirects → **Sign-in redirect URI** — paste exactly:
     `https://ultrametric.ai/productarena/auth/callback`
   - Redirects → **Logout redirect URI** — paste exactly:
     `https://ultrametric.ai/productarena`
2. From `infra/cloudflare-proxy/`:
   ```sh
   # paste the client_… id from the dashboard into wrangler.toml [vars] WORKOS_CLIENT_ID, then:
   wrangler secret put WORKOS_API_KEY     # the sk_… API key from the same dashboard page
   wrangler secret put PA_SESSION_KEY     # fresh random: openssl rand -base64 48
   wrangler deploy
   ```
3. Verify privately: on ultrametric.ai/productarena set `localStorage['pa-auth-test'] = '1'`,
   reload, log in via AuthKit, star a product, check /watchlist (and on a second
   browser/device: log in there — the list follows), log out.
4. Unhide the login for everyone: in `components/AccountMenu.tsx`, delete the
   `if (!testFlag) return null` line (and the now-unused `testFlag` store read + its
   `AUTH_TEST_FLAG_KEY` helpers) in the non-authenticated branch. `components/WatchlistGate.tsx`
   already shows its log-in prompt to all anonymous visitors of `/watchlist`.
5. Flip the WorkOS row in `docs/FOUNDER-ASKS.md` to `shipped`.

## Notes

- WorkOS endpoints used (re-verified against the live docs 2026-09-15; URLs in worker.js
  comments): `GET api.workos.com/user_management/authorize` (client_id, redirect_uri,
  response_type=code, provider=authkit, state, optional screen_hint — PKCE optional for
  confidential clients like this worker),
  `POST api.workos.com/user_management/authenticate` (JSON body client_id/client_secret/
  grant_type=authorization_code/code),
  `GET api.workos.com/user_management/sessions/logout` (session_id from the access token's
  `sid` claim, return_to). No deprecations; nothing needed fixing in the routes on this pass.
- Session hardening (verified): HMAC-SHA256-signed cookie, constant-time compare, exp required
  and capped at 30 days even when correctly signed, `/auth/me` and `/api/watchlist` fail closed
  (explicit 500) when `PA_SESSION_KEY` is unset, no sliding refresh by design (a stolen cookie
  can never outlive 30 days; rotating `PA_SESSION_KEY` stays a true kill switch).
- We keep **no WorkOS tokens**: only `{user id, email, WorkOS session id, exp}` inside the
  signed cookie. The WorkOS session id (`sid` claim of their access token) exists solely to
  build the logout URL.
- Ory (`auth.ultrametric.ai`) remains live for other Ultrametric products — this change only
  swapped ProductArena's client and gave it its own worker-side backend.
- Tests: `infra/cloudflare-proxy/__tests__/auth.test.ts` (worker routes + cookie crypto +
  mock mode incl. the production host guard),
  `infra/cloudflare-proxy/__tests__/watchlist-route.test.ts` (/api/watchlist gating, storage,
  id normalization, mock-cookie interop), `lib/__tests__/session.test.ts` (client hook + sync
  trigger), `lib/__tests__/watchlist.test.ts` (merge + account sync + push-through writes).
