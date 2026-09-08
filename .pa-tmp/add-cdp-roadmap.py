import json
p='data/arena-roadmap.json'
d=json.load(open(p))
assert not any(e['id']=='customer-data-platforms' for e in d)
entry={
  "id": "customer-data-platforms",
  "name": "Customer Data Platforms",
  "tier": 2,
  "status": "live",
  "g2Equivalent": "Customer Data Platforms (CDP)",
  "candidateProducts": [
    "Twilio Segment",
    "RudderStack",
    "mParticle",
    "Jitsu",
    "Hightouch"
  ],
  "rationale": "Live arena: the pipe every other tool drinks from — Segment vs open-source RudderStack/Jitsu vs the composable-CDP wave (Hightouch), with mParticle judged post-Rokt-merger. Amplitude stays in product-analytics (boundary rule: products judged here only on their CDP surface).",
  "aiEraAngle": "Agents managing customer-data pipelines head-to-head: hosted MCP servers verified live for RudderStack (mcp.rudderstack.com), Jitsu (use.jitsu.com/mcp), and Hightouch; AI audience builders and agent-driven activation judged against evidence; llms.txt sweep across all five."
}
# insert right after incident-management for tier-2 locality
idx = next(i for i,e in enumerate(d) if e['id']=='incident-management')
d.insert(idx+1, entry)
with open(p,'w') as f:
    f.write(json.dumps(d, indent=2)+'\n')
print('inserted at', idx+1, 'total', len(d))
