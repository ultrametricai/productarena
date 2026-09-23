#!/usr/bin/env python3
# Registers the launch-day FILES+CLOUD arenas (cloud-storage, cloud-platforms):
# categories.json entries, arena-sections placement, arena-icons, adjacent-arenas, roadmap
# (two new live entries), search-aliases. Idempotent — skips anything already present.
# Same shape as .pa-tmp/register-wave5-arenas.py.
import json

def load(p):
    with open(p) as f:
        return json.load(f)

def dump(p, d):
    with open(p, 'w') as f:
        json.dump(d, f, indent=2, ensure_ascii=False)
        f.write('\n')

CATS = [
    {
        'id': 'cloud-storage',
        'name': 'Cloud Storage',
        'description': (
            'Cloud file storage — where every company\'s documents, contracts, and data rooms actually live: Dropbox, '
            'Google Drive, Box, and OneDrive judged on the machine surface behind the folder icon. Files APIs with '
            'chunked/resumable uploads and revision history, delta/cursor listing and webhooks for real sync, '
            'programmable shared links and granular permissions, content search and custom metadata APIs, previews and '
            'e-signature workflows, team admin and audit-log APIs, and published storage pricing. Distinct from '
            'object-storage (S3-style buckets programs write to — a roadmap arena) and notes-knowledge (documents as a '
            'product): this arena is the file system of record for humans and their agents. The agent angle is measured '
            'hard — an agent that can file, fetch, share, and audit documents needs exactly these APIs, MCP surfaces, '
            'and scoped credentials.'
        ),
        'personas': ['developer', 'founder', 'it-admin', 'operations-lead', 'power-user', 'security-engineer', 'ai-native'],
        'themes': [
            'files-api',
            'sync-webhooks',
            'sharing-permissions',
            'search-metadata',
            'content-workflows',
            'admin-governance',
            'storage-pricing',
        ],
    },
    {
        'id': 'cloud-platforms',
        'name': 'Cloud Platforms',
        'description': (
            'The hyperscaler platforms — AWS, Google Cloud, Azure, and OCI judged on the platform developer surface, '
            'not a per-service catalog: CLI and SDK quality, first-party IaC plus the official Terraform provider, IAM '
            'that can express least privilege and issue short-lived workload credentials, budgets and cost APIs that '
            'stop bill shock, free tiers and account-isolation guardrails, reference docs and status transparency at '
            'thousand-service scale, and the managed inference/agent runtimes now bolted to each platform. Distinct '
            'from edge-platforms (Vercel/Cloudflare app platforms), gpu-clouds (GPU neoclouds), and '
            'backend-as-a-service (Supabase/Firebase): this arena is the general-purpose cloud itself. Agent-era '
            'stakes are explicit — MCP servers, llms.txt, machine-readable pricing, and credentials an agent can hold '
            'without holding the keys to prod.'
        ),
        'personas': ['developer', 'platform-engineer', 'security-engineer', 'founder', 'operations-lead', 'analyst', 'ai-native'],
        'themes': [
            'iac-surface',
            'identity-access',
            'cost-controls',
            'onboarding',
            'core-platform',
            'platform-docs',
            'ai-platform',
        ],
    },
]

SECTION_PLACEMENT = {
    'cloud-storage': ('comms-productivity', 'notes-knowledge'),
    'cloud-platforms': ('infra-ops', 'edge-platforms'),
}

ICONS = {
    'cloud-storage': '📁',
    'cloud-platforms': '☁️',
}

ADJACENT = [
    ['cloud-storage', 'notes-knowledge', 'docs-platforms', 'legal-ops'],
    ['cloud-platforms', 'edge-platforms', 'gpu-clouds', 'backend-as-a-service', 'infra-as-code'],
]

ALIASES = {
    'cloud-storage': [
        'cloud storage', 'file storage', 'dropbox vs', 'google drive vs', 'box vs onedrive',
        'file sync', 'file sharing api', 'data room storage', 'onedrive vs google drive',
    ],
    'cloud-platforms': [
        'aws vs', 'gcp vs azure', 'google cloud vs aws', 'azure vs aws', 'hyperscaler',
        'cloud provider', 'iaas', 'oci', 'cloud pricing calculator', 'which cloud',
    ],
}

ROADMAP_NEW = [
    {
        'id': 'cloud-storage',
        'name': 'Cloud Storage',
        'tier': 1,
        'status': 'live',
        'g2Equivalent': 'Cloud Content Collaboration',
        'candidateProducts': ['Dropbox', 'Google Drive', 'Box', 'Microsoft OneDrive'],
        'rationale': 'Live arena (launch day): the founder data-room and file steps (qs_015, fund_005, comp_011 and every "file the executed copy" step) pointed at untracked dropbox/google_drive chips.',
        'aiEraAngle': 'Files APIs, delta sync, webhooks, and scoped credentials are exactly what document agents drive; first-party AI surfaces (Dash, Box AI, Gemini in Drive, Copilot) now differentiate the field.',
    },
    {
        'id': 'cloud-platforms',
        'name': 'Cloud Platforms',
        'tier': 1,
        'status': 'live',
        'g2Equivalent': 'Infrastructure as a Service (IaaS) — hyperscalers',
        'candidateProducts': ['AWS', 'Google Cloud', 'Microsoft Azure', 'Oracle Cloud Infrastructure'],
        'rationale': 'Live arena (launch day): prod_001\'s nine AWS process steps ran through an untracked chip; the hyperscaler choice is the biggest infrastructure decision a startup makes.',
        'aiEraAngle': 'CLI/IaC/MCP surfaces agents already drive; IAM that can scope an agent, cost APIs that catch runaway spend, and managed inference/agent runtimes as platform services.',
    },
]

cats = load('data/categories.json')
have = {c['id'] for c in cats}
for cat in CATS:
    if cat['id'] not in have:
        cats.append(cat)
        print(f"categories.json: added {cat['id']}")
dump('data/categories.json', cats)

sections = load('data/arena-sections.json')
for arena, (sec_id, after) in SECTION_PLACEMENT.items():
    for s in sections['sections']:
        if s['id'] == sec_id and arena not in s['arenaIds']:
            i = s['arenaIds'].index(after) + 1
            s['arenaIds'].insert(i, arena)
            print(f'arena-sections.json: {arena} -> {sec_id} (after {after})')
dump('data/arena-sections.json', sections)

icons = load('data/arena-icons.json')
for arena, icon in ICONS.items():
    if arena not in icons:
        icons[arena] = icon
        print(f'arena-icons.json: {arena} {icon}')
dump('data/arena-icons.json', icons)

adj = load('data/adjacent-arenas.json')
existing = {tuple(g) for g in adj}
for group in ADJACENT:
    if tuple(group) not in existing:
        adj.append(group)
        print(f'adjacent-arenas.json: added {group}')
dump('data/adjacent-arenas.json', adj)

rm = load('data/arena-roadmap.json')
ids = {e['id'] for e in rm}
for entry in ROADMAP_NEW:
    if entry['id'] not in ids:
        rm.append(entry)
        print(f"arena-roadmap.json: added {entry['id']} (live)")
dump('data/arena-roadmap.json', rm)

sa = load('data/search-aliases.json')
for arena, aliases in ALIASES.items():
    if arena not in sa['arenas']:
        sa['arenas'][arena] = aliases
        print(f'search-aliases.json: added {arena}')
dump('data/search-aliases.json', sa)

print('done')
