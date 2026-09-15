# Research: authenticator-apps arena (verified live 2026-09-15)

All URLs, versions, and quotes below come from commands actually run on 2026-09-15 (curl, npm, gh, brew, npx, WebFetch). Negative findings are recorded explicitly. Method note: `curl -sIL` (HEAD) 404s on support.google.com and some help.twilio.com pages that return 200 on GET with a browser UA — statuses below are GET-verified where flagged.

---

## google-authenticator

### URLS
- Site: `200 https://safety.google/safety/authentication/` (from https://safety.google/authentication/)
- Help root (canonical article): https://support.google.com/accounts/answer/1066447?hl=en — GET 200 (HEAD returns 404), title "Get verification codes with Google Authenticator - Android - Google Account Help"
- Changelog: ABSENT — no public release notes page found; only app-store listings
- GitHub: `200 https://github.com/google/google-authenticator` (ARCHIVED)
- Pricing page: ABSENT (free app, no pricing page)

### EXTRA_DOCS
- https://support.google.com/accounts/answer/1066447?hl=en — Get verification codes with Google Authenticator (install, sync, transfer, offline use)
- https://support.google.com/accounts/answer/185839?hl=en — Turn on 2-Step Verification
- https://support.google.com/accounts/answer/185834?hl=en — Fix common issues with 2-Step Verification
- https://safety.google/safety/authentication/ — Google safety/authentication page
- Honest negative: Google publishes essentially one product help article; there is no docs site, no API docs, no CLI docs, no watch-app docs, no self-host story.

### LLMS_TXT
- https://safety.google/llms.txt → 404 ABSENT
- https://support.microsoft.com-style root not applicable; no llms.txt found anywhere for Google Authenticator

### MD_MIRROR
- https://support.google.com/accounts/answer/1066447.md → 404 ABSENT

### MCP
- ABSENT. No official or community MCP server found in docs.

### PACKAGES
- ABSENT. No official CLI/npm/brew package. (OSS PAM module in archived repo only.)

### GITHUB
- google/google-authenticator | stars: 5357 | archived: True | pushed_at: 2020-09-28T13:57:17Z | "Open source version of Google Authenticator (except the Android app)"
- google/google-authenticator-android | stars: 1672 | archived: True | pushed_at: 2020-06-09T13:34:39Z
- Openness finding: both OSS repos archived, untouched since 2020; shipping app is closed source.

### HN_SEEDS
- 35690398 | Google Authenticator now supports Google Account synchronization | 333
- 35708869 | Google Authenticator cloud sync: Google can see the secrets, even while stored | 141
- 28324626 | How does Google Authenticator work? | 158

### PRICING
- Free (no pricing page exists; app free on Play/App Store).

### NOTES (source: support article 1066447, fetched live)
- Cloud sync is on by default when signed in: "When you sign in to your Google Account within Google Authenticator on a new device, your codes are automatically synce[d]".
- Encryption claim verbatim: "Google encrypts Authenticator codes both in transit and at rest across our products." The string "end-to-end" appears ZERO times in the article (checked programmatically) — synced secrets are NOT stated to be E2EE, consistent with the 2023 controversy (HN 35708869).
- Export is QR-transfer only: "In the Authenticator app, tap Menu > Transfer accounts > Export accounts... your old device may create more than one QR code." No file export. (2FAS docs note the QR export carries max 10 services per code: https://2fas.com/llms-full.txt line ~3218.)
- Can be used without a Google Account ("Use Google Authenticator without a Google Account" section exists).
- No passkey storage (Authenticator is TOTP-only; passkeys live in Google Password Manager), no browser extension, no watch app docs, no API/CLI/self-host. Agent-drivable: NO.

---

## microsoft-authenticator

### URLS
- Site: https://www.microsoft.com/en-us/security/mobile-authenticator-app → 403 (bot-gated even with browser UA; noted honestly)
- Docs/help root: `200 https://support.microsoft.com/en-us/authenticator/download-microsoft-authenticator` (redirect from old account-billing slug)
- Changelog: ABSENT (no public release notes page found)
- GitHub: ABSENT (closed source)
- Pricing page: ABSENT (free)

### EXTRA_DOCS
- https://support.microsoft.com/en-us/authenticator/download-microsoft-authenticator — "Download Microsoft Authenticator"
- https://support.microsoft.com/en-us/authenticator/microsoft-authenticator-faqs — "Microsoft Authenticator FAQs"
- https://support.microsoft.com/en-us/authenticator/about-microsoft-authenticator — "About Microsoft Authenticator"
- https://support.microsoft.com/en-us/authenticator/back-up-your-accounts-in-microsoft-authenticator — "Back up your accounts in Microsoft Authenticator" (redirect from bb939936 GUID)
- https://support.microsoft.com/en-us/authenticator/export-passwords-from-microsoft-authenticator — "Export passwords from Microsoft Authenticator" (passwords, NOT TOTP secrets)
- https://support.microsoft.com/en-us/account-billing/changes-to-microsoft-authenticator-autofill-09fd75df-dc04-4477-9619-811510805ab6 — now renders as "View or edit your passwords in Microsoft Password Manager" (the autofill-changes article was folded into Password Manager docs)

### LLMS_TXT
- https://support.microsoft.com/llms.txt → 404 ABSENT

### MD_MIRROR
- https://support.microsoft.com/en-us/authenticator/microsoft-authenticator-faqs.md → 404 ABSENT

### MCP
- ABSENT for the Authenticator product.

### PACKAGES
- ABSENT. No official CLI/npm/brew package.

### GITHUB
- ABSENT (closed source; no official repos).

### HN_SEEDS
- 41275846 | Flaw has Microsoft Authenticator overwriting MFA accounts, locking users out | 311
- 44426985 | Next month, saved passwords will no longer be in Microsoft's Authenticator app | 357
- 27192997 | Microsoft Authenticator Chrome Extention is not from MS and is phishing | 212

### PRICING
- Free.

### NOTES
- Autofill removal VERIFIED verbatim from live FAQ page: "Autofill on Microsoft Authenticator was discontinued in mid-August 2025." and "The Microsoft Autofill Chrome Extension was retired on December 14, 2024."
- Password export path exists (export-passwords article) but TOTP secrets cannot be exported: 2FAS docs verbatim: "Authy and Microsoft Authenticator do not allow the codes to be exported from their app" (https://2fas.com/llms-full.txt line ~3544).
- Backup/restore is via Microsoft account + iCloud on iOS (backup article live; FAQ details iCloud Drive/Keychain requirements) — platform-locked, not a portable file.
- Marketing site 403s to curl — poor machine accessibility even at the storefront level.
- No API, no CLI, no self-host, no browser extension (the Chrome one was retired/never the app). Agent-drivable: NO.

---

## authy

### URLS
- Site: `200 https://www.authy.com/`
- Help root: `200 https://help.twilio.com/categories/360000269933-Authy` (JS-rendered SPA; titles not in HTML)
- API docs: `200 https://www.twilio.com/docs/authy` (carries deprecation notice)
- Changelog: ABSENT (no public app release notes found)
- GitHub: ABSENT (closed source)
- Pricing page: https://www.authy.com/pricing/ → 404 ABSENT (app free)

### EXTRA_DOCS
- https://www.authy.com/download/ — "Download - Authy | Authy" (iOS + Android only now)
- https://www.authy.com/features/ — "Features - Authy | Authy" (mentions Apple Watch: "Access tokens On any device. Your phone, tablet, even your Apple Watch."; "Encrypted Backups"; "Multiple Devices Sync 2FA across mobile and tablet")
- https://www.twilio.com/docs/authy — Authy API docs with deprecation banner
- https://help.twilio.com/articles/22771146070299-End-user-guide-End-of-Life-EOL-for-Twilio-Authy-Desktop-app — 200 (JS-rendered; title confirmed via HN story 39360439 "End of Life for Twilio Authy Desktop App")
- https://www.twilio.com/docs/verify — Verify (Twilio's designated successor API)

### LLMS_TXT
- https://www.authy.com/llms.txt → 404 ABSENT
- Parent org: https://www.twilio.com/docs/llms.txt → 200, first lines: "# Twilio Documentation" / "> Reference documentation for all Twilio products..." / "## Authy: 2FA and Passwordless Login" (Authy still indexed there)

### MD_MIRROR
- https://www.authy.com/features.md → returns 200 but body is HTML (`<!DOCTYPE HTML>`), so NO markdown mirror — ABSENT.

### MCP
- ABSENT.

### PACKAGES
- Official app tooling: ABSENT.
- npm `authy` → 1.4.0 (community wrapper around the deprecated Authy API, not Twilio-official app tooling; no deprecation flag set on npm).

### GITHUB
- ABSENT (no official OSS).

### HN_SEEDS
- 40874341 | Twilio confirms data breach after hackers leak 33M Authy user phone numbers | 396
- 39360439 | End of Life for Twilio Authy Desktop App | 172
- 32622923 | Some Authy 2FA accounts were compromised in Twilio data breach | 64

### PRICING
- App free. Authy API: closed to new customers (see below); no public price page (authy.com/pricing 404).

### NOTES
- Authy API deprecation VERIFIED verbatim from live https://www.twilio.com/docs/authy: "The Authy API is now closed to new customers and will be fully deprecated in the future. For new development, we encourage you to use the Verify v2 API. Existing customers will not be impacted at this time until Authy API has reached End of Life."
- Desktop apps EOL (March 2024): EOL article live at help.twilio.com/articles/22771146070299. Third-party confirmation in Ente's live migration guide (https://ente.com/help/auth/migration/authy/): "WARNING Authy has dropped all support for its desktop apps. It is no longer possible to export data from Authy using methods 1 and 2."
- Export lock-in VERIFIED verbatim (same Ente page): "you cannot export your 2FA codes through the app" — worst-in-class export openness.
- 2024 breach: 33M phone numbers scraped via unauthenticated API endpoint (HN 40874341); 2022 Twilio breach touched some Authy accounts (HN 32622923).
- Agent-drivable: NO (API closed to new customers; no CLI; no export).

---

## 1password

### URLS
- Site: `200 https://1password.com/`
- Developer docs: developer.1password.com → `200 https://www.1password.dev/` (domain migrated)
- Support docs: `200 https://support.1password.com/`
- Changelog: `200 https://releases.1password.com/` — "1Password Releases"
- GitHub (SDKs): https://github.com/1Password/onepassword-sdk-js (110 stars)
- Pricing: `200 https://1password.com/pricing` (business, quote-led) and `200 https://1password.com/personal` → /personal-family-security (consumer prices)

### EXTRA_DOCS (all fetched 200 with titles)
- https://www.1password.dev/cli/get-started — "Get started with 1Password CLI"
- https://www.1password.dev/cli/reference — "1Password CLI reference"
- https://www.1password.dev/connect — "1Password Connect"
- https://www.1password.dev/service-accounts — "1Password Service Accounts"
- https://www.1password.dev/events-api — "1Password Events API"
- https://www.1password.dev/sdks — "1Password SDKs"
- https://www.1password.dev/ssh — "1Password for SSH & Git"
- https://www.1password.dev/ai-readable-docs — docs-for-AI page: llms.txt, per-page Markdown, llms-full.txt, MCP search server
- https://www.1password.dev/environments/mcp-server — "1Password Environments MCP Server" (Beta): "Connect MCP clients to 1Password Environments with secure authorization prompts, without returning secrets to the agent."
- https://support.1password.com/one-time-passwords/ — "Use 1Password as an authenticator for sites with two-factor authentication" (TOTP)
- https://support.1password.com/passkeys/ (redirects to live passkeys hub) and https://support.1password.com/save-use-passkeys/ — "Save and sign in with passkeys in your browser"
- https://support.1password.com/export/ — "How to export your data from the 1Password apps"
- https://support.1password.com/import/ — "Move your data from other applications to 1Password"
- https://support.1password.com/watchtower/ — "Use Watchtower to find account details you need to change" (breach alerting)
- https://support.1password.com/1password-security/ — "About the 1Password security model"
- https://support.1password.com/security-assessments/ — "Security audits of 1Password"
- https://support.1password.com/getting-started-browser/ — "Get to know 1Password in your browser" (extension/autofill)
- https://support.1password.com/apple-watch/ — "Use 1Password on your Apple Watch"

### LLMS_TXT (two live files)
https://www.1password.dev/llms.txt, first lines exactly:
```
# 1Password Developer Documentation

> Developer tools and APIs for 1Password, including SSH & Git, Environments, CLI, SDKs, secrets automation, service accounts, and CI/CD integrations.

This file follows the llmstxt.org standard as a curated index of 1Password developer documentation. For the complete content of every documentation page concatenated into a single file, see https://www.1password.dev/llms-full.txt.
```
https://support.1password.com/llms.txt, first lines exactly:
```
# 1Password Support

> LLM-friendly exports of English public support guides from 1Password Support.

## Guides
```
- https://1password.com/llms.txt → 404 ABSENT (marketing root only)

### MD_MIRROR
- https://www.1password.dev/cli/get-started.md → 200, real markdown. First content heading: `# Get started with 1Password CLI` (preceded by an injected "> ## Documentation Index" pointer to /llms.txt).

### MCP
- OFFICIAL, two servers:
  1. Public docs-search MCP at `https://www.1password.dev/mcp` — "The server is public and requires no authentication." Live handshake verified (see PROBE_CANDIDATES): serverInfo `{"name":"1Password Developer","version":"1.0.0"}`. Docs even show `claude mcp add --transport http 1password-dev https://www.1password.dev/mcp`.
  2. 1Password Environments MCP Server (Beta) — https://www.1password.dev/environments/mcp-server — manages Environments "with secure authorization prompts, without returning secrets to the agent".

### PACKAGES (exact outputs)
- `brew info --json=v2 1password-cli` → cask `1password-cli`, homepage https://developer.1password.com/docs/cli, url `https://cache.agilebits.com/dist/1P/op2/pkg/v2.39.0/op_darw...` (i.e., op v2.39.0)
- `npm view @1password/sdk version` → `0.5.0`
- `which op` → not installed on this machine ("op not found")

### GITHUB
- 1Password/onepassword-sdk-js | 110 stars | pushed 2026-08-13
- 1Password/onepassword-sdk-python | 190 stars | pushed 2026-08-17
- 1Password/onepassword-sdk-go | 128 stars | pushed 2026-08-12
- Apps are closed source.

### HN_SEEDS
- 14403911 | 1Password Travel Mode: Protect your data when crossing borders | 521
- 28145247 | 1Password 8 will be subscription only and won't support local vaults | 661
- 29993961 | 1Password Has Raised $620M | 700

### PRICING (verbatim from live 1password.com/personal)
- "Individual ... $2.99 USD [annual] $3.99 USD [monthly] Per month. Paid annually.*"
- Families plan present on same page (embedded price set includes $4.99; card text not server-rendered — noted honestly).
- Business pricing page has pivoted to quote-led "Unified Access": "Unified Access pricing is tailored to your organization's needs"; MSP program is "consumption-based per user".

### NOTES
- Strongest agent surface of the closed-source products: op CLI (v2.39.0), Connect server (self-hosted REST), Service Accounts, Events API, official SDKs (JS/Python/Go), two official MCP servers, llms.txt + per-page .md + llms-full.txt.
- Company messaging now explicitly agentic: site banner "1Password Privileged Access: Zero standing privileges for humans and AI."
- TOTP + passkey storage + Watchtower breach alerting + Apple Watch app all doc-verified. Export supported (support/export) but 1PUX/CSV — no self-hosting of the vault service (Connect is a self-hosted API gateway, not a server).
- Agent-drivable: YES (CLI + service accounts keyless-to-verify; secrets access requires an account).

---

## bitwarden

### URLS
- Site: `200 https://bitwarden.com/`
- Docs root: `200 https://bitwarden.com/help/`
- Changelog: `200 https://bitwarden.com/help/releasenotes/` — "Release Notes"
- GitHub: `200 https://github.com/bitwarden/clients`, `200 https://github.com/bitwarden/server`
- Pricing: `200 https://bitwarden.com/pricing/`

### EXTRA_DOCS (all fetched 200 with titles)
- https://bitwarden.com/help/integrated-authenticator/ — "Integrated Authenticator" (TOTP in vault; /help/authenticator-keys/ redirects here)
- https://bitwarden.com/help/bitwarden-authenticator/ — "Bitwarden Authenticator" (standalone free TOTP app)
- https://bitwarden.com/help/authenticator-import-export/ — "Import & Export Authenticator Data"
- https://bitwarden.com/help/totp-sync/ — "Sync Verification Codes"
- https://bitwarden.com/help/storing-passkeys/ — "Autofill Passkeys"
- https://bitwarden.com/help/export-your-data/ — "Export Vault Data"
- https://bitwarden.com/help/import-data/ — "Import Data"
- https://bitwarden.com/help/cli/ — "Password Manager CLI" (documents `bw serve`)
- https://bitwarden.com/help/vault-management-api/ — "Vault Management API" (the `bw serve` REST spec)
- https://bitwarden.com/help/public-api/ — "Bitwarden Public API"
- https://bitwarden.com/help/personal-api-key/ — "CLI Authentication via API Key"
- https://bitwarden.com/help/install-on-premise-linux/ — "Linux Standard Deployment" (official self-host)
- https://bitwarden.com/help/self-host-an-organization/ — "Self-host an Organization"
- https://bitwarden.com/help/getting-started-browserext/ — "Password Manager Browser Extensions"
- https://bitwarden.com/help/auto-fill-browser/ — "Autofill From Browser Extensions"
- https://bitwarden.com/help/reports/ — "Vault Health Reports" (incl. data breach report)
- https://bitwarden.com/help/is-bitwarden-audited/ — "Compliance, Audits, and Certifications"
- https://bitwarden.com/help/bitwarden-security-white-paper/ — "Bitwarden Security Whitepaper"
- https://bitwarden.com/help/secrets-manager-cli/ — "Secrets Manager CLI"

### LLMS_TXT
https://bitwarden.com/llms.txt → 200, first lines exactly:
```
# Bitwarden

> The most trusted open source password manager for passwords, passkeys, and secrets — for business, enterprise, and personal use, on any browser or device.

Bitwarden is the most trusted password manager for passwords and passkeys at home or at work, on any browser or device. Start with a free trial.
```
- https://bitwarden.com/help/llms.txt → 404 ABSENT (root file only)

### MD_MIRROR
- https://bitwarden.com/help/cli.md → 200 real markdown; first heading exactly: `# Password Manager CLI`
- Also verified https://bitwarden.com/help/bitwarden-authenticator.md (headings: `# Bitwarden Authenticator`, `## Transfer codes to a new mobile device`).

### MCP
- OFFICIAL: github.com/bitwarden/mcp-server — 254 stars, license GPL-3.0, pushed 2026-09-15. npm `@bitwarden/mcp-server` latest `2026.7.0` (registry repo field: git+https://github.com/bitwarden/mcp-server.git).
- Live stdio handshake (keyless) succeeded — see PROBE_CANDIDATES: serverInfo `{"name":"Bitwarden MCP Server","version":"2026.7.0"}`.

### PACKAGES (exact outputs)
- `npm view @bitwarden/cli version` → `2026.8.0`
- `npm view @bitwarden/mcp-server version` → `2026.7.0`
- `npm view @bitwarden/sdk-napi version` → `1.0.0`
- `npx -y @bitwarden/cli --version` → prints (exactly):
```
Could not find dir, "/Users/judegomila/Library/Application Support/Bitwarden CLI"; creating it instead.
Could not find data file, "/Users/judegomila/Library/Application Support/Bitwarden CLI/data.json"; creating it instead.
2026.6.0
```
  (npx resolved a cached 2026.6.0 while registry latest is 2026.8.0 — recorded as observed.)
- `which bw` → not installed ("bw not found")

### GITHUB
- bitwarden/clients | 13,789 stars | pushed 2026-09-15
- bitwarden/server | 20,145 stars | pushed 2026-09-15
- bitwarden/cli | 1,694 stars | ARCHIVED 2022 (moved into clients monorepo)
- bitwarden/mcp-server | 254 stars | GPL-3.0 | pushed 2026-09-15
- Third-party (honest note): dani-garcia/vaultwarden | 67,651 stars | pushed 2026-09-13 — "Unofficial Bitwarden compatible server written in Rust". NOT a Bitwarden product; the official self-host path is bitwarden/server (help/install-on-premise-linux).

### HN_SEEDS
- 41940580 | Bitwarden SDK relicensed from proprietary to GPLv3 | 369
- 47876043 | Bitwarden CLI compromised in ongoing Checkmarx supply chain campaign | 432 (2026-04-23)
- 48163389 | The quiet renovation at Bitwarden | 314

### PRICING (verbatim from live bitwarden.com/pricing)
- "Premium $ 1.65 per month Billed annually at $19.80 ... Integrated authenticator, File attachments, Emergency access, Security reports and more. Share vault items with one other user"
- "Families $ 3.99 per month Up to 6 users Billed annually at $47.88 ... 6 premium accounts, Unlimited sharing, Unlimited collectio[ns]"
- Free tier exists ("Get Started Free"). NOTE: the widely remembered "$10/yr premium" is OUTDATED — it is now $19.80/yr.

### NOTES
- `bw serve` REST API VERIFIED verbatim from help/cli: "...express web server that can be used to take all actions accessible from the CLI in the form of RESTful API calls from an HTTP interface. `bw serve --port <port> --hostname <hostname>` ... by default ... port 8087 ... bind ... to localhost".
- Supply-chain incident (verified via socket.dev/blog/bitwarden-cli-compromised): npm `@bitwarden/cli` 2026.4.0 compromised April 2026 via "a compromised GitHub Action in Bitwarden's CI/CD pipeline"; payload harvested tokens/keys; Chrome extension, MCP server, other distributions not affected. Relevant risk fact for the agent-drivability story.
- TOTP: integrated authenticator is a Premium feature; the standalone Bitwarden Authenticator app is free and has documented import/EXPORT (authenticator-import-export) and optional TOTP sync with the vault.
- Passkeys stored + autofilled (storing-passkeys). Public API + personal API key + Secrets Manager CLI + SDK.
- Agent-drivable: YES — the most drivable of all eight (CLI, `bw serve` local REST, Public API, official MCP server, self-host server, GPLv3 SDK).

---

## proton-pass

### URLS
- Site: `200 https://proton.me/pass`
- Docs/help root: `200 https://proton.me/support/pass`
- Changelog: ABSENT as a single page (release notes live on app stores / GitHub releases of protonpass repos)
- GitHub: protonpass/android-pass, protonpass/ios-pass, web client inside ProtonMail/WebClients
- Pricing: `200 https://proton.me/pass/pricing`

### EXTRA_DOCS (all fetched 200 with titles)
- https://proton.me/support/pass-2fa — "How to use 2FA in Proton Pass" (built-in TOTP)
- https://proton.me/support/pass-use-passkeys — "How to use Proton Pass passkeys"
- https://proton.me/support/pass-export — "How to export from Proton Pass"
- https://proton.me/support/pass-import — "Import passwords to Proton Pass"
- https://proton.me/support/pass-import-bitwarden — "How to import from Bitwarden to Proton Pass"
- https://proton.me/support/how-to-use-pass-monitor — "How to use Pass Monitor" (breach alerting)
- https://proton.me/support/dark-web-monitoring — "How to use Dark Web Monitoring"
- https://proton.me/support/pass-setup — "How to set up the Proton Pass browser extension"
- https://proton.me/support/how-to-use-proton-pass-desktop-app — "How to use the Proton Pass desktop app"
- https://proton.me/support/proton-sentinel — "Proton Sentinel"
- https://proton.me/blog/proton-pass-cli — "Introducing CLI for Proton Pass" (published 2025-11-25)
- https://proton.me/support/authenticator — "Proton Authenticator support" (separate standalone TOTP app — adjacent product)

### LLMS_TXT
- https://proton.me/llms.txt → 404 ABSENT
- https://proton.me/support/llms.txt → 404 ABSENT

### MD_MIRROR
- https://proton.me/support/pass-export.md → 404 ABSENT

### MCP
- ABSENT. No MCP references found in Proton Pass docs.

### PACKAGES
- No npm/brew package verified for the Pass CLI (blog links only to localized copies of itself; install channel not confirmed by a command I ran) — recorded as NOT VERIFIED.
- Official apps on GitHub (below), no registry packages found.

### GITHUB
- protonpass/android-pass | 775 stars | pushed 2026-07-28
- protonpass/ios-pass | 299 stars
- ProtonMail/WebClients | 5,585 stars | pushed 2026-09-15 | "Monorepo hosting the proton web clients" (includes Pass web)

### HN_SEEDS
- 36784326 | Proton Pass: Open-Source and Encrypted Password Manager App | 110
- 35638902 | Proton announces Proton Pass, a password manager | 90
- 36507707 | Proton Pass end-to-end encrypted password manager is here and free for everyone | 94

### PRICING
- Prices are client-rendered; server HTML shows placeholders ("Billed at $0.00 every month. undefined% off") — exact dollar figures NOT capturable via curl (recorded honestly).
- Structure verbatim from page text: "Proton Free ... No credit card required. Unlimited logins, notes and credit cards. Unlimited devices ... Passkeys supported on all devices"; "Pass Plus ... Get everything in Free, plus: Unlimited hide-my-email aliases, Built-in 2FA authenticator, Secure vault sharing, Secure link sharing, Dark Web Monitoring, File attachment ... Command line interface (CLI)"; "Pass Family ... 6 Pass Plus accounts"; "Proton Unlimited" bundle.

### NOTES
- NEW since 2025: official Proton Pass CLI (blog 2025-11-25): "view, create, update, and delete items ... vaults ... operate in CI/CD, servers, containers, and headless environments". CLI is a PAID feature (Pass Plus and up). This flips Proton Pass from non-drivable to partially agent-drivable (paid, no public API, no MCP).
- Built-in 2FA authenticator (TOTP) is Plus+; free plan has unlimited logins AND passkeys.
- Export supported (pass-export: PGP-encrypted JSON, plain JSON, or CSV per page) — no TOTP lock-in.
- Proton also ships a separate free "Proton Authenticator" app (support page live) — worth a mention or its own product later.
- No self-hosting of the Proton server; clients are open source (GPL) in protonpass/* and WebClients.

---

## ente-auth

### URLS
- Site: `200 https://ente.com/auth/` (ente.io → ente.com migration; old URLs redirect)
- Docs root: `200 https://ente.com/help/` (help.ente.io redirects here); Auth docs: https://ente.com/help/auth/
- Changelog: `200 https://ente.com/help/auth/changelog` — "Ente Auth - Changelog"
- GitHub: `200 https://github.com/ente/ente` (org renamed: github.com/ente-io/ente redirects to ente/ente; gh API shows both resolve to ente/ente)
- Pricing: Auth has no pricing page — free (see PRICING)

### EXTRA_DOCS (all fetched 200 with titles)
- https://ente.com/help/auth/ — "Ente Auth"
- https://ente.com/help/auth/faq/ — "FAQ - Auth"
- https://ente.com/help/auth/migration/export — "Exporting your data from Ente Auth"
- https://ente.com/help/auth/migration/import — "Migrating from other providers"
- https://ente.com/help/auth/migration/authy/ — "Migrating from Authy"
- https://ente.com/help/auth/migration/microsoft-authenticator/ — "Migrating from Microsoft Authenticator"
- https://ente.com/help/auth/features/offline-mode — "Using offline mode safely - Auth"
- https://ente.com/help/auth/faq/enteception/ — "Enteception" (storing Ente's own 2FA in Ente)
- https://ente.com/help/self-hosting/ — "Quickstart - Self-hosting" (official, first-party self-host docs)
- https://ente.com/blog/auth-v4/ — "Auth v4"
- https://ente.com/reliability/ — "Reliability and Replication"

### LLMS_TXT
https://ente.com/llms.txt → 200, first lines exactly:
```
# Ente

> Ente builds private, end-to-end encrypted apps for photos, two-factor authentication codes, and files. Ente's apps and server are open source, and user data is encrypted before it leaves the user's device.

## Products
```

### MD_MIRROR
- https://ente.com/help/auth/changelog.md → returns HTML (`<!DOCTYPE html>`), NOT markdown — ABSENT.

### MCP
- ABSENT. No MCP server found.

### PACKAGES
- `brew info --json=v2 ente-cli` → formula `ente-cli` stable `0.3.0`, desc: "Utility for exporting data from Ente and decrypt the export from Ente Auth", license AGPL, homepage github.com/ente-io/
- CLI source verified in monorepo: `gh api repos/ente-io/ente/contents/cli` lists files (Dockerfile etc.)
- npm: ABSENT.

### GITHUB
- ente/ente | 28,906 stars | pushed 2026-09-15 | "💚 End-to-end encrypted cloud for everything." (AGPL-3.0 per site: "20k+ stars AGPL-3.0")

### HN_SEEDS (only 2 qualify with >5 comments)
- 40883839 | Ente Auth: open-source Authy alternative for 2FA | 201
- 37714283 | Ente-io-auth: open-source 2FA app for Android, iOS and web | 8

### PRICING (verbatim from live ente.com/auth/)
- "Free and open source. Ente is fully open source. You can export and import your data. No lockins." Ente Auth is free (Ente Photos is the paid product).

### NOTES
- Best-in-class export honesty: dedicated export doc (plaintext or encrypted export), bulk import, per-competitor migration guides — including the Authy guide that documents Authy's lock-in.
- Fully open source client + server (AGPL), official self-hosting quickstart, brew CLI that can "export ... and decrypt the export from Ente Auth" → agent-drivable for read/export workflows (no full write API for Auth via CLI).
- Org/domain migration (ente.io→ente.com, ente-io→ente on GitHub) — update any stored URLs.

---

## 2fas

### URLS
- Site: `200 https://2fas.com/`
- Product pages: `200 https://2fas.com/auth/`, `200 https://2fas.com/pass/` (2FAS Pass is a new local-first password manager)
- Support root: `200 https://2fas.com/support/` (2fas.com/help/ → 404; support.2fas.com redirects to /support/)
- Changelog: ABSENT as a page (GitHub releases per repo)
- GitHub: `200 https://github.com/twofas/2fas-android`, `200 https://github.com/twofas/2fas-ios`
- Pricing: `200 https://2fas.com/pass/pricing/` and machine-readable `200 https://2fas.com/.well-known/pricing.md`

### EXTRA_DOCS (all fetched 200)
- https://2fas.com/auth/browser-extension/ — "2FAS Auth Browser Extension — 2FA for Your Browser"
- https://2fas.com/pass/browser-extension/ — "2FAS Pass Browser Extension"
- https://2fas.com/auth/how-to-enable-2fa/ — service-by-service 2FA tutorials
- https://2fas.com/download/ — "Download 2FAS Authenticator and 2FAS Password Manager"
- https://2fas.com/pass/recovery/ — "2FAS Pass | Recovery"
- https://2fas.com/donate/ — "Donate to 2FAS"
- https://2fas.com/help-center/ — "2FAS Help Center"
- https://2fas.com/support/2fas-auth-mobile-app/which-imports-are-supported-in-the-2fas-app/ — "Which imports are supported in the 2FAS Auth?"
- https://2fas.com/support/2fas-auth-security-privacy/is-2fas-backup-safe/ — "Is 2FAS Auth Backup safe?"

### LLMS_TXT
https://2fas.com/llms.txt → 200, first lines exactly:
```
# 2FAS — Password Manager and Authenticator

> Local-first password manager (2FAS Pass), open-source two-factor authentication app (2FAS Auth), and end-to-end encrypted sharing service (2FAS Share — https://share.2fas.com). Store passwords and 2FA tokens on your device — no mandatory server, no account required, full data ownership. Native mobile apps (iOS, Android), browser extensions (Chrome, Firefox, Edge, Safari, Brave, Opera).

> This is a curated index. For per-section detail (tutorials, legal documents, etc.) see the modular llms.txt files listed below.
```
Remarkably agent-forward: includes a "For AI agents — when to use 2FAS" section, explicit "Public API: **None.**", `Accept: text/markdown` / `?mode=agent` markdown rendering, `/llms-full.txt`, `/.well-known/pricing.md`, `/.well-known/schemamap.xml`.

### MD_MIRROR
- https://2fas.com/auth.md → 200, first heading exactly: `# 2FAS Auth — Free, Open-source 2FA Authenticator App` (note: /auth/index.md is 404; the pattern is `<path>.md` without trailing slash). `?mode=agent` and `Accept: text/markdown` verified to return the same markdown.

### MCP
- ABSENT — and explicitly declared: llms.txt says "There is no agent-callable REST/HTTP/A2A endpoint for token generation, vault access, or inference."

### PACKAGES
- `npm view @2fas/extension version` → `npm error 404 Not Found - GET https://registry.npmjs.org/@2fas%2fextension` — ABSENT on npm.
- Extensions distributed via browser stores; source at twofas/2fas-browser-extension.

### GITHUB
- twofas/2fas-android | 1,513 stars | pushed 2026-09-07
- twofas/2fas-ios | 749 stars | pushed 2026-09-15
- twofas/2fas-browser-extension | 365 stars | pushed 2026-09-14

### HN_SEEDS
- NONE qualifying. Honest negative: no 2FAS story found with num_comments > 5 (best: 45082327 "2fas – Store your passwords and 2FA Tokens locally" | 2 comments; 46188858 "2FAS Pass: Local-First Password Manager" | 1).

### PRICING (verbatim from live /.well-known/pricing.md)
- "## 2FAS Auth — free forever (authenticator) / **Price:** `$0` — no tiers, no premium, no in-app purchases, no advertising, no telemetry."
- 2FAS Pass: free tier + Premium; feature table verbatim from llms-full: "| Import / Export | ✓ | ✓ | | Multi-device Sync | ✗ | ✓ | | Item Limit | Up to 200 | Unlimited |"
- "## 2FAS Share — end-to-end encrypted sharing / **Price:** free service."
- Donations page live (/donate/).

### NOTES
- Export openness verified verbatim (llms-full.txt): backup files "with the extension *.2fas, are essentially text files in JSON format... if exported without a password, the file remains unencrypted, and all data, including sensitive information like your secret keys, is readable." Cross-platform export/import documented ("2FAS Backup, tap 'Export'").
- Their docs also independently confirm competitors' lock-in: "Authy and Microsoft Authenticator do not allow the codes to be exported from their app" and Google Authenticator's 10-services-per-QR export limit.
- Local-first by design: no account, no server API → agent-drivable NO (by intent), but the best machine-readable *docs* surface of the whole arena alongside 1Password.

---

## PROBE_CANDIDATES
Keyless read-only probes actually run on 2026-09-15, with exact matchable output snippets.

1. `curl -sL https://www.1password.dev/llms.txt | head -1`
   → `# 1Password Developer Documentation`
2. `curl -sL https://support.1password.com/llms.txt | head -1`
   → `# 1Password Support`
3. `curl -sL https://bitwarden.com/llms.txt | head -1`
   → `# Bitwarden`
4. `curl -sL https://ente.com/llms.txt | head -1`
   → `# Ente`
5. `curl -sL https://2fas.com/llms.txt | head -1`
   → `# 2FAS — Password Manager and Authenticator`
6. `curl -sL https://www.twilio.com/docs/llms.txt | head -6`
   → contains `## Authy: 2FA and Passwordless Login`
7. `curl -sL https://bitwarden.com/help/cli.md | head -1`
   → `# Password Manager CLI`
8. `curl -sL https://www.1password.dev/cli/get-started.md | sed -n '5p'`
   → `# Get started with 1Password CLI`
9. `curl -sL https://2fas.com/auth.md | head -1`
   → `# 2FAS Auth — Free, Open-source 2FA Authenticator App`
10. `curl -sL https://2fas.com/.well-known/pricing.md | head -1`
    → `# 2FAS Pricing`
11. `curl -sL -H "Accept: text/markdown" https://2fas.com/auth/ | head -1`
    → `# 2FAS Auth — Free, Open-source 2FA Authenticator App`
12. `npm view @bitwarden/cli version`
    → `2026.8.0`
13. `npm view @bitwarden/mcp-server version`
    → `2026.7.0`
14. `npx -y @bitwarden/cli --version`
    → last line `2026.6.0` (preceded by two "Could not find..." data-dir lines on first run; npx cache may lag registry latest)
15. Bitwarden MCP stdio handshake (keyless): pipe `{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"pa-probe","version":"0.0.1"}}}` into `npx -y @bitwarden/mcp-server`
    → stdout `{"result":{"protocolVersion":"2024-11-05","capabilities":{"tools":{}},"serverInfo":{"name":"Bitwarden MCP Server","version":"2026.7.0"}},"jsonrpc":"2.0","id":1}`; stderr `Bitwarden MCP Server running on stdio`
16. 1Password docs MCP remote handshake (keyless): `curl -s -X POST https://www.1password.dev/mcp -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"pa-probe","version":"0.0.1"}}}'`
    → SSE `data:` line containing `"serverInfo":{"name":"1Password Developer","version":"1.0.0"}`
17. `brew info --json=v2 1password-cli` → cask URL contains `/op2/pkg/v2.39.0/`
18. `brew info --json=v2 ente-cli` → formula stable `0.3.0`, desc "Utility for exporting data from Ente and decrypt the export from Ente Auth"
19. `npm view @2fas/extension version` → `npm error 404 Not Found` (negative probe, matchable)
20. `curl -s 'https://hn.algolia.com/api/v1/items/39360439'` → title `End of Life for Twilio Authy Desktop App`
21. `curl -sL 'https://www.twilio.com/docs/authy'` (strip tags) → contains `The Authy API is now closed to new customers and will be fully deprecated in the future.`
22. `curl -sL 'https://support.microsoft.com/en-us/authenticator/microsoft-authenticator-faqs'` (strip tags) → contains `Autofill on Microsoft Authenticator was discontinued in mid-August 2025.`
23. `curl -sL 'https://support.google.com/accounts/answer/1066447?hl=en' -A 'Mozilla/5.0'` (strip tags) → contains `Google encrypts Authenticator codes both in transit and at rest`; zero occurrences of `end-to-end`
24. Negative llms.txt probes (all 404): `proton.me/llms.txt`, `proton.me/support/llms.txt`, `authy.com/llms.txt`, `safety.google/llms.txt`, `support.microsoft.com/llms.txt`, `bitwarden.com/help/llms.txt`, `1password.com/llms.txt`, `ente.com/help/llms.txt`
25. Negative .md mirror probes: `support.google.com/accounts/answer/1066447.md` 404; `support.microsoft.com/en-us/authenticator/microsoft-authenticator-faqs.md` 404; `proton.me/support/pass-export.md` 404; `ente.com/help/auth/changelog.md` 200-but-HTML; `authy.com/features.md` 200-but-HTML
