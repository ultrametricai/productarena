import json

p = 'data/categories.json'
c = json.load(open(p))
assert not any(x['id'] == 'email' for x in c), 'email already registered'
c.append({
    "id": "email",
    "name": "Email Clients & Email AI",
    "description": "Email clients and AI-native email apps — the inbox war refought in the AI era — judged on triage and split inboxes, snippets and templates, shared team inboxes, calendar integration, search, keyboard-first speed, offline resilience, multi-account and open-protocol portability, tracking protection, and how completely an AI agent can read, triage, draft, and send through documented APIs and MCP servers. Transactional email APIs, email marketing, and help-desk ticketing are separate arenas; Missive is judged here as the shared-inbox anchor and Fastmail as the classic open-protocol anchor. Notion Mail was evaluated and excluded: Notion's own help center announces the Notion Mail inbox shuts down on September 22, 2026.",
    "personas": ["power-user", "team-lead", "switcher", "ai-native"],
    "themes": [
        "triage-inbox",
        "composing-sending",
        "team-collaboration",
        "calendar-integration",
        "speed-keyboard",
        "search-history",
        "offline-reliability",
        "accounts-openness",
        "privacy-tracking",
        "ai-email",
    ],
})
open(p, 'w').write(json.dumps(c, indent=2) + '\n')
print('categories:', len(c))
