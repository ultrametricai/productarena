import type { Metadata } from 'next'
import Link from 'next/link'

// The company Privacy Policy, restored (founder 2026-10-02: "we had a better proper privacy
// notice and that seems to have got worse — bring our better one back and make sure it fits
// into our TOS"). The thorough policy below is the one the retired Astro landing site served
// at ultrametric.ai/privacy (src/pages/privacy.astro, "Last Updated: March 9, 2026"); when the
// landing was retired the /tos port kept the base Terms of Service but /privacy regressed to a
// thin notes page that linked to the base policy at... its own URL. This page brings the full
// policy back in the app/tos/page.tsx port pattern, and keeps the site-specific plain-language
// section ("This website, concretely") updated to what the code actually does today:
//   - GA4 in app/layout.tsx + PostHog (components/PostHogInit.tsx — build-time key gated,
//     manual pageviews, pageleave, session recording disabled)
//   - the pair-only compare counter and the SHA-256-hashed-IP rate-limit buckets in
//     infra/cloudflare-proxy/worker.js
//   - pa-* localStorage preferences (lib/geoPreference.ts, lib/watchlist.ts, …)
//   - WorkOS AuthKit login minting the HMAC-signed pa_session cookie, and the per-account
//     watchlist:/stack: KV records (worker.js "Auth backend" / "Watchlist API" / "My Stack API")
// Base ToS: /tos. Rankings-specific terms: /terms (which links back here).
export const metadata: Metadata = {
  title: 'Ultrametric Privacy Policy',
  description:
    'The Ultrametric privacy policy, plus exactly what this website collects: analytics, an anonymous compare-pair counter, browser-local preferences, and — if you log in — your email. No ads, nothing sold.',
  alternates: { canonical: 'https://ultrametric.ai/privacy' },
}

// Static page — pure text, no data dependency.
export const dynamic = 'force-static'

export default function PrivacyPage() {
  return (
    <article
      // Same house stand-in for `prose prose-invert` as app/tos/page.tsx (no typography plugin).
      className="mx-auto max-w-3xl leading-relaxed text-zinc-300 [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-zinc-100 [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-zinc-100 [&_p]:my-3 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:my-1 [&_strong]:font-semibold [&_strong]:text-zinc-100 [&_a]:underline [&_a]:decoration-zinc-700 [&_a:hover]:text-emerald-300 [&_address]:not-italic [&_address]:whitespace-pre-line [&_code]:text-[0.85em] [&_code]:text-zinc-400"
    >
      <h1 className="font-display text-3xl font-bold tracking-tight text-zinc-100">Ultrametric Privacy Policy</h1>
      <p className="mt-2 text-sm text-zinc-500"><strong>Last Updated:</strong> October 2, 2026</p>

      <p>
        This Privacy Policy explains how <strong>Ultrametric, Inc.</strong> (&quot;<strong>Ultrametric</strong>,&quot;
        &quot;<strong>we</strong>,&quot; &quot;<strong>us</strong>,&quot; or &quot;<strong>our</strong>&quot;) collects, uses,
        discloses, and otherwise processes information when you access or use our website, software platform, mobile
        applications (if any), APIs, and related services (collectively, the &quot;<strong>Services</strong>&quot;).
      </p>
      <p>
        If you use the Services on behalf of an organization (a &quot;<strong>Customer</strong>&quot;), your use may also be
        governed by the Customer&apos;s agreements and policies. Where we process personal information on behalf of a
        Customer as a service provider/processor, the Customer controls the purposes and means of processing.
      </p>
      <p>
        Your use of the Services is governed by the{' '}
        <Link href="/tos">Ultrametric Terms of Service</Link>; the rankings site adds its own{' '}
        <Link href="/terms">terms of use</Link> on top.
      </p>

      <hr className="my-8 border-zinc-800" />

      <h2>This website, concretely</h2>
      <p>
        The rankings site at ultrametric.ai is a static site: every reader gets the same pages, no account needed. The
        short version — we collect very little, we show no ads, and we sell none of it. The specifics below describe what
        the site&apos;s code actually does; the formal policy that follows covers the Services generally.
      </p>

      <h3>Analytics</h3>
      <p>
        We use Google Analytics 4 to understand which pages get read — standard usage data such as pages visited,
        referrer, browser, and approximate location derived from IP. Google&apos;s processing is described in{' '}
        <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google&apos;s privacy policy</a>.
        The site is also instrumented for PostHog product analytics; where a deployment enables it, it records pageviews
        and page-leave events only — <strong>session recording is disabled</strong> — and keeps its state in localStorage
        and a cookie (see <a href="https://posthog.com/privacy" target="_blank" rel="noopener noreferrer">PostHog&apos;s privacy policy</a>).
        You can block both with standard browser tooling; the site works fully without them.
      </p>

      <h3>Compare counter</h3>
      <p>
        When you open a comparison, we increment a counter for that product pair so popular comparisons can be surfaced.
        The counter stores product-pair ids and a number — no IP addresses, no user agents, no per-visit timestamps, no
        per-visitor state of any kind.
      </p>

      <h3>Preferences stored in your browser</h3>
      <p>
        Reading preferences live in your own browser&apos;s localStorage under <code>pa-</code> keys — for example{' '}
        <code>pa-geo</code> (your country pick), <code>pa-jurisdiction</code>, <code>pa-home-mode</code>, collapsed-section
        state, the logged-out ☆ watchlist (<code>pa-watchlist</code>), and the logged-out stack picker. These never leave
        your device and we cannot see them; clearing site data removes them.
      </p>

      <h3>If you log in</h3>
      <p>
        Logging in is optional and only adds features; the whole site works logged out. Login uses WorkOS AuthKit. If you
        log in, we set <code>pa_session</code> — a signed, HTTP-only, Secure cookie (30-day maximum) containing your user
        id and email address. The email is the only personal information we hold, used to show you your session and
        contact you about your account if ever needed. We do not keep WorkOS&apos;s tokens. While you are logged in, your ☆
        watchlist and your stack picks are also stored server-side (in Cloudflare Workers KV, keyed by your user id) so
        they follow you across devices — they contain product ids only. We do not sell any of this, share it with vendors
        we rank, or use it for advertising. To delete your data, email{' '}
        <a href="mailto:legal@ultrametric.ai">legal@ultrametric.ai</a>.
      </p>

      <h3>Abuse protection</h3>
      <p>
        The live-probe and product-scan endpoints are rate-limited per IP. Where a limit is enforced across servers, the
        store holds a SHA-256 hash of the IP in a per-minute bucket that expires after 120 seconds — no raw IP addresses
        at rest, and nothing persists beyond two minutes.
      </p>

      <h3>Cookies, ads, and sale of data</h3>
      <p>
        The only cookie the site itself sets is the <code>pa_session</code> cookie above, and only after you log in; the
        analytics tools set their own as described in their policies. The site shows no advertising. We do not sell
        personal information, and we do not share it for cross-context behavioral advertising. Flags and contributions
        happen in public on GitHub under GitHub&apos;s own terms and privacy policy — anything you post there is public by
        design.
      </p>

      <hr className="my-8 border-zinc-800" />

      <h2>1. Scope</h2>
      <p>This Privacy Policy applies to information we process:</p>
      <ul>
        <li>when you visit our website,</li>
        <li>when you create an account or use the Services,</li>
        <li>when you connect third-party integrations,</li>
        <li>when you communicate with us (e.g., support, sales),</li>
        <li>when you receive messages from us (including SMS, if enabled).</li>
      </ul>

      <h2>2. Information We Collect</h2>

      <h3>2.1 Information You Provide</h3>
      <p>We may collect information you provide directly, such as:</p>
      <ul>
        <li><strong>Account information</strong> (name, email, username, password, organization/workspace identifiers)</li>
        <li><strong>Profile and workspace information</strong> (role, permissions, team/department, settings)</li>
        <li><strong>Billing information</strong> (billing contact details; payment card details are typically handled by our payment processor)</li>
        <li><strong>Support and communications</strong> (messages, tickets, emails, call notes)</li>
        <li><strong>Customer Data</strong> you or your organization submits to the Services (e.g., prompts, instructions, documents, messages, files, workflow configurations)</li>
      </ul>
      <p>Customer Data may include any information that a Customer or its users uploads, inputs, transmits, or makes available through the Services.</p>

      <h3>2.2 Information From Your Organization</h3>
      <p>If you are a user of a Customer workspace, the Customer (your organization) may provide or control:</p>
      <ul>
        <li>your name, email, role, and permissions,</li>
        <li>workspace settings, connected integrations, and admin policies,</li>
        <li>content you can access and actions you can take.</li>
      </ul>

      <h3>2.3 Information From Integrations / Connected Systems</h3>
      <p>
        If you connect third-party systems (e.g., productivity tools, CRMs, ticketing systems, data sources, financial
        systems), we may process information obtained from those systems as authorized by you and your organization&apos;s
        settings, including:
      </p>
      <ul>
        <li>identifiers (user IDs, record IDs),</li>
        <li>content (tickets, emails, documents, messages),</li>
        <li>metadata (timestamps, authorship, status),</li>
        <li>configuration and permissions scopes.</li>
      </ul>
      <p>
        Customer Data may include content obtained from connected third-party systems. Customer Data may include personal
        information, and may include sensitive information if the Customer chooses to provide it or enables access to it
        via integrations.
      </p>
      <p><strong>Note:</strong> We do not control third-party systems and their data practices. Your use of integrations is also governed by third-party terms and privacy policies.</p>

      <h3>2.4 Automatically Collected Information</h3>
      <p>We may automatically collect:</p>
      <ul>
        <li><strong>Device and usage data</strong> (IP address, device type, browser, operating system, session data)</li>
        <li><strong>Log and event data</strong> (login events, feature usage, workflow runs, agent actions, API calls)</li>
        <li><strong>Approximate location</strong> (derived from IP address)</li>
        <li><strong>Cookies and similar technologies</strong> (see Section 6)</li>
      </ul>

      <h3>2.5 Mobile and SMS Data (If Applicable)</h3>
      <p>If we offer a mobile app or SMS features, we may process:</p>
      <ul>
        <li>mobile device identifiers, app version, and push notification tokens,</li>
        <li>phone number and messaging metadata (delivery status, timestamps),</li>
        <li>message content where necessary to provide the feature.</li>
      </ul>
      <p>Message and data rates may apply. You can opt out of non-required SMS as described in the applicable message flow.</p>

      <h3>2.6 Sensitive Information</h3>
      <p>Depending on how the Services are configured and used, we may process <strong>sensitive information</strong>, which can include:</p>
      <ul>
        <li><strong>government-issued identifiers</strong> (such as national identification numbers),</li>
        <li>financial account information and transaction-related data,</li>
        <li>authentication information and security credentials (in hashed/encrypted form where appropriate),</li>
        <li>information a user chooses to upload or make available that may be considered sensitive under applicable law.</li>
      </ul>
      <p>We generally recommend that Customers <strong>minimize</strong> the sensitive information provided to the Services and configure permissions and retention controls appropriately.</p>

      <h3>2.7 Health Information / HIPAA (Not Designed for PHI by Default)</h3>
      <p>The Services are <strong>not specifically designed for processing protected health information (&quot;PHI&quot;)</strong> regulated by HIPAA.</p>
      <p>Customer Data may nevertheless include health-related or other regulated information if a Customer or its users choose to upload it or make it available through integrations or connected systems.</p>
      <p>
        Customers are responsible for determining whether their use of the Services involves PHI or other regulated data
        and for configuring the Services and their data sources appropriately. If a Customer requires HIPAA-regulated use
        (including PHI processing), such use must be expressly agreed in writing and may require execution of a separate{' '}
        <strong>Business Associate Agreement (BAA)</strong>. Unless and until a BAA is in place, Ultrametric does not
        undertake obligations applicable to business associates under HIPAA with respect to PHI.
      </p>

      <h2>3. How We Use Information</h2>
      <p>We use information to:</p>
      <ul>
        <li><strong>Provide and operate</strong> the Services (including running workflows and executing agent actions you configure)</li>
        <li><strong>Secure the Services</strong> (authentication, fraud prevention, abuse detection, access controls)</li>
        <li><strong>Maintain admin and audit capabilities</strong> (activity logs, permissions management, approvals, monitoring)</li>
        <li><strong>Improve and develop</strong> the Services (product analytics, debugging, performance improvements)</li>
        <li><strong>Support and communicate</strong> with you (support, service announcements, administrative messages)</li>
        <li><strong>Process payments</strong> and manage subscriptions (if applicable)</li>
        <li><strong>Comply with law</strong> and enforce our agreements</li>
      </ul>

      <h2>4. AI, Agents, and Automated Processing</h2>
      <p>
        Ultrametric may use artificial intelligence and automated systems to generate outputs and execute actions in
        connected systems <strong>as configured by you or your organization</strong>.
      </p>
      <p>This may involve processing Customer Data and integration data to:</p>
      <ul>
        <li>generate recommendations or summaries,</li>
        <li>classify or extract information,</li>
        <li>propose or execute actions in connected tools,</li>
        <li>route tasks or automate workflows.</li>
      </ul>
      <p><strong>Important:</strong> AI outputs may be inaccurate or incomplete. Customers are responsible for configuring approvals, permissions, and safeguards, and for determining whether human review is required.</p>
      <p>
        Customers are responsible for configuring access controls, approvals, and least-privilege permissions, including
        when Customer Data contains sensitive information. Workspace administrators may control visibility and retention
        of Customer Data within the Customer&apos;s workspace.
      </p>

      <h3>4.1 Training and Improving Models</h3>
      <p>We may use information to improve the Services in multiple ways, such as improving reliability, safety, accuracy, and performance.</p>
      <p><strong>Customer Data used in the Services (including content from connected integrations) is not used to train or improve general-purpose models by default unless:</strong></p>
      <ul>
        <li>the Customer explicitly enables or opts into such use (for example, through workspace settings or an Order Form), or</li>
        <li>the data has been de-identified and/or aggregated so that it is not reasonably linked to an identifiable person or Customer, or</li>
        <li>otherwise permitted by applicable law.</li>
      </ul>
      <p>If we introduce new training options or materially change how Customer Data is used for training, we will provide notice and (where required) choices and controls.</p>

      <h2>5. How We Share Information</h2>
      <p>We may share information in the following circumstances:</p>

      <h3>5.1 Service Providers</h3>
      <p>
        We share information with vendors who help us operate the Services (e.g., hosting, analytics, customer support,
        security, payment processing). They are permitted to process information only to provide services to us.
      </p>

      <h3>5.2 Within a Customer Workspace</h3>
      <p>Information (including Customer Data and activity logs) may be visible to other users within your organization&apos;s workspace, depending on roles, permissions, and admin settings.</p>

      <h3>5.3 Integrations You Enable</h3>
      <p>When you connect third-party services, we may send and receive information with those services according to your configuration and authorization.</p>

      <h3>5.4 Legal, Safety, and Rights</h3>
      <p>We may disclose information to comply with law, respond to lawful requests, protect rights and safety, investigate fraud or security issues, or enforce our agreements.</p>

      <h3>5.5 Business Transfers</h3>
      <p>If we are involved in a merger, acquisition, financing, reorganization, bankruptcy, or sale of assets, information may be transferred as part of that transaction.</p>

      <h3>5.6 Data Processing Addendum (DPA) / Processor Role</h3>
      <p>
        When Customers use the Services, Ultrametric typically processes Customer Data on behalf of the Customer as a{' '}
        <strong>service provider/processor</strong>, and the Customer acts as the <strong>controller/business</strong> for
        such Customer Data. Customers may request a <strong>Data Processing Addendum (DPA)</strong> to address applicable
        data protection requirements (including cross-border transfer terms, where relevant). To request a DPA, contact us
        at <a href="mailto:legal@ultrametric.ai">legal@ultrametric.ai</a>.
      </p>

      <h2>6. Cookies, Analytics, and Similar Technologies</h2>
      <p>We may use cookies, SDKs, pixels, log files, and similar technologies to:</p>
      <ul>
        <li>keep you logged in,</li>
        <li>remember preferences,</li>
        <li>measure usage and performance,</li>
        <li>secure the Services,</li>
        <li>understand how users interact with the Services.</li>
      </ul>
      <p>
        We use <strong>product analytics</strong> to understand feature usage and improve the Services — on this website,
        the tools named in &quot;This website, concretely&quot; above. If we use analytics that involve cross-site tracking
        or advertising-related measurement, we will provide appropriate notices and choices where required by law.
      </p>
      <p>You can control cookies through your browser settings. If you disable cookies, some features may not work.</p>

      <h2>7. Data Retention</h2>
      <p>We retain information for as long as necessary to:</p>
      <ul>
        <li>provide the Services,</li>
        <li>meet legal and compliance obligations,</li>
        <li>resolve disputes,</li>
        <li>enforce agreements.</li>
      </ul>
      <p>Customers may be able to delete or export Customer Data through the Services. Some data (e.g., logs, billing records) may be retained for legitimate business or legal purposes.</p>

      <h2>8. Security</h2>
      <p>We use administrative, technical, and physical safeguards designed to protect information, including access controls and monitoring. However, no system can be completely secure.</p>
      <p>We use safeguards designed to protect sensitive information, such as access controls, encryption in transit, and other security measures appropriate to the risk of the data processed.</p>

      <h2>9. International Transfers</h2>
      <p>We may process and store information in the United States and other countries where we or our service providers operate. These countries may have different data protection laws than your jurisdiction.</p>

      <h2>10. Your Privacy Choices and Rights</h2>

      <h3>10.1 Account and Workspace Controls</h3>
      <p>You may be able to access, update, export, or delete certain information through the Services. Workspace admins may have additional controls.</p>

      <h3>10.2 California Privacy Rights (CPRA)</h3>
      <p>If you are a California resident, you may have rights to:</p>
      <ul>
        <li>know what personal information is collected, used, and disclosed,</li>
        <li>request deletion of certain information,</li>
        <li>correct certain information,</li>
        <li>opt out of certain &quot;sales&quot; or &quot;sharing&quot; (as defined by law).</li>
      </ul>
      <p>We do not sell personal information in the traditional sense. If we engage in &quot;sharing&quot; for cross-context behavioral advertising as defined by California law, we will provide opt-out mechanisms as required.</p>
      <p>
        To submit a request: <a href="mailto:legal@ultrametric.ai">legal@ultrametric.ai</a>
        <br />
        We may need to verify your identity and/or your authority (especially for workspace data controlled by a Customer).
      </p>

      <h3>10.3 Users in Customer Workspaces</h3>
      <p>If you use the Services through a Customer (your organization), requests relating to workspace content may need to be directed to your organization&apos;s administrator.</p>

      <h2>11. Children&apos;s Privacy</h2>
      <p>The Services are not directed to children under 13 (or under 16 where applicable), and we do not knowingly collect personal information from children.</p>

      <h2>12. Third-Party Links and Services</h2>
      <p>The Services may contain links to third-party websites or services. We are not responsible for their privacy practices.</p>

      <h2>13. Changes to This Policy</h2>
      <p>We may update this Privacy Policy from time to time. We will update the &quot;Last Updated&quot; date and may provide additional notice if changes are material.</p>

      <h2>14. Contact Us</h2>
      <p><strong>Ultrametric, Inc.</strong></p>
      <p><strong>Privacy Email:</strong> <a href="mailto:legal@ultrametric.ai">legal@ultrametric.ai</a></p>
      <address>
1 Harbor Drive, Suite 300 PMB 3786,
Sausalito CA 94965
United States
      </address>
    </article>
  )
}
