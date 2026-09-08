import json
p='data/categories.json'
cats=json.load(open(p))
assert not any(c['id']=='ecommerce-platforms' for c in cats)
cats.append({
  "id": "ecommerce-platforms",
  "name": "E-commerce Platforms",
  "description": "E-commerce platforms for building and running online stores — judged on storefront and theme customization, checkout and conversion, integrated payments, catalog and inventory operations, taxes and shipping, multi-channel selling (POS, marketplaces, international), headless storefront APIs, the app/extension ecosystem, B2B and wholesale, self-hostability, and how completely an AI shopping agent can discover products, build carts, and process orders through documented APIs and MCP/UCP endpoints. Shopify's Universal Commerce Protocol surface (Global Catalog MCP at catalog.shopify.com/api/ucp/mcp and per-storefront /api/ucp/mcp endpoints) was verified with live keyless initialize handshakes. Payments infrastructure (Stripe, Adyen) is a separate arena, as are website builders; Swell is judged here as the API-first, agent-oriented challenger anchor. Adobe Commerce (Magento) and Wix/Squarespace commerce were left out of this five-product cut rather than excluded on the merits.",
  "personas": ["merchant","developer","operations-lead","ai-native"],
  "themes": ["storefront-experience","checkout-conversion","payments","catalog-inventory","taxes-shipping","multi-channel","headless-apis","extensibility-apps","b2b-wholesale","ai-commerce"]
})
with open(p,'w') as f:
    f.write(json.dumps(cats, indent=2)+'\n')
print('added ecommerce-platforms; total', len(cats))
