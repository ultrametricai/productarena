#!/usr/bin/env python3
# Registers the self-hosted-assistants arena (founder ask 2026-09-21: "add in openclaw type
# arena and what it can do"): categories.json entry, arena-sections placement (ai-agents),
# arena-icons, adjacent-arenas, roadmap (live), search-aliases. Idempotent — skips anything
# already present. Same shape as .pa-tmp/register-three-arenas.py (the 2026-09-15 precedent).
import json

def load(p):
    with open(p) as f:
        return json.load(f)

def dump(p, d):
    with open(p, 'w') as f:
        json.dump(d, f, indent=2, ensure_ascii=False)
        f.write('\n')

CAT = {
    'id': 'self-hosted-assistants',
    'name': 'Self-Hosted AI Assistants',
    'description': (
        'Open-source personal AI assistant runtimes you run on your own machine and keys — the OpenClaw wave: '
        'a gateway process that meets you in the messengers you already use (WhatsApp, Telegram, Discord, Slack, '
        'iMessage), plugs into any model backend from Anthropic and OpenAI to a local Ollama, and actually does '
        'things — shell and browser control, skills from registries thousands deep, cron jobs and webhooks, '
        'persistent memory it writes to disk you own. Distinct from hosted consumer assistants (ai-assistants: '
        'ChatGPT, Claude, Muse) and from developer agent libraries (agent-frameworks): these are shipped, '
        'installable products where self-hosting is the point. Judged on install and deployment reality, '
        'messaging-surface breadth, model-backend freedom, skills/plugin ecosystems, memory, computer and browser '
        'control, credential security and sandboxing, multi-agent orchestration — and the agent angle cuts both '
        'ways: each of these IS an agent runtime, so their own CLIs, APIs, and MCP surfaces are measured too.'
    ),
    'personas': ['self-hoster', 'everyday-user', 'power-user', 'developer', 'security-engineer', 'privacy-first-user', 'ai-native'],
    'themes': [
        'self-host-install',
        'messaging-surfaces',
        'model-backends',
        'skills-plugins',
        'memory-context',
        'computer-control',
        'credential-security',
        'orchestration-multi-agent',
    ],
}

cats = load('data/categories.json')
if CAT['id'] not in {c['id'] for c in cats}:
    cats.append(CAT)
    print('categories.json: added self-hosted-assistants')
dump('data/categories.json', cats)

sections = load('data/arena-sections.json')
for s in sections['sections']:
    if s['id'] == 'ai-agents' and 'self-hosted-assistants' not in s['arenaIds']:
        # after ai-assistants — the hosted/self-hosted pair reads side by side
        i = s['arenaIds'].index('ai-assistants') + 1
        s['arenaIds'].insert(i, 'self-hosted-assistants')
        print('arena-sections.json: self-hosted-assistants -> ai-agents (after ai-assistants)')
dump('data/arena-sections.json', sections)

icons = load('data/arena-icons.json')
if 'self-hosted-assistants' not in icons:
    icons['self-hosted-assistants'] = '🦞'
    print('arena-icons.json: self-hosted-assistants 🦞')
dump('data/arena-icons.json', icons)

adj = load('data/adjacent-arenas.json')
group = ['self-hosted-assistants', 'ai-assistants', 'local-llm-runtimes', 'agent-frameworks']
if tuple(group) not in {tuple(g) for g in adj}:
    adj.append(group)
    print(f'adjacent-arenas.json: added {group}')
dump('data/adjacent-arenas.json', adj)

rm = load('data/arena-roadmap.json')
if 'self-hosted-assistants' not in {e['id'] for e in rm}:
    rm.append({
        'id': 'self-hosted-assistants',
        'name': 'Self-Hosted AI Assistants',
        'tier': 1,
        'status': 'live',
        'g2Equivalent': 'AI Chatbots Software (self-hosted/open-source segment)',
        'candidateProducts': ['OpenClaw', 'Open WebUI', 'LibreChat', 'AnythingLLM', 'Khoj', 'LobeChat'],
        'rationale': 'Live arena (founder ask 2026-09-21): OpenClaw made the self-hosted personal agent a category — 390k stars, a skills registry 5,400+ deep, and a WhatsApp surface no hosted assistant matches.',
        'aiEraAngle': 'These products ARE agent runtimes — the question is whether an agent can also drive THEM: gateway HTTP APIs, CLIs, MCP servers, and machine-readable docs are all live axes.',
    })
    print('arena-roadmap.json: added self-hosted-assistants (live)')
dump('data/arena-roadmap.json', rm)

sa = load('data/search-aliases.json')
if 'self-hosted-assistants' not in sa['arenas']:
    sa['arenas']['self-hosted-assistants'] = [
        'self-hosted ai', 'openclaw vs', 'personal ai agent', 'self-hosted chatgpt',
        'open source assistant', 'whatsapp ai assistant', 'open webui vs', 'librechat vs',
    ]
    print('search-aliases.json: added self-hosted-assistants')
dump('data/search-aliases.json', sa)

print('done')
