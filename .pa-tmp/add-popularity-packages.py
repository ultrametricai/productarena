import json
p = 'pipeline/popularity-packages.json'
d = json.load(open(p))
adds = {
    'mintlify': {'npm': 'mint'},
    'readme': {'npm': 'rdme'},
    'docusaurus': {'npm': '@docusaurus/core'},
    'fern': {'npm': 'fern-api'},
    'airbyte': {'pypi': 'airbyte'},
    'dagster': {'pypi': 'dagster'},
    'dlt': {'pypi': 'dlt'},
    'meltano': {'pypi': 'meltano'},
    'fivetran': {'pypi': 'fivetran-connector-sdk'},
}
for k, v in adds.items():
    if k not in d:
        d[k] = v
with open(p, 'w') as f:
    json.dump(d, f, indent=2)
    f.write('\n')
print('ok', len(d))
