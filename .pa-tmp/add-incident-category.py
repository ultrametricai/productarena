import json

p = 'data/categories.json'
c = json.load(open(p))
assert not any(x['id'] == 'incident-management' for x in c)
c.append({
    "id": "incident-management",
    "name": "Incident Management & On-call",
    "description": "Incident management and on-call platforms — alerting, escalation, scheduling, incident response, postmortems, and status pages — judged on alert routing and noise reduction, on-call schedules and overrides, chat-native incident response, timelines, retrospectives and follow-ups, status communication, observability integrations, runbook and workflow automation, reliability analytics, and how completely an AI agent can acknowledge, escalate, and resolve through documented APIs, webhooks, and MCP servers. Opsgenie was excluded — Atlassian's page now redirects straight to a migration notice after its sunset — and Grafana OnCall OSS was excluded because its repository is archived in cold storage; Better Stack is judged here on its incident-management and on-call surface, with uptime monitoring left to a future arena.",
    "personas": ["sre", "on-call-engineer", "engineering-leader", "ai-native"],
    "themes": [
        "alerting-escalation",
        "on-call-scheduling",
        "incident-response",
        "postmortems-learning",
        "status-communication",
        "integrations-observability",
        "automation-runbooks",
        "analytics-reliability",
        "mobile-experience",
        "ai-incident",
    ],
})
open(p, 'w').write(json.dumps(c, indent=2) + '\n')
print('categories:', len(c))

# roadmap flip
rp = 'data/arena-roadmap.json'
r = json.load(open(rp))
[e] = [e for e in r if e['id'] == 'incident-management']
assert e['status'] == 'planned'
e['status'] = 'live'
e['name'] = 'Incident Management & On-call'
e['candidateProducts'] = ['PagerDuty', 'incident.io', 'FireHydrant', 'Rootly', 'Better Stack']
e['rationale'] = (
    "Live arena: Opsgenie's sunset forced a mass migration and buyers are actively comparing. "
    "Opsgenie itself was verified sunset (Atlassian's page redirects to a migration notice) and "
    "Grafana OnCall OSS was verified archived (repo moved to grafana-cold-storage), so Better Stack "
    "fills the fifth slot from the roadmap's own candidate list."
)
e['aiEraAngle'] = (
    'AI responders head-to-head: AI incident summaries and drafted postmortems (incident.io Scribe, '
    'Rootly AI, FireHydrant AI), root-cause investigations, and hosted MCP servers '
    '(mcp.pagerduty.com, mcp.incident.io, mcp.rootly.com) through which agents ack and escalate.'
)
open(rp, 'w').write(json.dumps(r, indent=2) + '\n')
print('roadmap flipped')

# popularity packages
pp = 'pipeline/popularity-packages.json'
d = json.load(open(pp))
d['pagerduty'] = {"pypi": "pagerduty", "npm": "@pagerduty/pdjs"}
d['incident-io'] = {"npm": "@incident-io/backstage"}
d['firehydrant'] = {"npm": "firehydrant-typescript-sdk"}
d['rootly'] = {"pypi": "rootly-mcp-server"}
d['betterstack'] = {"npm": "@logtail/node"}
open(pp, 'w').write(json.dumps(d, indent=1) + '\n')
print('popularity packages added')

# community seeds
sp = 'pipeline/seeds/community.json'
s = json.load(open(sp))
assert 'incident-management' not in s
s['incident-management'] = {
    "pagerduty": [
        "https://hn.algolia.com/api/v1/items/26203074",
        "https://hn.algolia.com/api/v1/items/35675029",
        "https://hn.algolia.com/api/v1/items/19402966",
    ],
    "incident-io": [
        "https://hn.algolia.com/api/v1/items/39605713",
        "https://hn.algolia.com/api/v1/items/42257640",
        "https://hn.algolia.com/api/v1/items/25846943",
        "https://hn.algolia.com/api/v1/items/43643871",
    ],
    "firehydrant": [
        "https://hn.algolia.com/api/v1/items/17382927",
        "https://hn.algolia.com/api/v1/items/41311415",
        "https://hn.algolia.com/api/v1/items/22469710",
    ],
    "rootly": [
        "https://hn.algolia.com/api/v1/items/31653985",
        "https://hn.algolia.com/api/v1/items/39606393",
        "https://hn.algolia.com/api/v1/items/39696484",
    ],
    "betterstack": [
        "https://hn.algolia.com/api/v1/items/32191168",
        "https://hn.algolia.com/api/v1/items/26203074",
        "https://hn.algolia.com/api/v1/items/43896997",
    ],
}
open(sp, 'w').write(json.dumps(s, indent=2) + '\n')
print('seeds added')
