#!/usr/bin/env python3
"""Append live-verified virtual-mailboxes depth URLs (anytime-mailbox help-center KB
articles + KB index; virtualpostmail features page). earth-class-mail deliberately gets
nothing: beyond the already-crawled LegalZoom absorption overview only checkout-funnel
pages exist — honest ceiling, documenting reality without inflating."""
import json

ADD = {
    'anytime-mailbox': [
        'https://help.anytimemailbox.com/support/solutions',
        'https://help.anytimemailbox.com/support/solutions/articles/36000499627-understanding-service-plans',
        'https://help.anytimemailbox.com/support/solutions/articles/36000499625-choosing-a-service-plan',
        'https://help.anytimemailbox.com/support/solutions/articles/36000499628-monthly-or-annual-plan',
        'https://help.anytimemailbox.com/support/solutions/articles/36000499745-usps-form-1583',
        'https://help.anytimemailbox.com/support/solutions/articles/36000499624-how-to-search-for-a-mailbox-location',
        'https://help.anytimemailbox.com/support/solutions/articles/36000112949-adding-an-additional-recipient-onto-your-mailbox',
    ],
    'virtualpostmail': [
        'https://www.virtualpostmail.com/features',
    ],
}
f = 'data/virtual-mailboxes/products.json'
prods = json.load(open(f))
for p in prods:
    if p['id'] in ADD:
        extra = p['urls'].setdefault('extra', [])
        added = [u for u in ADD[p['id']] if u not in extra]
        extra.extend(added)
        print(p['id'], 'appended', len(added))
json.dump(prods, open(f, 'w'), indent=2, ensure_ascii=False)
open(f, 'a').write('\n')
