import json
p='pipeline/popularity-packages.json'
d=json.load(open(p))
add={
  'segment': {'npm': '@segment/analytics-next'},
  'rudderstack': {'npm': '@rudderstack/analytics-js'},
  'mparticle': {'npm': '@mparticle/web-sdk'},
  'jitsu': {'npm': '@jitsu/js'},
}
for k,v in add.items():
    if k in d:
        print('exists, skipping:', k, d[k])
    else:
        d[k]=v
        print('added', k, v)
with open(p,'w') as f:
    f.write(json.dumps(d, indent=2)+'\n')
