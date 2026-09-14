// Curated, salient emoji for the founder-process corpus: one icon per PHASE, one per PROCESS
// (keyed by corpus task id — stable across title tweaks), and one per curated playbook (chain).
// Hand-picked, not keyword-derived — each icon should evoke the actual process (incorporate 🏛️,
// run payroll 💸, track runway 📉, hire 🤝), and the site-wide rules from lib/icons.ts apply:
// same concept = same icon everywhere (all three cap-table processes share 🥧), and every icon
// renders with a tooltip naming the concept (components/IconChip.tsx enforces the title).
//
// Coverage over the LIVE corpus is enforced by lib/__tests__/processIcons.test.ts: a new
// process, phase, or chain shipped without a curated icon is a test failure — that's the point.
// Client-safe and pure (no node builtins): imported from server pages and the ProcessesTable
// client component alike.

// ---------- Phases ----------

export const PHASE_ICONS: Record<string, { icon: string; blurb: string }> = {
  startup: { icon: '🐣', blurb: 'validating the idea and forming the founding team' },
  formation: { icon: '🏛️', blurb: 'incorporating and standing up the company' },
  fundraising: { icon: '💰', blurb: 'raising money and managing equity' },
  legal: { icon: '⚖️', blurb: 'contracts, IP, and legal paperwork' },
  compliance: { icon: '📋', blurb: 'filings, taxes, and staying compliant' },
  finance: { icon: '💸', blurb: 'banking, accounting, and money movement' },
  hr: { icon: '🤝', blurb: 'hiring, payroll, and people ops' },
  operations: { icon: '⚙️', blurb: 'day-to-day tooling and internal ops' },
  product: { icon: '🛠️', blurb: 'standing up the product stack' },
  software: { icon: '💻', blurb: 'the spec, build, review, ship loop' },
  sales: { icon: '📞', blurb: 'selling and invoicing customers' },
  growth: { icon: '📈', blurb: 'marketing, subscriptions, and retention' },
}

export function phaseIcon(phase: string): string {
  return PHASE_ICONS[phase]?.icon ?? ''
}

// The REQUIRED tooltip for a phase icon — names the concept, per the site-wide icon rule.
export function phaseTooltip(phase: string): string {
  const entry = PHASE_ICONS[phase]
  return entry ? `${phase} — ${entry.blurb}` : phase
}

// ---------- Individual processes (keyed by corpus task id) ----------

export const PROCESS_ICONS: Record<string, string> = {
  // Initial startup
  startup_001: '🧪', // Validate the idea
  startup_002: '🖋️', // Founder agreement & equity split
  // Formation
  form_001: '🏛️', // Incorporate C-Corp
  form_002: '🆔', // Get EIN
  form_005: '🗺️', // Register state taxes
  form_010: '🏛️', // Incorporate a company (same concept as form_001)
  qs_044: '📬', // Set up mailing address
  qs_046: '🧭', // Evaluate C Corp conversion
  brand_001: '💡', // Generate a company name
  brand_002: '🎨', // Generate a brand logo
  brand_003: '🌈', // Pick a brand color palette
  domain_001: '🔍', // Check domain availability
  domain_002: '🌐', // Buy a domain
  // Fundraising
  fund_001: '🌱', // Raise pre-seed (SAFEs)
  fund_003: '💲', // 409A valuation
  fund_004: '🎟️', // Issue stock options
  qs_051: '🥧', // Set up cap table (ownership pie)
  qs_052: '🥧', // Update cap table
  qs_053: '🥧', // Audit cap table
  // Legal
  legal_001: '🤐', // Send NDA
  legal_002: '®️', // File trademark
  legal_003: '©️', // IP assignments
  legal_004: '📑', // Negotiate SaaS agreement
  qs_043: '🕴️', // Set up registered agent
  opp_012: '🔭', // Monitor trademark / handle availability
  // Compliance
  tax_001: '💵', // File DE franchise tax
  tax_002: '🧾', // File federal tax return
  tax_003: '📮', // Issue 1099s
  ins_001: '☂️', // Get insurance quotes
  comp_001: '🛡️', // Start SOC 2 Type I
  qs_041: '📆', // File DE annual report
  qs_045: '🗂️', // Review state registration
  qs_047: '📆', // File state annual report (same concept as qs_041)
  opp_010: '📆', // File an annual report / registered agent
  scale_007: '🔑', // SSO & access mgmt
  scale_011: '🕵️', // Vendor security review
  comp_010: '🔒', // Publish privacy policy & DPA (privacy is 🔒 site-wide)
  comp_011: '📜', // Board minutes cadence
  // Finance
  qs_021: '💳', // Connect a payment processor (canonical: Stripe)
  qs_023: '🏦', // Open bank account
  qs_024: '💳', // Set up credit card
  qs_050: '📉', // Track runway
  qs_073: '🧮', // Set up accounting
  fin_001: '💵', // Pay vendor invoices
  fin_002: '📒', // Bookkeeping close
  fin_003: '📊', // Board financial report
  scale_004: '🧾', // Expense management (receipts)
  scale_005: '👔', // Board meeting prep
  opp_001: '📤', // Send a wire or ACH payment
  opp_004: '↩️', // Issue a refund
  // HR
  qs_063: '💸', // Set up payroll
  hr_001: '🤝', // Hire first employee
  hr_002: '💸', // Run payroll (same concept as qs_063)
  hr_003: '🌍', // Hire intl contractor
  hr_004: '🗃️', // Set up ATS
  hr_005: '👋', // Offboard employee
  scale_001: '⭐', // Performance reviews
  scale_002: '🩺', // Set up benefits
  scale_003: '📖', // Employee handbook
  scale_008: '📥', // Hiring pipeline
  opp_002: '👷', // Add a contractor (1099)
  opp_007: '🪪', // Provision a workspace user (canonical: Google Workspace)
  team_001: '💌', // Invite a teammate
  // Operations
  qs_001: '📝', // Summarize my company
  qs_002: '✅', // List my tasks
  qs_003: '🎯', // Goals due this week
  qs_004: '🧰', // List capabilities
  qs_010: '🧠', // Extract Ultrametric context
  qs_015: '🗄️', // Set up doc storage
  ops_001: '💬', // Set up team chat (canonical: Slack)
  ops_002: '🎫', // Set up a project tracker (canonical: Linear)
  ops_003: '📚', // Set up a team wiki (canonical: Notion)
  ops_004: '🏢', // Set up company email & docs (canonical: Google Workspace)
  ops_005: '🔐', // Set up a password manager (canonical: 1Password)
  scale_006: '🏗️', // Multi-team structure
  scale_012: '🎯', // Company OKRs (same concept as qs_003)
  opp_005: '📋', // Create a project in your tracker (canonical: Asana)
  opp_006: '📦', // Import documents from Dropbox
  opp_008: '✉️', // Draft and send an email (canonical: Gmail)
  opp_011: '📨', // Set up email routing on your domain
  vendor_010: '🔌', // Connect a vendor or MCP server
  // Software making
  sw_001: '🚢', // Ship a feature (ship it!)
  sw_002: '🏷️', // Cut a release (tag it)
  prod_002: '🔄', // Set up CI/CD
  prod_004: '🚨', // Set up error tracking (canonical: Sentry)
  // Product
  qs_081: '🖥️', // Set up website
  prod_001: '☁️', // Set up cloud infrastructure (canonical: AWS)
  prod_003: '🔗', // Set up custom domain
  prod_005: '🦔', // Set up product analytics (canonical: PostHog — the hedgehog)
  prod_006: '🐙', // Set up a code hosting org (canonical: GitHub — the octopus)
  opp_009: '🎫', // Create an issue from a task (same concept as ops_002)
  scale_009: '📟', // On-call & incidents (the pager)
  scale_010: '🏭', // Data warehouse & BI (the warehouse)
  // Sales
  sales_001: '📇', // Set up a CRM (canonical: HubSpot — rolodex)
  sales_002: '🧾', // Send an invoice (canonical: Stripe)
  // Growth
  growth_001: '🔁', // Set up subscription billing (canonical: Stripe)
  growth_002: '🛟', // Churn save attempt (save the customer)
  growth_003: '📣', // Set up email marketing (canonical: Mailchimp)
  growth_004: '🗨️', // Set up customer support (canonical: Intercom)
  growth_005: '📧', // Set up transactional email (canonical: SendGrid)
  opp_003: '🔁', // Create a subscription product (same concept as growth_001)
  site_001: '🪄', // Generate a website
  growth_010: '🚀', // Launch on Product Hunt & directories
  growth_011: '🔎', // SEO & content engine (search is 🔎 site-wide)
  growth_012: '🛫', // Outbound sales sequences (departures)
  growth_013: '🎁', // Referral program (the reward)
}

export function processIcon(taskId: string): string {
  return PROCESS_ICONS[taskId] ?? ''
}

// ---------- Curated end-to-end playbooks (chains) ----------

export const CHAIN_ICONS: Record<string, string> = {
  'company-launch': '🚀',
  'first-hire': '🤝',
  'month-end-close': '📒',
  'get-paid': '🤑',
  'launch-website': '🌐',
}

export function chainIcon(chainId: string): string {
  return CHAIN_ICONS[chainId] ?? ''
}
