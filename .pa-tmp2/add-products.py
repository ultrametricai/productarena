# Bring-up registrations (2026-09-14 design-tools deepening wave):
#   design-tools: spline, rive
#   notes-knowledge: poly (disambiguated — withpoly.com 301s to poly.app; the 2022 AI-texture
#   design product is gone. Poly today is "the intelligent cloud file system" (Launch HN: "Poly
#   (YC S22) — Cursor for Files"), so the honest arena is Notes & Knowledge Bases, not
#   Design & Prototyping.)
import json


def add(path, entry):
    d = json.load(open(path))
    ids = [p['id'] for p in d]
    assert entry['id'] not in ids, entry['id']
    d.append(entry)
    with open(path, 'w') as f:
        f.write(json.dumps(d, indent=2) + '\n')
    print(path, '->', [p['id'] for p in d])


add('data/design-tools/products.json', {
    "id": "spline",
    "name": "Spline",
    "vendor": "Spline, Inc.",
    "type": "commercial",
    "urls": {
        "site": "https://spline.design",
        "docs": "https://docs.spline.design/basics/what-is-spline",
        "extra": [
            "https://docs.spline.design/llms.txt",
            "https://docs.spline.design/index.md",
            "https://docs.spline.design/basics/what-is-spline.md",
            "https://docs.spline.design/basics/download-spline-for-desktop.md",
            "https://docs.spline.design/spline-ai/ai-agent.md",
            "https://docs.spline.design/spline-ai/ai-textures.md",
            "https://docs.spline.design/interaction-states-events-and-actions/variables-and-data/real-time-api.md",
            "https://docs.spline.design/interaction-states-events-and-actions/variables-and-data/webhooks.md",
            "https://docs.spline.design/interaction-states-events-and-actions/code-tab.md",
            "https://docs.spline.design/exporting-your-scene/web/exporting-as-code.md",
            "https://docs.spline.design/exporting-your-scene/web/code-api-for-web.md",
            "https://docs.spline.design/exporting-your-scene/web/exporting-as-spline-viewer.md",
            "https://docs.spline.design/exporting-your-scene/web/exporting-as-self-hosted-project.md",
            "https://docs.spline.design/designing-in-3-d/scenes/components.md",
            "https://docs.spline.design/designing-in-3-d/scenes/version-history.md",
            "https://spline.design/pricing"
        ]
    },
    "links": {
        "app": "https://app.spline.design",
        "api": "https://docs.spline.design/exporting-your-scene/web/code-api-for-web",
        "mcp": "https://docs.spline.design/basics/download-spline-for-desktop"
    },
    "businessModel": {
        "models": ["free-tier", "subscription-per-seat", "enterprise-custom"],
        "summary": "Free personal plan, then per-seat Super/Super Team tiers that unlock exports, higher limits, and AI features; custom Enterprise contracts.",
        "url": "https://spline.design/pricing"
    },
    "install": [
        {
            "label": "npm",
            "command": "npm install @splinetool/runtime",
            "url": "https://docs.spline.design/exporting-your-scene/web/code-api-for-web"
        }
    ]
})

add('data/design-tools/products.json', {
    "id": "rive",
    "name": "Rive",
    "vendor": "Rive, Inc.",
    "type": "commercial",
    "urls": {
        "site": "https://rive.app",
        "docs": "https://rive.app/docs/getting-started/introduction",
        "github": "https://github.com/rive-app/rive-runtime",
        "extra": [
            "https://rive.app/docs/llms.txt",
            "https://rive.app/docs/getting-started/introduction.md",
            "https://rive.app/docs/editor/ai-agent/ai-agent.md",
            "https://rive.app/docs/editor/ai/mcp.md",
            "https://rive.app/docs/editor/data-binding/overview.md",
            "https://rive.app/docs/editor/exporting/exporting-for-runtime.md",
            "https://rive.app/docs/runtimes/getting-started.md",
            "https://rive.app/docs/runtimes/web/web-js.md",
            "https://rive.app/docs/runtimes/web/rive-parameters.md",
            "https://rive.app/docs/runtimes/advanced-topic/rml.md",
            "https://rive.app/docs/scripting/getting-started.md",
            "https://rive.app/docs/editor/fundamentals/components.md",
            "https://rive.app/docs/editor/fundamentals/revision-history.md",
            "https://rive.app/docs/community/marketplace.md",
            "https://rive.app/docs/account-admin/pricing.md",
            "https://rive.app/pricing"
        ]
    },
    "links": {
        "app": "https://editor.rive.app",
        "api": "https://rive.app/docs/runtimes/web/rive-parameters",
        "mcp": "https://rive.app/docs/editor/ai/mcp"
    },
    "businessModel": {
        "models": ["free-tier", "subscription-per-seat", "enterprise-custom"],
        "summary": "Free plan for learning (3 collaborative files); per-seat Cadet ($17/mo) and Voyager ($39/mo) tiers unlock runtime exports and Libraries; Enterprise at $1,440/seat/year.",
        "url": "https://rive.app/pricing"
    },
    "install": [
        {
            "label": "npm",
            "command": "npm install @rive-app/canvas",
            "url": "https://rive.app/docs/runtimes/web/web-js"
        }
    ]
})

add('data/notes-knowledge/products.json', {
    "id": "poly",
    "name": "Poly",
    "vendor": "Poly (withpoly)",
    "type": "commercial",
    "urls": {
        "site": "https://poly.app",
        "docs": "https://docs.poly.app",
        "github": "https://github.com/withpoly/polymcp",
        "extra": [
            "https://docs.poly.app/llms.txt",
            "https://docs.poly.app/raw/index.md",
            "https://docs.poly.app/raw/getting-started.md",
            "https://docs.poly.app/raw/file-browser.md",
            "https://docs.poly.app/raw/searching.md",
            "https://docs.poly.app/raw/agent.md",
            "https://docs.poly.app/raw/agent/creating-and-editing-files.md",
            "https://docs.poly.app/raw/agent/complex-tasks.md",
            "https://docs.poly.app/raw/mind.md",
            "https://docs.poly.app/raw/mind/journaling.md",
            "https://docs.poly.app/raw/mind/integrating-with-your-agent.md",
            "https://docs.poly.app/raw/mind/importing-your-notes.md",
            "https://docs.poly.app/raw/cli.md",
            "https://docs.poly.app/raw/cli/commands.md",
            "https://docs.poly.app/raw/cli/agent-skill.md",
            "https://docs.poly.app/raw/integrations.md",
            "https://docs.poly.app/raw/integrations/using-mcp.md",
            "https://docs.poly.app/raw/integrations/claude-code.md",
            "https://docs.poly.app/raw/desktop.md",
            "https://docs.poly.app/raw/desktop/sync-folder.md",
            "https://docs.poly.app/raw/recovering-files.md",
            "https://docs.poly.app/raw/sharing.md",
            "https://docs.poly.app/raw/privacy-and-security.md",
            "https://docs.poly.app/raw/releases/latest.md"
        ]
    },
    "links": {
        "app": "https://poly.app",
        "cli": "https://docs.poly.app/cli",
        "mcp": "https://docs.poly.app/integrations/using-mcp"
    },
    "install": [
        {
            "label": "gemini-cli",
            "command": "gemini extensions install https://github.com/withpoly/polymcp",
            "url": "https://docs.poly.app/cli/agent-skill"
        }
    ]
})
