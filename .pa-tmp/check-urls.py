#!/usr/bin/env python3
# Batch URL liveness check for a products.json: prints "<code> <url>" per URL (follows
# redirects, browser-ish UA), flagging anything that isn't 200.
import json
import subprocess
import sys

path = sys.argv[1]
products = json.load(open(path))
urls = []
for p in products:
    u = p['urls']
    for k in ('site', 'docs', 'changelog', 'github'):
        if u.get(k):
            urls.append((p['id'], k, u[k]))
    for i, x in enumerate(u.get('extra') or []):
        urls.append((p['id'], f'extra-{i}', x))
    for k, v in (p.get('links') or {}).items():
        urls.append((p['id'], f'links.{k}', v))
    bm = p.get('businessModel')
    if bm:
        urls.append((p['id'], 'pricing', bm['url']))

bad = 0
for pid, key, url in urls:
    try:
        code = subprocess.run(
            ['curl', '-sL', '-o', '/dev/null', '-w', '%{http_code}', '--max-time', '25',
             '-A', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', url],
            capture_output=True, text=True, timeout=40,
        ).stdout.strip()
    except Exception as e:  # noqa: BLE001
        code = f'ERR {e}'
    flag = '' if code == '200' else '   <-- CHECK'
    if code != '200':
        bad += 1
    print(f'{code} {pid} {key} {url}{flag}')
print(f'\n{bad} non-200 of {len(urls)}')
