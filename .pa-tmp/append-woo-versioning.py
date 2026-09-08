import json, datetime
NOW = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.000Z')
path='data/ecommerce-platforms/evidence/woocommerce.json'
ev=json.load(open(path))
item={
  'id': 'woocommerce-docs-x2',
  'tier': 'claimed-docs',
  'url': 'https://woocommerce.github.io/woocommerce-rest-api-docs/',
  'excerpt': "WooCommerce REST API Documentation - WP REST API v3 — all endpoints are versioned under the /wp-json/wc/v3/ prefix (e.g. GET /wp-json/wc/v3/products), with prior versions (v1/v2, legacy) retained as separate documented namespaces; no deprecation-timeline policy is published.",
  'fetchedAt': NOW,
}
if not any(e['id']==item['id'] for e in ev):
    ev.append(item)
    print('appended', item['id'])
with open(path,'w') as f:
    f.write(json.dumps(ev, indent=2)+'\n')
