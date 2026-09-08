import json
p='pipeline/seeds/community.json'
d=json.load(open(p))
assert 'customer-data-platforms' not in d
d['customer-data-platforms']={
  'segment': [
    'https://hn.algolia.com/api/v1/items/46257714'
  ],
  'rudderstack': [
    'https://hn.algolia.com/api/v1/items/22637302'
  ],
  'mparticle': [
    'https://hn.algolia.com/api/v1/items/10894521'
  ],
  'jitsu': [
    'https://hn.algolia.com/api/v1/items/29106082'
  ],
  'hightouch': [
    'https://hn.algolia.com/api/v1/items/29188544',
    'https://hn.algolia.com/api/v1/items/46695855',
    'https://hn.algolia.com/api/v1/items/37863276'
  ]
}
with open(p,'w') as f:
    f.write(json.dumps(d, indent=2)+'\n')
print('seeds added:', list(d['customer-data-platforms']))
