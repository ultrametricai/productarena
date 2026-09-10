#!/usr/bin/env python3
# Registers the ai-code-review arena: categories.json entry, roadmap live-flip, community
# seeds, popularity packages. Idempotent (skips when already present). Market reality was
# re-verified by live crawl on 2026-09-10 before writing any of this (see products.json).
import json

def load(p):
    with open(p) as f:
        return json.load(f)

def dump(p, d):
    with open(p, 'w') as f:
        json.dump(d, f, indent=2, ensure_ascii=True)
        f.write('\n')

# --- categories.json ---
cats = load('data/categories.json')
if not any(c['id'] == 'ai-code-review' for c in cats):
    cats.append({
        'id': 'ai-code-review',
        'name': 'AI Code Review',
        'description': (
            'AI code review agents — the bots that review every pull request: summarizing changes, catching real bugs with '
            'full-codebase context, enforcing team standards, and increasingly holding the line on the flood of agent-authored '
            'code no human team could review alone — judged on review accuracy and noise discipline, codebase understanding and '
            'team memory, native GitHub/GitLab integration, in-repo configuration and custom rules, PR chat, agentic autofixes '
            'and pre-merge checks, merge gating and analytics, and IDE/CLI review surfaces. The 2026 market moved fast and the '
            'arena models it honestly: CodeRabbit raised a $143M Series C at a $1.5B valuation and rebranded around agentic '
            'change management; Graphite retired its Diamond branding into Graphite AI reviews; Qodo handed the open-source '
            'PR-Agent to a community org (The-PR-Agent/pr-agent now states it is "not the Qodo free tier") and sells credit-'
            'metered Qodo Review; Cursor’s Bugbot switched to usage-based billing (~$1.00–$1.50 per review run); cubic '
            '(formerly the mrge stacking tool, YC X25) ships custom review agents and Ultrareview. Ellipsis (pivoted to a managed '
            'cloud for coding agents) and Bito (pivoted to the Governor model router) were excluded as pivots, not omissions.'
        ),
        'personas': ['developer', 'engineering-lead', 'security-engineer', 'ai-native'],
        'themes': [
            'review-accuracy',
            'codebase-understanding',
            'pr-integration',
            'workflow-config',
            'interaction',
            'autofix-agents',
            'quality-gates',
            'surfaces',
        ],
    })
    dump('data/categories.json', cats)
    print('categories.json: added ai-code-review')

# --- arena-roadmap.json: flip to live ---
rm = load('data/arena-roadmap.json')
for e in rm:
    if e['id'] == 'ai-code-review':
        e['status'] = 'live'
        e['candidateProducts'] = ['CodeRabbit', 'Greptile', 'Graphite', 'Qodo', 'Cursor Bugbot', 'cubic']
        e['rationale'] = 'Live arena: with agents writing most new code, the AI reviewer became the load-bearing quality gate — and its own product war.'
        print('arena-roadmap.json: ai-code-review -> live')
dump('data/arena-roadmap.json', rm)

# --- community seeds (HN items verified live 2026-09-10) ---
seeds = load('pipeline/seeds/community.json')
if 'ai-code-review' not in seeds:
    seeds['ai-code-review'] = {
        'coderabbit': [
            'https://hn.algolia.com/api/v1/items/44953032',
            'https://hn.algolia.com/api/v1/items/49274706',
            'https://hn.algolia.com/api/v1/items/49450921',
        ],
        'greptile': [
            'https://hn.algolia.com/api/v1/items/39604961',
            'https://hn.algolia.com/api/v1/items/44786514',
            'https://hn.algolia.com/api/v1/items/47966075',
        ],
        'graphite': [
            'https://hn.algolia.com/api/v1/items/37570929',
            'https://hn.algolia.com/api/v1/items/43400283',
            'https://hn.algolia.com/api/v1/items/28543289',
        ],
        'qodo': [
            'https://hn.algolia.com/api/v1/items/44874736',
            'https://hn.algolia.com/api/v1/items/44376353',
            'https://hn.algolia.com/api/v1/items/42265051',
        ],
        'cursor-bugbot': [
            'https://hn.algolia.com/api/v1/items/46643737',
            'https://hn.algolia.com/api/v1/items/48098731',
            'https://hn.algolia.com/api/v1/items/48574270',
        ],
        'cubic': [
            'https://hn.algolia.com/api/v1/items/46605224',
            'https://hn.algolia.com/api/v1/items/45901525',
            'https://hn.algolia.com/api/v1/items/44115578',
        ],
    }
    dump('pipeline/seeds/community.json', seeds)
    print('community.json: added ai-code-review seeds')

# --- popularity packages (registry-verified 2026-09-10) ---
pkgs = load('pipeline/popularity-packages.json')
added = []
for pid, entry in {
    'greptile': {'npm': 'greptile'},               # 3.5.2, ~10k weekly
    'graphite': {'npm': '@withgraphite/graphite-cli'},  # 1.8.6, ~50k weekly
    'cubic': {'npm': '@cubic-dev-ai/cli'},         # 1.10.8, ~1.4k weekly
}.items():
    if pid not in pkgs:
        pkgs[pid] = entry
        added.append(pid)
if added:
    dump('pipeline/popularity-packages.json', pkgs)
    print(f'popularity-packages.json: added {added}')
