#!/usr/bin/env python3
# One-shot helper for the game-engines arena bring-up (2026-09-15): appends probe-tier
# evidence items distilled from the recorded runtime probes in data/game-engines/proofs/
# (see pipeline/probes/game-engines.ts — all 19 recorded probes passed, three deliberate
# negatives) plus the MCP-landscape facts verified live the same day via keyless GitHub/npm
# API calls (official vs community attribution matters — the founder asked for agenticness
# measured honestly). Run AFTER `pnpm pipeline probe --category game-engines` — that stage
# wholesale-replaces probe-tier evidence and would wipe these items.
import datetime
import json

NOW = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.000Z')

ITEMS = {
    'unity': [
        {
            'id': 'unity-probe-rt-1',
            'tier': 'probe',
            'url': 'https://unity.com/features/ai',
            'excerpt': "PROBE runtime (recorded 2026-09-15): Unity ships an OFFICIAL MCP server as part of Unity's AI tools (beta) inside the com.unity.ai.assistant package — unity.com/features/ai links 'View MCP Docs' to the package manual's unity-mcp-get-started page (verified live), and the Personal plan page lists \"Unity's MCP\" as included. Closed distribution: no public repo (GitHub search `mcp org:Unity-Technologies` → 0 results) and no standalone package, so no keyless handshake is possible; AI usage is metered via Unity Credits. Community MCP is the largest of any engine: CoplayDev/unity-mcp, 14,243 stars, pushed 2026-09-05.",
            'fetchedAt': NOW,
        },
        {
            'id': 'unity-probe-rt-2',
            'tier': 'probe',
            'url': 'https://unity.com/llms.txt',
            'excerpt': "PROBE runtime (recorded 2026-09-15): unity.com serves a site-root llms.txt ('# Unity — Develop, deploy, and grow with Unity...'), but docs.unity3d.com has none (HTTP 404) and manual pages have no .md mirrors — the marketing site is machine-readable, the actual documentation is not.",
            'fetchedAt': NOW,
        },
        {
            'id': 'unity-probe-rt-3',
            'tier': 'probe',
            'url': 'https://unity.com/download',
            'excerpt': "PROBE runtime (recorded 2026-09-15): Unity Hub installs keylessly from Homebrew (cask unity-hub 3.21.2, 'Management tool for Unity') — the entry point to the editor whose -batchmode/-nographics CLI is documented for headless CI builds.",
            'fetchedAt': NOW,
        },
    ],
    'godot': [
        {
            'id': 'godot-probe-rt-1',
            'tier': 'probe',
            'url': 'https://godotengine.org/download/',
            'excerpt': "PROBE runtime (recorded 2026-09-15): Godot installs keylessly from Homebrew (cask godot 4.7.2, '2D and 3D game engine') — one command to the binary that runs `godot --headless` for CI builds, exports, and scripted editor automation.",
            'fetchedAt': NOW,
        },
        {
            'id': 'godot-probe-rt-2',
            'tier': 'probe',
            'url': 'https://godotengine.org/asset-library/asset',
            'excerpt': "PROBE runtime (recorded 2026-09-15): the Godot Asset Library exposes a keyless JSON API — GET godotengine.org/asset-library/api/asset?godot_version=4.3 returns structured asset records ({\"result\":[{\"asset_id\":...}) an agent can query directly.",
            'fetchedAt': NOW,
        },
        {
            'id': 'godot-probe-rt-3',
            'tier': 'probe',
            'url': 'https://godotengine.org/',
            'excerpt': "PROBE runtime negative (recorded 2026-09-15): godotengine.org serves no llms.txt (HTTP 404; docs.godotengine.org 404 as well) and docs pages have no .md mirrors. No official MCP exists (GitHub search `mcp org:godotengine` → 0 results); the community scene is large but fragmented — Coding-Solo/godot-mcp (5,698 stars) idle since 2026-04-16, hi-godot/godot-ai (2,437 stars) actively pushed 2026-09-15, three more repos at 600-800 stars.",
            'fetchedAt': NOW,
        },
    ],
    'threejs': [
        {
            'id': 'threejs-probe-rt-1',
            'tier': 'probe',
            'url': 'https://www.npmjs.com/package/three',
            'excerpt': "PROBE runtime (recorded 2026-09-15): `npm view three version` → 0.186.0, and the public npm downloads API reports 12,206,532 weekly downloads — an order of magnitude above every other engine in the arena. MIT license verified from the registry.",
            'fetchedAt': NOW,
        },
        {
            'id': 'threejs-probe-rt-2',
            'tier': 'probe',
            'url': 'https://threejs.org/docs/llms.txt',
            'excerpt': "PROBE runtime (recorded 2026-09-15): threejs.org publishes llms.txt at the site root pointing to a docs llms.txt that carries a literal '## Instructions for Large Language Models' section plus a 363 KB llms-full.txt of the complete docs. Caveat recorded honestly: human doc pages are hash-routed (no per-page static URLs) — the llms files are the machine path. No three.js MCP exists, official or notable community; coding agents drive the library directly through npm.",
            'fetchedAt': NOW,
        },
    ],
    'babylonjs': [
        {
            'id': 'babylonjs-probe-rt-1',
            'tier': 'probe',
            'url': 'https://doc.babylonjs.com/setup/frameworkPackages/npmSupport',
            'excerpt': "PROBE runtime (recorded 2026-09-15): `npm view @babylonjs/core version` → 9.26.1 (Apache-2.0, 234,040 weekly downloads via the public npm API), and BOTH doc.babylonjs.com and www.babylonjs.com serve llms.txt files.",
            'fetchedAt': NOW,
        },
        {
            'id': 'babylonjs-probe-rt-2',
            'tier': 'probe',
            'url': 'https://www.babylonjs.com/',
            'excerpt': "PROBE runtime negative (recorded 2026-09-15): despite Microsoft parentage, Babylon.js has essentially no MCP ecosystem — no official server, and the largest community repo has 9 stars (davidvanstory/babylonjs-mcp, idle since 2025-07). Docs pages are client-rendered Next.js with no .md mirrors.",
            'fetchedAt': NOW,
        },
    ],
    'bevy': [
        {
            'id': 'bevy-probe-rt-1',
            'tier': 'probe',
            'url': 'https://bevy.org/learn/quick-start/getting-started/setup/',
            'excerpt': "PROBE runtime (recorded 2026-09-15): bevy resolves on crates.io — `cargo search bevy` → 'bevy = \"0.19.1\" # A refreshingly simple data-driven game engine and app framework', and the keyless crates.io API reports max_stable_version 0.19.1, 1,478,352 downloads in 90 days, license 'MIT OR Apache-2.0'. Pre-1.0 with breaking changes each release — a real caveat for agents trained on older APIs.",
            'fetchedAt': NOW,
        },
        {
            'id': 'bevy-probe-rt-2',
            'tier': 'probe',
            'url': 'https://bevy.org/',
            'excerpt': "PROBE runtime negative (recorded 2026-09-15): bevy.org serves no llms.txt (HTTP 404; docs.rs likewise) and no official MCP exists — community tooling is nascent (natepiano/bevy_brp, 70 stars, built on the first-party Bevy Remote Protocol). Counterweight: docs.rs/bevy gives fully static, crawlable API docs, and the code-first cargo workflow needs no editor for an agent to drive.",
            'fetchedAt': NOW,
        },
    ],
    'playcanvas': [
        {
            'id': 'playcanvas-probe-rt-1',
            'tier': 'probe',
            'url': 'https://developer.playcanvas.com/user-manual/editor/mcp-server/',
            'excerpt': "PROBE runtime (recorded 2026-09-15): PlayCanvas ships the only OFFICIAL, open, npm-published editor MCP server of the eight engines — `npm view @playcanvas/editor-mcp-server version` → 0.7.1, source at playcanvas/editor-mcp-server (official org, 137 stars, pushed 2026-09-09, 'MCP Server for AI automation of the PlayCanvas Editor'), documented in the user manual.",
            'fetchedAt': NOW,
        },
        {
            'id': 'playcanvas-probe-rt-2',
            'tier': 'probe',
            'url': 'https://developer.playcanvas.com/llms.txt',
            'excerpt': "PROBE runtime (recorded 2026-09-15): developer.playcanvas.com serves llms.txt plus the largest llms-full.txt of the arena (2,053,637 bytes of complete docs), and `npm view playcanvas version` → 2.22.2 (MIT engine runtime, 48,435 weekly downloads). A scriptable Editor API is separately documented at api.playcanvas.com/editor/.",
            'fetchedAt': NOW,
        },
    ],
    'phaser': [
        {
            'id': 'phaser-probe-rt-1',
            'tier': 'probe',
            'url': 'https://phaser.io/agent/mcp',
            'excerpt': "PROBE runtime (recorded 2026-09-15): `npm view phaser version` → 4.2.1 (MIT, 263,018 weekly downloads), and phaser.io/llms.txt is live as a programmatic examples-API index ('# Phaser Examples Index... For full metadata and source code, use the API: GET /api/v1/examples/{id}'). Phaser Studio's official MCP rides its hosted Game Agent (phaser.io/agent/mcp 'Connect your coding agent'); no @phaserjs MCP package exists on npm (E404, recorded). Caveat: phaser.io root 403s non-browser clients — deep links and a browser UA required.",
            'fetchedAt': NOW,
        },
    ],
    'unreal': [
        {
            'id': 'unreal-probe-rt-1',
            'tier': 'probe',
            'url': 'https://github.com/EpicGames/UnrealEngine',
            'excerpt': "PROBE runtime negative (recorded 2026-09-15): Unreal is the least machine-readable presence of the eight — api.github.com/repos/EpicGames/UnrealEngine answers {\"message\": \"Not Found\"} keylessly (source access is EULA/account-gated), unrealengine.com/epicgames.com/fab.com return HTTP 403 to all non-browser clients, no llms.txt exists, and appending .md to dev.epicgames.com docs URLs serves the HTML SPA shell, not markdown. No official Epic MCP (GitHub search `mcp org:EpicGames` → 0 results); the most-starred community MCP (chongdashu/unreal-mcp, 2,080 stars) has been unmaintained since 2025-04. Counterweight: the Python editor-scripting docs and UAT/automation CLI docs on dev.epicgames.com/documentation ARE fetchable keylessly.",
            'fetchedAt': NOW,
        },
    ],
}


def main() -> None:
    for pid, items in ITEMS.items():
        path = f'data/game-engines/evidence/{pid}.json'
        with open(path) as f:
            evidence = json.load(f)
        have = {e['id'] for e in evidence}
        added = [i for i in items if i['id'] not in have]
        evidence.extend(added)
        with open(path, 'w') as f:
            json.dump(evidence, f, indent=2, ensure_ascii=False)
            f.write('\n')
        print(f'{pid}: +{len(added)} probe runtime items')


if __name__ == '__main__':
    main()
