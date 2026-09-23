import json
import os

os.chdir(os.path.join(os.path.dirname(__file__), '..'))

path = 'data/frontier-models/products.json'
products = json.load(open(path))
assert not any(p['id'] == 'grok' for p in products), 'grok already present'

grok = {
  "id": "grok",
  "name": "Grok (models & API)",
  "vendor": "xAI (SpaceXAI)",
  "type": "commercial",
  "urls": {
    "site": "https://x.ai",
    "docs": "https://docs.x.ai/overview.md",
    "changelog": "https://docs.x.ai/developers/release-notes.md",
    "github": "https://github.com/xai-org/xai-sdk-python",
    "extra": [
      "https://docs.x.ai/llms.txt",
      "https://docs.x.ai/developers/quickstart.md",
      "https://docs.x.ai/developers/models.md",
      "https://docs.x.ai/developers/models/grok-4.7.md",
      "https://docs.x.ai/developers/grok-4-7.md",
      "https://docs.x.ai/developers/pricing.md",
      "https://docs.x.ai/developers/rate-limits.md",
      "https://docs.x.ai/developers/model-capabilities/text/generate-text.md",
      "https://docs.x.ai/developers/model-capabilities/text/streaming.md",
      "https://docs.x.ai/developers/model-capabilities/text/reasoning.md",
      "https://docs.x.ai/developers/model-capabilities/text/structured-outputs.md",
      "https://docs.x.ai/developers/model-capabilities/text/multi-agent.md",
      "https://docs.x.ai/developers/model-capabilities/images/understanding.md",
      "https://docs.x.ai/developers/tools/overview.md",
      "https://docs.x.ai/developers/tools/function-calling.md",
      "https://docs.x.ai/developers/tools/web-search.md",
      "https://docs.x.ai/developers/tools/code-execution.md",
      "https://docs.x.ai/developers/tools/remote-mcp.md",
      "https://docs.x.ai/developers/tools/collections-search.md",
      "https://docs.x.ai/developers/advanced-api-usage/prompt-caching.md",
      "https://docs.x.ai/developers/advanced-api-usage/batch-api.md",
      "https://docs.x.ai/developers/advanced-api-usage/priority-processing.md",
      "https://docs.x.ai/developers/advanced-api-usage/regions.md",
      "https://docs.x.ai/developers/cost-tracking.md",
      "https://docs.x.ai/developers/debugging.md",
      "https://docs.x.ai/developers/migration/may-15-retirement.md",
      "https://docs.x.ai/developers/rest-api-reference/inference.md",
      "https://docs.x.ai/developers/rest-api-reference/inference/responses.md",
      "https://docs.x.ai/developers/rest-api-reference/inference/models.md",
      "https://docs.x.ai/developers/rest-api-reference/management.md",
      "https://docs.x.ai/developers/management-api-guide.md",
      "https://docs.x.ai/developers/rest-api-reference/management/audit.md",
      "https://docs.x.ai/developers/grpc-api-reference.md",
      "https://docs.x.ai/developers/community/google-cloud-vertex-ai.md",
      "https://docs.x.ai/developers/community/microsoft-foundry.md",
      "https://docs.x.ai/developers/docs-mcp.md",
      "https://docs.x.ai/developers/faq/security.md",
      "https://docs.x.ai/developers/faq/general.md",
      "https://docs.x.ai/developers/files.md",
      "https://docs.x.ai/developers/files/collections.md"
    ]
  },
  "links": {
    "app": "https://console.x.ai",
    "api": "https://docs.x.ai/developers/rest-api-reference/inference",
    "mcp": "https://docs.x.ai/developers/tools/remote-mcp"
  },
  "businessModel": {
    "models": ["usage-based", "enterprise-custom"],
    "summary": "Usage-based per-token API pricing published per model with cached-input discounts, batch and priority-processing tiers, and team/enterprise billing via the management API.",
    "url": "https://docs.x.ai/developers/pricing"
  },
  "install": [
    {
      "label": "pip",
      "command": "pip install xai-sdk",
      "url": "https://docs.x.ai/developers/quickstart"
    },
    {
      "label": "npm",
      "command": "npm install ai @ai-sdk/xai zod",
      "url": "https://docs.x.ai/developers/quickstart"
    }
  ]
}

products.append(grok)
with open(path, 'w') as f:
    json.dump(products, f, indent=2, ensure_ascii=False)
    f.write('\n')
print('added grok; roster now:', [p['id'] for p in products])

# community seeds
seeds_path = 'pipeline/seeds/community.json'
seeds = json.load(open(seeds_path))
fm = seeds['frontier-models']
assert 'grok' not in fm
fm['grok'] = [
  "https://hn.algolia.com/api/v1/items/49788838",
  "https://hn.algolia.com/api/v1/items/49274027",
  "https://hn.algolia.com/api/v1/items/48835111",
  "https://hn.algolia.com/api/v1/items/45862833"
]
with open(seeds_path, 'w') as f:
    json.dump(seeds, f, indent=2, ensure_ascii=False)
    f.write('\n')
print('seeded community for grok:', fm['grok'])
