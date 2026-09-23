# cloud-storage corpus notes (verified live 2026-09-23)

## Walls / negatives
- **Box**: `www.box.com` root answers 200 to keyless curl, but `/pricing`, `/ai`, `/esignature`, `/llms.txt` return a Cloudflare 403 challenge ("Just a moment..."). Pricing verified via Wayback snapshot 20260918124612 of box.com/pricing (meta description: "Box Plans & Pricing From $5"; snapshot served CAD tier prices CA$14/19/28/47/66/70). Honest-negative probe added on /pricing. businessModel.url kept as the canonical https://www.box.com/pricing (bot-walled keyless; flagged here). box-community/mcp-server-box README says the repo is **discontinued** in favor of the hosted MCP server — used mcp.box.com instead (keyless `.well-known/oauth-protected-resource` names "Box Model Context Protocol Server").
- **Microsoft OneDrive**: all `www.microsoft.com/en-us/microsoft-365/onedrive/*` marketing pages bot-wall keyless curl ("Your request has been blocked"), even with a browser UA. Product page/pricing dropped from urls; `site` set to learn.microsoft.com/en-us/onedrive/ (same precedent as microsoft-entra in sso-identity). Prices verified via Wayback snapshot of compare-onedrive-plans ($1.99 / $9.99 / $12.99 / $19.99 tiers). Honest-negative probe added on the plans page. `onedrive.live.com/about/en-us/` also 403s keyless. businessModel.url kept as the canonical compare-onedrive-plans URL (bot-walled keyless; flagged here).
- **Dropbox**: no walls found; all listed URLs answered keyless 200. `developers.dropbox.com/dbx-sdks` and `www.dropbox.com/developers/reference/dbx-sdks` are 404 (dropped).
- **Google Drive**: no walls; `developers.google.com/workspace/drive/api/guides/change-notifications` is 404 (the live guide is `api/guides/push`); `api/release-notes` is 404, so changelog = Workspace Updates blog.

## llms.txt findings
- https://www.dropbox.com/llms.txt — **present** ("# Dropbox > Discover Dropbox – secure, easy cloud storage...").
- developers.dropbox.com/llms.txt, dropbox.com/developers/llms.txt — 404.
- developers.google.com/llms.txt, workspace.google.com/llms.txt — 404 (absent).
- https://developer.box.com/llms.txt — **present** ("# Box Dev Docs"). www.box.com/llms.txt — Cloudflare 403 wall.
- www.microsoft.com/llms.txt, learn.microsoft.com/llms.txt — 404 (absent).

## HN discussions (all item URLs verified to return JSON)
- Dropbox: https://hn.algolia.com/api/v1/items/7566069 (Drop Dropbox, 1008c), https://hn.algolia.com/api/v1/items/12463338 (How Dropbox Hacks Your Mac, 412c)
- Google Drive: https://hn.algolia.com/api/v1/items/3884720 (Introducing Google Drive, 492c), https://hn.algolia.com/api/v1/items/38427864 (Google Drive files suddenly disappeared, 317c), https://hn.algolia.com/api/v1/items/27858032 (Drive bans distribution of "misleading content", 1520c)
- Box: https://hn.algolia.com/api/v1/items/7461452 (Box files for $250M IPO, 65c), https://hn.algolia.com/api/v1/items/5208009 (Get 50GB of Box free for life, 79c) — HN has little substantive 50+-comment Box product discussion; these were the best matches.
- OneDrive: https://hn.algolia.com/api/v1/items/13932226 (OneDrive slow on Linux but fast with Windows UA, 469c), https://hn.algolia.com/api/v1/items/40781048 (Windows 11 enabling OneDrive folder backup without asking, 381c), https://hn.algolia.com/api/v1/items/46526376 (Everyone hates OneDrive, 232c)

## Official SDK packages (registry-verified)
- Dropbox: npm `dropbox` (10.47.0), npm `@dropbox/sign` (1.13.0), pypi `dropbox` (Dropbox <dev-platform@dropbox.com>). GitHub dropbox/dropbox-sdk-js + dropbox/dropbox-sdk-python confirmed via api.github.com.
- Google Drive: npm `@googleapis/drive` (26.0.0), pypi `google-api-python-client` (Google LLC).
- Box: npm `box-node-sdk` (10.16.0), npm `box-typescript-sdk-gen` (1.19.1), pypi `boxsdk` + `box-sdk-gen` (author Box, oss@box.com), pypi `mcp-server-box` (community repo now discontinued; hosted mcp.box.com is the supported surface).
- OneDrive/Graph: npm `@microsoft/microsoft-graph-client`, pypi `msgraph-sdk` (Microsoft <graphtooling+python@microsoft.com>).

## Other
- Dropbox NOT in data/yc-batches.json (grep for "dropbox" empty), so no ycBatch stamped despite the real-world S07 batch.
- No install commands added: no vendor-documented official CLI one-liner was verified on a fetched page for any of the four.
- familyId "google" (google-drive) and "microsoft" (onedrive) stamped per task; data/product-families.json may need these members added by the families sync (not edited here — outside deliverables).
