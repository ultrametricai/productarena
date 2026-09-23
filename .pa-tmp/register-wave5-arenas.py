#!/usr/bin/env python3
# Registers the launch-audit wave-5 arenas (compliance-automation, applicant-tracking,
# domain-registrars, sso-identity): categories.json entries, arena-sections placement,
# arena-icons, adjacent-arenas, roadmap (graduate compliance-automation planned->live, rename
# ats-recruiting->applicant-tracking, add the two new ones live), search-aliases. Idempotent —
# skips anything already present. Same shape as .pa-tmp/register-self-hosted-assistants.py.
import json

def load(p):
    with open(p) as f:
        return json.load(f)

def dump(p, d):
    with open(p, 'w') as f:
        json.dump(d, f, indent=2, ensure_ascii=False)
        f.write('\n')

CATS = [
    {
        'id': 'compliance-automation',
        'name': 'Compliance Automation',
        'description': (
            'Compliance automation platforms — the SOC 2/ISO 27001/HIPAA machines every startup buys the week a real '
            'customer asks for a security review. Judged on what the platform actually automates: framework coverage and '
            'cross-framework control mapping, integration breadth and machine-gathered evidence, continuous control tests '
            'that catch drift before the auditor does, in-platform auditor workflow and audit-readiness truth, hosted '
            'trust centers, AI security-questionnaire answering, risk registers and policy programs, and the '
            'onboarding/offboarding/access-review loop. Distinct from security-scanners (finding vulnerabilities in YOUR '
            'code) and legal-ops (contracts and incorporation): this arena is proving your controls to someone else. The '
            'agent angle is measured on both sides — evidence-collection APIs and custom-integration surfaces agents can '
            'push to, and MCP/docs surfaces agents can drive.'
        ),
        'personas': ['founder', 'security-engineer', 'operations-lead', 'it-admin', 'sales-lead', 'developer', 'ai-native'],
        'themes': [
            'framework-coverage',
            'evidence-collection',
            'continuous-monitoring',
            'audit-workflow',
            'trust-center',
            'questionnaire-automation',
            'risk-policy',
            'workforce-compliance',
        ],
    },
    {
        'id': 'applicant-tracking',
        'name': 'Applicant Tracking',
        'description': (
            'Applicant tracking systems — where startups actually run hiring: pipelines and stages, hosted careers pages, '
            'job-board distribution, calendar-integrated interview scheduling, structured scorecards, sourcing CRM, offer '
            'letters with e-signature, and funnel analytics. Judged on the operational reality (can a two-person team run '
            'a credible loop; can a scale-up schedule a five-interviewer onsite automatically) plus the new AI layer — '
            'screening, interview notes, drafted outreach — with its safeguards documented, not just marketed. Distinct '
            'from payroll/HRIS (after the hire) and scheduling (general-purpose booking): this arena is the '
            'req-to-signed-offer machine. Agent surfaces are measured hard: Harvest-style REST APIs, keyless public '
            'job-board APIs, webhooks, and partner ecosystems are exactly what hiring agents will drive.'
        ),
        'personas': ['recruiter', 'hiring-manager', 'founder', 'operations-lead', 'employee', 'analyst', 'ai-native'],
        'themes': [
            'pipeline-management',
            'careers-page',
            'interview-scheduling',
            'structured-interviews',
            'sourcing-crm',
            'offer-management',
            'recruiting-analytics',
            'recruiting-ai',
        ],
    },
    {
        'id': 'domain-registrars',
        'name': 'Domain Registrars',
        'description': (
            'Domain registrars — the first purchase of every company and every side project, judged on the parts that '
            'differ wildly between vendors: honest search without teaser-price games, published per-TLD price lists with '
            'renewal and transfer prices shown, free WHOIS privacy, transfer and registry locks, DNSSEC, full DNS hosting '
            'with an API, bulk portfolio operations, and the registration/availability/pricing APIs that let a deploy '
            'script — or an agent — buy and wire a domain end to end. Distinct from edge-platforms (Cloudflare\'s CDN and '
            'compute are judged there; only its registrar product competes here) and email (mailbox hosting): this arena '
            'is the registrar function itself. Sandbox environments, self-serve API keys, and machine-readable pricing '
            'are scored as the agent-era table stakes they are becoming.'
        ),
        'personas': ['founder', 'developer', 'power-user', 'it-admin', 'security-engineer', 'privacy-first-user', 'ai-native'],
        'themes': [
            'domain-search',
            'registration-transfer',
            'dns-management',
            'whois-privacy',
            'pricing-transparency',
            'registrar-platform',
        ],
    },
    {
        'id': 'sso-identity',
        'name': 'SSO & Workforce Identity',
        'description': (
            'Workforce identity providers — the IdP that owns who works here and what they can reach: SSO app catalogs '
            'thousands deep, SCIM provisioning and instant deprovisioning, HRIS-driven joiner/mover/leaver flows, MFA '
            'policy up to phishing-resistant FIDO2/passkeys, device trust, the directory APIs and Terraform providers '
            'that make identity config code, lifecycle workflows, access certification, and system logs that stream to a '
            'SIEM. Distinct from auth-platforms (Auth0/Clerk/WorkOS — login for YOUR app\'s users) and '
            'authenticator-apps (the codes on your phone): this arena is the employer-side identity control plane. The '
            'agent era raises the stakes both ways — agents need governed identities of their own (cross-app access, '
            'token vaulting), and the IdP\'s admin APIs are exactly the surface IT agents will drive.'
        ),
        'personas': ['it-admin', 'security-engineer', 'employee', 'developer', 'platform-engineer', 'founder', 'ai-native'],
        'themes': [
            'app-catalog',
            'scim-provisioning',
            'mfa-policy',
            'device-trust',
            'directory-core',
            'lifecycle-automation',
            'identity-observability',
            'agent-identity',
        ],
    },
]

SECTION_PLACEMENT = {
    # (section id, arena to insert after)
    'compliance-automation': ('security-legal', 'legal-ops'),
    'applicant-tracking': ('fintech-ops', 'payroll'),
    'domain-registrars': ('infra-ops', 'edge-platforms'),
    'sso-identity': ('security-legal', 'auth-platforms'),
}

ICONS = {
    'compliance-automation': '📋',
    'applicant-tracking': '🗂️',
    'domain-registrars': '🌐',
    'sso-identity': '🪪',
}

ADJACENT = [
    ['compliance-automation', 'security-scanners', 'legal-ops', 'identity-verification'],
    ['applicant-tracking', 'payroll', 'scheduling'],
    ['domain-registrars', 'edge-platforms', 'email'],
    ['sso-identity', 'auth-platforms', 'authenticator-apps', 'security-keys'],
]

ALIASES = {
    'compliance-automation': [
        'soc 2 automation', 'vanta vs', 'drata vs', 'soc2 compliance', 'iso 27001 software',
        'compliance platform', 'trust center', 'security questionnaire ai', 'grc for startups',
    ],
    'applicant-tracking': [
        'ats', 'applicant tracking system', 'greenhouse vs', 'ashby vs', 'lever vs',
        'recruiting software', 'hiring pipeline', 'careers page software', 'interview scheduling',
    ],
    'domain-registrars': [
        'domain registrar', 'buy a domain', 'namecheap vs', 'porkbun vs', 'cloudflare registrar',
        'domain api', 'whois privacy', 'cheapest domain renewal', 'dns hosting',
    ],
    'sso-identity': [
        'sso', 'identity provider', 'idp', 'okta vs', 'jumpcloud vs', 'scim provisioning',
        'workforce identity', 'single sign-on', 'entra vs okta', 'device trust',
    ],
}

ROADMAP_NEW = [
    {
        'id': 'domain-registrars',
        'name': 'Domain Registrars',
        'tier': 2,
        'status': 'live',
        'g2Equivalent': 'Domain Registration Providers',
        'candidateProducts': ['Cloudflare Registrar', 'Porkbun', 'Namecheap', 'Name.com', 'Dynadot', 'GoDaddy'],
        'rationale': 'Live arena (launch-audit wave 5): the first purchase of every company — 9 process steps across 7 founder processes needed a registrar market that was still untracked chips.',
        'aiEraAngle': 'Registration, availability, DNS, and pricing APIs are how agents will buy and wire domains; sandbox environments and machine-readable price lists separate the field.',
    },
    {
        'id': 'sso-identity',
        'name': 'SSO & Workforce Identity',
        'tier': 2,
        'status': 'live',
        'g2Equivalent': 'Single Sign-On (SSO) / Identity and Access Management (IAM)',
        'candidateProducts': ['Okta', 'Microsoft Entra ID', 'JumpCloud', 'Google Workspace', 'Rippling IT'],
        'rationale': 'Live arena (launch-audit wave 5): the workforce IdP — distinct from app-auth (auth-platforms) — anchoring the SSO/access-management steps founders hit at scale.',
        'aiEraAngle': 'Agents need governed identities (cross-app access, token vaulting) and the IdP admin APIs, SCIM, and Terraform providers are the surfaces IT agents drive.',
    },
]

cats = load('data/categories.json')
have = {c['id'] for c in cats}
for cat in CATS:
    if cat['id'] not in have:
        cats.append(cat)
        print(f"categories.json: added {cat['id']}")
dump('data/categories.json', cats)

sections = load('data/arena-sections.json')
for arena, (sec_id, after) in SECTION_PLACEMENT.items():
    for s in sections['sections']:
        if s['id'] == sec_id and arena not in s['arenaIds']:
            i = s['arenaIds'].index(after) + 1
            s['arenaIds'].insert(i, arena)
            print(f'arena-sections.json: {arena} -> {sec_id} (after {after})')
dump('data/arena-sections.json', sections)

icons = load('data/arena-icons.json')
for arena, icon in ICONS.items():
    if arena not in icons:
        icons[arena] = icon
        print(f'arena-icons.json: {arena} {icon}')
dump('data/arena-icons.json', icons)

adj = load('data/adjacent-arenas.json')
existing = {tuple(g) for g in adj}
for group in ADJACENT:
    if tuple(group) not in existing:
        adj.append(group)
        print(f'adjacent-arenas.json: added {group}')
dump('data/adjacent-arenas.json', adj)

rm = load('data/arena-roadmap.json')
by_id = {e['id']: e for e in rm}
# Graduate compliance-automation planned -> live in place.
ca = by_id.get('compliance-automation')
if ca and ca['status'] != 'live':
    ca['status'] = 'live'
    ca['name'] = 'Compliance Automation'
    ca['candidateProducts'] = ['Vanta', 'Drata', 'Secureframe', 'Oneleet', 'Sprinto', 'Thoropass']
    ca['rationale'] = 'Live arena (launch-audit wave 5): every AI startup needs SOC 2 to sell — 13 process steps across 7 founder processes were pointing at untracked chips.'
    ca['aiEraAngle'] = 'Evidence-collection APIs, AI questionnaire answering, MCP surfaces, and integration breadth are the axes; the compliance platform is itself becoming an agent target.'
    print('arena-roadmap.json: compliance-automation planned -> live')
# Rename ats-recruiting -> applicant-tracking and graduate to live.
ats = by_id.get('ats-recruiting')
if ats:
    ats['id'] = 'applicant-tracking'
    ats['name'] = 'Applicant Tracking'
    ats['status'] = 'live'
    ats['candidateProducts'] = ['Greenhouse', 'Ashby', 'Lever', 'Workable', 'Recruitee']
    ats['rationale'] = "Live arena (launch-audit wave 5): Ashby's analytics-first rise vs the incumbents; the ATS steps in the founder hiring processes needed a tracked market."
    ats['aiEraAngle'] = 'AI screening posture (and its bias risks), scheduling automation, keyless public job-board APIs, Harvest-style REST APIs, and candidate-data portability.'
    print('arena-roadmap.json: ats-recruiting renamed -> applicant-tracking, live')
ids = {e['id'] for e in rm}
for entry in ROADMAP_NEW:
    if entry['id'] not in ids:
        rm.append(entry)
        print(f"arena-roadmap.json: added {entry['id']} (live)")
dump('data/arena-roadmap.json', rm)

sa = load('data/search-aliases.json')
for arena, aliases in ALIASES.items():
    if arena not in sa['arenas']:
        sa['arenas'][arena] = aliases
        print(f'search-aliases.json: added {arena}')
dump('data/search-aliases.json', sa)

print('done')
