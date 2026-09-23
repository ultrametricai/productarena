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
  vc: { icon: '🦄', blurb: 'forming, closing, and running a venture fund' },
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
  form_011: '🧱', // Set up an LLC (the simpler building block)
  form_002: '🆔', // Get EIN
  form_005: '🗺️', // Register state taxes
  qs_044: '📬', // Set up mailing address
  brand_001: '💡', // Generate a company name
  brand_002: '🎨', // Generate a brand logo
  brand_003: '🌈', // Pick a brand color palette
  domain_001: '🔍', // Check domain availability
  domain_002: '🌐', // Buy a domain
  // Fundraising
  fund_001: '🌱', // Raise pre-seed (SAFEs)
  fund_002: '💼', // Close a priced equity round (the suits arrive)
  fund_003: '💲', // 409A valuation
  fund_005: '📁', // Set up a data room (the diligence folder)
  fund_004: '🎟️', // Issue stock options
  fund_006: '🔀', // Convert SAFEs at the priced round (notes become preferred stock)
  // VC fund (founder ask 2026-09-23: "a process area for VC processes")
  vc_001: '🫙', // Form a VC fund (the vehicle, stood up and ready to fill)
  vc_002: '🍾', // Close the fund (the first-and-final close)
  vc_003: '🏧', // Run the fund back office (capital calls, fees, bookings — the money machine)
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
  shutdown_001: '🚪', // Shut down the company (closing the doors)
  // Compliance
  tax_001: '💵', // File DE franchise tax
  tax_002: '🧾', // File federal tax return
  tax_003: '📮', // Issue 1099s
  ins_001: '☂️', // Get insurance quotes
  comp_001: '🛡️', // Start SOC 2 Type I
  qs_045: '🗂️', // Review state registration
  qs_047: '📆', // File state annual report (annual-filing calendar concept)
  scale_007: '🔑', // SSO & access mgmt
  scale_011: '🕵️', // Vendor security review
  comp_010: '🔒', // Publish privacy policy & DPA (privacy is 🔒 site-wide)
  comp_011: '📜', // Board minutes cadence
  comp_002: '🛡️', // Complete SOC 2 Type II (same SOC 2 concept as comp_001)
  comp_013: '🥷', // Annual penetration test (the ethical intruder)
  comp_014: '📝', // Answer a security questionnaire (the giant form)
  tax_010: '🔬', // Claim the R&D tax credit (qualified research)
  tax_011: '🛒', // Sales tax nexus & registration (tax on the cart)
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
  fin_010: '📐', // Annual budget & board approval (drawing up the plan)
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
  hr_010: '🎩', // Hire an executive (the top hat)
  hr_011: '🛂', // Sponsor a work visa (passport control)
  hr_012: '🪺', // Set up a 401(k) (the nest egg)
  hr_013: '🌏', // Hire abroad via an EOR (employment across the globe)
  // Operations
  qs_015: '🗄️', // Set up doc storage
  ops_001: '💬', // Set up team chat (canonical: Slack)
  ops_002: '🎫', // Set up a project tracker (canonical: Linear)
  ops_003: '📚', // Set up a team wiki (canonical: Notion)
  ops_004: '🏢', // Set up company email & docs (canonical: Google Workspace)
  ops_005: '🔐', // Set up a password manager (canonical: 1Password)
  scale_006: '🏗️', // Multi-team structure
  scale_012: '🎯', // Company OKRs (goals are 🎯 site-wide)
  opp_005: '📋', // Create a project in your tracker (canonical: Asana)
  opp_008: '✉️', // Draft and send an email (canonical: Gmail)
  opp_011: '📨', // Set up email routing on your domain
  vendor_010: '🔌', // Connect a vendor or MCP server
  vendor_011: '🧭', // Contextual vendor selection (navigating the market from your context)
  ops_013: '🖥️', // Set up device management (the managed fleet)
  ops_014: '🏙️', // Lease an office (the building downtown)
  // Software making
  sw_001: '🚢', // Ship a feature (ship it!)
  sw_002: '🏷️', // Cut a release (tag it)
  sw_010: '🤖', // Make the repo agent-ready
  prod_002: '🔄', // Set up CI/CD
  prod_004: '🚨', // Set up error tracking (canonical: Sentry)
  // Product
  prod_001: '☁️', // Set up cloud infrastructure (canonical: AWS)
  prod_003: '🔗', // Set up custom domain
  prod_005: '🦔', // Set up product analytics (canonical: PostHog — the hedgehog)
  prod_006: '🐙', // Set up a code hosting org (canonical: GitHub — the octopus)
  opp_009: '🎫', // Create an issue from a task (same concept as ops_002)
  scale_009: '📟', // On-call & incidents (the pager)
  scale_010: '🏭', // Data warehouse & BI (the warehouse)
  prod_010: '🧯', // Run an incident postmortem (after the fire is out)
  prod_011: '🟢', // Publish a status page & SLA (the uptime dot)
  prod_012: '📱', // Launch in the app stores
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
  growth_014: '🪙', // Roll out a pricing change (the coin flips)
  growth_015: '🪃', // Run a win-back campaign (they come back)
}

export function processIcon(taskId: string): string {
  return PROCESS_ICONS[taskId] ?? ''
}

// ---------- Curated end-to-end playbooks (chains) ----------

export const CHAIN_ICONS: Record<string, string> = {
  'name-the-company': '💡', // same concept as brand_001 (the name idea)
  'company-launch': '🚀',
  'raise-a-seed-round': '🌱', // same concept as fund_001 (the seed)
  'ship-v1': '🚢', // same concept as sw_001 (ship it)
  'launch-website': '🌐',
  'launch-on-product-hunt': '😺', // the Product Hunt cat
  'get-first-10-customers': '🧲', // pull the first customers in
  'get-paid': '🤑',
  'first-hire': '🤝',
  'month-end-close': '📒',
  'tax-season': '📆', // same concept as qs_047 (the annual-filing calendar)
  'set-up-compliance': '🛡️', // same concept as comp_001 (SOC 2 shield)
  'land-the-enterprise-deal': '🏰', // the enterprise castle, finally opened
  'go-fundraise-follow-on': '💰', // same concept as the fundraising phase
  'launch-a-vc-fund': '🦄', // same concept as the vc phase
}

export function chainIcon(chainId: string): string {
  return CHAIN_ICONS[chainId] ?? ''
}
