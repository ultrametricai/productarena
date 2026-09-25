#!/usr/bin/env python3
"""Honest lastRun records for the two processors whose engine passes errored but whose
work was completed manually (9950X3D: bot-walled crawl surface -> browser-UA prefetch +
manual stages; m4-max: judge killed by the transient DNS outage -> judge re-run + manual
churn settle)."""
import json, datetime

q = json.load(open('data/spike-queue.json'))
now = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.000Z')
runs = {
    'amd-ryzen-9-9950x3d': {
        'urlsAdded': [
            'https://www.amd.com/en/products/software/ryzen-master.html',
            'https://www.amd.com/en/products/processors/chipsets/am5.html',
            'https://www.amd.com/en/products/processors/desktops/ryzen/9000-series.html',
        ],
        'evidenceAdded': 7,
        'cellsRejudged': 5,
        'flipsKept': 2,
        'flipsReverted': 3,
        'note': 'www.amd.com bot-walls the pipeline UA (crawl stage cannot run) — pages fetched via the prefetch-amd-crawl.ts browser-UA path (3 platform pages appended: Ryzen Master, AM5 chipset, 9000-series; nothing Ryzen-AI/GAIA per the 2026-09-23 bias correction), then extract/probe/judge run manually and churn settled vs pre-wave HEAD. aiEra stays null (na); naDimensions score unchanged.',
    },
    'apple-m4-max': {
        'urlsAdded': [
            'https://support.apple.com/en-us/121554',
            'https://www.apple.com/newsroom/2025/03/apple-unveils-new-mac-studio-the-most-powerful-mac-ever/',
        ],
        'evidenceAdded': 9,
        'cellsRejudged': 12,
        'flipsKept': 4,
        'flipsReverted': 8,
        'note': 'second pass over 2 appended live-verified Apple pages (MBP16-2024 tech specs, Mac Studio 2025 announcement); judge interrupted by transient local DNS outage, completed manually and churn settled vs pre-wave HEAD',
    },
}
for e in q['queue']:
    if e['arena'] == 'processors' and e['productId'] in runs:
        e['lastSpiked'] = now
        e['status'] = 'spiked'
        e['lastRun'] = {'at': now, **runs[e['productId']]}
json.dump(q, open('data/spike-queue.json', 'w'), indent=2, ensure_ascii=False)
open('data/spike-queue.json', 'a').write('\n')
print('queue updated')
