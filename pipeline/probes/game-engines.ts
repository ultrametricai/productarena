import type { LocalProbe } from './types'

// Game engines, probed keylessly on the surfaces the founder asked about: llms.txt indexes
// (unity.com, threejs.org — whose docs llms.txt carries literal "Instructions for Large
// Language Models" — doc.babylonjs.com, developer.playcanvas.com, phaser.io), registry
// installs (npm three/@babylonjs/core/playcanvas/phaser, cargo bevy, brew casks godot/
// unity-hub), PlayCanvas's OFFICIAL editor MCP server on npm, Godot's keyless Asset Library
// API, and honest negatives — godotengine.org serves no llms.txt, and EpicGames/UnrealEngine
// 404s keylessly (source access is EULA/auth-gated), the least machine-readable presence of
// the eight. MCP context verified live: Unity's official MCP ships inside com.unity.ai.assistant
// (docs-only, no public repo/package — so no keyless handshake exists to record); Godot and
// Unreal have community-only MCPs; Phaser's MCP rides its hosted Game Agent. All keyless,
// read-only.
export const probes: LocalProbe[] = [
  {
    // unity.com serves a site-root llms.txt.
    probeId: 'site-llms-txt',
    productId: 'unity',
    storyIds: ['agentic-agent-docs'],
    bin: 'curl',
    argv: ['sh', '-c', 'curl -sL --max-time 20 https://unity.com/llms.txt | head -4'],
    displayCommand: 'curl -s https://unity.com/llms.txt | head -4',
    expect: /# Unity/,
    timeoutMs: 30_000,
  },
  {
    // Unity Hub installs keylessly from Homebrew (the engine's distribution channel).
    probeId: 'brew-hub-cask',
    productId: 'unity',
    storyIds: ['agentic-headless', 'headless-cli-builds'],
    bin: 'brew',
    argv: ['sh', '-c', 'brew info --json=v2 unity-hub 2>/dev/null | grep -o \'"desc": *"[^"]*"\' | head -1'],
    displayCommand: 'brew info --json=v2 unity-hub | grep desc',
    expect: /Management tool for Unity/,
    timeoutMs: 60_000,
  },
  {
    // Godot installs keylessly from Homebrew — the binary that runs `godot --headless`.
    probeId: 'brew-cask',
    productId: 'godot',
    storyIds: ['agentic-headless', 'headless-cli-builds'],
    bin: 'brew',
    argv: ['sh', '-c', 'brew info --json=v2 godot 2>/dev/null | grep -o \'"desc": *"[^"]*"\' | head -1'],
    displayCommand: 'brew info --json=v2 godot | grep desc',
    expect: /2D and 3D game engine/,
    timeoutMs: 60_000,
  },
  {
    // Godot's Asset Library exposes a keyless JSON API.
    probeId: 'asset-library-api',
    productId: 'godot',
    storyIds: ['agentic-public-api', 'asset-marketplace'],
    bin: 'curl',
    argv: ['sh', '-c', `curl -s --max-time 20 'https://godotengine.org/asset-library/api/asset?godot_version=4.3&max_results=2' | head -c 200`],
    displayCommand: `curl -s 'https://godotengine.org/asset-library/api/asset?godot_version=4.3&max_results=2'`,
    expect: /"result":\[\{"asset_id"/,
    timeoutMs: 30_000,
  },
  {
    // Honest negative: godotengine.org publishes no llms.txt (docs are clean Sphinx HTML,
    // but nothing machine-oriented).
    probeId: 'site-llms-txt-absent',
    productId: 'godot',
    storyIds: ['agentic-agent-docs'],
    bin: 'curl',
    argv: ['sh', '-c', 'curl -sL --max-time 20 -o /dev/null -w "HTTP %{http_code}" https://godotengine.org/llms.txt'],
    displayCommand: 'curl -s -o /dev/null -w "HTTP %{http_code}" https://godotengine.org/llms.txt',
    expect: /HTTP 404/,
    timeoutMs: 30_000,
  },
  {
    // three.js resolves on the public npm registry.
    probeId: 'npm-version',
    productId: 'threejs',
    storyIds: ['agentic-sdks', 'npm-installable-runtime'],
    bin: 'npm',
    argv: ['npm', 'view', 'three', 'version'],
    displayCommand: 'npm view three version',
    expect: /\d+\.\d+\.\d+/,
    timeoutMs: 60_000,
  },
  {
    // three.js weekly downloads from the public npm API — an order of magnitude above every
    // other engine here (12.2M/week at recording).
    probeId: 'npm-weekly-downloads',
    productId: 'threejs',
    storyIds: ['npm-installable-runtime'],
    bin: 'curl',
    argv: ['sh', '-c', 'curl -s --max-time 20 https://api.npmjs.org/downloads/point/last-week/three'],
    displayCommand: 'curl -s https://api.npmjs.org/downloads/point/last-week/three',
    expect: /"package":"three"/,
    timeoutMs: 30_000,
  },
  {
    // threejs.org serves a site llms.txt pointing at the full docs index.
    probeId: 'site-llms-txt',
    productId: 'threejs',
    storyIds: ['agentic-agent-docs'],
    bin: 'curl',
    argv: ['sh', '-c', 'curl -s --max-time 20 https://threejs.org/llms.txt | head -6'],
    displayCommand: 'curl -s https://threejs.org/llms.txt | head -6',
    expect: /# Three\.js/,
    timeoutMs: 30_000,
  },
  {
    // The docs llms.txt carries a literal "Instructions for Large Language Models" section
    // (plus a 363 KB llms-full.txt).
    probeId: 'docs-llm-instructions',
    productId: 'threejs',
    storyIds: ['agentic-agent-docs', 'codegen-friendly-apis'],
    bin: 'curl',
    argv: ['sh', '-c', 'curl -s --max-time 20 https://threejs.org/docs/llms.txt | grep -m1 "Instructions"'],
    displayCommand: 'curl -s https://threejs.org/docs/llms.txt | grep -m1 Instructions',
    expect: /Instructions for Large Language Models/,
    timeoutMs: 30_000,
  },
  {
    // @babylonjs/core resolves on the public npm registry.
    probeId: 'npm-version',
    productId: 'babylonjs',
    storyIds: ['agentic-sdks', 'npm-installable-runtime'],
    bin: 'npm',
    argv: ['npm', 'view', '@babylonjs/core', 'version'],
    displayCommand: 'npm view @babylonjs/core version',
    expect: /\d+\.\d+\.\d+/,
    timeoutMs: 60_000,
  },
  {
    // Babylon's docs llms.txt (the site root serves one too).
    probeId: 'docs-llms-txt',
    productId: 'babylonjs',
    storyIds: ['agentic-agent-docs'],
    bin: 'curl',
    argv: ['sh', '-c', 'curl -s --max-time 20 https://doc.babylonjs.com/llms.txt | head -4'],
    displayCommand: 'curl -s https://doc.babylonjs.com/llms.txt | head -4',
    expect: /# Babylon\.js Documentation/,
    timeoutMs: 30_000,
  },
  {
    // bevy resolves on crates.io via cargo search.
    probeId: 'cargo-search',
    productId: 'bevy',
    storyIds: ['agentic-sdks'],
    bin: 'cargo',
    argv: ['sh', '-c', 'cargo search bevy --limit 3 2>&1 | head -3'],
    displayCommand: 'cargo search bevy --limit 3',
    expect: /bevy = "\d+\.\d+/,
    timeoutMs: 60_000,
  },
  {
    // crates.io's keyless JSON API confirms the stable version (requires a User-Agent).
    probeId: 'crates-api',
    productId: 'bevy',
    storyIds: ['agentic-public-api'],
    bin: 'curl',
    argv: ['sh', '-c', 'curl -s --max-time 20 -A "productarena-probe" https://crates.io/api/v1/crates/bevy | grep -o \'"max_stable_version":"[^"]*"\' | head -1'],
    displayCommand: 'curl -s -A "productarena-probe" https://crates.io/api/v1/crates/bevy | grep max_stable_version',
    expect: /"max_stable_version":"\d+\.\d+/,
    timeoutMs: 30_000,
  },
  {
    // playcanvas resolves on the public npm registry (the MIT engine runtime).
    probeId: 'npm-version',
    productId: 'playcanvas',
    storyIds: ['agentic-sdks', 'npm-installable-runtime'],
    bin: 'npm',
    argv: ['npm', 'view', 'playcanvas', 'version'],
    displayCommand: 'npm view playcanvas version',
    expect: /\d+\.\d+\.\d+/,
    timeoutMs: 60_000,
  },
  {
    // PlayCanvas's OFFICIAL editor MCP server is published to npm by the playcanvas org and
    // documented in the user manual — the only engine here with an open, npm-published,
    // first-party editor MCP.
    probeId: 'editor-mcp-npm',
    productId: 'playcanvas',
    storyIds: ['agentic-mcp-server', 'agent-editor-control'],
    bin: 'npm',
    argv: ['npm', 'view', '@playcanvas/editor-mcp-server', 'version'],
    displayCommand: 'npm view @playcanvas/editor-mcp-server version',
    expect: /\d+\.\d+\.\d+/,
    timeoutMs: 60_000,
  },
  {
    // PlayCanvas docs llms.txt (with a 2 MB llms-full.txt behind it).
    probeId: 'docs-llms-txt',
    productId: 'playcanvas',
    storyIds: ['agentic-agent-docs'],
    bin: 'curl',
    argv: ['sh', '-c', 'curl -s --max-time 20 https://developer.playcanvas.com/llms.txt | head -6'],
    displayCommand: 'curl -s https://developer.playcanvas.com/llms.txt | head -6',
    expect: /# PlayCanvas Developer Documentation/,
    timeoutMs: 30_000,
  },
  {
    // phaser resolves on the public npm registry.
    probeId: 'npm-version',
    productId: 'phaser',
    storyIds: ['agentic-sdks', 'npm-installable-runtime'],
    bin: 'npm',
    argv: ['npm', 'view', 'phaser', 'version'],
    displayCommand: 'npm view phaser version',
    expect: /\d+\.\d+\.\d+/,
    timeoutMs: 60_000,
  },
  {
    // phaser.io's llms.txt doubles as a programmatic examples-API index (root needs a browser
    // UA — Cloudflare blocks bare curl, recorded honestly in the command).
    probeId: 'site-llms-txt',
    productId: 'phaser',
    storyIds: ['agentic-agent-docs'],
    bin: 'curl',
    argv: ['sh', '-c', 'curl -s --max-time 20 -A "Mozilla/5.0" https://phaser.io/llms.txt | head -3'],
    displayCommand: 'curl -s -A "Mozilla/5.0" https://phaser.io/llms.txt | head -3',
    expect: /# Phaser Examples Index/,
    timeoutMs: 30_000,
  },
  {
    // Honest negative: Unreal's source repo is EULA/auth-gated (raw README 404s keylessly)
    // and unrealengine.com 403s every non-browser client, its license page included.
    // (Deliberately avoids api.github.com — the keyless 60/hr rate limit makes that endpoint
    // an unreliable recorder; raw.githubusercontent.com has no such limit.)
    probeId: 'source-auth-gated',
    productId: 'unreal',
    storyIds: ['full-source-access', 'openness-open-license'],
    bin: 'curl',
    argv: [
      'sh', '-c',
      'echo "github raw README: HTTP $(curl -sL -o /dev/null -w "%{http_code}" --max-time 20 https://raw.githubusercontent.com/EpicGames/UnrealEngine/HEAD/README.md)"; echo "unrealengine.com license: HTTP $(curl -s -o /dev/null -w "%{http_code}" --max-time 20 https://www.unrealengine.com/en-US/license)"',
    ],
    displayCommand: 'curl -sL -o /dev/null -w "%{http_code}" https://raw.githubusercontent.com/EpicGames/UnrealEngine/HEAD/README.md; curl -s -o /dev/null -w "%{http_code}" https://www.unrealengine.com/en-US/license',
    expect: /github raw README: HTTP 404/,
    timeoutMs: 30_000,
  },
]
