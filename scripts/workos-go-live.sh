#!/usr/bin/env bash
# WorkOS go-live for ProductArena — one command after two dashboard copies.
#
# Prereqs (2 minutes in https://dashboard.workos.com — the Ultrametric environment):
#   1. Applications → create (or open) the ProductArena application.
#   2. Redirects → add sign-in redirect URI:  https://ultrametric.ai/productarena/auth/callback
#                  add logout redirect URI:   https://ultrametric.ai/productarena
#   3. Copy the Client ID (client_…) and an API key (sk_…) from the same environment.
#
# Then run from the repo root:
#   ./scripts/workos-go-live.sh client_XXXX sk_XXXX
#
# What it does: patches wrangler.toml's WORKOS_CLIENT_ID, sets WORKOS_API_KEY and a
# freshly generated PA_SESSION_KEY as worker secrets, deploys the worker, and smoke-tests
# the live /auth/login redirect and /auth/me. It does NOT commit — review the wrangler.toml
# diff and commit yourself (the client id is publishable, the secrets never touch git).
set -euo pipefail

CLIENT_ID="${1:?usage: workos-go-live.sh <client_id> <api_key>}"
API_KEY="${2:?usage: workos-go-live.sh <client_id> <api_key>}"
cd "$(dirname "$0")/../infra/cloudflare-proxy"

case "$CLIENT_ID" in client_*) ;; *) echo "client id should start with client_" >&2; exit 1;; esac
case "$API_KEY" in sk_*) ;; *) echo "api key should start with sk_" >&2; exit 1;; esac

# 1. Patch the publishable client id into wrangler.toml (idempotent).
perl -pi -e "s/^WORKOS_CLIENT_ID = \"[^\"]*\"/WORKOS_CLIENT_ID = \"$CLIENT_ID\"/" wrangler.toml
grep -q "WORKOS_CLIENT_ID = \"$CLIENT_ID\"" wrangler.toml && echo "wrangler.toml: client id set"

# 2. Secrets.
printf '%s' "$API_KEY" | npx wrangler secret put WORKOS_API_KEY
openssl rand -base64 48 | tr -d '\n' | npx wrangler secret put PA_SESSION_KEY

# 3. Deploy (bundles live-probes + allowlist as usual).
npx wrangler deploy

# 4. Smoke test: login must 302 to api.workos.com; /auth/me must answer JSON (anonymous).
echo "--- smoke ---"
curl -s -o /dev/null -w "login redirect: %{http_code} -> %{redirect_url}\n" \
  "https://ultrametric.ai/productarena/auth/login?return_to=https://ultrametric.ai/productarena"
curl -s "https://ultrametric.ai/productarena/auth/me" | head -c 200; echo
cat <<'NEXT'

Done. Final steps:
  1. Test the full flow privately: localStorage['pa-auth-test']='1' on the live site, reload,
     Log in -> account chip -> Watchlist -> Log out (docs/AUTH.md "Going live").
  2. When satisfied, delete the `if (!testFlag) return null` branch in components/AccountMenu.tsx
     (or ask Claude to) — that reveals Log in to everyone.
NEXT
