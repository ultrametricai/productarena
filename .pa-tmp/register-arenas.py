#!/usr/bin/env python3
# Registers the durable-workflows + ai-support-agents arenas: categories.json entries,
# adjacent-arenas clusters, roadmap live-flips, arena icons. Idempotent (skips when present).
import json

def load(p):
    with open(p) as f:
        return json.load(f)

def dump(p, d):
    with open(p, 'w') as f:
        json.dump(d, f, indent=2, ensure_ascii=False)
        f.write('\n')

# --- categories.json ---
cats = load('data/categories.json')
if not any(c['id'] == 'durable-workflows' for c in cats):
    cats.append({
        'id': 'durable-workflows',
        'name': 'Durable Execution Engines',
        'description': (
            'Durable execution engines — the checkpointing workflow runtimes that make long-running, failure-prone code '
            'reliable by persisting every step and resuming exactly where a crash, deploy, or week-long pause left off — '
            'judged on code-first workflow authoring in real languages, automatic retries with backoff, crash recovery and '
            'compute-free long sleeps, cron schedules and event triggers, human-in-the-loop approval waits and external '
            'signals, per-run timeline observability and replay debugging, safe versioned deploys while old runs finish, '
            'worker fleet scaling with concurrency and rate controls, and the agent-era heart of the arena: durable agent '
            'loops — LLM and tool calls as retried, checkpointed steps in multi-day agent runs, first-party AI-framework '
            'integrations, and realtime run streaming. Temporal anchors the battle-tested end; DBOS argues the whole '
            'control plane can live in Postgres; Inngest, Trigger.dev, Restate, and Hatchet fight over the '
            'agent-backend developer.'
        ),
        'personas': ['backend-developer', 'platform-engineer', 'agent-builder', 'ai-native'],
        'themes': [
            'workflow-authoring',
            'reliability-recovery',
            'triggers-scheduling',
            'human-in-the-loop',
            'observability-debugging',
            'versioning-deployment',
            'performance-scale',
            'agent-workloads',
            'developer-experience',
            'operations-hosting',
        ],
    })
    print('categories.json: added durable-workflows')
if not any(c['id'] == 'ai-support-agents' for c in cats):
    cats.append({
        'id': 'ai-support-agents',
        'name': 'AI Customer Support Agents',
        'description': (
            'AI customer support agents — autonomous agents that resolve customer conversations end-to-end, the '
            'first agent category with real enterprise revenue and auditable resolution-rate claims — judged on knowledge '
            'grounding (help-center/docs/past-ticket ingestion with cited answers and auto-sync), genuine end-to-end '
            'resolution versus mere deflection, personalized answers from live customer data, safe escalation and human '
            'handoff with full context, channel and language coverage (chat, email, voice, Slack, WhatsApp), real API '
            'actions like refunds and account changes, procedure/SOP builders, hallucination guardrails and supervised '
            'modes, pre-launch simulation testing and ongoing QA, resolution analytics, helpdesk-platform integrations, '
            'and outcome-based per-resolution pricing. The arena where "resolution rate" marketing meets the evidence '
            'standard: vendors are judged on what their agents verifiably do, not what their case studies claim.'
        ),
        'personas': ['support-leader', 'support-ops', 'developer', 'ai-native'],
        'themes': [
            'knowledge-grounding',
            'resolution-quality',
            'escalation-handoff',
            'channels-languages',
            'agent-actions',
            'guardrails-safety',
            'testing-qa',
            'insights-analytics',
            'integrations-platform',
            'pricing-economics',
        ],
    })
    print('categories.json: added ai-support-agents')
dump('data/categories.json', cats)

# --- adjacent-arenas.json ---
adj = load('data/adjacent-arenas.json')
if not any('durable-workflows' in c for c in adj):
    adj.append(['durable-workflows', 'workflow-automation', 'serverless-databases', 'agent-frameworks'])
    print('adjacent-arenas.json: added durable-workflows cluster')
if not any('ai-support-agents' in c for c in adj):
    adj.append(['ai-support-agents', 'crm', 'voice-agents', 'team-chat'])
    print('adjacent-arenas.json: added ai-support-agents cluster')
dump('data/adjacent-arenas.json', adj)

# --- arena-icons.json ---
icons = load('data/arena-icons.json')
if 'durable-workflows' not in icons:
    icons['durable-workflows'] = '🔁'
    print('arena-icons.json: durable-workflows')
if 'ai-support-agents' not in icons:
    icons['ai-support-agents'] = '🎧'
    print('arena-icons.json: ai-support-agents')
dump('data/arena-icons.json', icons)

# --- arena-roadmap.json: flip both to live ---
rm = load('data/arena-roadmap.json')
for e in rm:
    if e['id'] == 'durable-workflows' and e.get('status') != 'live':
        e['status'] = 'live'
        e['candidateProducts'] = ['Temporal', 'Inngest', 'Trigger.dev', 'Restate', 'Hatchet', 'DBOS']
        e['rationale'] = 'Live arena: durable execution is the backbone under serious agent systems — multi-day agent runs need checkpointed retries, human-in-the-loop waits, and replay debugging.'
        print('arena-roadmap.json: durable-workflows -> live')
    if e['id'] == 'ai-support-agents' and e.get('status') != 'live':
        e['status'] = 'live'
        e['rationale'] = 'Live arena: the first agent category with real enterprise revenue and resolution-rate claims to audit against evidence.'
        print('arena-roadmap.json: ai-support-agents -> live (candidateProducts confirmed post-crawl)')
dump('data/arena-roadmap.json', rm)
