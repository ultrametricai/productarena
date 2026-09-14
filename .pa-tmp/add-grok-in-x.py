import json
PATH = 'data/product-families.json'
fams = json.load(open(PATH))
for f in fams:
    if f['id'] != 'xai':
        continue
    ids = [s['id'] for s in f['subProducts']]
    assert 'grok-in-x' not in ids
    line = {
        "id": "grok-in-x",
        "name": "Grok in X",
        "blurb": "Ask Grok from the X timeline: summarize threads and replies, explain posts with real-time X context, and generate images without leaving the feed — included with X Premium.",
        "docsUrl": "https://docs.x.ai/grok/faq.md",
        "arenaRef": None,
        "note": "A distribution surface of the same Grok assistant inside X (bundled with X Premium, operated with X Corp) — judged inside the grok entry; its real-time-answers capability scores there where the arena's research stories apply.",
    }
    assert len(line['blurb']) <= 300 and len(line['note']) <= 300
    f['subProducts'].insert(ids.index('grok') + 1, line)
    print('xai lines:', [s['id'] for s in f['subProducts']])
json.dump(fams, open(PATH, 'w'), indent=2)
