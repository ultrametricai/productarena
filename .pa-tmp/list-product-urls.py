import json, sys
prods = json.load(open(sys.argv[1]))
seen = set()
for p in prods:
    for k, v in p['urls'].items():
        if k == 'extra':
            seen.update(v)
        else:
            seen.add(v)
    for v in (p.get('links') or {}).values():
        seen.add(v)
    if p.get('businessModel'):
        seen.add(p['businessModel']['url'])
    for i in (p.get('install') or []):
        if i.get('url'):
            seen.add(i['url'])
for u in sorted(seen):
    print(u)
