// Registers the email-marketing arena's shared-file entries: categories.json, arena icon,
// arena section, adjacent-arenas cluster. Idempotent. (Aliases, roadmap flip, NAV_LABELS,
// probes, pipeline data are handled in their own steps.)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const W = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const w2 = (f, v) => fs.writeFileSync(path.join(W, f), JSON.stringify(v, null, 2) + '\n')
const rd = (f) => JSON.parse(fs.readFileSync(path.join(W, f), 'utf8'))

// 1. categories.json — append the email-marketing arena
const cats = rd('data/categories.json')
if (!cats.some((c) => c.id === 'email-marketing')) {
  cats.push({
    id: 'email-marketing',
    name: 'Email Marketing',
    description:
      "Email marketing platforms — the campaign and lifecycle engine a startup points at its own audience: broadcasts, segments, automation flows, deliverability, and the AI-era heart of the arena: whether an agent can build a segment, draft a campaign, and drive sends through real APIs and MCP servers. Loops anchors the agent era with a hosted MCP server, agent skills, and llms.txt docs; Customer.io and Klaviyo ship official MCP servers of their own; Kit's v4 API is real but paid-plan-gated; Mailchimp is the legacy incumbent with a deep REST API and no agent surface; Bento is the indie SaaS favorite with marketing and transactional in one API. Scope, honestly drawn: transactional email APIs (Resend, Postmark, SendGrid) are the planned email-apis arena, agent-first mail clients are judged in email, and creator newsletter publishing (Substack, beehiiv) is the planned newsletter-platforms arena.",
    personas: ['founder', 'marketer', 'developer', 'ops', 'ai-native'],
    themes: [
      'campaign-sending',
      'audience-segmentation',
      'lifecycle-automation',
      'template-content',
      'deliverability-domains',
      'analytics-attribution',
      'transactional-sending',
      'list-portability',
      'integrations-webhooks',
      'marketing-data-access',
    ],
  })
  w2('data/categories.json', cats)
}

// 2. arena-icons.json
const icons = rd('data/arena-icons.json')
icons['email-marketing'] = '📣'
w2('data/arena-icons.json', icons)

// 3. arena-sections.json — Commerce & Customers
const sections = rd('data/arena-sections.json')
const cc = sections.sections.find((s) => s.id === 'commerce-customers')
if (!cc.arenaIds.includes('email-marketing')) cc.arenaIds.push('email-marketing')
w2('data/arena-sections.json', sections)

// 4. adjacent-arenas.json — new cluster
const adj = rd('data/adjacent-arenas.json')
if (!adj.some((c) => c.includes('email-marketing'))) {
  adj.push(['email-marketing', 'crm', 'customer-data-platforms', 'email', 'product-analytics'])
}
w2('data/adjacent-arenas.json', adj)
console.log('registered email-marketing shared entries')
