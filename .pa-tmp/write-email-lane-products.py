#!/usr/bin/env python3
# Writes data/email-apis/products.json and data/virtual-mailboxes/products.json, and appends
# the gmail scoped sub-product to data/email/products.json (google-workspace/sso-identity
# precedent). Every URL below was live-verified 200 by .pa-tmp/verify-corpus.sh /
# .pa-tmp/check-urls*.sh on 2026-09-23 before being written.
import json, os

def dump(p, d):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, 'w') as f:
        json.dump(d, f, indent=2, ensure_ascii=False)
        f.write('\n')

EMAIL_APIS = [
    {
        'id': 'sendgrid',
        'name': 'Twilio SendGrid',
        'vendor': 'Twilio',
        'type': 'commercial',
        'urls': {
            'site': 'https://sendgrid.com',
            'docs': 'https://www.twilio.com/docs/sendgrid',
            'extra': [
                'https://www.twilio.com/docs/sendgrid/api-reference',
                'https://www.twilio.com/docs/sendgrid/api-reference/mail-send/mail-send',
                'https://www.twilio.com/docs/sendgrid/for-developers/sending-email/api-getting-started',
                'https://www.twilio.com/docs/sendgrid/for-developers/sending-email/getting-started-smtp',
                'https://www.twilio.com/docs/sendgrid/for-developers/sending-email/sandbox-mode',
                'https://www.twilio.com/docs/sendgrid/for-developers/tracking-events/getting-started-event-webhook',
                'https://www.twilio.com/docs/sendgrid/for-developers/parsing-email/setting-up-the-inbound-parse-webhook',
                'https://www.twilio.com/docs/sendgrid/ui/account-and-settings/how-to-set-up-domain-authentication',
                'https://www.twilio.com/docs/sendgrid/ui/sending-email/how-to-send-an-email-with-dynamic-transactional-templates',
                'https://www.twilio.com/docs/sendgrid/ui/analytics-and-reporting/deliverability-insights',
                'https://sendgrid.com/en-us/solutions/email-api',
                'https://sendgrid.com/en-us/pricing',
            ],
        },
        'links': {
            'app': 'https://app.sendgrid.com',
            'api': 'https://www.twilio.com/docs/sendgrid/api-reference',
        },
        'businessModel': {
            'models': ['free-tier', 'subscription', 'usage-based', 'enterprise-custom'],
            'summary': 'Free tier (100 emails/day); Essentials from $19.95/mo and Pro from $89.95/mo scale by monthly email volume; dedicated IPs and expert services on Pro/Premier; marketing campaigns priced separately.',
            'url': 'https://sendgrid.com/en-us/pricing',
        },
        'install': [
            {'label': 'npm', 'command': 'npm install @sendgrid/mail', 'url': 'https://www.twilio.com/docs/sendgrid/for-developers/sending-email/api-getting-started'},
            {'label': 'pip', 'command': 'pip install sendgrid', 'url': 'https://www.twilio.com/docs/sendgrid/for-developers/sending-email/api-getting-started'},
        ],
    },
    {
        'id': 'resend',
        'name': 'Resend',
        'vendor': 'Resend',
        'type': 'commercial',
        'urls': {
            'site': 'https://resend.com',
            'docs': 'https://resend.com/docs/introduction',
            'changelog': 'https://resend.com/changelog',
            'extra': [
                'https://resend.com/llms.txt',
                'https://resend.com/docs/llms.txt',
                'https://resend.com/openapi.json',
                'https://resend.com/.well-known/mcp.json',
                'https://resend.com/.well-known/agent-skills/index.json',
                'https://resend.com/docs/introduction.md',
                'https://resend.com/docs/api-reference/introduction.md',
                'https://resend.com/docs/api-reference/emails/send-email.md',
                'https://resend.com/docs/api-reference/emails/send-batch-emails.md',
                'https://resend.com/docs/api-reference/emails/list-received-emails.md',
                'https://resend.com/docs/api-reference/domains/create-domain.md',
                'https://resend.com/docs/api-reference/domains/verify-domain.md',
                'https://resend.com/docs/api-reference/webhooks/create-webhook.md',
                'https://resend.com/docs/api-reference/suppressions/add-suppression.md',
                'https://resend.com/docs/api-reference/api-keys/create-api-key.md',
                'https://resend.com/docs/api-reference/broadcasts/send-broadcast.md',
                'https://resend.com/docs/add-a-domain.md',
                'https://resend.com/docs/send-with-smtp.md',
                'https://resend.com/docs/dashboard/emails/idempotency-keys.md',
                'https://resend.com/blog/agent-experience.md',
                'https://resend.com/migrate/sendgrid.md',
                'https://resend.com/security.md',
                'https://resend.com/pricing.md',
            ],
        },
        'links': {
            'app': 'https://resend.com/login',
            'api': 'https://resend.com/docs/api-reference/introduction',
            'cli': 'https://github.com/resend/resend-cli',
            'mcp': 'https://mcp.resend.com/mcp',
        },
        'businessModel': {
            'models': ['free-tier', 'subscription', 'usage-based', 'enterprise-custom'],
            'summary': 'Free tier (3,000 emails/mo, 1 domain); Pro from $20/mo scales by volume; Scale and Enterprise add dedicated IPs, SSO, and higher limits; marketing contacts priced separately.',
            'url': 'https://resend.com/pricing',
        },
        'install': [
            {'label': 'npm', 'command': 'npm install resend', 'url': 'https://resend.com/docs/introduction'},
            {'label': 'pip', 'command': 'pip install resend', 'url': 'https://resend.com/docs/introduction'},
        ],
        'ycBatch': 'W23',
    },
    {
        'id': 'postmark',
        'name': 'Postmark',
        'vendor': 'ActiveCampaign',
        'type': 'commercial',
        'urls': {
            'site': 'https://postmarkapp.com',
            'docs': 'https://postmarkapp.com/developer',
            'extra': [
                'https://postmarkapp.com/llms.txt',
                'https://postmarkapp.com/pricing.txt',
                'https://postmarkapp.com/pricing',
                'https://postmarkapp.com/developer/api/overview',
                'https://postmarkapp.com/developer/api/email-api',
                'https://postmarkapp.com/developer/api/templates-api',
                'https://postmarkapp.com/developer/api/bounce-api',
                'https://postmarkapp.com/developer/api/messages-api',
                'https://postmarkapp.com/developer/api/domains-api',
                'https://postmarkapp.com/developer/api/servers-api',
                'https://postmarkapp.com/developer/api/stats-api',
                'https://postmarkapp.com/developer/webhooks/webhooks-overview',
                'https://postmarkapp.com/developer/user-guide/send-email-with-api',
                'https://postmarkapp.com/developer/user-guide/inbound',
                'https://postmarkapp.com/developer/integration/official-libraries',
            ],
        },
        'links': {
            'app': 'https://account.postmarkapp.com',
            'api': 'https://postmarkapp.com/developer/api/overview',
        },
        'businessModel': {
            'models': ['free-tier', 'subscription', 'usage-based'],
            'summary': 'Developer sandbox free (100 test emails/mo); paid from $15/mo for 10,000 emails, scaling by volume; dedicated IPs on higher tiers; pricing published in full, including a machine-readable pricing.txt.',
            'url': 'https://postmarkapp.com/pricing',
        },
        'install': [
            {'label': 'npm', 'command': 'npm install postmark', 'url': 'https://postmarkapp.com/developer/integration/official-libraries'},
        ],
    },
    {
        'id': 'mailgun',
        'name': 'Mailgun',
        'vendor': 'Sinch',
        'type': 'commercial',
        'urls': {
            'site': 'https://www.mailgun.com',
            'docs': 'https://documentation.mailgun.com',
            'extra': [
                'https://documentation.mailgun.com/llms.txt',
                'https://documentation.mailgun.com/docs/mailgun/get-started.md',
                'https://documentation.mailgun.com/docs/mailgun/quickstart.md',
                'https://documentation.mailgun.com/docs/mailgun/mcp.md',
                'https://documentation.mailgun.com/docs/mailgun/api-reference/api-overview.md',
                'https://documentation.mailgun.com/docs/mailgun/api-reference/send/mailgun.md',
                'https://documentation.mailgun.com/docs/mailgun/api-reference/mg-auth.md',
                'https://documentation.mailgun.com/docs/mailgun/api-reference/analytics/mg-webhooks.md',
                'https://documentation.mailgun.com/docs/mailgun/api-reference/developer-tools.md',
                'https://documentation.mailgun.com/docs/mailgun/email-best-practices/dns.md',
                'https://documentation.mailgun.com/docs/mailgun/email-best-practices/best_practices.md',
                'https://documentation.mailgun.com/docs/mailgun/sdk/introduction.md',
                'https://documentation.mailgun.com/docs/mailgun/faq/sending.md',
                'https://documentation.mailgun.com/docs/mailgun/faq/receiving.md',
                'https://documentation.mailgun.com/docs/inboxready/intro-ir.md',
                'https://documentation.mailgun.com/docs/inboxready/inbox-placement-ir.md',
                'https://www.mailgun.com/pricing/',
            ],
        },
        'links': {
            'app': 'https://app.mailgun.com',
            'api': 'https://documentation.mailgun.com/docs/mailgun/api-reference/api-overview',
            'mcp': 'https://documentation.mailgun.com/docs/mailgun/mcp',
        },
        'businessModel': {
            'models': ['free-tier', 'subscription', 'usage-based', 'enterprise-custom'],
            'summary': 'Free plan (100 emails/day); Basic from $15/mo, Foundation from $35/mo, Scale adds dedicated IPs and SSO; volume-based overages; InboxReady deliverability suite priced separately.',
            'url': 'https://www.mailgun.com/pricing/',
        },
        'install': [
            {'label': 'npm', 'command': 'npm install mailgun.js', 'url': 'https://documentation.mailgun.com/docs/mailgun/sdk/introduction'},
        ],
        'ycBatch': 'W11',
    },
    {
        'id': 'amazon-ses',
        'name': 'Amazon SES',
        'vendor': 'Amazon Web Services',
        'type': 'commercial',
        'urls': {
            'site': 'https://aws.amazon.com/ses/',
            'docs': 'https://docs.aws.amazon.com/ses/latest/dg/Welcome.html',
            'extra': [
                'https://docs.aws.amazon.com/ses/latest/dg/setting-up.html',
                'https://docs.aws.amazon.com/ses/latest/dg/creating-identities.html',
                'https://docs.aws.amazon.com/ses/latest/dg/send-email-authentication.html',
                'https://docs.aws.amazon.com/ses/latest/dg/request-production-access.html',
                'https://docs.aws.amazon.com/ses/latest/dg/send-email-smtp.html',
                'https://docs.aws.amazon.com/ses/latest/dg/monitor-sending-activity.html',
                'https://docs.aws.amazon.com/ses/latest/dg/monitor-using-event-publishing.html',
                'https://docs.aws.amazon.com/ses/latest/dg/dedicated-ip.html',
                'https://docs.aws.amazon.com/ses/latest/dg/receiving-email.html',
                'https://docs.aws.amazon.com/ses/latest/APIReference-V2/Welcome.html',
                'https://docs.aws.amazon.com/ses/latest/APIReference-V2/API_SendEmail.html',
                'https://aws.amazon.com/ses/pricing/',
                'https://aws.amazon.com/ses/faqs/',
            ],
        },
        'links': {
            'app': 'https://console.aws.amazon.com/ses/',
            'api': 'https://docs.aws.amazon.com/ses/latest/APIReference-V2/Welcome.html',
        },
        'businessModel': {
            'models': ['usage-based', 'free-tier'],
            'summary': 'Pure pay-as-you-go: $0.10 per 1,000 emails sent plus data charges; free tier for sends from EC2/Lambda; dedicated IPs and Virtual Deliverability Manager as paid add-ons; sandbox until production access is granted.',
            'url': 'https://aws.amazon.com/ses/pricing/',
        },
        'install': [
            {'label': 'npm', 'command': 'npm install @aws-sdk/client-sesv2', 'url': 'https://docs.aws.amazon.com/ses/latest/APIReference-V2/Welcome.html'},
        ],
    },
]

VIRTUAL_MAILBOXES = [
    {
        'id': 'stable',
        'name': 'Stable',
        'vendor': 'Stable Technologies',
        'type': 'commercial',
        'urls': {
            'site': 'https://www.usestable.com',
            'docs': 'https://docs.usestable.com',
            'extra': [
                'https://www.usestable.com/llms.txt',
                'https://www.usestable.com/products/virtual-address',
                'https://www.usestable.com/products/virtual-mailbox',
                'https://www.usestable.com/products/registered-agent',
                'https://www.usestable.com/pricing',
                'https://www.usestable.com/about',
                'https://docs.usestable.com/llms.txt',
                'https://docs.usestable.com/docs/getting-started.md',
                'https://docs.usestable.com/docs/webhooks.md',
                'https://docs.usestable.com/docs/the-mail-item-object.md',
                'https://docs.usestable.com/docs/the-location-object.md',
                'https://docs.usestable.com/docs/checks.md',
                'https://docs.usestable.com/docs/companies.md',
                'https://docs.usestable.com/docs/create-a-registered-agent-location.md',
            ],
        },
        'links': {
            'app': 'https://dashboard.usestable.com',
            'api': 'https://docs.usestable.com/docs/getting-started',
        },
        'businessModel': {
            'models': ['subscription', 'usage-based'],
            'summary': 'Virtual address plans from $29/mo (Grow $49, Scale $99) with scan allowances and per-item overages; check deposit, forwarding, and registered agent priced as add-ons or bundled on higher tiers.',
            'url': 'https://www.usestable.com/pricing',
        },
        'ycBatch': 'W20',
    },
    {
        'id': 'virtualpostmail',
        'name': 'VirtualPostMail',
        'vendor': 'Virtual Post Solutions',
        'type': 'commercial',
        'urls': {
            'site': 'https://www.virtualpostmail.com',
            'docs': 'https://www.virtualpostmail.com/developers/',
            'extra': [
                'https://www.virtualpostmail.com/virtual-mailbox/',
                'https://www.virtualpostmail.com/virtual-mailbox/check-deposit/',
                'https://www.virtualpostmail.com/registered-agent/',
                'https://www.virtualpostmail.com/pricing/',
                'https://www.virtualpostmail.com/security/',
                'https://www.virtualpostmail.com/addresses/overview/',
                'https://www.virtualpostmail.com/trulease/',
                'https://www.virtualpostmail.com/truresidence/',
                'https://www.virtualpostmail.com/trustart/',
            ],
        },
        'links': {
            'app': 'https://app.virtualpostmail.com',
            'api': 'https://www.virtualpostmail.com/developers/',
        },
        'businessModel': {
            'models': ['subscription', 'usage-based'],
            'summary': 'Virtual mailbox plans from $25/mo (Starter) to $100/mo (Premium) by mail volume and recipients; unlimited scanning on plan allowances; check deposit from $35/mo add-on; registered agent free with any mailbox plan.',
            'url': 'https://www.virtualpostmail.com/pricing/',
        },
    },
    {
        'id': 'earth-class-mail',
        'name': 'Earth Class Mail',
        'vendor': 'LegalZoom',
        'type': 'commercial',
        'urls': {
            'site': 'https://www.earthclassmail.com',
            'extra': [
                'https://www.legalzoom.com/business/business-operations/lz-virtual-mail-overview.html',
            ],
        },
        'businessModel': {
            'models': ['subscription'],
            'summary': 'Now sold as LegalZoom LZ Virtual Mail: subscription plans (from ~$29/mo) with scanning included; check deposit and forwarding as add-ons. Standalone Earth Class Mail plans and its public API are no longer offered post-acquisition.',
            'url': 'https://www.legalzoom.com/business/business-operations/lz-virtual-mail-overview.html',
        },
    },
    {
        'id': 'anytime-mailbox',
        'name': 'Anytime Mailbox',
        'vendor': 'Anytime Mailbox',
        'type': 'commercial',
        'urls': {
            'site': 'https://www.anytimemailbox.com',
            'extra': [
                'https://www.anytimemailbox.com/how-it-works',
                'https://www.anytimemailbox.com/mail-forwarding',
                'https://www.anytimemailbox.com/mail-center',
                'https://www.anytimemailbox.com/mail-center/faq',
                'https://www.anytimemailbox.com/locations',
                'https://www.anytimemailbox.com/business-owners',
                'https://www.anytimemailbox.com/digital-mail/case-studies',
            ],
        },
        'links': {
            'app': 'https://packmail.anytimemailbox.com',
        },
        'businessModel': {
            'models': ['subscription', 'usage-based'],
            'summary': 'Location-priced subscriptions (typically $9.99-$39.99/mo depending on site and plan) with per-item scan, forwarding, and storage fees set by each location operator; pricing shown per location at signup rather than on a single public page.',
            'url': 'https://www.anytimemailbox.com/locations',
        },
    },
]

GMAIL = {
    'id': 'gmail',
    'name': 'Gmail',
    'vendor': 'Google',
    'type': 'commercial',
    'urls': {
        'site': 'https://www.google.com/gmail/about/',
        'docs': 'https://developers.google.com/gmail/api/guides',
        'extra': [
            'https://developers.google.com/gmail/api/reference/rest',
            'https://developers.google.com/gmail/api/reference/rest/v1/users.messages/send',
            'https://developers.google.com/gmail/api/guides/sending',
            'https://developers.google.com/gmail/api/guides/push',
            'https://developers.google.com/gmail/api/auth/scopes',
            'https://developers.google.com/gmail/imap/imap-smtp',
            'https://developers.google.com/workspace/add-ons/gmail',
            'https://workspace.google.com/products/gmail/',
            'https://workspace.google.com/pricing',
            'https://support.google.com/mail/answer/7190',
            'https://support.google.com/mail/answer/7622010',
            'https://support.google.com/mail/answer/1306849',
            'https://support.google.com/mail/answer/2819488',
            'https://support.google.com/mail/answer/138350',
            'https://support.google.com/mail/answer/7126229',
            'https://support.google.com/mail/answer/14199860',
        ],
    },
    'links': {
        'app': 'https://mail.google.com',
        'api': 'https://developers.google.com/gmail/api/reference/rest',
    },
    'businessModel': {
        'models': ['free-tier', 'subscription-per-seat'],
        'summary': 'Free consumer Gmail (15 GB shared storage, ad-supported); business Gmail via Google Workspace per-user plans (Business Starter $7, Standard $14, Plus $22/user/mo) with custom domain, admin controls, and Gemini features on paid tiers.',
        'url': 'https://workspace.google.com/pricing',
    },
    'familyId': 'google',
}

dump('data/email-apis/products.json', EMAIL_APIS)
print(f'data/email-apis/products.json: {len(EMAIL_APIS)} products')
dump('data/virtual-mailboxes/products.json', VIRTUAL_MAILBOXES)
print(f'data/virtual-mailboxes/products.json: {len(VIRTUAL_MAILBOXES)} products')

with open('data/email/products.json') as f:
    email = json.load(f)
if not any(p['id'] == 'gmail' for p in email):
    email.append(GMAIL)
    dump('data/email/products.json', email)
    print(f'data/email/products.json: appended gmail ({len(email)} products)')

# product-families: gmail joins the google family (bidirectional familyId gate)
with open('data/product-families.json') as f:
    fams = json.load(f)
for fam in fams:
    if fam['id'] == 'google' and not any(s['id'] == 'gmail' for s in fam['subProducts']):
        fam['subProducts'].append({
            'id': 'gmail',
            'name': 'Gmail',
            'blurb': 'The default inbox of the internet — 1.8B+ accounts, now judged as an email client and agent surface: Gmail API sends and reads mail under OAuth scopes, Pub/Sub push watches inboxes, and Gemini drafts inside the client.',
            'docsUrl': 'https://developers.google.com/gmail/api/guides',
            'arenaRef': {'arenaId': 'email', 'productId': 'gmail'},
        })
        dump('data/product-families.json', fams)
        print('data/product-families.json: gmail added to google family')

# yc-batches stamps, domain-verified against the public YC directory (yc-oss mirror, 2026-09-23):
# Resend W23 (resend.com), Mailgun W11 (mailgun.net), Stable W20 (usestable.com).
with open('data/yc-batches.json') as f:
    yc = json.load(f)
changed = False
for pid, batch in (('resend', 'W23'), ('mailgun', 'W11'), ('stable', 'W20')):
    if pid not in yc:
        yc[pid] = batch
        changed = True
        print(f'yc-batches.json: {pid} {batch}')
if changed:
    dump('data/yc-batches.json', dict(sorted(yc.items())))
print('done')
