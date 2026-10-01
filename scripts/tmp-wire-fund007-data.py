import json

# ── data/process-step-stories.json: computer-use mappings for fund_007's five non-agent nodes.
# Hand-curated (the LLM mapper is non-deterministic and gated); conservative, mirroring the
# committed conventions: portal form work maps to the browser-agent stories, founder-substance
# and physical/wait steps honestly map to [] (no fleet story describes attempting them).
p = 'data/process-step-stories.json'
raw = open(p).read()
d = json.loads(raw)
rt = json.dumps(d, indent=2, ensure_ascii=True) + '\n'
assert rt == raw, 'process-step-stories.json not round-trip stable: ' + repr(raw[:80])
assert not any(e['taskId'] == 'fund_007' for e in d)
new = [
  {"taskId": "fund_007", "nodeId": "n1", "kind": "computer-use", "arenaId": "ai-assistants", "storyIds": ["browser-agent"]},
  {"taskId": "fund_007", "nodeId": "n1", "kind": "computer-use", "arenaId": "browser-agents", "storyIds": ["dom-action-primitives", "nl-task-to-completion"]},
  {"taskId": "fund_007", "nodeId": "n2", "kind": "computer-use", "arenaId": "ai-assistants", "storyIds": []},
  {"taskId": "fund_007", "nodeId": "n2", "kind": "computer-use", "arenaId": "browser-agents", "storyIds": []},
  {"taskId": "fund_007", "nodeId": "n3", "kind": "computer-use", "arenaId": "ai-assistants", "storyIds": []},
  {"taskId": "fund_007", "nodeId": "n3", "kind": "computer-use", "arenaId": "browser-agents", "storyIds": []},
  {"taskId": "fund_007", "nodeId": "n5", "kind": "computer-use", "arenaId": "ai-assistants", "storyIds": ["browser-agent"]},
  {"taskId": "fund_007", "nodeId": "n5", "kind": "computer-use", "arenaId": "browser-agents", "storyIds": ["dom-action-primitives", "file-download-upload", "nl-task-to-completion"]},
  {"taskId": "fund_007", "nodeId": "n6", "kind": "computer-use", "arenaId": "ai-assistants", "storyIds": []},
  {"taskId": "fund_007", "nodeId": "n6", "kind": "computer-use", "arenaId": "browser-agents", "storyIds": []},
]
d.extend(new)
open(p, 'w').write(json.dumps(d, indent=2, ensure_ascii=True) + '\n')
print('step-stories +', len(new))

# ── data/human-step-audit.json: one authored entry per non-agent node.
p = 'data/human-step-audit.json'
raw = open(p).read()
d = json.loads(raw)
rt = json.dumps(d, indent=2, ensure_ascii=True) + '\n'
assert rt == raw, 'human-step-audit.json not round-trip stable: ' + repr(raw[:80])
assert not any(e['taskId'] == 'fund_007' for e in d)
d.extend([
  {
    "taskId": "fund_007", "nodeId": "n1", "route": "form",
    "why": "YC's application portal is a login-gated web app with no public API; the account is created by hand in the browser.",
    "computerUse": "assist",
    "computerUseWhy": "A browser agent can fill the signup form, but the email-verification loop and any bot checks keep the founder in the loop."
  },
  {
    "taskId": "fund_007", "nodeId": "n2", "route": "person",
    "why": "The written application is the founders' own story — YC's published guidance asks for the founders' direct, concrete answers, which is substance no one else can supply.",
    "computerUse": "assist",
    "computerUseWhy": "An agent can hold drafts and paste saved answers into the form, but the substance of what the company is and who the founders are has to come from the founders."
  },
  {
    "taskId": "fund_007", "nodeId": "n3", "route": "person",
    "why": "YC asks for the founders themselves on camera — the one-minute video exists precisely to show the actual people behind the application.",
    "computerUse": "no-screen",
    "computerUseWhy": "Recording the founders on camera is physical-world work, not a screen an agent could drive; the subsequent upload is trivial by comparison."
  },
  {
    "taskId": "fund_007", "nodeId": "n5", "route": "form",
    "why": "The final review and submission inside YC's portal is the founders' call — sending it attests the application is theirs, complete, and ready before the batch deadline.",
    "computerUse": "policy-gate",
    "computerUseWhy": "The submit click is mechanically trivial in the portal, but only the founders should certify and send their own batch application."
  },
  {
    "taskId": "fund_007", "nodeId": "n6", "route": "person",
    "why": "The decision timeline belongs to YC — founders can only wait for the interview-invitation or decision email to arrive.",
    "computerUse": "third-party-wait",
    "computerUseWhy": "There is nothing to drive: YC reviews applications on its own clock, and the step ends when their email lands."
  },
])
open(p, 'w').write(json.dumps(d, indent=2, ensure_ascii=True) + '\n')
print('human-step-audit +5')
