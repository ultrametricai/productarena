import json

p = 'data/arena-roadmap.json'
r = json.load(open(p))
[e] = [e for e in r if e['id'] == 'email-clients']
assert e['status'] == 'planned'
e['id'] = 'email'
e['name'] = 'Email Clients & Email AI'
e['status'] = 'live'
e['candidateProducts'] = ['Superhuman Mail', 'Shortwave', 'Missive', 'Zero', 'Fastmail']
e['rationale'] = (
    'Live arena: AI-native clients are re-fighting the inbox war. Notion Mail was verified mid-bring-up '
    'to be shutting down September 22, 2026 (per Notion’s own help center) and was excluded; Fastmail '
    'anchors the classic open-protocol corner instead.'
)
e['aiEraAngle'] = (
    'Inbox agents and triage automation head-to-head: first-party MCP servers (Superhuman Mail MCP, '
    'mcp.missiveapp.com), AI drafting in your voice, auto-labeling, and IMAP/JMAP openness vs walled gardens.'
)
open(p, 'w').write(json.dumps(r, indent=1) + '\n')
print('flipped email live')
