import json
p='data/categories.json'
cats=json.load(open(p))
assert not any(c['id']=='customer-data-platforms' for c in cats)
cats.append({
  "id": "customer-data-platforms",
  "name": "Customer Data Platforms",
  "description": "Customer data platforms — event collection, identity resolution, audiences, and activation — judged on SDK breadth and tracking specs, identity stitching and unified profiles, audience building and real-time activation, the destinations catalog, warehouse sync and warehouse-native/composable modes, in-pipeline transformations and schema enforcement, privacy and consent controls (including deletion/suppression), pipeline observability, event replay and backfill, self-hostability, and how completely an AI agent can manage pipelines and query or activate audiences through documented APIs and MCP servers. Boundary: product analytics (Amplitude, Mixpanel, PostHog) is a separate arena — products are judged here only on their CDP surface. Hightouch is included as the composable-CDP anchor (its Customer Studio builds and activates warehouse-native audiences, plus event collection and identity resolution); mParticle is judged post-Rokt-merger. All five verified live, with hosted MCP servers confirmed for RudderStack, Jitsu, and Hightouch.",
  "personas": ["data-engineer","marketer","privacy-lead","ai-native"],
  "themes": ["event-collection","identity-resolution","audiences-activation","destinations-integrations","warehouse-native","transformations-quality","privacy-consent","pipeline-observability","replay-portability","ai-cdp"]
})
with open(p,'w') as f:
    f.write(json.dumps(cats, indent=2)+'\n')
print('added customer-data-platforms; total', len(cats))
