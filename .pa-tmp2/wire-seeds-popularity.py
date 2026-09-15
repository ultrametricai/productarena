import json

# 1. community seeds
p = 'pipeline/seeds/community.json'
d = json.load(open(p))
dt = d.setdefault('design-tools', {})
for pid in ('spline', 'rive'):
    dt.setdefault(pid, [])
nk = d.setdefault('notes-knowledge', {})
# Curated seed: Launch HN: Poly (YC S22) – Cursor for Files. The bare name "Poly" collides
# with Google Poly, Plantronics/Poly headsets, and Polymarket on HN — the curated seed
# guarantees the right product's thread leads the corpus (collector prompt still filters).
nk.setdefault('poly', ['https://news.ycombinator.com/item?id=45995394'])
with open(p, 'w') as f:
    f.write(json.dumps(d, indent=2) + '\n')
print('seeds:', dt.keys(), nk.keys())

# 2. popularity packages
p = 'pipeline/popularity-packages.json'
d = json.load(open(p))
assert 'spline' not in d and 'rive' not in d
d['spline'] = {'npm': '@splinetool/runtime'}
d['rive'] = {'npm': '@rive-app/canvas'}
with open(p, 'w') as f:
    f.write(json.dumps(d, indent=2) + '\n')
print('popularity packages added')
