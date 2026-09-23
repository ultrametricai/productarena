#!/usr/bin/env python3
# Registers the email-apis and virtual-mailboxes arenas (founder ask 2026-09-23, launch day:
# "sendgrid, virtualpostmail, do an arena for mail"): categories.json entries, arena-sections
# placement, arena-icons, adjacent-arenas, roadmap (email-apis planned->live; virtual-mailboxes
# added live), search-aliases, and the email-marketing description's stale "planned email-apis
# arena" reference. Idempotent — same shape as .pa-tmp/register-self-hosted-assistants.py.
import json

def load(p):
    with open(p) as f:
        return json.load(f)

def dump(p, d):
    with open(p, 'w') as f:
        json.dump(d, f, indent=2, ensure_ascii=False)
        f.write('\n')

EMAIL_APIS = {
    'id': 'email-apis',
    'name': 'Transactional Email APIs',
    'description': (
        'Transactional email APIs — the send-a-message-from-code layer every product stands on: password '
        'resets, receipts, notifications, and increasingly the outbound half of AI agents. Resend reopened a '
        'settled category with developer-first APIs, llms.txt docs, agent skills, and a hosted MCP server; '
        'Postmark holds the deliverability-obsessed corner; Twilio SendGrid is the incumbent at volume; '
        'Mailgun (Sinch) pairs a veteran API with published MCP docs; Amazon SES is the raw-infrastructure '
        'floor on price. Judged on send API quality (single, batch, idempotent, scheduled), guided domain '
        'authentication (SPF/DKIM/DMARC), deliverability tooling and suppression management, template APIs, '
        'delivery-event webhooks with signing, inbound parsing, test/sandbox modes, SDK breadth, throughput '
        'transparency, pricing clarity — and the agent-era spine: machine-readable docs, OpenAPI specs, MCP '
        'servers, and whether an agent can wire up a verified sending domain end to end. Scope, honestly '
        'drawn: email marketing platforms (Loops, Customer.io) are the email-marketing arena, mail clients '
        'are the email arena, and Loops stays tracked in email-marketing rather than being double-counted here.'
    ),
    'personas': ['developer', 'founder', 'platform-engineer', 'deliverability-manager', 'ai-native'],
    'themes': [
        'send-api',
        'deliverability',
        'templates-content',
        'events-webhooks',
        'inbound-mail',
        'developer-experience',
        'sending-scale',
        'pricing-plans',
    ],
}

VIRTUAL_MAILBOXES = {
    'id': 'virtual-mailboxes',
    'name': 'Virtual Mailboxes',
    'description': (
        'Virtual mailbox and virtual business address services — a real street address for your company '
        'plus scan-and-forward operations on the physical mail that still runs the back office: state and '
        'IRS notices, bank letters, checks. Stable is the startup-facing entrant with real developer docs '
        'and an API; VirtualPostMail (VPM) is the operator veteran with check deposit and registered-agent '
        'bundles; Earth Class Mail pioneered the category and now lives inside LegalZoom as LZ Virtual Mail; '
        'Anytime Mailbox fronts the largest location network. Judged on address establishment (USPS Form '
        '1583 flow help, notarization, proof-of-address usability), scan quality and OCR, forwarding and '
        'shredding automation, check deposit, registered-agent and formation tie-ins, location breadth, '
        'pricing transparency — and the agent surface: whether mail items are reachable through a documented '
        'API, webhooks, or any machine-readable docs at all. The honest finding this arena exists to record: '
        'most of the category still judges LOW on agent readiness, and the leaderboard says which vendors '
        'are the exceptions.'
    ),
    'personas': ['founder', 'operator', 'digital-nomad', 'developer', 'ai-native'],
    'themes': [
        'address-setup',
        'mail-scanning',
        'forwarding-shipping',
        'check-deposit',
        'business-services',
        'integrations-access',
        'plans-locations',
        'trust-reliability',
    ],
}

cats = load('data/categories.json')
ids = {c['id'] for c in cats}
for cat in (EMAIL_APIS, VIRTUAL_MAILBOXES):
    if cat['id'] not in ids:
        cats.append(cat)
        print(f"categories.json: added {cat['id']}")
# email-marketing description: the "planned email-apis arena" is now live
for c in cats:
    if c['id'] == 'email-marketing' and 'the planned email-apis arena' in c['description']:
        c['description'] = c['description'].replace('are the planned email-apis arena', 'are the email-apis arena')
        print('categories.json: email-marketing description now references live email-apis')
dump('data/categories.json', cats)

sections = load('data/arena-sections.json')
for s in sections['sections']:
    if s['id'] == 'comms-productivity' and 'email-apis' not in s['arenaIds']:
        # after email — the client/API pair reads side by side
        s['arenaIds'].insert(s['arenaIds'].index('email') + 1, 'email-apis')
        print('arena-sections.json: email-apis -> comms-productivity (after email)')
    if s['id'] == 'fintech-ops' and 'virtual-mailboxes' not in s['arenaIds']:
        # after startup-banking — the back-office formation cluster
        s['arenaIds'].insert(s['arenaIds'].index('startup-banking') + 1, 'virtual-mailboxes')
        print('arena-sections.json: virtual-mailboxes -> fintech-ops (after startup-banking)')
dump('data/arena-sections.json', sections)

icons = load('data/arena-icons.json')
for k, v in (('email-apis', '📮'), ('virtual-mailboxes', '📬')):
    if k not in icons:
        icons[k] = v
        print(f'arena-icons.json: {k} {v}')
dump('data/arena-icons.json', icons)

adj = load('data/adjacent-arenas.json')
existing = {tuple(g) for g in adj}
for group in (['email-apis', 'email-marketing', 'email', 'edge-platforms'],
              ['virtual-mailboxes', 'startup-banking', 'legal-ops', 'compliance-automation']):
    if tuple(group) not in existing:
        adj.append(group)
        print(f'adjacent-arenas.json: added {group}')
dump('data/adjacent-arenas.json', adj)

rm = load('data/arena-roadmap.json')
for e in rm:
    if e['id'] == 'email-apis' and e['status'] != 'live':
        e['status'] = 'live'
        e['tier'] = 1
        e['candidateProducts'] = ['SendGrid', 'Resend', 'Postmark', 'Mailgun', 'Amazon SES']
        e['rationale'] = (
            'Live arena (founder ask 2026-09-23): SendGrid appears on 6 untracked process-step chips and the '
            'category owns the send layer under every launch checklist. Loops stays tracked in email-marketing '
            'rather than being double-counted.'
        )
        e['aiEraAngle'] = (
            'Resend ships llms.txt + OpenAPI + a hosted MCP server + published agent skills; Mailgun documents '
            'an MCP server; the arena measures whether an agent can authenticate a domain and send end to end.'
        )
        print('arena-roadmap.json: email-apis planned -> live')
if 'virtual-mailboxes' not in {e['id'] for e in rm}:
    rm.append({
        'id': 'virtual-mailboxes',
        'name': 'Virtual Mailboxes',
        'tier': 2,
        'status': 'live',
        'g2Equivalent': 'Virtual Mailbox Services',
        'candidateProducts': ['Stable', 'VirtualPostMail', 'Earth Class Mail', 'Anytime Mailbox'],
        'rationale': (
            "Live arena (founder ask 2026-09-23: 'virtualpostmail... do an arena for mail'): the qs_044 "
            "mailing-address step's three chips were all untracked; iPostal1 was evaluated and excluded — its "
            'site bot-walls keyless crawlers (HTTP 403 site-wide).'
        ),
        'aiEraAngle': (
            'Physical mail is the last analog inbox: the arena measures who exposes scans, forwarding, and '
            'check deposit through real APIs and webhooks (Stable, VPM) versus portal-only vendors — most of '
            'the category honestly judges LOW on agent readiness.'
        ),
    })
    print('arena-roadmap.json: added virtual-mailboxes (live)')
dump('data/arena-roadmap.json', rm)

sa = load('data/search-aliases.json')
if 'email-apis' not in sa['arenas']:
    sa['arenas']['email-apis'] = [
        'transactional email', 'email api', 'sendgrid alternatives', 'resend vs postmark',
        'smtp service', 'email deliverability',
    ]
    print('search-aliases.json: added email-apis')
if 'virtual-mailboxes' not in sa['arenas']:
    sa['arenas']['virtual-mailboxes'] = [
        'virtual mailbox', 'virtual business address', 'mail scanning', 'mail forwarding',
        'virtual address for llc', 'business mailing address',
    ]
    print('search-aliases.json: added virtual-mailboxes')
dump('data/search-aliases.json', sa)

print('done')
