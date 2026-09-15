# Game Engines Arena — Live Market Research
Collected 2026-09-15 via curl/npm/cargo/brew/GitHub API/HN Algolia. Every URL, number, and quote below came from a command actually run this session. Negative findings recorded explicitly.

Global gotchas discovered:
- www.unrealengine.com, www.epicgames.com, www.fab.com, dev.epicgames.com/community return HTTP 403 to curl even with a browser UA (bot protection). dev.epicgames.com/documentation works fine via curl. Unreal license terms verified via Wayback snapshot (see unreal PRICING).
- phaser.io and docs.phaser.io ROOT pages return 403 ("Just a moment..." Cloudflare) to curl, but deep pages return 200 with a browser UA.
- api.github.com keyless rate limit (60/hr core, ~10/min search) was hit once mid-session; all reported numbers come from successful calls.

---

## unity

### URLS
- Site: https://unity.com (200)
- Docs root: https://docs.unity3d.com -> 200 https://docs.unity3d.com/Manual/index.html ("Unity 6.6 User Manual")
- Pricing: https://unity.com/products/compare-plans -> redirects to https://unity.com/products (200, "Unity Plans & Pricing: Pro, Personal, Enterprise, Industry")
- Blog: https://unity.com/blog (200)
- GitHub (engine source is closed; reference repo): https://github.com/Unity-Technologies/UnityCsReference

### EXTRA_DOCS (all verified HTTP 200; title/H1 from live fetch)
- https://docs.unity3d.com/Manual/index.html — "Unity 6.6 User Manual"
- https://docs.unity3d.com/Manual/CommandLineArguments.html — "Command-line interface"
- https://docs.unity3d.com/Manual/EditorCommandLineArguments.html — "Unity Editor command line arguments reference" (batch mode / headless CI surface)
- https://docs.unity3d.com/Manual/PlayerCommandLineArguments.html — "Unity Player command line arguments reference"
- https://docs.unity3d.com/ScriptReference/index.html — "Welcome to the Unity Scripting Reference!"
- https://docs.unity3d.com/Manual/scripting.html — "Programming in Unity" (C#)
- https://docs.unity3d.com/Manual/ExtendingTheEditor.html — "Extending the Editor with IMGUI" (editor scripting)
- https://docs.unity3d.com/ScriptReference/EditorApplication.html — "EditorApplication"
- https://docs.unity3d.com/ScriptReference/AssetDatabase.html — "AssetDatabase" (asset pipeline automation API)
- https://docs.unity3d.com/Manual/AssetDatabase.html — "Managing assets with the Asset Database"
- https://docs.unity3d.com/Manual/Packages.html — "Get started with packages" (UPM)
- https://docs.unity3d.com/Manual/upm-ui.html — "Package Manager window reference"
- https://docs.unity3d.com/Manual/BuildSettings.html — "Create a build from the Editor" (note: /Manual/PublishingBuilds.html redirects here)
- https://docs.unity3d.com/Packages/com.unity.netcode.gameobjects@latest/ — 200 (multiplayer/Netcode for GameObjects package docs)
- https://docs.unity3d.com/Packages/com.unity.ai.inference@latest/ — 200 (Inference Engine, née Sentis)
- https://docs.unity3d.com/Packages/com.unity.sentis@latest/ — 200 (legacy Sentis package docs still resolve)
- https://docs.unity3d.com/Packages/com.unity.ai.assistant@latest/index.html?subfolder=/manual/integration/unity-mcp-get-started.html — 200 "Redirecting to latest version of com.unity.ai.assistant" (OFFICIAL Unity MCP get-started doc, linked from unity.com/features/ai "View MCP Docs")
- https://docs.unity.com/en-us/ai/credits/credits-about — "About Unity Credits • Unity AI • Unity Docs" (AI usage is credit-metered)
- https://unity.com/features/ai — "Unity's AI Game Development Tools & RT3D Software" / H1 "Trained on Unity. Designed for game development."
- https://unity.com/products/unity-personal — "Unity Personal"
- https://unity.com/products/unity-pro — "Unity Pro"
- https://unity.com/products/unity-industry — 200 (Industry plan; page text today contains NO "runtime fee"/"per-install" wording — checked)
- https://unity.com/blog/unity-is-canceling-the-runtime-fee — "A message to our community: Unity is canceling the Runtime Fee"

### LLMS_TXT
- https://unity.com/llms.txt — 200. First lines (exact):
```
# Unity

> Develop, deploy, and grow with Unity, the world’s leading 3D game engine. Build for all major platforms from mobile, to PC and console as well as XR, acquire ...

## Products
```
- https://docs.unity3d.com/llms.txt — 404 ABSENT (site llms.txt exists, docs root does not)

### MD_MIRROR
- https://docs.unity3d.com/6000.2/Documentation/Manual/CommandLineArguments.html.md — 404 ABSENT

### MCP
- OFFICIAL: Unity MCP server ships as part of Unity's AI tools (beta) inside package com.unity.ai.assistant. Evidence: unity.com/features/ai links "View MCP Docs" -> https://docs.unity3d.com/Packages/com.unity.ai.assistant@latest/index.html?subfolder=/manual/integration/unity-mcp-get-started.html (200). unity.com/products plans page: Personal "What's included ... Unity's MCP" (text on page). No standalone com.unity.mcp package (docs.unity3d.com/Packages/com.unity.mcp@latest — 404). GitHub search `mcp org:Unity-Technologies` — 0 results (official MCP is not on GitHub).
- CoplayDev/unity-mcp | community | 14,243 stars | pushed 2026-09-05 | "Unity MCP acts as a bridge between AI assistants and your Unity Editor" (justinpbarnett/unity-mcp now 301s — repo moved; the popular repo is CoplayDev's)
- IvanMurzak/Unity-MCP | community | 4,273 stars | pushed 2026-09-14
- CoderGamester/mcp-unity | community | 1,905 stars | pushed 2026-09-03
- hatayama/unity-cli-loop | community | 563 stars | pushed 2026-09-15 ("Let AI Drive Unity, from Editor to Play Mode")

### PACKAGES
- brew cask unity-hub (exact): token "unity-hub", name "Unity Hub", desc "Management tool for Unity", url https://public-cdn.cloud.unity3d.com/hub/prod/3.21.2/UnityHubSetup-3.21.2-arm64.dmg (version 3.21.2)
- Unity engine itself is not on npm/crates/brew (distributed via Unity Hub) — negative finding.

### GITHUB
- Unity-Technologies/UnityCsReference | 12,988 stars | pushed 2026-09-11 (read-only C# reference source; engine core is proprietary)

### HN_SEEDS
- 37503837 | Unity introduces per-install fee for game developers | 13
- 37491002 | Unity rushes to clarify price increase plan, as game developers fume | 74
- 44973269 | Unity reintroduces the Runtime Fee through its Industry license | 120 (2025-08-21, links to unity.com/products/unity-industry)

### PRICING (verbatim from unity.com/products and unity.com/products/unity-personal, 2026-09-15)
- Personal: "COST No credit card required Free ... Publish to web, desktop, AR/VR, and mobile ... Unity's MCP" — "Eligibility: Unity Personal is for individuals and small organizations with less than $200K USD of re[venue/funding]... in the last 12 months."
- Pro: "Required for businesses with over $200K in funding or annual revenue. ... Cost Per month $210.00" / "Unity Pro from $2,310.00 /yr"
- Enterprise: "Required for businesses with more than $25M in annual revenue. Cost Requires sales Custom pricing"
- Industry: "Custo[m]" pricing, contact sales.

### NOTES
- Runtime Fee history: introduced Sept 2023 ("Unity introduces per-install fee", HN 37503837); CANCELLED Sept 2024 — Unity's own announcement live at https://unity.com/blog/unity-is-canceling-the-runtime-fee, verbatim: "Canceling the Runtime Fee for games and instituting these pricing changes will allow us to continue investing to improve game development for everyone while also being better partners." Notably, the original Sept-2023 announcement URL (unity.com/blog/news/plan-pricing-and-packaging-updates) now 301-redirects to the cancellation post (verified by curl -L).
- Aug 2025 HN story (44973269, 120 comments) claimed Unity "reintroduces the Runtime Fee through its Industry license"; the current unity-industry page contains no runtime-fee/per-install wording (checked 2026-09-15) — treat as reported controversy, not current published terms.
- Muse status: unity.com/products/unity-muse and unity.com/ai both redirect to https://unity.com/features/ai. Page FAQ verbatim: "...the tools themselves aren't going anywhere, we're simply describing each one by what it does: the in-editor AI assistant, the AI gateway, and the MCP server. Collectively, we'll refer to them as Unity's AI tools (still in beta)." Sentis renamed: com.unity.ai.inference ("Inference Engine") docs live; legacy com.unity.sentis docs still resolve. AI usage is metered via Unity Credits (docs.unity.com/en-us/ai/credits/credits-about).
- Agenticness: strongest official-MCP story of the proprietary engines (official in-editor MCP + assistant + 14k-star community MCP), full CLI/batchmode docs, deep editor-scripting API. But docs have no llms.txt at docs root and no .md mirrors; engine source closed.

---

## unreal

### URLS
- Site: https://www.unrealengine.com — 403 to curl/WebFetch (bot-blocked; loads in browsers)
- Docs root: https://dev.epicgames.com/documentation/en-us/unreal-engine/unreal-engine-5-6-documentation (200; titles across docs say "Unreal Engine 5.8 Documentation" — current version 5.8)
- Release notes/blog: unrealengine.com/en-US/release and /faq — 403 to curl (recorded)
- GitHub: https://github.com/EpicGames/UnrealEngine — API returns 404 keylessly ("Not Found") because the repo is private-gated behind EULA-linked org membership. Recorded honestly; no star count obtainable without auth.
- Licensing: https://www.unrealengine.com/en-US/license — 403 to curl; content verified via Wayback snapshot https://web.archive.org/web/20260905174652/https://www.unrealengine.com/license

### EXTRA_DOCS (all HTTP 200 via curl)
- https://dev.epicgames.com/documentation/en-us/unreal-engine/blueprints-visual-scripting-in-unreal-engine — "Blueprints Visual Scripting"
- https://dev.epicgames.com/documentation/en-us/unreal-engine/programming-with-cplusplus-in-unreal-engine — "Programming with C++"
- https://dev.epicgames.com/documentation/en-us/unreal-engine/scripting-the-unreal-editor-using-python — "Scripting the Unreal Editor Using Python" (the big agent surface — verified live)
- https://dev.epicgames.com/documentation/en-us/unreal-engine/python-api/ — "Unreal Python API Documentation — Unreal Python 5.8 (Experimental)"
- https://dev.epicgames.com/documentation/en-us/unreal-engine/unreal-automation-tool-for-unreal-engine — "Unreal Automation Tool" (UAT)
- https://dev.epicgames.com/documentation/en-us/unreal-engine/automation-system-in-unreal-engine — 200 (title JS-rendered)
- https://dev.epicgames.com/documentation/en-us/unreal-engine/build-operations-cooking-packaging-deploying-and-running-projects-in-unreal-engine — "Build Operations: Cook, Package, Deploy, and Run"
- https://dev.epicgames.com/documentation/en-us/unreal-engine/cooking-content-in-unreal-engine — "Content Cooking"
- https://dev.epicgames.com/documentation/en-us/unreal-engine/command-line-arguments-in-unreal-engine — "Command-Line Arguments"
- https://dev.epicgames.com/documentation/en-us/unreal-engine/networking-and-multiplayer-in-unreal-engine — "Networking and Multiplayer"
- https://dev.epicgames.com/documentation/en-us/unreal-engine/asset-management-in-unreal-engine — "Asset Management"
- https://dev.epicgames.com/documentation/en-us/unreal-engine/plugins-in-unreal-engine — "Plugins"
- https://dev.epicgames.com/documentation/en-us/unreal-engine/end-user-license-agreement-for-unreal-engine — 200 (content JS-rendered; EULA text not extractable via curl — recorded)
- https://dev.epicgames.com/documentation/en-us/unreal-engine/unreal-engine-5-6-documentation — 200 (docs landing)

### LLMS_TXT
- https://www.unrealengine.com/llms.txt — 403 (site blocks curl) — effectively ABSENT/unverifiable
- https://dev.epicgames.com/llms.txt — 403; https://dev.epicgames.com/documentation/llms.txt — 404 ABSENT

### MD_MIRROR
- https://dev.epicgames.com/documentation/en-us/unreal-engine/unreal-engine-5-6-documentation.md — HTTP 200 BUT serves the HTML SPA shell (<!DOCTYPE html>...), NOT markdown. Effectively ABSENT (catch-all route).

### MCP
- No official Epic MCP: GitHub search `mcp org:EpicGames` — 0 results.
- chongdashu/unreal-mcp | community | 2,080 stars | pushed 2025-04-22 (stale ~17 months)
- flopperam/unreal-engine-mcp | community | 1,081 stars | pushed 2026-06-26 ("This MCP is now owned by Aura!")
- Natfii/UnrealClaude | community | 904 stars | pushed 2026-06-26 (Claude Code CLI integration for UE 5.7)
- ChiR24/Unreal_mcp | community | 872 stars | pushed 2026-09-15 (actively maintained)
- kevinpbuckley/VibeUE | community | 686 stars | pushed 2026-09-14

### PACKAGES
- brew cask epic-games (exact): token "epic-games", name "Epic Games Launcher", desc "Launcher for *Epic Games* games", homepage https://www.epicgames.com/ (engine installs via launcher; engine itself not in a public registry — negative finding)

### GITHUB
- EpicGames/UnrealEngine: keyless API response `"message": "Not Found"` — source access requires linked Epic account. Recorded as private-gated.

### HN_SEEDS
- 23167794 | A first look at Unreal Engine 5 | 676
- 30920345 | Unreal Engine 5 is now available | 158
- 27290854 | Unreal Engine 5 enters Early Access | 152

### PRICING (verbatim, Wayback snapshot 2026-09-05 of unrealengine.com/license)
- "Unreal Engine Licensing Under $1 million USD in revenue? Free"
- "All lifetime gross revenue above $1M that is directly attributable to the UE product, regardless of who collects it, will be subject to a 5% royalty."
- "Revenues generated from sales in the Epic Games Store are royalty-free."
- Seat-based: "If you're using Unreal Engine for commercial purposes, have generated more than $1 million in the past 12 months, and are not creating a game or application that relies on engine code at runtime ... then a seat license fee is required."

### NOTES
- Big agent surfaces: official Python editor scripting + full Python API reference + UAT/automation CLI docs, all verified live. But: no llms.txt, .md mirror is fake (SPA shell), main marketing/licensing site is hard-blocked to non-browser agents, and source repo requires auth — the least machine-readable web presence of the eight.
- Epic's stance: no official MCP or LLM copilot found in docs/org search (negative finding). Community MCP scene active but fragmented; most-starred repo (chongdashu) unmaintained since Apr 2025.

---

## godot

### URLS
- Site: https://godotengine.org (200)
- Docs root: https://docs.godotengine.org/en/stable/ (200)
- Blog: https://godotengine.org/blog/ (200)
- GitHub: https://github.com/godotengine/godot
- License: https://godotengine.org/license/ — "License – Godot Engine"

### EXTRA_DOCS (all HTTP 200)
- https://docs.godotengine.org/en/stable/getting_started/introduction/introduction_to_godot.html — "Introduction to Godot"
- https://docs.godotengine.org/en/stable/tutorials/scripting/gdscript/gdscript_basics.html — "GDScript reference"
- https://docs.godotengine.org/en/stable/tutorials/scripting/c_sharp/c_sharp_basics.html — "C# basics"
- https://docs.godotengine.org/en/stable/tutorials/editor/command_line_tutorial.html — "Command line tutorial" (covers headless/CLI use)
- https://docs.godotengine.org/en/stable/tutorials/plugins/editor/making_plugins.html — "Making plugins" (EditorPlugin how-to)
- https://docs.godotengine.org/en/stable/classes/class_editorplugin.html — "EditorPlugin"
- https://docs.godotengine.org/en/stable/classes/class_editorscript.html — "EditorScript"
- https://docs.godotengine.org/en/stable/tutorials/export/exporting_projects.html — "Exporting projects"
- https://docs.godotengine.org/en/stable/tutorials/networking/high_level_multiplayer.html — "High-level multiplayer"
- https://docs.godotengine.org/en/stable/tutorials/assets_pipeline/import_process.html — "Import process"
- https://docs.godotengine.org/en/stable/about/faq.html — "Frequently asked questions"
- https://godotengine.org/license/ — "License"
- https://godotengine.org/asset-library/asset — "Godot Asset Library"
- https://godotengine.org/download/ — "Download – Godot Engine"
- https://fund.godotengine.org/ — "Godot Development Fund" / H1 "Support the future of Godot"
- https://www.w4games.com/ — "Home | W4Games"
- NEGATIVE: https://docs.godotengine.org/en/stable/tutorials/scripting/gdextension/what_is_gdextension.html — 404 (GDExtension docs moved; old canonical path dead)

### LLMS_TXT
- https://godotengine.org/llms.txt — 404 ABSENT
- https://docs.godotengine.org/llms.txt — 404 ABSENT

### MD_MIRROR
- https://docs.godotengine.org/en/stable/getting_started/introduction/introduction_to_godot.html.md — 404 ABSENT

### MCP
- No official Godot MCP: GitHub search `mcp org:godotengine` — 0 results.
- Coding-Solo/godot-mcp | community | 5,698 stars | pushed 2026-04-16
- hi-godot/godot-ai | community | 2,437 stars | pushed 2026-09-15 ("Production-grade MCP server and AI tools for the Godot engine")
- yurineko73/Godot-MCP-Native | community | 783 stars | pushed 2026-08-03
- ee0pdt/Godot-MCP | community | 616 stars | pushed 2025-03-19 (stale)
- youichi-uda/godot-mcp-pro | community | 597 stars | pushed 2026-08-01 ("162 MCP tools for AI-powered Godot 4 development")

### PACKAGES
- brew info --json=v2 godot (exact snippet): cask "godot", name "Godot Engine", desc "2D and 3D game engine", homepage https://godotengine.org/, url https://github.com/godotengine/godot/releases/download/4.7.2-stable/Godot_v4.7.2-stable_macos.universal.zip, "version": "4.7.2"
- Asset Library API (keyless JSON): curl "https://godotengine.org/asset-library/api/asset?godot_version=4.3&max_results=2" returns `{"result":[{"asset_id":"5038","title":"GoBuild",...`

### GITHUB
- godotengine/godot | 117,220 stars | pushed 2026-09-15 — highest star count of all eight engines.

### HN_SEEDS
- 34982889 | Godot 4.0 Stable | 103
- 36614114 | Godot 4.1 | 154
- 23668918 | Godot 4.0 gets SDF based real-time global illumination | 144

### PRICING (verbatim from godotengine.org/license)
- "Godot Engine is free and open source software released under the permissive MIT license (also named Expat license)."
- "Godot Engine's license terms and copyright do not apply to the content you create with it; you are free to license your games how you see best fit, and will be their sole copyright owner(s)."
- Funded by donations: fund.godotengine.org ("Support the future of Godot"); commercial console/services arm W4 Games (w4games.com) founded by Godot leadership.

### NOTES
- Now the most-starred engine repo (117k), ahead of three.js — Godot's post-Unity-runtime-fee momentum is measurable (see HN 42210841 "Ask HN: How many studios / developers have moved away from Unity?", 12 comments).
- Agenticness: excellent CLI/headless story (command-line tutorial, `--headless` in 4.x) and clean, stable-URL Sphinx docs, but zero llms.txt/.md machine-readability and no official MCP; community MCP scene is large but fragmented across 5+ repos with no clear winner (top repo idle since April 2026).

---

## threejs

### URLS
- Site: https://threejs.org (200)
- Docs root: https://threejs.org/docs/ (200; hash-routed SPA)
- Manual: https://threejs.org/manual/ (200)
- Releases: https://github.com/mrdoob/three.js/releases (repo); wiki: https://github.com/mrdoob/three.js/wiki (200, "Home · mrdoob/three.js Wiki")
- License: MIT (npm `three` license field, exact output: `MIT`)

### EXTRA_DOCS
Verified 200 shells / real pages:
- https://threejs.org/manual/ — "three.js manual"
- https://threejs.org/examples/ — "three.js examples"
- https://threejs.org/editor/ — "three.js editor" (browser-based scene editor)
- https://github.com/mrdoob/three.js/wiki — "Home"
- https://threejs.org/docs/llms-full.txt — 200, 363,106 bytes of full machine-readable docs
IMPORTANT HONEST CAVEAT: individual doc/manual pages are hash-routed (e.g. https://threejs.org/manual/#en/creating-a-scene, https://threejs.org/docs/#api/en/core/Object3D — these URLs are what threejs.org/docs/llms.txt itself publishes). Path-style equivalents (threejs.org/manual/en/creating-a-scene.html, /docs/api/en/core/Object3D.html) return 404 "Redirecting...". Use hash URLs (server serves the 200 shell) or llms-full.txt for content.
Hash URLs published by three.js's own llms.txt (verified list source): manual/#installation, manual/#creating-a-scene, manual/#fundamentals, manual/#responsive, manual/#webgpurenderer, docs/#api/en/core/Object3D, docs/#api/en/scenes/Scene, docs/#api/en/cameras/PerspectiveCamera, docs/#api/en/renderers/WebGLRenderer, docs/#api/en/objects/Mesh, plus https://threejs.org/tsl/.

### LLMS_TXT
- https://threejs.org/llms.txt — 200. Exact first lines:
```
# Three.js

> Three.js is a cross-browser JavaScript library for creating 3D graphics using WebGL and WebGPU.

See the full documentation for LLMs at: https://threejs.org/docs/llms.txt
```
- https://threejs.org/docs/llms.txt — 200 ("## Instructions for Large Language Models" section) and llms-full.txt (363 KB) — best-in-class LLM docs plumbing.

### MD_MIRROR
- https://threejs.org/manual/en/creating-a-scene.html.md — 404 ABSENT (llms-full.txt serves this role instead)

### MCP
- No notable dedicated three.js MCP server found. GitHub search "threejs mcp" top results are unrelated tools (pascalorg/editor — an architectural editor with MCP, 23,947 stars, built ON three.js but not a three.js MCP; 3D-printer MCPs, etc.). Negative finding: no official or popular community three.js MCP.

### PACKAGES (exact outputs)
- `npm view three version` -> `0.186.0`
- `curl -s https://api.npmjs.org/downloads/point/last-week/three` -> `{"downloads":12206532,"start":"2026-09-05","end":"2026-09-11","package":"three"}` (12.2M/week — an order of magnitude above every other engine here)
- `npm view three license` -> `MIT`

### GITHUB
- mrdoob/three.js | 115,555 stars | pushed 2026-09-15

### HN_SEEDS
- 38786581 | 3D Map of Shinjuku Station in Three.js | 185
- 44249565 | Show HN: Spark, An advanced 3D Gaussian Splatting renderer for Three.js | 86
- 19944990 | Three.js Fundamentals | 44

### PRICING
- Free, MIT-licensed OSS. No paid tiers exist (negative finding: no pricing page).

### NOTES
- The default agent target for web 3D: 12.2M weekly npm downloads, MIT, and self-published llms.txt with explicit "Instructions for Large Language Models" plus a 363 KB llms-full.txt. Library (not a full engine/editor), so "MCP server" is less meaningful — coding agents drive it directly through npm + docs.
- Hash-routed human docs are the one machine-readability wart (no per-page static/markdown URLs).

---

## babylonjs

### URLS
- Site: https://www.babylonjs.com (200)
- Docs root: https://doc.babylonjs.com (200)
- Changelog: https://doc.babylonjs.com/whats-new (200)
- GitHub: https://github.com/BabylonJS/Babylon.js
- License: Apache-2.0 (`npm view @babylonjs/core license` -> `Apache-2.0`)

### EXTRA_DOCS (all HTTP 200; site is a Next.js app — <title> is generic "Babylon.js docs", content client-rendered; URLs are real routes, 404s do exist e.g. featuresDeepDive/network/ -> 404 "WebContentNotFound")
- https://doc.babylonjs.com/journey/theFirstStep
- https://doc.babylonjs.com/setup/ (setup hub)
- https://doc.babylonjs.com/setup/frameworkPackages/npmSupport (npm install docs)
- https://doc.babylonjs.com/setup/support/serverSide (server-side/headless usage)
- https://doc.babylonjs.com/typedoc/classes/BABYLON.NullEngine (NullEngine — headless engine class, verified route)
- https://doc.babylonjs.com/typedoc/ -> redirects to /typedoc/modules/BABYLON (full API typedoc)
- https://doc.babylonjs.com/features/featuresDeepDive/scene/
- https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/set
- https://doc.babylonjs.com/features/featuresDeepDive/importers/glTF (asset pipeline)
- https://doc.babylonjs.com/toolsAndResources/thePlayground (Playground — shareable live-code)
- https://doc.babylonjs.com/whats-new (changelog)
- https://www.babylonjs.com/community/ — "Babylon.js Community Demos"
- https://forum.babylonjs.com/ — "Babylon.js" (official forum)

### LLMS_TXT
- https://doc.babylonjs.com/llms.txt — 200. Exact first lines:
```
# Babylon.js Documentation

> Babylon.js is a powerful, beautiful, simple, and open game and rendering engine packed into a friendly JavaScript framework.

## About Babylon.js
```
- https://www.babylonjs.com/llms.txt — 200 too ("# Babylon.js Website / > Babylon.js: Powerful, Beautiful, Simple, Open - Web-Based 3D At Its Best / ## Project Overview"). Both site and docs roots covered.

### MD_MIRROR
- https://doc.babylonjs.com/journey/theFirstStep.md — 404 ABSENT

### MCP
- No official Microsoft/BabylonJS MCP found. Community only, tiny: davidvanstory/babylonjs-mcp | 9 stars | pushed 2025-07-08; VibeCAD/babylonjs-mcp | 2 stars; thaneplummer/babylonjs-mcp | 1 star | 2026-09-08. Negative finding: MCP landscape essentially nonexistent for Babylon.

### PACKAGES (exact outputs)
- `npm view @babylonjs/core version` -> `9.26.1`
- `curl -s https://api.npmjs.org/downloads/point/last-week/@babylonjs/core` -> `{"downloads":234040,"start":"2026-09-05","end":"2026-09-11","package":"@babylonjs/core"}`
- `npm view @babylonjs/core license` -> `Apache-2.0`

### GITHUB
- BabylonJS/Babylon.js | 26,075 stars | pushed 2026-09-15 (Microsoft-backed OSS)

### HN_SEEDS
- 35645857 | Babylon.js 6.0 | 30
- 14758153 | Babylon.js 3.0 | 33
- 6200085 | Babylon.js: JS framework for building 3D games with HTML5 and WebGL | 69

### PRICING
- Free, Apache-2.0 OSS, Microsoft-sponsored. No paid tiers (negative finding: no pricing page).

### NOTES
- Dual llms.txt (site + docs) — strong LLM-docs intent; NullEngine gives a documented headless path (verified typedoc route). Weakness: docs are client-rendered Next.js (curl sees empty titles) and no .md mirrors; no meaningful MCP ecosystem despite Microsoft parentage — a genuine surprise.

---

## bevy

### URLS
- Site: https://bevy.org (200; bevyengine.org 301s to bevy.org — domain moved)
- Docs: https://docs.rs/bevy/latest/bevy/ ("Crate bevy") + book/quick-start at https://bevy.org/learn/
- Release notes: https://bevy.org/news/ (200); latest major: https://bevy.org/news/bevy-0-19/ — "Bevy 0.19"
- GitHub: https://github.com/bevyengine/bevy
- License: dual — crates.io API `"license": "MIT OR Apache-2.0"` (bevy 0.19.1)

### EXTRA_DOCS (all HTTP 200)
- https://bevy.org/learn/quick-start/introduction/ — "Introduction"
- https://bevy.org/learn/quick-start/getting-started/setup/ — "Setup"
- https://bevy.org/learn/quick-start/getting-started/ecs/ — "ECS" (Rust ECS scripting model)
- https://bevy.org/learn/ — "Learn Bevy"
- https://docs.rs/bevy/latest/bevy/ — "bevy - Rust" (full API on docs.rs)
- https://bevy.org/examples/ — "Bevy Examples in WebGL2"
- https://bevy.org/assets/ — "Bevy Assets" (community plugin/asset index)
- https://bevy.org/news/bevy-0-19/ — "Bevy 0.19"
- https://bevy.org/news/ — "Bevy News"
- https://bevy.org/foundation/ — "Bevy Foundation"
- https://bevy.org/community/ — "Bevy Community"
- https://bevy-cheatbook.github.io/ — "Unofficial Bevy Cheat Book"
- NEGATIVE: https://crates.io/crates/bevy returns 404 to curl (JS SPA); use API https://crates.io/api/v1/crates/bevy instead (works keyless).

### LLMS_TXT
- https://bevy.org/llms.txt — 404 ABSENT; https://bevyengine.org/llms.txt — 404; https://docs.rs/bevy/latest/llms.txt — 404. ABSENT everywhere.

### MD_MIRROR
- https://bevy.org/learn/quick-start/introduction/index.md — 404 ABSENT

### MCP
- No official MCP. Community, small: natepiano/bevy_brp | 70 stars | pushed 2026-09-11 ("mcp tools for your favorite agent" — Bevy Remote Protocol based); Ladvien/bevy_debugger_mcp | 27 stars | 2026-08-17; Blackjack200/mcp-bevy-buddy | 8 stars. Negative finding: MCP scene nascent.

### PACKAGES (exact outputs)
- `cargo search bevy --limit 3` (exact):
```
bevy = "0.19.1"                    # A refreshingly simple data-driven game engine and app framework
bevy_symbios_texture = "0.12.0"    # Algorithmic texture generator for Bevy.
bevy_resvg = "2.5.0"               # A simple library for rendering SVGs in Bevy using the amazing Resvg library.
```
- crates.io API: name: bevy | max_stable_version: 0.19.1 | downloads: 7,366,946 all-time | recent_downloads (90d): 1,478,352 | updated_at 2026-08-13 | license "MIT OR Apache-2.0"

### GITHUB
- bevyengine/bevy | 48,195 stars | pushed 2026-09-15

### HN_SEEDS
- 24123283 | Bevy: A data-driven game engine and app framework built in Rust | 103
- 29854416 | Bevy game engine 0.6 | 89
- 38144417 | Bevy 0.12 | 84

### PRICING
- Free, MIT OR Apache-2.0. Backed by the Bevy Foundation (bevy.org/foundation, verified 200); no commercial tiers.

### NOTES
- Still pre-1.0 (0.19.1) with breaking changes each ~quarterly release — honest caveat for production and for agents trained on older APIs. Code-first (no editor GUI yet), which ironically suits coding agents: everything is cargo + Rust source. docs.rs gives fully static, crawlable API docs, but no llms.txt anywhere and only embryonic MCP tooling (bevy_brp builds on the official Bevy Remote Protocol).

---

## playcanvas

### URLS
- Site: https://playcanvas.com (200)
- Docs root: https://developer.playcanvas.com (200)
- API refs: https://api.playcanvas.com/engine/ ("Engine API Reference - v2.22.1"), https://api.playcanvas.com/editor/ ("Editor API Reference - v1.1.28")
- Blog: playcanvas.com/blog (nav-linked); GitHub: https://github.com/playcanvas/engine
- Pricing: https://playcanvas.com/plans — "Pricing & Plans | PlayCanvas" / H1 "Editor Plans"

### EXTRA_DOCS (all HTTP 200)
- https://developer.playcanvas.com/user-manual/ — "Welcome"
- https://developer.playcanvas.com/user-manual/getting-started/ — "Getting Started"
- https://developer.playcanvas.com/user-manual/scripting/ — "Scripting" (JS/TS)
- https://developer.playcanvas.com/user-manual/editor/ — "PlayCanvas Editor"
- https://developer.playcanvas.com/user-manual/editor/mcp-server/ — "MCP Server" (OFFICIAL MCP docs page in the user manual)
- https://developer.playcanvas.com/user-manual/engine/ — "PlayCanvas Engine"
- https://developer.playcanvas.com/user-manual/graphics/ — "Graphics"
- https://developer.playcanvas.com/user-manual/physics/ — "Physics"
- https://developer.playcanvas.com/user-manual/xr/ — "XR"
- https://developer.playcanvas.com/user-manual/gaussian-splatting/ — "Gaussian Splatting"
- https://developer.playcanvas.com/user-manual/publishing/ — 200 (export/publishing)
- https://developer.playcanvas.com/tutorials/ — "Tutorials"
- https://api.playcanvas.com/engine/ — "Engine API Reference - v2.22.1"
- https://api.playcanvas.com/editor/ — "Editor API Reference - v1.1.28" (scriptable editor API)
- https://playcanvas.com/plans — "Editor Plans"

### LLMS_TXT
- https://developer.playcanvas.com/llms.txt — 200. Exact first lines:
```
# PlayCanvas Developer Documentation

> PlayCanvas is an open-source WebGL/WebGPU 3D engine for building games, configurators, and interactive 3D experiences that run in any browser. It can be used ...

This file is a structured overview of the PlayCanvas developer documentation.
Complete documentation content: https://developer.playcanvas.com/llms-full.txt
```
- llms-full.txt verified: 2,053,637 bytes (2 MB of full docs — largest llms-full of the eight)
- https://playcanvas.com/llms.txt — 404 (docs root only)

### MD_MIRROR
- https://developer.playcanvas.com/user-manual/scripting.md — 404 ABSENT

### MCP
- OFFICIAL: playcanvas/editor-mcp-server | official org | 137 stars | pushed 2026-09-09 | "MCP Server for AI automation of the PlayCanvas Editor". npm: `npm view @playcanvas/editor-mcp-server version` -> `0.7.1`. Documented in the official user manual (developer.playcanvas.com/user-manual/editor/mcp-server/). The only engine here with an official, GitHub-public, npm-published editor MCP.

### PACKAGES (exact outputs)
- `npm view playcanvas version` -> `2.22.2`
- `curl -s https://api.npmjs.org/downloads/point/last-week/playcanvas` -> `{"downloads":48435,"start":"2026-09-05","end":"2026-09-11","package":"playcanvas"}`
- `npm view playcanvas license` -> `MIT`
- `npm view @playcanvas/editor-mcp-server version` -> `0.7.1`

### GITHUB
- playcanvas/engine | 16,838 stars | pushed 2026-09-15 (engine MIT; cloud Editor is the commercial product)

### HN_SEEDS
- 40379982 | Build WebGPU apps with PlayCanvas | 43
- 24018097 | PlayCanvas, the Web-first game engine | 45
- 7846494 | PlayCanvas goes open source | 11

### PRICING (verbatim from playcanvas.com/plans)
- "PlayCanvas is free and open source. These plans unlock additional Editor features..."
- Free: "Unlimited Public Projects ... 1GB Storage Free App Hosting ... Access to REST API"
- "Personal $15 / month Designed for Individuals Unlimited Private Projects 10x Storage of Free Account"
- "Organization $50 per seat / month Designed for Businesses Unlimited Private Projects Team Management"

### NOTES
- Pound-for-pound the most agent-ready editor-based engine: official editor MCP server (org repo + npm 0.7.1 + manual page), scriptable Editor API (api.playcanvas.com/editor), REST API on the free tier, llms.txt + 2 MB llms-full.txt. Small community relative to the giants (137 stars on the MCP, 48k weekly npm downloads).

---

## phaser

### URLS
- Site: https://phaser.io (root 403 to curl/Cloudflare; deep pages 200 with browser UA)
- Docs root: https://docs.phaser.io (root 403; pages 200)
- News/blog: https://phaser.io/news — "Latest News | Phaser"
- GitHub: https://github.com/phaserjs/phaser (current org; photonstorm/phaser now 301 "Moved Permanently" — org renamed)
- Pricing: https://phaser.io/pricing — "Pricing Plans"

### EXTRA_DOCS (all HTTP 200 with browser UA)
- https://docs.phaser.io/phaser/getting-started/what-is-phaser — "What is Phaser?"
- https://docs.phaser.io/phaser/getting-started/installation — "Installing"
- https://docs.phaser.io/phaser/concepts/scenes — "Scenes"
- https://docs.phaser.io/phaser/concepts/gameobjects — "Game Objects"
- https://docs.phaser.io/phaser/concepts/physics/arcade — "Arcade Physics"
- https://docs.phaser.io/phaser/concepts/input — "Input"
- https://docs.phaser.io/phaser/concepts/loader — "Loader" (asset pipeline)
- https://docs.phaser.io/phaser/concepts/animations — "Animations"
- https://docs.phaser.io/api-documentation/api-documentation — "Phaser 4.1.0 API Documentation"
- https://phaser.io/tutorials/getting-started-phaser3 — "Getting Started with Phaser 3"
- https://phaser.io/editor — "Phaser Editor — Visual Game Development with AI"
- https://phaser.io/agent — "Build a Game with an Agent | Phaser" (hosted AI game agent, official)
- https://phaser.io/agent/mcp — "Connect your coding agent — Phaser Game Agent MCP setup" (official MCP setup page)
- https://phaser.io/news — "Latest News"
- https://phaser.io/pricing — "Pricing Plans"

### LLMS_TXT
- https://phaser.io/llms.txt — 200. Exact first lines:
```
# Phaser Examples Index
# https://phaser.io
#
# Format: version | folder | title | description
# For full metadata and source code, use the API: GET /api/v1/examples/{id}
#
```
(An examples index with a public examples API — unusual but real machine-readable surface.)
- https://docs.phaser.io/llms.txt — 404 ABSENT at docs root.

### MD_MIRROR
- https://docs.phaser.io/phaser/getting-started/what-is-phaser.md — 404 ABSENT

### MCP
- OFFICIAL: Phaser Studio runs a hosted "Phaser Game Agent" (phaser.io/agent) with an official MCP connection page https://phaser.io/agent/mcp ("Connect your coding agent"). Phaser Editor plan explicitly lists "MCP support for AI tools" and "AI-ready skills files". Negative finding: no @phaserjs/mcp, @phaserjs/editor-mcp, or phaser-mcp on npm (all E404); no popular community phaser MCP repo surfaced in GitHub search (top "phaser mcp" results were unrelated Claude-tooling repos).

### PACKAGES (exact outputs)
- `npm view phaser version` -> `4.2.1`
- `curl -s https://api.npmjs.org/downloads/point/last-week/phaser` -> `{"downloads":263018,"start":"2026-09-05","end":"2026-09-11","package":"phaser"}`
- `npm view phaser license` -> `MIT`

### GITHUB
- phaserjs/phaser | 40,317 stars | pushed 2026-08-21 (photonstorm/phaser -> Moved Permanently)

### HN_SEEDS
- 16372375 | Phaser 3.0: HTML5 game framework | 59
- 30656961 | Show HN: I made my personal website a Pokémon-style minigame using Phaser 3 | 67
- 37499163 | Phaser: A fast, fun and free open source HTML5 game framework | 8

### PRICING (verbatim from phaser.io/pricing)
- "Phaser A complete suite of game-dev tools, all in one browser tab. Free * ... 25+ creative & coding tools ... AI tools require credit purchases"
- "Phaser Editor Our powerful visual editor for game dev professionals. $12 / month ... MCP support for AI tools AI-ready skills files VSCode integration"
- "Enterprise For studios and teams who need per-seat licencing and support. Custom"
- FAQ: "I thought Phaser was free and open-source? It is and it always will be. However, Phaser Editor is a commercial product built to create games powered by the open-source Phaser game framework."
- Footer: "© 2026 Phaser Studio Inc."

### NOTES
- Phaser Studio has pivoted hard to AI: hosted Game Agent (phaser.io/agent), official agent MCP setup (phaser.io/agent/mcp), "AI-ready skills files" in the $12/mo Editor, credit-priced AI tools on the free tier, and an llms.txt that doubles as a programmatic examples API index. Framework itself stays MIT (v4.2.1, 263k weekly downloads).
- Cloudflare blocks curl on root pages — agents need a browser UA or deep links.

---

## PROBE_CANDIDATES
Keyless, read-only, actually run this session, with exact matchable output snippets:

1. `curl -s https://api.npmjs.org/downloads/point/last-week/three`
   -> `{"downloads":12206532,"start":"2026-09-05","end":"2026-09-11","package":"three"}` (match: `"package":"three"`)
2. `npm view three version` -> `0.186.0`
3. `npm view @babylonjs/core version` -> `9.26.1`; `curl -s "https://api.npmjs.org/downloads/point/last-week/@babylonjs/core"` -> `{"downloads":234040,...,"package":"@babylonjs/core"}`
4. `npm view phaser version` -> `4.2.1`; `curl -s https://api.npmjs.org/downloads/point/last-week/phaser` -> `{"downloads":263018,...,"package":"phaser"}`
5. `npm view playcanvas version` -> `2.22.2`; `curl -s https://api.npmjs.org/downloads/point/last-week/playcanvas` -> `{"downloads":48435,...,"package":"playcanvas"}`
6. `npm view @playcanvas/editor-mcp-server version` -> `0.7.1` (official PlayCanvas editor MCP on npm)
7. `cargo search bevy --limit 3` -> first line exactly: `bevy = "0.19.1"                    # A refreshingly simple data-driven game engine and app framework`
8. `curl -s -A "productarena-research" https://crates.io/api/v1/crates/bevy` -> JSON containing `"max_stable_version":"0.19.1"` (note: crates.io REQUIRES a User-Agent; the HTML page 404s to curl, the API works)
9. `brew info --json=v2 godot | head -c 500` -> contains `"token": "godot"`, `"desc": "2D and 3D game engine"`, `"version": "4.7.2"`
10. `brew info --json=v2 unity-hub | head -c 400` -> contains `"token": "unity-hub"`, `"desc": "Management tool for Unity"` (3.21.2)
11. `brew info --json=v2 epic-games | head -c 400` -> contains `"token": "epic-games"`, `"desc": "Launcher for *Epic Games* games"`
12. `curl -sL https://unity.com/llms.txt | head -6` -> starts `# Unity` / `> Develop, deploy, and grow with Unity, the world’s leading 3D game engine...`
13. `curl -s https://threejs.org/llms.txt | head -6` -> starts `# Three.js` and contains `See the full documentation for LLMs at: https://threejs.org/docs/llms.txt`
14. `curl -s https://doc.babylonjs.com/llms.txt | head -6` -> starts `# Babylon.js Documentation`
15. `curl -s https://developer.playcanvas.com/llms.txt | head -6` -> starts `# PlayCanvas Developer Documentation` and contains `https://developer.playcanvas.com/llms-full.txt`
16. `curl -s -A "Mozilla/5.0" https://phaser.io/llms.txt | head -3` -> starts `# Phaser Examples Index`
17. Negative probes (stable 404s): `curl -s -o /dev/null -w "%{http_code}" https://godotengine.org/llms.txt` -> `404`; same for `https://bevy.org/llms.txt` -> `404`, `https://docs.unity3d.com/llms.txt` -> `404`
18. `curl -s "https://godotengine.org/asset-library/api/asset?godot_version=4.3&max_results=2"` -> JSON starting `{"result":[{"asset_id":`
19. `curl -s https://api.github.com/repos/godotengine/godot` -> JSON with `"full_name": "godotengine/godot"` (stars 117,220 at capture; keyless, 60 req/hr limit)
20. `curl -s https://api.github.com/repos/EpicGames/UnrealEngine` -> `{"message": "Not Found"...}` keylessly (stable negative probe demonstrating auth-gated source)
21. `curl -s https://threejs.org/docs/llms-full.txt | wc -c` -> `363106` (order-of-magnitude match: >300000)
22. `curl -s https://developer.playcanvas.com/llms-full.txt | wc -c` -> `2053637` (>2,000,000 bytes)
23. HN Algolia (keyless): `curl -s "https://hn.algolia.com/api/v1/items/44973269"` -> title `Unity reintroduces the Runtime Fee through its Industry license`, url `https://unity.com/products/unity-industry`

Caveats for probe reuse: unrealengine.com / epicgames.com / fab.com 403 all non-browser clients; phaser.io root 403s plain curl (deep pages OK with browser UA); crates.io API needs any User-Agent header; api.github.com keyless limit 60/hr (search 10/min).
