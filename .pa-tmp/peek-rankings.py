import json, sys
r = json.load(open(sys.argv[1]))
for e in r['leaderboard']:
    print({k: e.get(k) for k in ('productId', 'aiEra', 'agentReady', 'openness', 'automation', 'privacy', 'apiQuality', 'agenticApp')})
print(sorted(r['leaderboard'][0].keys()))
