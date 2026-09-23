#!/usr/bin/env python3
# Registers the launch-day scoped sub-products on the google/microsoft families:
# Google Drive + Google Cloud, Microsoft OneDrive + Microsoft Azure. Idempotent.
import json

P = 'data/product-families.json'
fam = json.load(open(P))
by_id = {e['id']: e for e in fam}

NEW = {
    'google': [
        {
            'id': 'google-drive',
            'name': 'Google Drive',
            'blurb': 'Cloud file storage and sync — Drive API v3 (files, changes, permissions, revisions), shared drives, and the Workspace editors on top.',
            'docsUrl': 'https://developers.google.com/workspace/drive',
            'arenaRef': {'arenaId': 'cloud-storage', 'productId': 'google-drive'},
        },
        {
            'id': 'google-cloud',
            'name': 'Google Cloud',
            'blurb': 'The hyperscaler platform — gcloud CLI, Terraform provider, IAM with workload identity federation, and Vertex AI.',
            'docsUrl': 'https://cloud.google.com/docs',
            'arenaRef': {'arenaId': 'cloud-platforms', 'productId': 'google-cloud'},
        },
    ],
    'microsoft': [
        {
            'id': 'onedrive',
            'name': 'Microsoft OneDrive',
            'blurb': 'Cloud file storage on Microsoft Graph — driveItem APIs, upload sessions, delta sync, sharing, and Microsoft 365 co-editing.',
            'docsUrl': 'https://learn.microsoft.com/en-us/onedrive/developer/',
            'arenaRef': {'arenaId': 'cloud-storage', 'productId': 'onedrive'},
        },
        {
            'id': 'azure',
            'name': 'Microsoft Azure',
            'blurb': 'The hyperscaler platform — az CLI, Bicep/ARM, RBAC and managed identities, Cost Management, and AI Foundry.',
            'docsUrl': 'https://learn.microsoft.com/en-us/azure/',
            'arenaRef': {'arenaId': 'cloud-platforms', 'productId': 'azure'},
        },
    ],
}

for fam_id, subs in NEW.items():
    entry = by_id[fam_id]
    have = {s['id'] for s in entry['subProducts']}
    for s in subs:
        if s['id'] not in have:
            entry['subProducts'].append(s)
            print(f"{fam_id}: added sub-product {s['id']}")

with open(P, 'w') as f:
    json.dump(fam, f, indent=2, ensure_ascii=False)
    f.write('\n')
print('done')
