import json
p='pipeline/seeds/community.json'
d=json.load(open(p))
assert 'ecommerce-platforms' not in d
d['ecommerce-platforms']={
  'shopify': [],
  'medusa': [
    'https://hn.algolia.com/api/v1/items/29392312',
    'https://hn.algolia.com/api/v1/items/41979332'
  ],
  'woocommerce': [],
  'bigcommerce': [],
  'swell': [
    'https://hn.algolia.com/api/v1/items/36120663'
  ]
}
with open(p,'w') as f:
    f.write(json.dumps(d, indent=2)+'\n')
print('seeds added:', list(d['ecommerce-platforms']))
