import json
p='pipeline/popularity-packages.json'
d=json.load(open(p))
add={
  'shopify': {'npm': '@shopify/cli'},
  'medusa': {'npm': '@medusajs/medusa'},
  'swell': {'npm': 'swell-js'},
  'bigcommerce': {'npm': '@bigcommerce/checkout-sdk'},
}
for k,v in add.items():
    if k in d:
        print('exists, skipping:', k, d[k])
    else:
        d[k]=v
        print('added', k, v)
with open(p,'w') as f:
    f.write(json.dumps(d, indent=2)+'\n')
