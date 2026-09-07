import json
import sys
import urllib.request

ids = sys.argv[1:]
for i in ids:
    url = f'https://hn.algolia.com/api/v1/items/{i}'
    try:
        with urllib.request.urlopen(url, timeout=25) as r:
            d = json.load(r)
        kids = len(d.get('children') or [])
        print(i, '|', d.get('title'), '| comments:', kids)
    except Exception as e:
        print(i, 'ERROR', e)
