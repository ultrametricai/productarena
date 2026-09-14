import json

def add(path, entry):
    d = json.load(open(path))
    ids = [p['id'] for p in d]
    assert entry['id'] not in ids, entry['id']
    d.append(entry)
    json.dump(d, open(path, 'w'), indent=2)
    print(path, '->', [p['id'] for p in d])

add('data/ai-coding/products.json', {
  "id": "antigravity",
  "name": "Google Antigravity",
  "vendor": "Google",
  "type": "commercial",
  "urls": {
    "site": "https://antigravity.google",
    "docs": "https://antigravity.google/docs/getting-started",
    "changelog": "https://antigravity.google/changelog",
    "extra": [
      "https://antigravity.google/product/antigravity-2",
      "https://antigravity.google/product/antigravity-ide",
      "https://antigravity.google/product/antigravity-cli",
      "https://antigravity.google/product/antigravity-sdk",
      "https://antigravity.google/pricing",
      "https://antigravity.google/docs/overview",
      "https://antigravity.google/docs/features",
      "https://antigravity.google/docs/models",
      "https://antigravity.google/docs/projects",
      "https://antigravity.google/docs/subagents",
      "https://antigravity.google/docs/skills",
      "https://antigravity.google/docs/hooks",
      "https://antigravity.google/docs/mcp",
      "https://antigravity.google/docs/permissions",
      "https://antigravity.google/docs/artifact-review",
      "https://antigravity.google/docs/remote-control",
      "https://antigravity.google/docs/rules-workflows",
      "https://antigravity.google/docs/plugins",
      "https://antigravity.google/docs/settings",
      "https://antigravity.google/docs/artifacts"
    ]
  },
  "links": {
    "app": "https://antigravity.google/download",
    "cli": "https://antigravity.google/product/antigravity-cli"
  },
  "businessModel": {
    "models": ["free-tier", "subscription-flat", "enterprise-custom"],
    "summary": "Free for individuals with weekly rate limits; Google AI Pro/Ultra subscriptions raise limits and add a credit pool; teams buy consumption pricing via Gemini Enterprise.",
    "url": "https://antigravity.google/pricing"
  },
  "familyId": "google"
})

add('data/ai-research-agents/products.json', {
  "id": "notebooklm",
  "name": "Gemini Notebook",
  "vendor": "Google",
  "type": "commercial",
  "urls": {
    "site": "https://notebook.google",
    "docs": "https://support.google.com/gemininotebook/answer/16164461?hl=en",
    "extra": [
      "https://support.google.com/gemininotebook/answer/16215270?hl=en",
      "https://support.google.com/gemininotebook/answer/16179559?hl=en",
      "https://support.google.com/gemininotebook/answer/16206563?hl=en",
      "https://support.google.com/gemininotebook/answer/16262519?hl=en",
      "https://support.google.com/gemininotebook/answer/16212283?hl=en",
      "https://support.google.com/gemininotebook/answer/16212820?hl=en",
      "https://support.google.com/gemininotebook/answer/16454555?hl=en",
      "https://support.google.com/gemininotebook/answer/16958963?hl=en",
      "https://support.google.com/gemininotebook/answer/16758265?hl=en",
      "https://support.google.com/gemininotebook/answer/16757456?hl=en",
      "https://support.google.com/gemininotebook/answer/16322204?hl=en",
      "https://support.google.com/gemininotebook/answer/16296687?hl=en",
      "https://support.google.com/gemininotebook/answer/16213268?hl=en",
      "https://support.google.com/gemininotebook/answer/16337734?hl=en",
      "https://support.google.com/gemininotebook/answer/17670842?hl=en",
      "https://support.google.com/gemininotebook/answer/17004255?hl=en",
      "https://support.google.com/gemininotebook/answer/16269187?hl=en"
    ]
  },
  "links": {"app": "https://notebook.google"},
  "businessModel": {
    "models": ["free-tier", "subscription-flat"],
    "summary": "Free with notebook and source limits; Google AI Pro/Ultra subscriptions raise limits and unlock premium features like higher source caps and research options.",
    "url": "https://support.google.com/gemininotebook/answer/16213268?hl=en"
  },
  "familyId": "google"
})

add('data/ai-assistants/products.json', {
  "id": "grok",
  "name": "Grok",
  "vendor": "xAI (SpaceXAI)",
  "type": "commercial",
  "urls": {
    "site": "https://grok.com",
    "docs": "https://docs.x.ai/grok/overview.md",
    "changelog": "https://docs.x.ai/developers/release-notes.md",
    "extra": [
      "https://docs.x.ai/grok/user-guide.md",
      "https://docs.x.ai/grok/faq.md",
      "https://docs.x.ai/grok/connectors.md",
      "https://docs.x.ai/grok/connector-management.md",
      "https://docs.x.ai/grok/connectors/custom-mcp-tunneling.md",
      "https://docs.x.ai/grok/connectors/gmail-google-calendar.md",
      "https://docs.x.ai/grok/connectors/google-drive.md",
      "https://docs.x.ai/grok/connectors/microsoft-teams.md",
      "https://docs.x.ai/grok/connectors/salesforce.md",
      "https://docs.x.ai/grok/management.md",
      "https://docs.x.ai/grok/organization.md"
    ]
  },
  "links": {"app": "https://grok.com", "api": "https://docs.x.ai"},
  "businessModel": {
    "models": ["free-tier", "subscription-flat", "enterprise-custom"],
    "summary": "Free tier with usage limits; SuperGrok, Plus, and Heavy plans share one weekly usage pool across Chat, Imagine, Voice, and Build; Business/Enterprise add org management.",
    "url": "https://docs.x.ai/grok/faq.md"
  },
  "familyId": "xai"
})

add('data/design-tools/products.json', {
  "id": "claude-design",
  "name": "Claude Design",
  "vendor": "Anthropic",
  "type": "commercial",
  "urls": {
    "site": "https://claude.com/product/design",
    "docs": "https://support.claude.com/en/articles/14604416-get-started-with-claude-design",
    "extra": [
      "https://support.claude.com/en/articles/14604397-set-up-your-design-system-in-claude-design",
      "https://support.claude.com/en/articles/14604406-claude-design-admin-guide-for-team-and-enterprise-plans",
      "https://www.anthropic.com/news/claude-design-anthropic-labs",
      "https://claude.com/pricing"
    ]
  },
  "links": {"app": "https://claude.ai/design"},
  "businessModel": {
    "models": ["subscription-flat", "subscription-per-seat", "enterprise-custom"],
    "summary": "Included with Claude Pro and Max subscriptions and Team plans; Enterprise admins enable it per workspace. No separate Design pricing.",
    "url": "https://claude.com/pricing"
  },
  "familyId": "anthropic"
})
print('OK')
