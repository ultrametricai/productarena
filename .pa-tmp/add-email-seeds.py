import json

p = 'pipeline/seeds/community.json'
s = json.load(open(p))
assert 'email' not in s
s['email'] = {
    "superhuman": [
        "https://hn.algolia.com/api/v1/items/20336762",
        "https://hn.algolia.com/api/v1/items/15049855",
        "https://hn.algolia.com/api/v1/items/44433994",
        "https://hn.algolia.com/api/v1/items/23614167",
        "https://hn.algolia.com/api/v1/items/20349604",
    ],
    "shortwave": [
        "https://hn.algolia.com/api/v1/items/30349243",
        "https://hn.algolia.com/api/v1/items/30380760",
        "https://hn.algolia.com/api/v1/items/44492933",
        "https://hn.algolia.com/api/v1/items/34986632",
    ],
    "missive": [
        "https://hn.algolia.com/api/v1/items/10759307",
        "https://hn.algolia.com/api/v1/items/38945463",
        "https://hn.algolia.com/api/v1/items/33164922",
        "https://hn.algolia.com/api/v1/items/42119042",
    ],
    "zero": [
        "https://hn.algolia.com/api/v1/items/43862892",
        "https://hn.algolia.com/api/v1/items/44971039",
        "https://hn.algolia.com/api/v1/items/43324273",
    ],
    "fastmail": [
        "https://hn.algolia.com/api/v1/items/49334409",
        "https://hn.algolia.com/api/v1/items/33001391",
        "https://hn.algolia.com/api/v1/items/49223082",
        "https://hn.algolia.com/api/v1/items/12247401",
    ],
}
open(p, 'w').write(json.dumps(s, indent=2) + '\n')
print('seeds added for email:', sum(len(v) for v in s['email'].values()))
