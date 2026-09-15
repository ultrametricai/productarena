#!/usr/bin/env python3
import json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
p = os.path.join(ROOT, 'data', 'arena-roadmap.json')
r = json.load(open(p))
e = next(x for x in r if x['id'] == 'banking-data-apis')
e['aiEraAngle'] = "Bank data is the substrate agent finance workflows read: MX and Yapily run keyless docs MCPs, Plaid ships an OAuth Dashboard MCP plus an AI coding toolkit, and Teller serves llms.txt and .md twins but no MCP or OpenAPI — recorded, not assumed."
with open(p, 'w') as f:
    json.dump(r, f, indent=2, ensure_ascii=False)
    f.write('\n')
print('roadmap aiEraAngle fixed')
pp = os.path.join(ROOT, 'pipeline', 'popularity-packages.json')
d = json.load(open(pp))
if 'mastercard-open-finance' not in d:
    d['mastercard-open-finance'] = {'npm': 'connect-web-sdk'}
    with open(pp, 'w') as f:
        json.dump(d, f, indent=2, ensure_ascii=False)
        f.write('\n')
    print('popularity-packages + mastercard-open-finance')
