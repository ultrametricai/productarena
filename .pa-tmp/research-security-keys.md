# Security Keys Arena — Live Market Research
Date: 2026-09-15. All URLs, versions, and quotes below were verified via commands run in this session (curl / gh api / npm / brew / uvx). Negative findings recorded explicitly.

---

## yubikey

### URLS
- 200 https://www.yubico.com/ (marketing)
- 200 https://developers.yubico.com/ (developer docs root)
- 200 https://docs.yubico.com/ (product docs; title: "Yubico Product Documentation")
- 200 https://www.yubico.com/store/ (store)
- 200 https://github.com/Yubico (GitHub org)
- 200 https://console.yubico.com/apidocs/ (title: "YubiKey as a Service API Documentation" — enterprise REST API)
- 200 https://docs.yubico.com/cloud-services/yubienterprise/delivery/ (H1: "Customer Portal User Guide" — YubiEnterprise Delivery docs; note the old path https://docs.yubico.com/yed/ is now 404)

### EXTRA_DOCS (all verified 200 with real content)
- https://developers.yubico.com/WebAuthn/ — H1 "WebAuthn Introduction"
- https://developers.yubico.com/Passkeys/ — H1 "Passkeys"
- https://developers.yubico.com/PIV/ — H1 "What is PIV?"
- https://developers.yubico.com/PIV/Introduction/PIV_attestation.html — H1 "PIV Attestation"
- https://developers.yubico.com/PGP/ — H1 "What is PGP?"
- https://developers.yubico.com/OTP/ — H1 "What is Yubico OTP?"
- https://developers.yubico.com/OATH/ — H1 "What is OATH?" (TOTP/HOTP)
- https://developers.yubico.com/SSH/ — H1 "Securing SSH with the YubiKey"
- https://developers.yubico.com/SSH/Securing_SSH_with_FIDO2.html — H1 "Securing SSH Authentication with FIDO2 Security Keys"
- https://developers.yubico.com/yubikey-manager/ — H1 "YubiKey Manager CLI"
- https://developers.yubico.com/python-fido2/ — H1 "python-fido2"
- https://developers.yubico.com/yubikit-android/ — H1 "Yubico Mobile SDK (YubiKit) for Android"
- https://developers.yubico.com/yubikit-ios/ — H1 "Yubico Mobile iOS SDK - YubiKit 2.0.0"
- https://developers.yubico.com/java-webauthn-server/ — H1 "java-webauthn-server"
- https://developers.yubico.com/Developer_Program/ — H1 "About the Yubico Developer Program"
- https://docs.yubico.com/yesdk/ — title ".NET YubiKey SDK"
- https://docs.yubico.com/software/yubikey/tools/ykman/ — title "YubiKey Manager (ykman) CLI User Guide"
- https://docs.yubico.com/hardware/yubikey/yk-tech-manual/ — title "YubiKey Technical Manual"
- https://docs.yubico.com/hardware/yubikey/yk-tech-manual/yk5-firmware-overview.html — firmware policy source (quote in NOTES)
- https://www.yubico.com/support/security-advisories/ — og:title "Security advisories"
- https://www.yubico.com/products/yubienterprise-delivery/ — 200 (SPA, title rendered client-side)
- https://www.yubico.com/products/yubienterprise-subscription/ — 200 (SPA)
- https://www.yubico.com/product/yubikey-5c-nfc/ — title "USB-C YubiKey 5C NFC Two-Factor Security Key | Yubico"

### LLMS_TXT
ABSENT on all three hosts (verified):
- https://docs.yubico.com/llms.txt → 404 (nginx "404 Not Found")
- https://developers.yubico.com/llms.txt → 404 (HTML)
- https://www.yubico.com/llms.txt → 404 (HTML)

### MD_MIRROR
ABSENT. `https://developers.yubico.com/WebAuthn/index.md` → HTTP 300 "Multiple Choices" ("The document name you requested (/WebAuthn/index.md) could not be found").

### MCP
- No official MCP. `mcp.yubico.com` does not resolve (dig A: empty). Zero "MCP" mentions on developers.yubico.com homepage.
- Community (GitHub search "yubikey mcp"): `dazaffino/mcp-server-yubikey` — 0 stars, pushed 2026-06-24, "MCP server that exposes YubiKey management tools to AI agents via the ykman CLI"; `LemonHaze420/mcp-hatd` — 0 stars, pushed 2026-07-23 (YubiKey presence-check MCP). Both hobby-grade.

### PACKAGES (exact outputs)
- PyPI: `yubikey-manager 5.9.2`; `fido2 2.2.1` (Yubico's python-fido2); `yubico-client 1.13.0` (OTP validation client; third-party maintainer, not verified as official)
- npm: no official Yubico packages found. Registry search "yubico" returns only community OTP clients (yub 0.11.1, yubico 0.1.2, yubico-node 1.0.3, etc.). `npm view yubikey-manager version` → E404.
- brew: `ykman` stable 5.9.2, desc "Tool for managing your YubiKey configuration", license BSD-2-Clause, homepage developers.yubico.com/yubikey-manager/; `libfido2 1.17.0 - Provides library functionality for FIDO U2F & FIDO 2.0, including USB` (Yubico's C library)
- uvx probe: `uvx --from yubikey-manager ykman --version` → `YubiKey Manager (ykman) version: 5.9.2`

### GITHUB
- Yubico/yubikey-manager | stars: 1187 | pushed: 2026-09-12 | latest release 5.9.2 (2026-06-30)
- Yubico/python-fido2 | stars: 543 | pushed: 2026-06-29
- Yubico/libfido2 | stars: 735 | pushed: 2026-08-18
- Yubico/yubikit-android | stars: 157 | pushed: 2026-09-14
- Yubico/yubikit-ios | stars: 235 | pushed: 2026-02-27
- Yubico/java-webauthn-server | stars: 562 | pushed: 2026-09-15

### HN_SEEDS
- 41434500 | EUCLEAK Side-Channel Attack on the YubiKey 5 Series | 278 comments
- 24663989 | Pressing YubiKeys | 235 comments
- 35091768 | How to Yubikey | 172 comments

### PRICING
- YubiKey 5C NFC: "$58 USD" (verbatim from https://www.yubico.com/product/yubikey-5c-nfc/)
- Enterprise: YubiEnterprise Subscription + YubiEnterprise Delivery (pages 200); "YubiKey as a Service API Documentation" at console.yubico.com/apidocs/ (REST API for fleet delivery/inventory).

### NOTES
- Firmware is closed-source and NOT updatable. Verbatim from https://docs.yubico.com/hardware/yubikey/yk-tech-manual/yk5-firmware-overview.html: "Once programmed, YubiKeys cannot be updated to another version. The firmware cannot be altered or removed from a YubiKey."
- Broadest protocol surface in the arena: FIDO2/WebAuthn + resident keys, PIV smart card, OpenPGP, Yubico OTP, OATH TOTP/HOTP, FIDO2 SSH — each with its own doc section (URLs above).
- Agent manageability: strong via `ykman` CLI (pip/brew, exact version probes above) and the .NET SDK; enterprise REST API exists (console.yubico.com/apidocs/). No llms.txt, no .md mirrors, no MCP — docs are human-oriented HTML.
- EUCLEAK (2024 side-channel, Infineon lib) is the notable security event; advisories page live at yubico.com/support/security-advisories/.

---

## google-titan

### URLS
- 200 https://cloud.google.com/security/products/titan-security-key (redirect target of cloud.google.com/titan-security-key; marketing/product)
- 200 https://store.google.com/product/titan_security_key?hl=en-US (store)
- 200 https://support.google.com/titansecuritykey/ (docs root = help center, title "Titan Security Key Help")
- GitHub: none for Titan itself (no Titan firmware repo; firmware is closed — see NOTES). No changelog/release-notes page exists (negative finding).

### EXTRA_DOCS
- https://support.google.com/titansecuritykey/answer/9115487 — title "About Titan Security Keys - Titan Security Key Help"
- https://support.google.com/titansecuritykey/answer/9148044 — title "Add a Titan Security Key on a Linux system"
- https://support.google.com/accounts/answer/6103523 — title "Use a security key for 2-Step Verification"
- Help-center topic list also links (verified anchors on the 200 index page): "Charge your Titan Security Key" (answer/9124662), "Restart a Titan Security Key that's not working" (answer/9115813), "Stop using a security key" (answer/9115656), "Unpair a Bluetooth Titan Security Key" (answer/9398011)
- Only ~7-8 real doc pages exist in total — Titan has the thinnest documentation surface in this arena (honest negative: could not reach 12 distinct doc URLs of substance).

### LLMS_TXT
ABSENT: https://cloud.google.com/llms.txt → 404; https://store.google.com/llms.txt → 404 (Google "Error 404 (Not Found)!!1").

### MD_MIRROR
ABSENT: https://support.google.com/titansecuritykey/answer/9115487.md → 404 ("Sorry, this page can't be found.").

### MCP
None. No developer API, no CLI, no SDK, no MCP for Titan at all (negative finding — Titan is consumer/enterprise hardware managed only through Google Account / Workspace admin UIs).

### PACKAGES
None exist (npm/PyPI/brew: no Titan-specific packages; nothing to record — negative finding).

### GITHUB
No Titan repo. (Google's open-source FIDO2 firmware project OpenSK exists but is not stated by Google to be Titan's firmware; Feitian sells an OpenSK dongle — see feitian section.)

### HN_SEEDS
- 17610516 | Google Unveils Titan Security Key, a Yubico-Like Phishing Resistant 2FA Device | 142 comments
- 17875658 | Google Titan Security Key now available | 139 comments
- 19921360 | Security Issue with Bluetooth Low Energy (BLE) Titan Security Keys | 23 comments

### PRICING
- Google Store product page (static HTML): "From $30". Two current models on page: "USB-A/NFC Security Key" and "USB-C/NFC Security Key".

### NOTES
- Current positioning (verbatim from cloud.google.com/security/products/titan-security-key): "Titan Security Keys are built with a hardware chip that includes firmware engineered by Google to verify the key's integrity." and "Works with popular devices, browsers, and a growing set of apps that support FIDO standards."
- Manufacturing: 2018-era reporting said the original Titan key was made by Feitian (HN 17880738 "Google's new hardware security key was made by a Chinese company", 2 comments; 2018). Google's current pages say only "firmware engineered by Google" — do not claim current keys are Feitian-made; not verifiable from vendor sources.
- FIDO-only device (no PIV/PGP/OTP). The BLE model had a 2019 security recall-adjacent issue (HN 19921360) and Bluetooth models are legacy ("Unpair a Bluetooth Titan Security Key" help article remains).
- Compatibility quote from About article: "Works with computers through USB running Chrome version 67 or above… Works with compatible Android and iOS devices through NFC."
- Agent manageability: effectively zero (no CLI/API).

---

## nitrokey

### URLS
- 200 https://www.nitrokey.com/ (marketing)
- 200 https://docs.nitrokey.com/ (docs root)
- 200 https://github.com/Nitrokey (GitHub org)
- 200 https://shop.nitrokey.com/shop (store)
- 200 https://www.nitrokey.com/news (news/announcements; firmware changelogs live on GitHub releases)

### EXTRA_DOCS (all 200)
- https://docs.nitrokey.com/nitrokeys/ — "Nitrokeys - Nitrokey Documentation"
- https://docs.nitrokey.com/nitrokeys/nitrokey3/index.html — "Nitrokey 3 - Nitrokey Documentation"
- https://docs.nitrokey.com/nitrokeys/features.html — "Features - Nitrokey Documentation"
- https://docs.nitrokey.com/nitrokeys/features/fido2/index.html — "FIDO2 - Nitrokey Documentation"
- https://docs.nitrokey.com/nitrokeys/features/fido2/ssh.html — "SSH Authentication with FIDO2"
- https://docs.nitrokey.com/nitrokeys/features/openpgp-card/index.html — "OpenPGP Card - Nitrokey Documentation"
- https://docs.nitrokey.com/nitrokeys/features/piv/index.html — "PIV (Personal Identity Verification) - Nitrokey Documentation"
- https://docs.nitrokey.com/nitrokeys/features/encrypted-storage/index.html — "Encrypted Mobile Storage"
- https://docs.nitrokey.com/nitrokeys/nitrokey3/firmware-update.html — "Firmware Update - Nitrokey Documentation"
- https://docs.nitrokey.com/software/nitropy/ — "nitropy - Nitrokey Documentation"
- https://www.nitrokey.com/products/nitrokeys — H1 "Nitrokeys" (model comparison)
- https://shop.nitrokey.com/shop/nk3an-nitrokey-3a-nfc-147 — "Nitrokey 3A NFC | shop.nitrokey.com"

### LLMS_TXT
ABSENT: https://docs.nitrokey.com/llms.txt → 404; https://www.nitrokey.com/llms.txt → 404.

### MD_MIRROR
ABSENT: https://docs.nitrokey.com/nitrokeys/nitrokey3/index.md → HTTP 200 but returns the HTML page (Sphinx soft-200, not markdown).

### MCP
None. GitHub search "nitrokey mcp" → total_count 0. `mcp.nitrokey.com` does not resolve.

### PACKAGES (exact outputs)
- PyPI: `pynitrokey 0.13.0` (CLI), `nitrokey 0.4.2` (Python SDK, docs reference software/nitrokey-sdk-py)
- brew: `Error: No available formula with the name "nitropy".` (negative)
- npm: nothing official (registry search "nitrokey" returns only an unrelated PKCS#11 random package)
- uvx probe: `uvx --from pynitrokey nitropy version` → `Command line tool to interact with Nitrokey devices 0.13.0` / `0.13.0`

### GITHUB
- Nitrokey/nitrokey-3-firmware | stars: 394 | pushed: 2026-09-15 | latest release v1.8.3 (2025-10-14)
- Nitrokey/pynitrokey | stars: 122 | pushed: 2026-09-15 | latest release v0.13.0 (2026-09-02)
- Nitrokey/nitrokey-app2 | stars: 122 | pushed: 2026-09-13
- trussed-dev/trussed (Rust firmware framework used by Nitrokey 3) | stars: 503 | pushed: 2026-07-22

### HN_SEEDS
- 35706858 | NitroKey disappoints me | 66 comments
- 24294307 | Nitrokey | 97 comments
- 35336610 | OpenPGP master key on Nitrokey Start | 29 comments

### PRICING (verbatim, shop.nitrokey.com, EUR)
- Nitrokey 3A NFC: "60.00 €" (span oe_currency_value)
- Nitrokey 3C NFC: 65.00 (€)
- Nitrokey Passkey: 32.00 (€)
- Shop also lists "Nitrokey Business Subscription" and "Nitrokey Business Fulfillment" (enterprise offerings).

### NOTES
- Open-source firmware in Rust (nitrokey-3-firmware, on the Trussed framework) and field-updatable — dedicated Firmware Update doc page + GitHub releases (v1.8.3). Direct contrast with Yubico's non-updatable closed firmware.
- Protocols: FIDO2, OpenPGP card, PIV, encrypted storage, secrets/OTP app (SDK module nitrokey.nk3.secrets_app referenced in docs).
- German company; "NitroKey disappoints me" (HN 35706858) is a known critical community thread — good balance evidence.
- Agent manageability: good — `nitropy` CLI installable via pip/uvx (probe above), Python SDK on PyPI. No llms.txt/MCP/.md mirrors.

---

## solokeys

### URLS
- 200 https://solokeys.com/ (marketing + Shopify store)
- 200 https://docs.solokeys.dev/ (docs root; title "Solo Technical Documentation" — covers Solo 1)
- 200 https://solo2.dev → redirects to https://hackmd.io/@solokeys/solo2-getting-started ("Solo 2 Getting Started (for developers) - HackMD")
- 200 https://github.com/solokeys (GitHub org)
- Changelog: GitHub releases only (solo2 latest tag 2.964.0, 2022-08-25)

### EXTRA_DOCS
- https://docs.solokeys.dev/ — H1 "Home" (Solo Technical Documentation)
- https://docs.solokeys.dev/fido2-impl/ — "FIDO2 Implementation", H1 "Key generation"
- https://docs.solokeys.dev/customization/ — "Customization"
- https://docs.solokeys.dev/building/ — "Build instructions", H1 "Building solo"
- https://solo2.dev — Solo 2 developer getting-started (HackMD, not a real docs site — honest negative: Solo 2 has no dedicated docs portal)
- https://solokeys.com/collections/all — store catalog
- Thin surface overall (< 12 substantive doc pages; recorded honestly).

### LLMS_TXT
PRESENT at store level, ABSENT at docs level:
- https://solokeys.com/llms.txt → 200, content-type text/markdown. Exact first 6 lines:
  ```
  # Agent Instructions — SoloKeys
  (blank)
  This document describes how AI agents can interact with SoloKeys's online store at https://solokeys.com.
  (blank)
  ## For Personal Shopping Assistants and Agents Acting On Behalf of a User
  (blank)
  ```
  Caveat: this is a Shopify-platform-generated shopping-agent file (it recommends the shop.app SKILL.md); it is NOT product/technical documentation. Treated as data only.
- https://docs.solokeys.dev/llms.txt → 404.

### MD_MIRROR
ABSENT: https://docs.solokeys.dev/index.md → 404; https://solokeys.com/collections/all.md → 404 ("Not Found").

### MCP
None found (no vendor mention; no community repos surfaced in searches).

### PACKAGES (exact outputs)
- PyPI: `solo-python 0.1.1` (Solo 1 CLI); `solo2` → ABSENT (no such PyPI package)
- Probe (negative, reproducible): `uvx --from solo-python solo version` FAILS with `ImportError: cannot import name 'CTAP1' from 'fido2.ctap1'` — solo-python 0.1.1 is incompatible with current python-fido2 2.x; the Solo 1 CLI is effectively bit-rotted.
- npm: `npm view solokeys version` → E404. brew: none checked/known.

### GITHUB
- solokeys/solo1 | stars: 2383 | pushed: 2022-11-13 (dormant ~4 years)
- solokeys/solo2 | stars: 713 | pushed: 2026-08-20 | latest RELEASE 2.964.0 published 2022-08-25 (no firmware release in 4 years)
- solokeys/solo1-cli | stars: 196 | pushed: 2026-04-22
- Org still shows maintenance commits: solo2 last commits 2026-08-20 ("deps: update piv, fix secrets-app", "piv: update to v0.7"); fido-authenticator pushed 2026-08-17; ctap-types 2026-08-10.

### HN_SEEDS
Weak — recorded honestly. Only one story about a SoloKeys product clears >5 comments:
- 20648740 | Tell HN: Somu is live. Tiny, FIDO2, open source security key | 14 comments (Somu is a SoloKeys product; cf. 22055061 "Somu by solokeys – open-source security key")
- 25919556 | Tell HN: We launched Solo v2 – open security key | 5 comments (at, not above, threshold — flagged)
- No other qualifying SoloKeys-specific stories.

### PRICING (verbatim from solokeys.com/products.json)
- "Solo 2C Security Key (Built with Trussed®)" — 34.00
- "Solo 2 USB-A Security Key (Built with Trussed®)" — 35.00
- "Solo 2C+ NFC Security Key (Built with Trussed®)" — 46.00
- "Solo 2A+ NFC Hacker - Open Security Key for Developers" — 46.00
- "Limited Edition Solo 2C+ NFC Security Key" — 50.00
- Catalog also lists "Solo 1 Tap USB-A" (handle: solo-tap-usb-a-preorder) — 35.00
(Currency: store displays $ on collections page.)

### NOTES
- Fully open-source (firmware in Rust on Trussed — same framework family as Nitrokey; trussed-dev/trussed 503 stars). "Hacker" variants ship unlocked for reflashing.
- Project activity status (verified): repos receive dependency/CI commits as of Aug 2026, but the last tagged Solo 2 firmware release is 2.964.0 from 2022-08-25, Solo 1 repo dormant since 2022, and the Solo 1 Python CLI no longer runs against current deps. Fair description: alive but minimally maintained; no new firmware releases in 4 years.
- Docs for Solo 2 are a HackMD page rather than a maintained portal.
- Agent manageability: poor today (broken solo1 CLI; solo2 CLI not on PyPI).

---

## feitian

### URLS
- 200 https://www.ftsafe.com/products/FIDO (marketing; note: bare https://www.ftsafe.com redirects to https://portal.ftsafe.com/)
- 200 https://fido.ftsafe.com/ (FIDO docs portal, WordPress, title "FIDO Security Keys")
- 200 https://shop.ftsafe.us/ (US store, Shopify, "FEITIAN Technologies US")
- 200 https://feitiantech.github.io/ (bare index that links to OpenSK_USB docs)
- GitHub: https://github.com/FeitianSmartcardReader — User account, 67 public repos (mostly smartcard-reader SDKs: R301, iR301, mobile readers; no FIDO key firmware — their FIDO keys are closed-firmware except the OpenSK dongle)
- 403 https://download.ftsafe.com/ (Forbidden)

### EXTRA_DOCS (all 200)
- https://www.ftsafe.com/products/FIDO — H1 "FIDO Security Keys"
- https://www.ftsafe.com/Products/FIDO/Bio — H1 "BioPass FIDO® Series Biometric Security Keys"
- https://www.ftsafe.com/products/FIDO/Multi — H1 "MultiPass FIDO® Series Multi-interface Security Keys"
- https://www.ftsafe.com/Support — "Support | FEITIAN"
- https://fido.ftsafe.com/setup-keys/ — "Setup Keys – FIDO Security Keys"
- https://fido.ftsafe.com/register-key-to-platforms/ — "Register key to platforms – FIDO Security Keys"
- https://fido.ftsafe.com/piv-related/ — "PIV Related – FIDO Security Keys"
- https://fido.ftsafe.com/faq/ — "FAQ – FIDO Security Keys"
- https://fido.ftsafe.com/2-factor-authentication-related/, /fido-related/, /catalog/, /guide-2/, /other-usages/ (linked from verified nav of fido.ftsafe.com)
- https://feitiantech.github.io/OpenSK_USB — title "Feitian OpenSK USB Dongle" (open-source-firmware dev key based on Google's OpenSK)

### LLMS_TXT
ABSENT: https://www.ftsafe.com/llms.txt → HTTP 200 but returns the normal HTML site (soft-404, no llms.txt); https://feitiantech.github.io/llms.txt → 404.

### MD_MIRROR
ABSENT: https://fido.ftsafe.com/setup-keys/index.md → 404.

### MCP
None. `mcp.ftsafe.com` does not resolve. No community MCP repos found.

### PACKAGES
None on npm/PyPI/brew (negative finding). SDKs are distributed as GitHub repos under FeitianSmartcardReader (e.g. Feitian-PCSC-SDK, 2 stars, pushed 2026-03-13) — reader SDKs, not FIDO-key management tools.

### GITHUB
- FeitianSmartcardReader (User) | 67 public repos | most-starred recent: FEITIAN_MOBILE_READERS 28 stars (pushed 2025-11-07), R301 16 stars (pushed 2026-03-17)
- No public FIDO-key firmware repo (closed firmware), except the OpenSK-based dev dongle documented at feitiantech.github.io/OpenSK_USB.

### HN_SEEDS
No qualifying stories (recorded honestly). Only 2018 items about Titan manufacturing, both below threshold: 17880738 "Google's new hardware security key was made by a Chinese company" (2 comments), 17879972 (0 comments).

### PRICING (verbatim from shop.ftsafe.us/products.json)
- "K9B USB-A NFC Security Key - Green" (ePass FIDO2/U2F) — 38.00
- "K39 USB-C Security Key" — 28.50
- "K28e USB-C Micro Security Key" — 30.00
- "K45 Biometric Security Key" (BioPass) — 60.00
- "K45+ Biometric PIV Security Key" — 61.50
- "K49+ Biometric PIV Security Key" / "K50+ Biometric PIV Security Key" — 71.50 each
(USD; Shopify store.)

### NOTES
- Large Chinese OEM/budget vendor; broad catalog: ePass (standard FIDO2/U2F), BioPass (fingerprint), MultiPass (multi-interface), plus PIV-capable "+" models, OTP display tokens (C200/C300 TOTP/HOTP), and smartcard readers — all verified on shop.ftsafe.us product feed.
- Historic link to Google Titan (2018 press reporting only — see google-titan NOTES; do not state for current models).
- Docs are scattered across three hosts (ftsafe.com marketing, fido.ftsafe.com WordPress guides, feitiantech.github.io); main domain redirect to portal.ftsafe.com makes the marketing site awkward to reach.
- Agent manageability: none first-party (no CLI/API); keys are standard CTAP2 so third-party tools (libfido2, Token2 fido2-manage) can manage them.

---

## token2

### URLS
- 200 https://www.token2.com/ (marketing + shop; https://www.token2.swiss redirects here)
- 200 https://www.token2.com/shop/category/fido2-keys (store category, H1 "All FIDO2 Keys")
- Docs root: no separate docs site; docs live under /site/page/* and /tools/* (verified below)
- GitHub: https://github.com/token2 — User account, 54 public repos
- Changelog: per-tool GitHub releases; no central release-notes page (negative)

### EXTRA_DOCS (all 200)
- https://www.token2.com/site/page/fido2-security-keys-faq — H1 "FIDO2 Security Keys: FAQ"
- https://www.token2.com/site/page/integration-guides — H1 "Integration guides"
- https://www.token2.com/site/page/piv-management-tools-minidriver — H1 "PIV Management Tools & MiniDriver"
- https://www.token2.com/site/page/tools-for-fido-security-keys — H1 "Tools for FIDO security keys"
- https://www.token2.com/tools/fido2-demo — title "FIDO2 / Passkeys Demo"
- https://www.token2.com/tools/totp-toolset — H1 "TOTP Toolset"
- https://www.token2.com/site/page/tools-for-programmable-tokens (linked from verified homepage nav)

### LLMS_TXT
ABSENT: https://www.token2.com/llms.txt → 404 (HTML shop page).

### MD_MIRROR
ABSENT: https://www.token2.com/shop/category/fido2-keys.md → 404.

### MCP
None. `mcp.token2.com` does not resolve. No community MCP found.

### PACKAGES
Nothing on npm/PyPI/brew (negative). Tooling ships via GitHub (see below) and Windows binaries on the site.

### GITHUB (github.com/token2, User, 54 repos)
- token2/fido2-manage | stars: 112 | pushed: 2026-09-11 | "An open-source FIDO2.1 key management tool (with a GUI) under different platforms"
- token2/fido2_bulkenroll_entraid | stars: 18 | pushed: 2026-09-14 | "FIDO2 Key Automated Registration for Entra ID - PowerShell Solution"
- token2/librekeycompanion (Android, 16 stars) + librekeycompanion_ios (6 stars) | "open-source, manufacturer-agnostic manager for hardware security keys"
- token2/token2-otp-applet | 3 stars | "Token2 OTP applet for NXP-based FIDO2 security keys and cards"

### HN_SEEDS
None. No on-topic Token2 hardware stories exist on HN (query "token2" returns crypto-conference and unrelated items) — recorded as a genuine negative.

### PRICING (verbatim from shop category page, displayed in $)
- "Token2 Pico - RP2350-Based FIDO2 Security Key" — $8.08
- "KeyTen NFC FIDO2, U2F and TOTP Security Key" — $20.77
- "PIN+ Mini-A Release3.2 FIDO2, U2F and TOTP Security Key with PIN complexity" — $23.08
- "PIN+ Release3.3 USB-A - FIDO2, U2F, PIV and TOTP Security Key with PIN complexity feature" — $25.39
(Swiss vendor; site shows converted USD prices, hence odd cents.)

### NOTES
- Budget Swiss FIDO2 vendor; cheapest certified-adjacent keys in the arena ($8–26). Distinctives verified from product names: PIN-complexity enforcement ("PIN+" line), TOTP on-key, PIV on Release3.3, RP2350-based $8 Pico key.
- Surprisingly strong provisioning/automation story for a budget vendor: fido2-manage CLI/GUI (112 stars, cross-platform, FIDO2.1 credential management) and a PowerShell bulk-enrollment tool for Entra ID — both open source and directly usable by agents.
- No llms.txt/.md/MCP/registry packages; docs are basic e-commerce CMS pages but real and current.

---

## ledger

### URLS
- 200 https://www.ledger.com/ (marketing)
- 200 https://developers.ledger.com/ (developer docs root)
- 200 https://support.ledger.com/ (help center)
- 200 https://shop.ledger.com/ (store)
- 200 https://github.com/LedgerHQ (org; FIDO app repo below)
- Changelog: https://developers.ledger.com/docs/news.md (200, verbatim first line: "# 3rd quarter of 2026")

### EXTRA_DOCS
- https://developers.ledger.com/docs/ai-tools/hardware-security/security-key — title "Security Key - Ledger Developer Portal", H1 "Security Key"
- https://developers.ledger.com/docs/ai-tools/hardware-security/security-key.md — 200 markdown; frontmatter: `title: Security Key`, description "How your Ledger acts as a FIDO2 hardware security key to gate access to services like GitHub, npm, and 1Password."; body: "Your Ledger can act as a FIDO2 hardware security key… The Security Key app on Ledger supports FIDO2 and U2F."
- https://developers.ledger.com/docs/ai-tools/hardware-security/open-pgp.md — listed in llms.txt: "Use your Ledger signer as an OpenPGP hardware key to protect secrets used by agents."
- https://developers.ledger.com/docs/ai-tools/ledger-dmk-skills — title "Ledger DMK Skills" ("Markdown skills for coding agents (Claude Code, Cursor, Cline)")
- https://developers.ledger.com/docs/device-app/getting-started — "Getting started - Ledger Developer Portal"
- https://developers.ledger.com/docs/device-app/getting-started.md — 200, includes `agent_config` frontmatter pointing to https://raw.githubusercontent.com/LedgerHQ/ledger-app-ai-instructions/master/CLAUDE.md
- https://developers.ledger.com/docs/connectivity/ledgerJS/getting-started — 200 (LedgerJS; deprecated per news.md: "all LedgerJS packages (hw-app-*, hw-transport-*) are deprecated from that date [Sept 2026]")
- https://support.ledger.com/article/12350325732893-zd — 200 (Security Key app setup guide, linked from security-key.md; SPA so title not in static HTML)
- https://shop.ledger.com/products/ledger-nano-s-plus — "Buy Ledger Nano S Plus Hardware Wallet | Ledger"

### LLMS_TXT
PRESENT: https://developers.ledger.com/llms.txt → 200, text/plain. Exact first 6 lines:
```
# Ledger Developer Portal

> Technical documentation for developers building on Ledger's hardware security infrastructure. Covers native device apps, hardware interaction SDKs, Ledger Wallet integrations, Clear Signing, Ledger Wallet Provider, and AI agent tooling.
> Audience: blockchain developers, wallet integrators, dApp builders, and hardware security engineers.
> Base URL: https://developers.ledger.com

```
(www.ledger.com/llms.txt → 404.)

### MD_MIRROR
PRESENT: https://developers.ledger.com/docs/news.md → 200; exact first heading: `# 3rd quarter of 2026`. All /docs/* pages appear mirrored (.md verified on news, getting-started, security-key), some with agent_skills/agent_config frontmatter.

### MCP
No MCP: 0 matches for "MCP"/"Model Context Protocol" in developers.ledger.com/llms.txt; mcp.ledger.com does not resolve. Their agent surface is markdown skills + CLAUDE.md instruction files (ledger-dmk-skills, LedgerHQ/ledger-app-ai-instructions), not MCP. GitHub "ledger mcp" hits are accounting-ledger tools (minhyeoky/mcp-server-ledger 51 stars = Ledger CLI accounting, NOT LedgerHQ) — flagged to avoid false attribution.

### PACKAGES (exact outputs)
- npm: `@ledgerhq/hw-transport` 6.36.0; `@ledgerhq/hw-app-eth` 7.8.18 — but news.md states all LedgerJS hw-* packages are deprecated as of Sept 2026 (DMK is the successor)
- PyPI: `ledgerwallet 0.10.0` (device-app dev tool), `ledgerblue 0.1.58` (loader)
- None of these are FIDO-specific; there is no CLI/API for the Security Key app (negative finding).

### GITHUB
- LedgerHQ/app-security-key | stars: 21 | pushed: 2026-08-24 | no tagged releases (404 on releases/latest). README verbatim: "This application implements a U2F and CTAP2 Authenticator for Ledger devices."
- LedgerHQ/ledger-live | stars: 617 | pushed: 2026-09-15

### HN_SEEDS
None qualifying for the authenticator angle (recorded honestly): "ledger fido" / "ledger passkey" searches return no on-topic stories with >5 comments. Ledger's large HN presence concerns the crypto wallet (hacks, Ledger Recover), not FIDO2 usage — those would be misleading as arena seeds.

### PRICING
- Ledger Nano S Plus: JSON-LD offer verbatim `"price":"59","priceCurrency":"USD"` (shop.ledger.com, 1783 reviews, 4.44 rating in same JSON-LD).

### VERDICT — does ledger belong in this arena?
Borderline; recommend EXCLUDE from the core ranking or mark clearly as "secondary capability" if kept. Honest basis:
- For: real FIDO2/U2F authenticator app maintained by LedgerHQ (app-security-key, pushed 2026-08-24); first-party docs explicitly market "Use your Ledger as a FIDO2/WebAuthn security key for GitHub, npm, and 1Password"; hardware secure element; best-in-arena agent docs surface (llms.txt + .md mirrors + agent skills).
- Against: it is primarily a crypto wallet — the security-key function is one optional app among many; the FIDO app has 21 GitHub stars and no tagged releases; no NFC-tap UX comparable to dedicated keys; no PIV/OTP; price ($59+) buys a wallet, not an authenticator; zero HN/community discussion of Ledger-as-security-key. Evidence-judged against dedicated authenticators it would rank on marketing pages rather than authenticator substance. If the arena's judging includes "agent surface quality," note the paradox: the least-dedicated authenticator has the best agent-readable docs.

---

## PROBE_CANDIDATES
Keyless, read-only probes actually run this session, with exact matchable output snippets:

1. `curl -s https://pypi.org/pypi/yubikey-manager/json | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['info']['name'], d['info']['version'])"`
   → `yubikey-manager 5.9.2`
2. `curl -s https://pypi.org/pypi/fido2/json | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['info']['name'], d['info']['version'])"`
   → `fido2 2.2.1`
3. `curl -s https://pypi.org/pypi/pynitrokey/json | ...same...` → `pynitrokey 0.13.0`
4. `curl -s https://pypi.org/pypi/nitrokey/json | ...same...` → `nitrokey 0.4.2`
5. `curl -s https://pypi.org/pypi/solo-python/json | ...same...` → `solo-python 0.1.1`
6. `uvx --from yubikey-manager ykman --version` → `YubiKey Manager (ykman) version: 5.9.2`
7. `uvx --from pynitrokey nitropy version` → last lines: `Command line tool to interact with Nitrokey devices 0.13.0` then `0.13.0`
8. `uvx --from solo-python solo version` → FAILS: `ImportError: cannot import name 'CTAP1' from 'fido2.ctap1'` (deliberate negative probe: SoloKeys CLI bit-rot)
9. `npm view @ledgerhq/hw-transport version` → `6.36.0`
10. `npm view @ledgerhq/hw-app-eth version` → `7.8.18`
11. `brew info --json=v2 ykman` → contains `"name": "ykman"` ... `"stable": "5.9.2"`, desc `Tool for managing your YubiKey configuration`
12. `brew info --json=v2 libfido2` → `libfido2 1.17.0 - Provides library functionality for FIDO U2F & FIDO 2.0, including USB`
13. `curl -sL https://developers.ledger.com/llms.txt | head -1` → `# Ledger Developer Portal`
14. `curl -sL https://developers.ledger.com/docs/news.md | head -1` → `# 3rd quarter of 2026` (NOTE: heading changes quarterly; match on `# ` + `quarter of` instead)
15. `curl -sL https://solokeys.com/llms.txt | head -1` → `# Agent Instructions — SoloKeys`
16. `curl -sL -o /dev/null -w "%{http_code}" https://docs.yubico.com/llms.txt` → `404` (negative probe)
17. `curl -sL https://solokeys.com/products.json` → JSON; contains `"title": "Solo 2C Security Key (Built with Trussed®)"` with variant `"price": "34.00"`
18. `curl -sL https://shop.ftsafe.us/products.json` → JSON; contains `K9B USB-A NFC Security Key` with price `38.00`
19. `curl -s 'https://hn.algolia.com/api/v1/search?query=yubikey&tags=story&hitsPerPage=8'` → hit objectID `41434500`, title `EUCLEAK Side-Channel Attack on the YubiKey 5 Series`, num_comments 278
20. `curl -s 'https://hn.algolia.com/api/v1/search?query=nitrokey&tags=story&hitsPerPage=8'` → hit objectID `24294307` (97 comments), `35706858` "NitroKey disappoints me" (66 comments)
21. `curl -sIL -o /dev/null -w '%{http_code} %{url_effective}\n' https://solo2.dev` → `200 https://hackmd.io/@solokeys/solo2-getting-started`
22. `curl -sIL -o /dev/null -w '%{http_code} %{url_effective}\n' https://www.token2.swiss` → `200 https://www.token2.com/`
23. `curl -sIL -o /dev/null -w '%{http_code} %{url_effective}\n' https://www.ftsafe.com` → `200 https://portal.ftsafe.com/`
24. `curl -sL https://docs.yubico.com/hardware/yubikey/yk-tech-manual/yk5-firmware-overview.html` → contains `Once programmed, YubiKeys cannot be updated to another version.`
25. GitHub repo stats (needs auth or low rate: `curl -s https://api.github.com/repos/Yubico/yubikey-manager` hit unauthenticated rate limit this session; `gh api repos/Yubico/yubikey-manager` worked) → `stars: 1187` (drifts; match on `"full_name": "Yubico/yubikey-manager"`)
26. `dig +short mcp.yubico.com A` → empty output (negative probe; same for mcp.nitrokey.com, mcp.ledger.com, mcp.token2.com, mcp.ftsafe.com)
