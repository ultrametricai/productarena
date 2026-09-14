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

## Going live (unhide login)

In `components/AccountMenu.tsx`, delete the `if (!testFlag) return null` line (and the
now-unused `testFlag` store read + its `AUTH_TEST_FLAG_KEY` helpers) in the non-authenticated
branch so the "Log in" link renders for everyone. `components/WatchlistGate.tsx` already shows its log-in prompt to all
anonymous visitors of `/watchlist`.

## Notes

- WorkOS endpoints used (verified against the live docs, 2026-09-14; URLs in worker.js
  comments): `GET api.workos.com/user_management/authorize`,
  `POST api.workos.com/user_management/authenticate`,
  `GET api.workos.com/user_management/sessions/logout`.
- We keep **no WorkOS tokens**: only `{user id, email, WorkOS session id, exp}` inside the
  signed cookie. The WorkOS session id (`sid` claim of their access token) exists solely to
  build the logout URL.
- Ory (`auth.ultrametric.ai`) remains live for other Ultrametric products — this change only
  swapped ProductArena's client and gave it its own worker-side backend.
- Tests: `infra/cloudflare-proxy/__tests__/auth.test.ts` (worker routes + cookie crypto),
  `lib/__tests__/session.test.ts` (client hook).
