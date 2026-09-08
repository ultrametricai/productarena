import json, collections
for cat in ['docs-platforms', 'data-pipelines']:
    v = json.load(open(f'data/{cat}/verdicts.json'))
    c = collections.Counter(x['verdict'] for x in v)
    ev = {}
    for pid in {x['productId'] for x in v}:
        for e in json.load(open(f'data/{cat}/evidence/{pid}.json')):
            ev[e['id']] = e['tier']
    tested = sum(1 for x in v if any(ev.get(i) == 'probe' for i in x['evidenceIds']))
    print(cat, dict(c), 'cells citing probe evidence:', tested)
