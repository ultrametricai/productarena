#!/usr/bin/env python3
# One-shot helper for the agentic-commerce arena (2026-09-14): appends supplemental
# claimed-docs evidence for stripe-agentic-commerce, shopify-ucp, and paypal-agent-commerce,
# distilled from the crawled corpus in pipeline/cache/crawl/agentic-commerce/ (the LLM
# extraction pass surfaced only 12-18 items per product; these excerpts target the starved
# manual stories: catalog feed publishing, machine-readable catalog search, protocol
# cart/checkout, chat-surface checkout, scoped payment credentials, agent wallets, HTTP 402
# machine payments, human approval gates, agent identity/trust tiers, merchant onboarding
# gates, order attribution + webhooks, refunds/disputes tooling, protocol openness, and
# fees). Every quoted span ("...") in an excerpt is verbatim from the named source URL's
# cache file (modulo the crawler's markdown escaping of `_*` characters — see
# .pa-tmp/verify-quotes-A.py, which checks every quote after stripping that escaping).
#
# Verified-honest absences (NO doc items added, on purpose):
#   - shopify-ucp: no crawled page documents how MERCHANTS get their products included in
#     (or excluded from) the Global Catalog — the agent-facing docs describe only the
#     consumption side. Nothing to quote.
#   - paypal-agent-commerce: only createcart/getcart of the agentic-commerce v1 cart API
#     were crawled (no updatecart page); items quote what exists.
#   - stripe-agentic-commerce: disputes/api.md and webhooks.md were crawled but are generic
#     platform docs with no agent-specific content beyond what for-sellers.md already says;
#     refunds for agent orders are covered via the machine.md features table.
#
# Run AFTER `pnpm pipeline extract --product <id>` for these products (extraction is
# monotonic and dedups by normalized excerpt, so re-running extract keeps these stable).
# Idempotent: appends by item id, skips existing, prints per-product counts.
import datetime
import json

NOW = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.000Z')

ITEMS = {
    'stripe-agentic-commerce': [
        {
            'id': 'stripe-ac-supp-chat-commerce',
            'tier': 'claimed-docs',
            'url': 'https://docs.stripe.com/agentic-commerce.md',
            'excerpt': 'Stripe\'s agentic-commerce hub is explicitly chat-native: "Buyers can browse products, get personalized recommendations, and complete purchases without leaving the conversation", and "Agents can also act on behalf of the people who use them, making purchases with a customer-controlled wallet and retrieving permissioned financial insights from connected accounts." Sellers get "Share product catalog with agents", "Enable agent to complete checkout", and "Receive payment credentials from agents" over UCP or ACP, or "monetize your API or service using machine payments" over MPP/x402, while agent builders can "Embed checkout flows in chats or advertisements". The agents-as-intermediaries side ("They present product feeds, manage carts and checkout, and accept payments") is gated: "This feature is in private preview."',
            'fetchedAt': NOW,
        },
        {
            'id': 'stripe-ac-supp-seller-catalog-feed',
            'tier': 'claimed-docs',
            'url': 'https://docs.stripe.com/agentic-commerce/for-sellers.md',
            'excerpt': 'Merchant onboarding is Dashboard self-serve — "Use Agentic Commerce Suite (ACS) to start selling through agents with a single integration", "choose to onboard as a seller", then per-agent consent: "Find the agent you want to sell through and review its terms" and "We send the agent an approval request that the agent must accept" ("ACS is available in the US, Canada, and select European countries", 34 country codes listed). Catalog publishing is a CSV feed ("Format your feed as a CSV where each row is a product or variant") uploaded via the v2 Product Catalog Import API to a presigned URL ("The maximum file size is 4 GB"); cadence is product data "Once per day" and, for inventory/pricing, "in most cases, uploading inventory and pricing data every 15 minutes is enough". Deletion semantics are explicit ("In replace mode, any product not included in the uploaded file is permanently deleted from Stripe’s catalog"), indexing completes via v2.commerce.product_catalog.imports succeeded / succeeded_with_errors / failed webhooks with a per-row error CSV, and restricted keys need Product Catalog Imports write permission ("Without this permission, API requests return a `403` error").',
            'fetchedAt': NOW,
        },
        {
            'id': 'stripe-ac-supp-order-attribution',
            'tier': 'claimed-docs',
            'url': 'https://docs.stripe.com/agentic-commerce/for-sellers.md',
            'excerpt': 'Agent orders flow through standard Stripe rails with per-agent attribution: "Stripe sends `checkout.session.completed` after the agent completes an order. Each order generates a unique `checkout.session.completed` event." In the Dashboard, orders appear on the Transactions page "where they’re tagged with the originating agent" and "You can also filter transactions by agent names." The field reference exposes `CheckoutSessions.PaymentIntent.agent_details` (Private preview), and sellers can batch — "Instead of fulfilling each order individually, bulk fulfill orders" via the List CheckoutSessions endpoint.',
            'fetchedAt': NOW,
        },
        {
            'id': 'stripe-ac-supp-acp-custom-checkout',
            'tier': 'claimed-docs',
            'url': 'https://docs.stripe.com/agentic-commerce/for-sellers/custom.md',
            'excerpt': 'The ACP-style custom integration has sellers "implement a reverse API that defines the requests Stripe sends to your commerce backend and the response shapes your backend returns" — "When an agent routes a checkout request through Stripe, Stripe calls these endpoints on your behalf." Checkout create/update/confirm hooks move a session through the documented statuses "incomplete | ready_for_payment | requires_escalation | processing | completed | canceled"; on confirm the seller receives a shared payment token — a "scoped grant of the customer’s payment method from the agent to your" Stripe profile "with specific usage and expiration limits" — and resolves it into credentials whose type "is either `agentic_token` or `dpan`". "In collaboration with the card networks, Stripe might use tokens issued through network programs such as Mastercard’s Agent Pay and Visa’s Intelligent Commerce programs on your behalf." Geography and access are gated: "Agentic Commerce Suite (ACS) is available in the US." and onboarding the endpoint requires the waitlist.',
            'fetchedAt': NOW,
        },
        {
            'id': 'stripe-ac-supp-embedded-checkout-oca',
            'tier': 'claimed-docs',
            'url': 'https://docs.stripe.com/agentic-commerce/for-agents.md?agent-checkout-mode=full',
            'excerpt': 'For agent builders, the embedded mode manages "the full checkout lifecycle through Stripe, including product feed ingestion, cart management, fulfillment, and payment collection" — "Stripe handles routing, authentication, error retries, and shared payment token (SPT) creation so you don’t need to integrate directly with each seller", and after confirm "Stripe routes the token to the seller for payment processing, so you don’t need to manage the token’s lifecycle" (completion signalled by the `delegated_checkout.requested_session.completed` webhook). Access is agreement-gated: "An OCA is a required connection between your agent and a seller that enables agentic commerce flows. Only a seller can initiate an OCA request", "After both parties confirm the OCA, it authorizes data access between your agent and the seller", and "Either party can terminate an OCA at any time." Caveats are explicit: "Agentic Commerce Suite is private preview and is available in the US, Canada, and select European countries. It supports purchases of physical goods", and embedding agents "might be considered marketplace facilitators (MPFs) with tax collection and remittance obligations."',
            'fetchedAt': NOW,
        },
        {
            'id': 'stripe-ac-supp-spt-limits',
            'tier': 'claimed-docs',
            'url': 'https://docs.stripe.com/agentic-commerce/concepts/shared-payment-tokens.md?agent-seller=agent',
            'excerpt': '"Shared payment tokens (SPTs) grant sellers scoped access to customers’ payment methods for agent-initiated purchases." The issuing agent must "Set usage limits, including currency, maximum amount, and expiration window" (usage_limits currency / max_amount / expires_at in the create call), and can "Revoke the SPT at any time to prevent the seller from using it to create a payment" — "Sellers can’t create a payment with a revoked SPT." "An SPT functions as a state machine" across active / requires_action / deactivated, with webhooks for each transition (for `shared_payment.issued_token.used`: "You receive this event when the seller uses the SPT").',
            'fetchedAt': NOW,
        },
        {
            'id': 'stripe-ac-supp-machine-payments',
            'tier': 'claimed-docs',
            'url': 'https://docs.stripe.com/payments/machine.md',
            'excerpt': '"Machine payments let agents pay for APIs and services programmatically. Your server returns a payment challenge, the agent presents a valid payment credential, and Stripe settles the payment to your Stripe balance." Minimums are documented per rail: for card payments through SPTs "the minimum amount is 0.50 USD", for stablecoins "the minimum amount is 0.01" USDC — across MPP on Tempo (USDC.e) and Solana (USDC) and x402 on Base (USDC) — and "Stablecoin payments are available to businesses in all US states, except New York." Settlement stays on-platform: "Payments land directly in your Stripe balance and settle in fiat. Metrics, reporting, and multi-currency payouts work the same as any other payment in Stripe", with refunds available through the standard Refunds API and Dashboard per the features table.',
            'fetchedAt': NOW,
        },
        {
            'id': 'stripe-ac-supp-mpp-agent-build',
            'tier': 'claimed-docs',
            'url': 'https://docs.stripe.com/payments/machine/mpp.md',
            'excerpt': 'MPP "is an open protocol that lets agents pay for your APIs and services programmatically without a checkout UI, co-authored by Stripe and Tempo": on an unpaid request "your server returns an HTTP `402` response with payment details", then "The agent authorizes the payment, retries the request, and gets access to the paid resource along with a receipt." The docs ship a one-prompt agent build path ("Read https://docs.stripe.com/payments/machine/mpp.md?lang=node, and monetize my API using MPP to charge 0.50 USD per API call") and a conformance CLI: "Run `mppx validate` to automatically verify your implementation end-to-end. The command tests discovery, challenge formats, error handling, and the full payment flow." Agents test-pay with `npx @stripe/link-cli mpp pay` or the Tempo CLI.',
            'fetchedAt': NOW,
        },
        {
            'id': 'stripe-ac-supp-link-wallet',
            'tier': 'claimed-docs',
            'url': 'https://docs.stripe.com/agentic-commerce/link-cli.md',
            'excerpt': '"Link CLI gives your agent access to a wallet that your customer controls. Your agent can retrieve one-time-use payment credentials to complete purchases, and retrieve permissioned financial data to answer questions about spending, balances, and trends." Every spend is human-gated: "Customers approve each request on the Link website or in the mobile app. Agent payments support one-time-use virtual cards and shared payment tokens." Wallet guides cover "Search products and complete payments with UCP" and how to "pay merchants that accept machine payments over HTTP 402", and the tool is agent-legible: "Your agent can inspect the full CLI documentation with `link-cli --llms-full`".',
            'fetchedAt': NOW,
        },
        {
            'id': 'stripe-ac-supp-mcp-approval',
            'tier': 'claimed-docs',
            'url': 'https://docs.stripe.com/mcp.md',
            'excerpt': 'Dashboard-side agent actions carry a documented human approval gate: "To prevent agents from making mistakes, Stripe requires human confirmation before it takes certain `stripe_api_write` actions, such as refunds and outbound payments." The human reviews an approval URL; "When you click Approve, Stripe provides the agent with an approval token, but you need to tell the agent to retry the operation", and "If you don’t approve the action within 24 hours, it expires."',
            'fetchedAt': NOW,
        },
        {
            'id': 'stripe-ac-supp-acp-openness',
            'tier': 'claimed-docs',
            'url': 'https://www.agenticcommerce.dev/',
            'excerpt': '"ACP is open source and community-designed under the Apache 2.0 license. Businesses can implement the specification to transact with any AI agent or payment processor." Steering is disclosed on the site itself: "Stripe and OpenAI developed the Agentic Commerce Protocol to define a common language for how agents and businesses transact", "OpenAI is the first AI platform to implement ACP with ChatGPT", Stripe is "the first compatible PSP with its Shared Payment Token", and the contributor contact routes to acp@stripe.com. Listing is not automatic: "If your business wants to participate in ChatGPT, you\'ll need to apply."',
            'fetchedAt': NOW,
        },
        {
            'id': 'stripe-ac-supp-pricing',
            'tier': 'claimed-docs',
            'url': 'https://stripe.com/pricing',
            'excerpt': 'stripe.com/pricing publishes the flat rates that agent-driven orders inherit, with no separate agentic-channel fee schedule disclosed: Standard is "2.9% + 30¢" "per successful transaction for domestic cards" — "No setup fees, monthly fees, or hidden fees." — with published adders of "+ 0.5%" for manually entered cards, "+ 1.5%" "for international cards", and "+ 1%" for currency conversion.',
            'fetchedAt': NOW,
        },
    ],
    'shopify-ucp': [
        {
            'id': 'shopify-ucp-supp-ucp-journey',
            'tier': 'claimed-docs',
            'url': 'https://shopify.dev/docs/agents.md',
            'excerpt': 'Shopify\'s agent surface is UCP end to end via "Shopify\'s UCP-compliant MCP servers": the UCP CLI "provides structured commands to search the Catalog, build carts, create checkouts, hand off buyers, and track orders" (install with `npm install -g @shopify/ucp-cli` plus the AI Toolkit plugin, e.g. `claude plugin install shopify-ai-toolkit@claude-plugins-official`). The four-stage journey is explicit — discovery ("Search across hundreds of millions of Shopify listings"), carts/checkout ("Build carts, convert them to checkouts, and hand off to the merchant for payment", though "Trusted agents can complete checkouts directly"), and orders ("Receive order webhooks and fetch fresh order state on demand"). A cross-merchant wallet-of-goods is waitlisted: "One Cart, every brand. The Universal Cart API lets AI agents collect items from any merchant, on or off Shopify, into a single, unified cart, all via UCP."',
            'fetchedAt': NOW,
        },
        {
            'id': 'shopify-ucp-supp-global-catalog',
            'tier': 'claimed-docs',
            'url': 'https://shopify.dev/docs/agents/catalog/global-catalog.md',
            'excerpt': '"The Global Catalog MCP server enables AI agents to search and discover products across the entire Shopify ecosystem, helping buyers find products from multiple merchants." Tools at catalog.shopify.com/api/ucp/mcp conform to the UCP catalog spec: search_catalog "supports a text query, an image, or a set of product IDs to find similar items" and "Results are clustered by Universal Product ID (UPID) and include offers from multiple merchants"; lookup_catalog resolves known IDs and product URLs; get_product narrows variants with availability signals. Access requires identity — "Every request must include a `meta.ucp-agent.profile` URL pointing to your agent\'s UCP profile" — and machine-usable filters cover price in minor units, ships_to / ships_from, condition, rating, price_tier and taxonomy attributes, with cursor pagination ("You can paginate up to 1,000 results").',
            'fetchedAt': NOW,
        },
        {
            'id': 'shopify-ucp-supp-storefront-catalog',
            'tier': 'claimed-docs',
            'url': 'https://shopify.dev/docs/agents/catalog/storefront-catalog.md',
            'excerpt': '"The Storefront Catalog MCP server enables AI agents to search and discover products from a single merchant\'s catalog, helping buyers find and purchase products from that store" — the same UCP catalog tools served per-merchant at the shop\'s own /api/ucp/mcp endpoint. Agents introspect each shop\'s contract at runtime: "Use `--input-schema` against any of these commands to fetch the merchant\'s live input schema before composing a payload." Search responses include a UCP metadata envelope and "products with title, description, price range (minor units), media, and variants".',
            'fetchedAt': NOW,
        },
        {
            'id': 'shopify-ucp-supp-cart-mcp',
            'tier': 'claimed-docs',
            'url': 'https://shopify.dev/docs/agents/carts-and-checkout/cart-mcp.md',
            'excerpt': '"Cart tools accept unauthenticated requests, which lets you estimate totals and share a cart with the buyer before collecting credentials" — create_cart / get_cart / update_cart / cancel_cart run as JSON-RPC against the merchant\'s /api/ucp/mcp endpoint, and by design "Carts have a long TTL." while "Checkouts are short-lived." Each cart returns estimated totals plus a continue_url "that the buyer can use to pick up the cart on the merchant\'s storefront", and carts carry agent attribution ("Supported fields include `referring_domain`, `click_id_tag`, `click_id_value`, `activity_id_tag`, `activity_id_value`, `utm_campaign`, `utm_source`, `utm_medium`, `utm_content`, and `utm_term`"); cancel_cart additionally requires an idempotency-key UUID "for retry safety".',
            'fetchedAt': NOW,
        },
        {
            'id': 'shopify-ucp-supp-checkout-mcp',
            'tier': 'claimed-docs',
            'url': 'https://shopify.dev/docs/agents/carts-and-checkout/checkout-mcp.md',
            'excerpt': '"Checkout tools manage a purchase session once the buyer is ready to buy. All requests require authentication or a signed request." Tokens are minted from Dev Dashboard client credentials at api.shopify.com/auth/access_token ("JWT tokens created from Dev Dashboard credentials have a 60-minute TTL"). create_checkout converts carts — with cart_id, "the server loads the referenced cart and inherits its `line_items`, `context`, `buyer`, and associated attribution metadata" — and complete_checkout is the purchase commit ("Submit payment and place the order."), to be called only when "Checkout status is `ready_for_complete`", the "Buyer has reviewed and confirmed the order", and the "Payment credential has been collected"; the documented create_checkout response advertises negotiated payment_handlers such as com.google.pay.',
            'fetchedAt': NOW,
        },
        {
            'id': 'shopify-ucp-supp-buyer-handoff',
            'tier': 'claimed-docs',
            'url': 'https://shopify.dev/docs/agents/carts-and-checkout/checkout-mcp.md',
            'excerpt': 'Buyer handoff is a first-class state: "Build for escalations regardless of how you authenticate." A checkout in requires_escalation means "Checkout requires buyer input or review not available via API" — messages carry severity requires_buyer_input "(merchant needs input not available via API)" or requires_buyer_review — and the agent must "hand off to the buyer via `continue_url`" to the merchant\'s own checkout. The CLI automates the gate: "Set `UCP_ON_ESCALATION` before completing a checkout to open the merchant\'s `continue_url` in the buyer\'s browser automatically."',
            'fetchedAt': NOW,
        },
        {
            'id': 'shopify-ucp-supp-trust-tiers',
            'tier': 'claimed-docs',
            'url': 'https://shopify.dev/docs/agents/profiles/auth-and-rate-limiting.md',
            'excerpt': '"UCP traffic to Shopify\'s MCP servers is classified into three tiers based on how your agent identifies itself" — Token, Signed, Anonymous — and "Stronger identification means higher rate limits and access to more sensitive tools." "Rate limits scale with identification." ("The Token tier gets the highest limits, Signed gets lower limits, and Anonymous gets the lowest."), "Checkout MCP is rate-limited more strictly than Cart MCP at every tier.", and complete_checkout is Token-tier only, "When the token is granted permission to complete purchases". The Signed tier authenticates with RFC 9421 HTTP Message Signatures "using ECDSA P-256", verified "against the public key published in your agent\'s" well-known UCP profile.',
            'fetchedAt': NOW,
        },
        {
            'id': 'shopify-ucp-supp-agent-profiles',
            'tier': 'claimed-docs',
            'url': 'https://shopify.dev/docs/agents/profiles.md',
            'excerpt': 'In UCP, "a platform profile is a JSON document that describes the protocol version and capabilities the platform supports"; the business side publishes its own at the storefront origin ({shop}.myshopify.com/.well-known/ucp), which "describes that party’s protocol version, services, capabilities, payment handlers, and signing keys". "Negotiation is server-selects. The business computes the intersection of its capabilities with the platform’s and chooses the active set", and "If the profile cannot be loaded, is invalid, or yields no compatible capabilities, you get an error path instead of a successful negotiation."',
            'fetchedAt': NOW,
        },
        {
            'id': 'shopify-ucp-supp-order-mcp',
            'tier': 'claimed-docs',
            'url': 'https://shopify.dev/docs/agents/orders/order-mcp.md',
            'excerpt': '"The Order MCP server enables AI agents to fetch the current state of an order placed through their agent, including line items, fulfillment events, and post-purchase adjustments" via the single UCP tool get_order. Access is the highest trust gate: "Order MCP is available only to Token-tier agents." and "`get_order` requires a Global API JWT with the `read_global_api_orders` scope, which Signed-tier and Anonymous-tier agents can\'t obtain." Guidance: "Use webhooks as the primary update channel." and reserve get_order for buyer-initiated reads and reconciling missed webhooks.',
            'fetchedAt': NOW,
        },
        {
            'id': 'shopify-ucp-supp-order-webhooks',
            'tier': 'claimed-docs',
            'url': 'https://shopify.dev/docs/agents/orders/order-webhooks.md',
            'excerpt': '"Shopify pushes UCP-shaped order webhooks to your registered endpoint whenever an order placed through your agent has a committed change (fulfillment progress, refunds, returns, exchanges, order edits, or cancellations)." Each delivery is the full order state ("Treat the latest payload as the source of truth"), HMAC-SHA256 signed, and durable — "Failed deliveries are retried up to 8 times over 4 hours with exponential backoff." Subscription is not self-serve: "There\'s no self-serve subscription API today: your delivery URL and topic scoping are registered server-side. To set up or update an order webhook subscription, contact your Shopify partner manager." — and although the UCP spec lets agents advertise a webhook_url in their profile, "Shopify doesn\'t honor that field today."',
            'fetchedAt': NOW,
        },
        {
            'id': 'shopify-ucp-supp-ucp-governance',
            'tier': 'claimed-docs',
            'url': 'https://ucp.dev/index.md',
            'excerpt': 'ucp.dev positions the protocol as industry-governed rather than single-vendor: "UCP is built by the industry, to enable seamless agentic experiences", with a co-developer wall listing "Google Shopify Etsy Wayfair Target Walmart Amazon Microsoft Meta Salesforce Stripe" (plus lodging and food players such as Booking.com, Marriott, DoorDash and Uber Eats). Design commitments: businesses "remain the Merchant of Record, with full ownership of customer relationships"; it is built on "REST and JSON-RPC transports" with AP2, A2A, and MCP support; payments ride "secure payment (AP2) via payment mandates and verifiable credentials"; and "The complete technical specification, documentation, and reference implementations are hosted in our public GitHub repository."',
            'fetchedAt': NOW,
        },
    ],
    'paypal-agent-commerce': [
        {
            'id': 'paypal-ac-supp-agent-ready',
            'tier': 'claimed-docs',
            'url': 'https://developer.paypal.com/agent-ready/overview',
            'excerpt': '"Agent Ready helps Braintree merchants accept payments from AI shopping assistants across major platforms, including ChatGPT, Google AI Mode, and Gemini, without building separate integrations for each." Two protocol paths are supported: ACP for "ChatGPT, OpenAI" via "Delegated payment tokens through Braintree", and UCP for "Google AI Mode, Gemini" via the "Google Pay payment handler through Braintree". Both explicitly assume the merchant can "Leverage your existing Braintree merchant account and processing relationship" — the gate is Braintree, not a plain PayPal account.',
            'fetchedAt': NOW,
        },
        {
            'id': 'paypal-ac-supp-acs-gate',
            'tier': 'claimed-docs',
            'url': 'https://developer.paypal.com/agentic-commerce-services/about',
            'excerpt': 'Access to PayPal\'s agentic commerce services is form-gated, not self-serve: merchants must complete a form "to contact the AI team at PayPal and request access. The PayPal AI team will follow up after your form submission to guide you through onboarding." The pitch is "Connect once to reach many platforms", with catalog on-ramps through partners ("Connect your product listings to PayPal\'s partners like Wix, Cymbio, Commerce (BigCommerce & Feedonomics), and Shopware") and a merchant-control promise: with Store Sync "you stay in charge of your business. You control your brand appearance and customer communications for all AI-powered transactions".',
            'fetchedAt': NOW,
        },
        {
            'id': 'paypal-ac-supp-acp-chatgpt',
            'tier': 'claimed-docs',
            'url': 'https://developer.paypal.com/agent-ready/agentic-commerce-protocol',
            'excerpt': 'The ACP path is an in-ChatGPT checkout build: "Implement an MCP server with the `complete_checkout` tool to receive tokens", "Call `requestCheckout()` from the app to trigger Instant Checkout", "Follow the ACP agentic checkout specification to manage checkout sessions", and "Specify `braintree` as your payment provider." The delegated credential "is a one-time-use token that you can process using your existing Braintree integration" — a Braintree payment method nonce that "serves as a secure, single-use reference to the buyer\'s payment information" and is "bound to your merchant ID and includes amount and time restrictions that you can configure."',
            'fetchedAt': NOW,
        },
        {
            'id': 'paypal-ac-supp-ucp-googlepay',
            'tier': 'claimed-docs',
            'url': 'https://developer.paypal.com/agent-ready/universal-commerce-protocol',
            'excerpt': 'The UCP path targets Google surfaces: "This enables AI-powered checkout experiences through Google AI Mode (Gemini), where Google Pay returns a tokenized credential that Braintree can process, and your server uses it to process the payment." Tokenization moves off the client — "With UCP, Google shifts this to the server side" and "Google includes it in checkout-complete payload" — so when Google calls the merchant\'s /checkout-session/{id}/complete endpoint, "the payment payload includes the Braintree single-use token in the `credential.token` field". Enablement is Google-gated: "UCP merchant registration with Google. Contact Google for enablement."',
            'fetchedAt': NOW,
        },
        {
            'id': 'paypal-ac-supp-store-sync',
            'tier': 'claimed-docs',
            'url': 'https://developer.paypal.com/store-sync/overview',
            'excerpt': 'Store Sync is the full-catalog path, "enabling AI agents to discover your products, create and manage shopping carts, and complete purchases on behalf of customers through conversational interfaces", while "Your existing order management system receives the order just as it would from any other channel." Scope is narrow today: "Store Sync currently supports merchants who are selling physical goods to US-based customers in USD. It does not support digital goods, subscription products, or sales to customers who are outside the US at this time." Eligibility requires an existing PayPal merchant account with an Orders v2 integration or Braintree "with a compatible setup", plus the same form-gated access approval.',
            'fetchedAt': NOW,
        },
        {
            'id': 'paypal-ac-supp-create-catalog',
            'tier': 'claimed-docs',
            'url': 'https://developer.paypal.com/store-sync/create-catalog',
            'excerpt': 'Catalog publishing is feed-file based: "PayPal supports 3 feed specifications", including the Google Product Feed ("you can reuse it to power both traditional and AI-driven discovery with minimal extra work") and the "OpenAI ACP Product Feed", delivered as CSV/TSV/PSV where "each row in your feed represents a single product variant" and "Your feed file must not exceed 4 GB." Required Google-spec fields include id, title, link, image_link, description ("minimum 25 characters"), price, and availability; beyond the access gate, "access approval is the only prerequisite."',
            'fetchedAt': NOW,
        },
        {
            'id': 'paypal-ac-supp-cart-reverse-api',
            'tier': 'claimed-docs',
            'url': 'https://developer.paypal.com/api/agentic-commerce/v1/createcart',
            'excerpt': 'Cart execution is a reverse API the merchant hosts: POST /merchant-cart "Creates a new cart with the provided PayPalCart object. This is called by PayPal Shopping Cart when an AI agent or customer initiates a checkout process", returning "201 Created: Cart created successfully with payment token in payment_method" or 200 plus validation_issues ("Business logic issues that need resolution"). Authentication is PayPal-issued, not merchant-issued: "These JWT tokens are issued and managed by PayPal, not generated by merchants", and the merchant must "Verify token signature using PayPal\'s public keys".',
            'fetchedAt': NOW,
        },
        {
            'id': 'paypal-ac-supp-getcart',
            'tier': 'claimed-docs',
            'url': 'https://developer.paypal.com/api/agentic-commerce/v1/getcart',
            'excerpt': 'The companion read endpoint keeps agent-side cart state fresh: get cart "Retrieves the current state of a cart. Used by PayPal Shopping Cart to check cart status, validation issues, and current totals." Together with create cart, this is the crawled surface of PayPal\'s agentic-commerce v1 cart API — PayPal\'s Shopping Cart service, not the AI agent directly, calls the merchant\'s endpoints.',
            'fetchedAt': NOW,
        },
        {
            'id': 'paypal-ac-supp-agent-toolkit',
            'tier': 'claimed-docs',
            'url': 'https://developer.paypal.com/ai-tools/toolkit',
            'excerpt': '"PayPal\'s agent toolkit supports the integration of PayPal APIs into AI agent workflows using" Amazon Bedrock, CrewAI, LangChain, MCP, OpenAI\'s Agents SDK, and Vercel\'s AI SDK, in TypeScript and Python. Coverage: "Integrate with PayPal APIs to access orders, invoices, subscriptions, shipment tracking, transaction details, and dispute management through pre-built functions." The docs\' own operating guidance keeps a human in the loop: "Keep human oversight in areas where personal judgment matters most, while letting AI handle repetitive tasks."',
            'fetchedAt': NOW,
        },
        {
            'id': 'paypal-ac-supp-refund-dispute-tools',
            'tier': 'claimed-docs',
            'url': 'https://developer.paypal.com/ai-tools/agent-tools',
            'excerpt': 'Post-purchase operations are first-class agent tools: refunds via create_refund / get_refund (a "refund for a captured payment", where "If not specified, a refund is for the full amount of the purchase"), disputes via list_disputes ("Retrieve a summary of all disputes with optional filtering"), get_dispute, and accept_dispute_claim ("Accept a dispute claim, resolving it in favor of the buyer."), and orders via create_order ("Create an order in the PayPal system based on the provided details."), pay_order, and create_shipment. Catalog-management tools (create_product, list_product, show_product_details) let agents write to the PayPal product catalog itself.',
            'fetchedAt': NOW,
        },
        {
            'id': 'paypal-ac-supp-webhooks',
            'tier': 'claimed-docs',
            'url': 'https://developer.paypal.com/api/webhooks/overview',
            'excerpt': '"Webhooks are HTTPS posts from PayPal to an endpoint on your server whenever the corresponding event type occurs" — "Up to 10 webhook URLs may be subscribed per app", each scoped to specific event types or all of them. Delivery is durable: "Any non-2xx status code will cause PayPal to reattempt delivery up to 25 times over the course of 3 days or until it receives a 2xx success code." Authenticity checks are documented ("Post the message, stored webhook ID, and header information back to PayPal\'s verify signature endpoint"), and the warning is explicit: "If you do not verify a message, you will not have a way to validate that its sender was in fact PayPal."',
            'fetchedAt': NOW,
        },
        {
            'id': 'paypal-ac-supp-fees',
            'tier': 'claimed-docs',
            'url': 'https://www.paypal.com/us/business/paypal-business-fees',
            'excerpt': 'The published US commercial rates that agent-initiated orders inherit: "PayPal Checkout" and "PayPal Guest Checkout" at "3.49% +" fixed fee, "Standard Credit and Debit Card Payments" at "2.99% +" fixed fee, "QR code Transactions" at "2.29% +" fixed fee, and "PayPal Pay Later options" at "4.99% +" fixed fee, with an additional percentage-based fee for international commercial transactions. No separate agentic/AI-channel fee schedule is published on the page.',
            'fetchedAt': NOW,
        },
    ],
}


def main():
    for product, items in ITEMS.items():
        path = f'data/agentic-commerce/evidence/{product}.json'
        ev = json.load(open(path))
        have = {e['id'] for e in ev}
        added = 0
        for item in items:
            if item['id'] not in have:
                ev.append(item)
                added += 1
        with open(path, 'w') as f:
            json.dump(ev, f, indent=2, ensure_ascii=False)
            f.write('\n')
        print(f'{product}: +{added} supplemental claimed-docs items ({len(ev)} total)')


if __name__ == '__main__':
    main()
