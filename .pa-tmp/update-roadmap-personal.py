import json

p = 'data/arena-roadmap.json'
d = json.load(open(p))
ids = [e['id'] for e in d]

# 1. Refresh live ai-assistants candidates to reflect the arena as shipped
aa = d[ids.index('ai-assistants')]
aa['candidateProducts'] = ["ChatGPT", "Claude", "Gemini", "Perplexity", "Microsoft Copilot", "Grok", "Muse", "Poke", "Martin"]
aa['rationale'] = ("Live arena: the most-used software products on earth, finally judged on evidence. "
                   "Now spans frontier-lab assistants plus the personal-first wave (Meta Muse, Poke, Martin) brought up 2026-09.")

# 2. personal-assistants entry (recommendation documented; not created this wave)
pa = {
    "id": "personal-assistants",
    "name": "Personal AI Assistants & Companions",
    "tier": 3,
    "status": "planned",
    "g2Equivalent": None,
    "candidateProducts": ["Pi (Inflection)", "Sesame", "Ohai", "Duckbill", "Rabbit r1", "Friend"],
    "rationale": ("2026-09 research verdict: the strongest personal assistants (Meta Muse, Poke, Martin) compete honestly "
                  "in the live ai-assistants arena and were brought up there instead. What remains is a companion/concierge "
                  "tier - Pi (alive but no dev surface; pi.ai bot-blocks fetchers), Sesame (voice preview, eyewear 2027), "
                  "Ohai (family manager, from $9.99/mo), Duckbill (human+AI concierge, $49-350/mo), Rabbit r1 ($199 device), "
                  "Friend (companion pendant). Dead/pivoted, verified 2026-09-14: Dot shut down Oct 2025; Limitless acquired "
                  "by Meta and sunsetting; Personal.ai pivoted to enterprise telecom. Stand this arena up only if judged as "
                  "its own thing (companionship, proactivity, household focus) rather than on the assistants spine, where "
                  "most of these would na/none out (Mercury-SAFEs rule)."),
    "aiEraAngle": ("Proactive outreach, memory, and real-world task completion (calls, bookings, purchases) vs privacy "
                   "posture; almost no public APIs - the absence is the finding."),
}
d.insert(ids.index('ai-assistants') + 1, pa)

# 3. video-hosting entry anchored by Skiv (ex-muse.ai)
ids = [e['id'] for e in d]
vh = {
    "id": "video-hosting",
    "name": "Video Hosting & In-Video Search APIs",
    "tier": 3,
    "status": "planned",
    "g2Equivalent": "Video Hosting Software",
    "candidateProducts": ["Skiv (ex-muse.ai)", "Mux", "Cloudflare Stream", "api.video", "Bunny Stream", "Vimeo"],
    "rationale": ("Surfaced by the 2026-09 muse.ai disambiguation: the original muse.ai video host rebranded to Skiv "
                  "(skiv.com, March 2026) and transferred the muse.ai domain to Meta, which launched its Muse personal "
                  "agent there on 2026-09-08. Skiv keeps the ad-free player, AI in-video search (speech, on-screen text, "
                  "visual), API and docs - a credible anchor for an API-first video hosting arena."),
    "aiEraAngle": ("Upload/transcode/search as agent-callable APIs, in-video semantic search quality, embed openness, "
                   "and per-minute pricing transparency."),
}
pos = ids.index('video-editing') + 1 if 'video-editing' in ids else len(d)
d.insert(pos, vh)

json.dump(d, open(p, 'w'), indent=2)
open(p, 'a').write('\n')
print('roadmap updated:', len(d), 'entries')
