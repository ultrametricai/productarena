import json
from collections import Counter

r = json.load(open('data/design-tools/rankings.json'))
lb = [(e['productId'], e.get('aiEra'), e.get('agentReady'), e.get('apiQuality'), e.get('openness'), e.get('agenticApp'), e.get('automation')) for e in r['leaderboard']]
json.dump(lb, open('.pa-tmp2/before-design-leaderboard.json', 'w'), indent=1)
print(lb)

v = json.load(open('data/design-tools/verdicts.json'))
fig = {x['storyId']: x['verdict'] for x in v if x['productId'] == 'figma'}
json.dump(fig, open('.pa-tmp2/before-figma-verdicts.json', 'w'), indent=1, sort_keys=True)
print('figma cells:', len(fig))
print(Counter(fig.values()))

ev = json.load(open('data/design-tools/evidence/figma.json'))
print('figma evidence items:', len(ev), Counter(e['tier'] for e in ev))

nk = json.load(open('data/notes-knowledge/rankings.json'))
print('nk leaderboard:', [(e['productId'], e.get('aiEra')) for e in nk['leaderboard']])
