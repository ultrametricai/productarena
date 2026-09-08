import json, sys
cat = sys.argv[1]
want = sys.argv[2:] or None
v = json.load(open(f'data/{cat}/verdicts.json'))
for x in v:
    if want and x['storyId'] not in want:
        continue
    print(f"{x['productId']:12} {x['storyId']:28} {x['verdict']:8} q{x['quality']} {x['confidence']:6} cites={len(x['evidenceIds'])}")
