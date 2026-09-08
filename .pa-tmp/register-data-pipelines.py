#!/usr/bin/env python3
# Registers the data-pipelines arena: categories.json entry, adjacent-arenas cluster,
# roadmap conversion (etl-elt -> data-pipelines live; dagster removed from the still-planned
# data-orchestration entry to avoid double-listing), community seeds. Idempotent.
import json

def load(p):
    with open(p) as f:
        return json.load(f)

def dump(p, d, ind=2):
    with open(p, 'w') as f:
        json.dump(d, f, indent=ind)
        f.write('\n')

# --- categories.json ---
cats = load('data/categories.json')
if not any(c['id'] == 'data-pipelines' for c in cats):
    cats.append({
        'id': 'data-pipelines',
        'name': 'Data Pipelines & ELT',
        'description': (
            'Data pipeline and ELT platforms — the connectors, sync engines, and orchestration that move data from '
            'SaaS APIs, databases, and files into warehouses and lakes — judged on connector catalog breadth, custom-connector '
            'building, incremental sync and log-based CDC, backfills, schema-evolution handling, orchestration and scheduling, '
            'pipeline observability and alerting, dbt integration, code-first portability, reverse ETL, pricing-model clarity, and '
            'the AI-era axes: AI connector builders, MCP servers over pipelines, and whether an agent can build and operate a '
            'pipeline end to end through APIs and CLIs. Boundary note: this arena is DATA pipelines — moving and transforming '
            'datasets between systems; business-workflow automation (Zapier, Make, n8n) lives in the workflow-automation arena, and '
            'Dagster is judged here as the data-asset orchestrator anchor while a broader data-orchestration arena (Airflow, '
            'Prefect) remains on the roadmap. Meltano was verified actively maintained (repository pushed the same day as '
            'bring-up) despite its hosted Meltano Cloud being discontinued, and anchors the Singer open-standard corner.'
        ),
        'personas': ['data-engineer', 'analytics-engineer', 'data-platform-lead', 'ai-native'],
        'themes': [
            'connectors-catalog',
            'sync-replication',
            'schema-evolution',
            'orchestration-scheduling',
            'observability-reliability',
            'transformations-dbt',
            'code-first-portability',
            'reverse-etl-activation',
            'pricing-cost',
            'ai-pipelines',
        ],
    })
    dump('data/categories.json', cats)
    print('categories.json: added data-pipelines')

# --- adjacent-arenas.json ---
adj = load('data/adjacent-arenas.json')
if not any('data-pipelines' in c for c in adj):
    adj.append(['data-pipelines', 'data-warehouses', 'workflow-automation', 'serverless-databases'])
    dump('data/adjacent-arenas.json', adj, ind=1)
    print('adjacent-arenas.json: added data-pipelines cluster')

# --- arena-roadmap.json ---
rm = load('data/arena-roadmap.json')
for e in rm:
    if e['id'] == 'etl-elt':
        e['id'] = 'data-pipelines'
        e['name'] = 'Data Pipelines & ELT'
        e['status'] = 'live'
        e['candidateProducts'] = ['Airbyte', 'Fivetran', 'Dagster', 'dlt', 'Meltano']
        e['rationale'] = 'Live arena: connector economics (MAR pricing) vs open source is a live fight; absorbs the orchestration boundary via Dagster as the data-asset anchor.'
        e['aiEraAngle'] = 'AI connector builders, MCP servers over pipelines, and agents that scaffold and run a pipeline end to end via CLI/API.'
        print('arena-roadmap.json: etl-elt -> data-pipelines live')
    if e['id'] == 'data-orchestration' and 'Dagster' in (e.get('candidateProducts') or []):
        e['candidateProducts'] = [p for p in e['candidateProducts'] if p != 'Dagster']
        e['rationale'] = "Airflow's successor fight; strongly opinionated communities. (Dagster is already live in the data-pipelines arena.)"
        print('arena-roadmap.json: data-orchestration candidates updated')
dump('data/arena-roadmap.json', rm)

# --- community seeds ---
seeds = load('pipeline/seeds/community.json')
if 'data-pipelines' not in seeds:
    seeds['data-pipelines'] = {
        'airbyte': [
            'https://hn.algolia.com/api/v1/items/25917403',
            'https://hn.algolia.com/api/v1/items/48023496',
            'https://hn.algolia.com/api/v1/items/41638562',
        ],
        'fivetran': [
            'https://hn.algolia.com/api/v1/items/32395076',
            'https://hn.algolia.com/api/v1/items/45568842',
            'https://hn.algolia.com/api/v1/items/43860108',
        ],
        'dagster': [
            'https://hn.algolia.com/api/v1/items/32839147',
            'https://hn.algolia.com/api/v1/items/38610892',
            'https://hn.algolia.com/api/v1/items/24123289',
        ],
        'dlt': [
            'https://hn.algolia.com/api/v1/items/37999527',
            'https://hn.algolia.com/api/v1/items/40512113',
            'https://hn.algolia.com/api/v1/items/45712393',
        ],
        'meltano': [
            'https://hn.algolia.com/api/v1/items/26284253',
            'https://hn.algolia.com/api/v1/items/27690763',
            'https://hn.algolia.com/api/v1/items/36151234',
        ],
    }
    dump('pipeline/seeds/community.json', seeds)
    print('community.json: added data-pipelines seeds')
