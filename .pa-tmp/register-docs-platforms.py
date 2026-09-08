#!/usr/bin/env python3
# Registers the docs-platforms arena: categories.json entry, adjacent-arenas cluster,
# roadmap live-flip, community seeds. Idempotent (skips when already present).
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
if not any(c['id'] == 'docs-platforms' for c in cats):
    cats.append({
        'id': 'docs-platforms',
        'name': 'Developer Docs Platforms',
        'description': (
            'Developer documentation platforms — the authoring, API-reference, and publishing layer for developer-facing docs — '
            'judged on MDX authoring and web editing, OpenAPI-driven API references, docs-as-code git workflows with preview '
            'deployments and review, versioning and localization, search quality, theming and custom domains, docs analytics, and '
            'the deliciously self-referential heart of the arena: the agent-docs layer these vendors now sell — llms.txt generation, '
            '.md mirror endpoints, hosted docs MCP servers, embedded AI assistants, and AI agents that maintain the docs. These are '
            'the vendors selling the very surfaces this site scores every arena on, so they are judged partly on whether they drink '
            'their own champagne (whether mintlify.com/docs itself serves llms.txt, whether GitBook’s own docs expose the MCP '
            'server it generates for customers). Docusaurus, Meta’s MIT-licensed static-site generator, anchors the open-source '
            'end; Astro Starlight was left for a future static-site-generator arena.'
        ),
        'personas': ['technical-writer', 'developer', 'devrel-lead', 'ai-native'],
        'themes': [
            'authoring-editing',
            'api-reference',
            'docs-as-code',
            'collaboration-review',
            'versioning-localization',
            'search-discovery',
            'customization',
            'publishing-hosting',
            'analytics-insights',
            'ai-docs',
        ],
    })
    dump('data/categories.json', cats)
    print('categories.json: added docs-platforms')

# --- adjacent-arenas.json ---
adj = load('data/adjacent-arenas.json')
cluster = ['docs-platforms', 'api-platforms', 'search-infra', 'mcp-infrastructure']
if not any('docs-platforms' in c for c in adj):
    adj.append(cluster)
    dump('data/adjacent-arenas.json', adj)
    print('adjacent-arenas.json: added docs-platforms cluster')

# --- arena-roadmap.json: flip docs-platforms to live with the final field ---
rm = load('data/arena-roadmap.json')
for e in rm:
    if e['id'] == 'docs-platforms':
        e['status'] = 'live'
        e['candidateProducts'] = ['Mintlify', 'GitBook', 'ReadMe', 'Docusaurus', 'Fern']
        e['rationale'] = 'Live arena: docs are now read by agents more than humans, and these vendors sell the agent-docs layer this site scores everyone on.'
        print('arena-roadmap.json: docs-platforms -> live')
dump('data/arena-roadmap.json', rm)

# --- community seeds ---
seeds = load('pipeline/seeds/community.json')
if 'docs-platforms' not in seeds:
    seeds['docs-platforms'] = {
        'mintlify': [
            'https://hn.algolia.com/api/v1/items/31740724',
            'https://hn.algolia.com/api/v1/items/39730255',
            'https://hn.algolia.com/api/v1/items/45274440',
        ],
        'gitbook': [
            'https://hn.algolia.com/api/v1/items/23417046',
            'https://hn.algolia.com/api/v1/items/9209041',
            'https://hn.algolia.com/api/v1/items/23659451',
        ],
        'readme': [
            'https://hn.algolia.com/api/v1/items/8422408',
            'https://hn.algolia.com/api/v1/items/32867516',
            'https://hn.algolia.com/api/v1/items/33324835',
        ],
        'docusaurus': [
            'https://hn.algolia.com/api/v1/items/32303052',
            'https://hn.algolia.com/api/v1/items/44074626',
            'https://hn.algolia.com/api/v1/items/41387922',
        ],
        'fern': [
            'https://hn.algolia.com/api/v1/items/34346428',
            'https://hn.algolia.com/api/v1/items/40146505',
            'https://hn.algolia.com/api/v1/items/48182281',
        ],
    }
    dump('pipeline/seeds/community.json', seeds)
    print('community.json: added docs-platforms seeds')
