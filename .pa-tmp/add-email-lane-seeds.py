#!/usr/bin/env python3
# popularity-packages entries (official registry packages only) + curated HN community seeds
# (every item id fetched live from the Algolia API on 2026-09-23 — see .pa-tmp/find-hn-seeds.sh).
import json

def load(p):
    with open(p) as f:
        return json.load(f)

def dump(p, d):
    with open(p, 'w') as f:
        json.dump(d, f, indent=2, ensure_ascii=False)
        f.write('\n')

pkgs = load('pipeline/popularity-packages.json')
# Officially published vendor SDKs only. amazon-ses: @aws-sdk/client-sesv2 is the official
# SES-specific client. Virtual-mailbox vendors and gmail publish no product-scoped package —
# honestly omitted (googleapis is Google-wide, not Gmail).
for pid, entry in (
    ('sendgrid', {'npm': '@sendgrid/mail', 'pypi': 'sendgrid'}),
    ('resend', {'npm': 'resend', 'pypi': 'resend'}),
    ('postmark', {'npm': 'postmark'}),
    ('mailgun', {'npm': 'mailgun.js'}),
    ('amazon-ses', {'npm': '@aws-sdk/client-sesv2'}),
):
    if pid not in pkgs:
        pkgs[pid] = entry
        print(f'popularity-packages: {pid} {entry}')
dump('pipeline/popularity-packages.json', pkgs)

seeds = load('pipeline/seeds/community.json')
H = 'https://hn.algolia.com/api/v1/items/'
new = {
    'email-apis': {
        # Twilio acquisition (633), 2020 hacked-accounts siege (199), 2026 ICE/BLM phishing (209)
        'sendgrid': [H + '18223645', H + '24317634', H + '46555615'],
        # Launch HN W23 (432), Resend's own email-auth guide (209), Feb-2024 incident report (73)
        'resend': [H + '36309120', H + '37263708', H + '39476446'],
        # 2025 "postmark-mcp backdoor" npm-typosquat thread (308) — the community's agent-era
        # deliverability scare, argued about at length; searched, no bigger Postmark thread exists
        'postmark': [H + '45395957'],
        # free-tier cut 10k->625 (422), independence from Rackspace (230), Mailjet acquisition (172)
        'mailgun': [H + '22192543', H + '13705410', H + '21322776'],
        # MailChimp->SES bill reduction (313), Sendy-on-SES (67)
        'amazon-ses': [H + '15493127', H + '4281964'],
    },
    # virtual-mailboxes: HN Algolia has no >40-point threads for stable/VPM/ECM/anytime-mailbox
    # (searched 2026-09-23: 'usestable', 'virtualpostmail', 'earth class mail', 'anytime mailbox',
    # 'virtual mailbox' — all empty or irrelevant). collect-community's automatic HN name search
    # is the only honest source; no curated seeds.
}
for arena, products in new.items():
    if arena not in seeds:
        seeds[arena] = products
        print(f'community seeds: added {arena} ({sum(len(v) for v in products.values())} items)')
# gmail joins the existing email arena seeds
if 'gmail' not in seeds.get('email', {}):
    seeds['email']['gmail'] = [
        H + '48375016',  # "Gmail thinks I'm stupid, so I left" (1193, 2026) — client UX revolt
        H + '7945798',   # Gmail API launch (528, 2014)
        H + '20300008',  # Gmail API lockdown / third-party access restrictions (240, 2019)
        H + '16781959',  # "The dots do matter" gmail addressing scam thread (1023, 2018)
    ]
    print('community seeds: added email/gmail (4 items)')
dump('pipeline/seeds/community.json', seeds)
print('done')
