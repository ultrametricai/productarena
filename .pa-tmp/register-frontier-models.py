#!/usr/bin/env python3
# Registers the frontier-models arena (founder ask 2026-09-22: index Jev — TypeSafe AI's
# "System One" frontier model — in a new arena for the model/API layer): categories.json entry,
# arena-sections placement (models-inference, first — the intelligence the rest of the section
# hosts), arena-icons, adjacent-arenas, roadmap (live), search-aliases. Idempotent — skips
# anything already present. Same shape as .pa-tmp/register-self-hosted-assistants.py.
import json

def load(p):
    with open(p) as f:
        return json.load(f)

def dump(p, d):
    with open(p, 'w') as f:
        json.dump(d, f, indent=2, ensure_ascii=False)
        f.write('\n')

CAT = {
    'id': 'frontier-models',
    'name': 'Frontier Models',
    'description': (
        'The model/API layer itself — the intelligence you buy, judged on how agent-ready each vendor\'s '
        'PLATFORM is. Frontier and near-frontier model developers (Anthropic\'s Claude, OpenAI\'s GPT, '
        'Google\'s Gemini, Meta\'s Llama, DeepSeek, Mistral — and TypeSafe AI\'s Jev, the first "System One" '
        'model that returns typed decisions instead of prose) compared on the surfaces developers and agents '
        'actually touch: documented public APIs and SDKs, tool/function calling, structured outputs, streaming, '
        'prompt caching and batch pricing, precise context-window and rate-limit docs, model cards and honest '
        'limitation notes, versioned model IDs with real deprecation policies, open weights and licenses, '
        'fine-tuning access, safety policies, and llms.txt/agent-oriented docs. Distinct from '
        'inference-providers (hosting other people\'s open weights), model-gateways (routing layers), and '
        'ai-assistants (the consumer apps): this arena judges the developer-facing model platform, not the '
        'chat app above it or the serving cloud below it.'
    ),
    'personas': ['developer', 'ml-engineer', 'founder', 'ai-native'],
    'themes': [
        'capability-surface',
        'pricing-rate-limits',
        'model-transparency',
        'model-lifecycle',
        'weights-licensing',
        'developer-onboarding',
        'safety-usage-policy',
        'ecosystem-availability',
    ],
}

cats = load('data/categories.json')
if CAT['id'] not in {c['id'] for c in cats}:
    cats.append(CAT)
    print('categories.json: added frontier-models')
dump('data/categories.json', cats)

sections = load('data/arena-sections.json')
for s in sections['sections']:
    if s['id'] == 'models-inference' and 'frontier-models' not in s['arenaIds']:
        # first — the models themselves lead the section the hosting layers fill out
        s['arenaIds'].insert(0, 'frontier-models')
        print('arena-sections.json: frontier-models -> models-inference (first)')
dump('data/arena-sections.json', sections)

icons = load('data/arena-icons.json')
if 'frontier-models' not in icons:
    icons['frontier-models'] = '🧠'
    print('arena-icons.json: frontier-models 🧠')
dump('data/arena-icons.json', icons)

adj = load('data/adjacent-arenas.json')
group = ['frontier-models', 'inference-providers', 'model-gateways', 'local-llm-runtimes']
if tuple(group) not in {tuple(g) for g in adj}:
    adj.append(group)
    print(f'adjacent-arenas.json: added {group}')
dump('data/adjacent-arenas.json', adj)

rm = load('data/arena-roadmap.json')
if 'frontier-models' not in {e['id'] for e in rm}:
    rm.append({
        'id': 'frontier-models',
        'name': 'Frontier Models',
        'tier': 1,
        'status': 'live',
        'g2Equivalent': 'Large Language Model (LLM) Software',
        'candidateProducts': ['Jev (TypeSafe AI)', 'Claude', 'GPT', 'Gemini', 'Llama', 'DeepSeek', 'Mistral'],
        'rationale': 'Live arena (founder ask 2026-09-22): the model layer had no arena — inference-providers, model-gateways, and local-llm-runtimes all judge hosting, not the intelligence itself. TypeSafe AI\'s Jev (the first System One model, 1,959-point HN launch) made the gap obvious.',
        'aiEraAngle': 'Models are what agents run ON — the question is whether an agent can also buy and operate the PLATFORM: self-serve keys, models endpoints, machine-readable docs, typed outputs, and honest deprecation policies are all live axes.',
    })
    print('arena-roadmap.json: added frontier-models (live)')
dump('data/arena-roadmap.json', rm)

sa = load('data/search-aliases.json')
if 'frontier-models' not in sa['arenas']:
    sa['arenas']['frontier-models'] = [
        'llm', 'large language model', 'jev vs', 'typesafe ai', 'system one model',
        'claude vs gpt', 'gemini vs', 'best ai model', 'foundation models', 'model api',
    ]
    print('search-aliases.json: added frontier-models')
dump('data/search-aliases.json', sa)

print('done')
