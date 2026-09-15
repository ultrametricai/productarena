#!/usr/bin/env python3
# One-shot helper for the agentic-commerce arena (2026-09-14): appends supplemental
# claimed-docs evidence for visa-intelligent-commerce, coinbase-x402, crossmint, and
# skyfire, distilled from the crawled corpus in pipeline/cache/crawl/agentic-commerce/
# (the LLM extraction pass surfaced only 11-19 items per product; these excerpts target
# the starved stories: scoped credentials, agent wallets, human approval, agent identity,
# spend caps/revocation, 402/stablecoin settlement, discovery, merchant onboarding,
# refunds/disputes, fees, and protocol governance). Every quoted span ("...") is verbatim
# from the named source URL's cache file. Idempotent: appends by item id, skips existing.
import datetime
import json

NOW = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.000Z')

ITEMS = {
    'visa-intelligent-commerce': [
        {
            'id': 'visa-ic-supp-1',
            'tier': 'claimed-docs',
            'url': 'https://developer.visa.com/capabilities/visa-intelligent-commerce',
            'excerpt': 'Agent-scoped credentials are the core primitive: "Provisioning and life cycle management of agent-specific payment tokens that can be used by agents to make secure transactions on behalf of the user" — "A new pass-through payment token, specific to agents, that is intended for use at Visa-accepting merchant locations." The page carries a maturity caveat, verbatim: "This product is in the process of development and deployment."',
            'fetchedAt': NOW,
        },
        {
            'id': 'visa-ic-supp-2',
            'tier': 'claimed-docs',
            'url': 'https://developer.visa.com/capabilities/visa-intelligent-commerce',
            'excerpt': 'Human approval is passkey-anchored end to end: provisioning includes "step up verification of the cardholder as well as setting up a Passkey that will be used by the agent to authenticate future instructions"; before spending, "The agent requests the user to authenticate the Payment Instruction using their Passkey and provides that instruction to the Visa Intelligent Commerce platform." Credential requests are then checked against that consent — "The Visa Intelligent Commerce platform will validate that these requests match the authenticated user instruction and set network level controls." — and at authorization time, "When authorization requests are received by VisaNet, controls will be enforce to ensure that the request originates from the intended merchant for the correct amount." (typo in original).',
            'fetchedAt': NOW,
        },
        {
            'id': 'visa-ic-supp-3',
            'tier': 'claimed-docs',
            'url': 'https://developer.visaacceptance.com/docs/vas/en-us/intelligent-commerce/developer/all/rest/intelligent-commerce/intelligent-commerce-purchase-initiate-intro.html',
            'excerpt': 'Spend caps live in the purchase-intent mandate: Initiate a Purchase Intent (POST /acp/v1/instructions) exists "to verify that your agent is acting in accordance with the customer\'s intent", with required mandates fields declineThreshold (amount, currencyCode), effectiveUntilTime, mandateId, and description — the sample mandate sets a 10000.00 USD decline threshold and a consumerPrompt of "Authorize payment to Best Buy". Revocation is a documented follow-on: "Your agent can cancel a purchase intent when the customer chooses to not make the purchase."',
            'fetchedAt': NOW,
        },
        {
            'id': 'visa-ic-supp-4',
            'tier': 'claimed-docs',
            'url': 'https://developer.visaacceptance.com/docs/vas/en-us/intelligent-commerce/developer/all/rest/intelligent-commerce/intelligent-commerce-enroll-card-intro.html',
            'excerpt': '"Your agents can enroll a customer\'s card for tokenization during the customer\'s account registration or when the customer begins a new purchase intent" via POST /acp/v1/tokens (https://api.visaacceptance.com production, https://apitest.visaacceptance.com test); a required field is paymentInformation.instrumentIdentifier.id (prerequisite page: "Create an Instrument Identifier Token"). Enrollment returns PENDING and "the customer is immediately prompted to verify their identity in order to activate the enrolled card" — the documented step-up rail includes "Create a One-Time Password for Tokenized Card Authentication" and passkey setup.',
            'fetchedAt': NOW,
        },
        {
            'id': 'visa-ic-supp-5',
            'tier': 'claimed-docs',
            'url': 'https://developer.visaacceptance.com/docs/vas/en-us/intelligent-commerce/developer/all/rest/intelligent-commerce/intelligent-commerce-retrieve-credentials-intro.html',
            'excerpt': 'Credentials are scoped to an authenticated instruction: retrieval is POST /acp/v1/instructions/{instructionID}/credentials, and the request must declare where and for how much the credential will be used — required fields include "merchantInformation.merchantName", the merchant descriptor URL, and "orderInformation.amountDetail.totalAmount"; optional product-policy fields ("policies.refundPolicy", "policies.disputePolicy", cancellation/shipping policies) attach merchant terms to the credential request. "During checkout, your agents display a list of the customer\'s tokenized cards."',
            'fetchedAt': NOW,
        },
        {
            'id': 'visa-ic-supp-6',
            'tier': 'claimed-docs',
            'url': 'https://developer.visa.com/capabilities/trusted-agent-protocol/trusted-agent-protocol-specifications',
            'excerpt': 'The Trusted Agent Protocol\'s agent recognition signature is HTTP Message Signatures "defined by RCF 9421" (typo in original), "aligned with web-bot-auth", and "offers a secure, standardized, and verifiable way to ensure the legitimacy of clients (bots, agents, or any automated traffic) and the integrity of their requests". Signatures carry a tag of "agent-browser-auth" or "agent-payer-auth" per interaction; "Agents include timestamps (created, expires) and nonces in the signature. Servers are able to reject reused or expired signatures, thereby preventing replay attacks." — timestamps "should not be more than 8 minutes apart" — and merchants verify against Visa\'s public keys at https://mcp.visa.com/.well-known/jwks.',
            'fetchedAt': NOW,
        },
        {
            'id': 'visa-ic-supp-7',
            'tier': 'claimed-docs',
            'url': 'https://developer.visa.com/capabilities/trusted-agent-protocol/trusted-agent-protocol-specifications',
            'excerpt': 'TAP\'s signed Agentic Payment Container adapts to the merchant\'s rail: for guest-checkout key entry it carries a credential hash — "If the hashes do not match, the information being key entered is most likely fraudulent and the Merchant should decline the transaction." For network-token merchants, "The payload is encrypted using the Merchant\'s public key". And when a merchant requests payment with an HTTP 402 response code, "a payment IOU will be present"; after verifying it, "the Merchant can grant access with the expectation that the funds will be available when settlement occurs."',
            'fetchedAt': NOW,
        },
        {
            'id': 'visa-ic-supp-8',
            'tier': 'claimed-docs',
            'url': 'https://developer.visa.com/capabilities/visa-intelligent-commerce',
            'excerpt': 'Fees, verbatim from FEES & TERMS: "Free to use in Sandbox. Contact Visa for fees in Production." On refunds/disputes the docs stop at evidence capture, not a dispute API: "Collection of commerce signals that will provide the user’s original instruction and the details of each authorized purchase allow for the quick resolution of most disputes" and "These signals, along with the user instructions can be used to resolve any disputes that may arise."',
            'fetchedAt': NOW,
        },
        {
            'id': 'visa-ic-supp-9',
            'tier': 'claimed-docs',
            'url': 'https://github.com/visa/trusted-agent-protocol',
            'excerpt': 'The TAP spec is public with a runnable reference implementation: "Establishing a universal standard of trust between AI agents and merchants for the next phase of agentic commerce." The repo ships a complete sample ecosystem — tap-agent, merchant-frontend, cdn-proxy (RFC 9421 verification), merchant-backend, and agent-registry — so merchants can "Instantly distinguish a legitimate, credentialed agent from an anonymous bot" and confirm the agent "Is it acting on behalf of a specific, authenticated user?"',
            'fetchedAt': NOW,
        },
        {
            'id': 'visa-ic-supp-10',
            'tier': 'claimed-docs',
            'url': 'https://developer.visaacceptance.com/hello-world/agentic-sandbox.html',
            'excerpt': 'Merchant-side onboarding starts with a self-serve "Intelligent Commerce Sandbox Sign up" form (Organization ID, company, contact details, terms acceptance) on the Visa Acceptance developer portal: "After completing the evaluation registration process, you will be able to send test transactions" — account instructions arrive by email for the Test Enterprise Business Center.',
            'fetchedAt': NOW,
        },
    ],
    'coinbase-x402': [
        {
            'id': 'coinbase-x402-supp-1',
            'tier': 'claimed-docs',
            'url': 'https://docs.cdp.coinbase.com/x402/how-it-works.md',
            'excerpt': '"x402 is an open standard for adding per-request payments to HTTP, so APIs and services can charge without checkout pages, subscriptions, or separate billing integrations." In the documented nine-step flow the server quotes the price in a payment-required response, "The client signs a payment and sends the request again with proof of payment attached", the server has the CDP Facilitator verify it, performs the work, then "asks the facilitator to settle the payment" before returning the resource with confirmation.',
            'fetchedAt': NOW,
        },
        {
            'id': 'coinbase-x402-supp-2',
            'tier': 'claimed-docs',
            'url': 'https://docs.cdp.coinbase.com/x402/how-it-works.md',
            'excerpt': 'The handshake is rail-flexible by design: "USDC is the most common asset, but sellers can accept any ERC-20 token on EVM networks or SPL token on Solana", and pricing models span the three schemes — "Sellers can charge a fixed price, authorize a maximum and settle only what was used, or defer settlement for a batch of payments." "The same handshake works across chains, including EVM networks and Solana."',
            'fetchedAt': NOW,
        },
        {
            'id': 'coinbase-x402-supp-3',
            'tier': 'claimed-docs',
            'url': 'https://docs.cdp.coinbase.com/x402/seller/facilitator.md',
            'excerpt': 'The hosted CDP Facilitator "validates signed payments, screens transactions, submits settlement onchain, and reports the result to your resource server", with compliance built in: "OFAC and Know Your Transaction (KYT) checks identify and decline payments involving sanctioned or high-risk addresses." The x402 v2 support table lists exact, upto, and batch-settlement on Base ("eip155:8453"), Base Sepolia, Polygon, Arbitrum, and World, with Solana supporting exact and upto; it "supports all ERC-20 tokens on its EVM networks through EIP-3009 or Permit2, and SPL tokens on Solana".',
            'fetchedAt': NOW,
        },
        {
            'id': 'coinbase-x402-supp-4',
            'tier': 'claimed-docs',
            'url': 'https://docs.cdp.coinbase.com/x402/seller/facilitator.md',
            'excerpt': 'Facilitator fees, verbatim: "Free to start, inexpensive to scale." — "The first 1,000 onchain Facilitator transactions each month are free", then $0.001 per additional onchain transaction, and "Payment verification is always free." Batch settlement amortizes further: "vouchers are verified offchain for free and claimed together, so one onchain transaction can process thousands of payments". Scale claim: the facilitator "has processed more than 100 million transactions" and $28 million in payment volume across Base and Solana.',
            'fetchedAt': NOW,
        },
        {
            'id': 'coinbase-x402-supp-5',
            'tier': 'claimed-docs',
            'url': 'https://docs.cdp.coinbase.com/x402/buyer/discover-services.md',
            'excerpt': 'Payable-service discovery is open: "The x402 Bazaar is a catalog of payment-gated services discovered by the CDP Facilitator." and "Bazaar discovery is public. You do not need a CDP API key to use the discovery APIs or the corresponding TypeScript SDK functions." Buyers search by intent with network/asset/scheme/price filters — "Search returns at most 20 resources, ranked by a blend of query relevance and quality." — or via the Bazaar MCP server as tool calls.',
            'fetchedAt': NOW,
        },
        {
            'id': 'coinbase-x402-supp-6',
            'tier': 'claimed-docs',
            'url': 'https://docs.cdp.coinbase.com/x402/seller/get-discovered.md',
            'excerpt': '"Getting discovered makes your endpoint available to tens of thousands of agents through CDP APIs, the Bazaar MCP server, and Amazon Bedrock AgentCore" — "The x402 Bazaar lists more than 23,000 x402 resources." Listing is frictionless ("There is no registration form or separate API call") and usage-gated: "Every validated endpoint is eligible for indexing in the CDP Bazaar after a successful settled payment.", while "Resources that go 30 days without a settlement are removed from both the catalog and search results".',
            'fetchedAt': NOW,
        },
        {
            'id': 'coinbase-x402-supp-7',
            'tier': 'claimed-docs',
            'url': 'https://docs.cdp.coinbase.com/x402/agentic-accounts/overview.md',
            'excerpt': 'Agent wallets: "Agentic accounts let an AI agent hold funds and act through a Coinbase account or wallet. For an x402 buyer, the account is the source of USDC that the agent uses to pay for a service." Two documented options: the Agentic Wallet ("Give your own agent a wallet that can discover and pay for x402 services today.") and "Connect an agent to Coinbase Advanced Trade. x402 payments are coming soon."',
            'fetchedAt': NOW,
        },
        {
            'id': 'coinbase-x402-supp-8',
            'tier': 'claimed-docs',
            'url': 'https://docs.cdp.coinbase.com/x402/support/x402-foundation.md',
            'excerpt': 'Governance: "x402 was originally incubated at Coinbase." — then the "x402 Foundation launched under the Linux Foundation" and "Coinbase completed its contribution of the protocol". "x402 is now developed under open, vendor-neutral governance, so the payment layer stays interoperable and free of lock-in to any one provider. Forty organizations joined as members at launch, spanning finance, cloud infrastructure, and payments. Premier members include Amazon Web Services, American Express, Cloudflare, Coinbase, Google, Mastercard, Shopify, Solana Foundation, Stripe, and Visa."',
            'fetchedAt': NOW,
        },
        {
            'id': 'coinbase-x402-supp-9',
            'tier': 'claimed-docs',
            'url': 'https://x402.org/leadership/',
            'excerpt': 'Named governance seats on x402.org: "The x402 Governing Board is responsible for marketing, business oversight, and budget decisions for the x402 Foundation." with members from American Express, AWS, Google, Visa, Circle, MoonPay, Stripe, Ripple, Coinbase, Shopify, Adyen, Monad Foundation, Mastercard, Solana, Fiserv, Stellar Foundation, and Cloudflare; separately, "The Technical Steering Committee (TSC) is responsible for all technical oversight of x402." chaired by Erik Reppel, with a Linux Foundation executive director (Michael Hursta).',
            'fetchedAt': NOW,
        },
        {
            'id': 'coinbase-x402-supp-10',
            'tier': 'claimed-docs',
            'url': 'https://x402.org/x402-batch-settlement/',
            'excerpt': 'The batch-settlement scheme targets high-frequency agent loops: "Batch settlement lets agents perform thousands of granular interactions while maintaining the economic efficiency of a single transaction." Buyers commit escrowed funds, "Every HTTP interaction includes a cryptographic voucher", and the seller redeems in bulk onchain. Buyer exit ramps are specified: "Escrow is explicit, limits are cryptographically signed, and buyers retain defined refund and withdrawal semantics."',
            'fetchedAt': NOW,
        },
    ],
    'crossmint': [
        {
            'id': 'crossmint-supp-1',
            'tier': 'claimed-docs',
            'url': 'https://docs.crossmint.com/agents/overview.md',
            'excerpt': 'Crossmint\'s agent stack is three composable products, verbatim: Agent Cards — "a card for your agent to pay with, secured by Visa VIC and Mastercard Agent Pay."; Agent Wallets — "a non-custodial wallet for stablecoin micropayments via x402 and MPP."; and Agent Checkouts — "one API to buy from any merchant." All of it runs "all under spending rules defined and controlled by your users".',
            'fetchedAt': NOW,
        },
        {
            'id': 'crossmint-supp-2',
            'tier': 'claimed-docs',
            'url': 'https://docs.crossmint.com/agents/how-agents-pay.md',
            'excerpt': 'Scoped card spending: "An order intent gives the agent a fixed allowance with an amount, description, and expiration, enforced through Visa Intelligent Commerce or Mastercard Agent Pay. The agent never sees the real card number." Accounting and expiry are explicit: "The order intent tracks the total, reserved, spent, and available amounts. It stops working when cancelled, expired, or fully spent."',
            'fetchedAt': NOW,
        },
        {
            'id': 'crossmint-supp-3',
            'tier': 'claimed-docs',
            'url': 'https://docs.crossmint.com/agents/cards-quickstart.md',
            'excerpt': 'Credentials are one-time and network-verified: minting returns "the secure one-time card number, expiration, and CVC", and verification is a card-network ceremony where "A returning Visa user authenticates with the passkey already bound to the device." Eligibility is scoped: "You can currently use agent cards with Mastercard and eligible U.S.-issued Visa credit and debit cards", with Visa exclusions of "non-US cards, business cards, prepaid cards, Chase cards, Fidelity cards".',
            'fetchedAt': NOW,
        },
        {
            'id': 'crossmint-supp-4',
            'tier': 'claimed-docs',
            'url': 'https://docs.crossmint.com/agents/how-agents-pay.md',
            'excerpt': 'Agent wallets are user-owned with onchain-enforced delegation: "The user owns a non-custodial wallet and grants the agent scoped permissions (spend limit, counterparties, time window), enforced onchain." The agent gets its own signer key "bound to a permission set the user signs off on" — a spend cap ("max amount the agent can move"), allowed counterparties, and a time window — then transacts with "no user prompt per action". "Every delegation is explicit, scoped, and revocable, so the user stays in control." and "Permissions are enforced onchain. The user can revoke at any time."',
            'fetchedAt': NOW,
        },
        {
            'id': 'crossmint-supp-5',
            'tier': 'claimed-docs',
            'url': 'https://docs.crossmint.com/agents/payment-flows/mpp.md',
            'excerpt': 'MPP support is a first-class payment flow: "This guide shows how to pay MPP (Machine Payment Protocol) endpoints using a Crossmint wallet." via the mppx client — "If the endpoint requires payment, the client pays via Tempo and retries the request." Prerequisite: "The agent must be authorized as a signer on the wallet."',
            'fetchedAt': NOW,
        },
        {
            'id': 'crossmint-supp-6',
            'tier': 'claimed-docs',
            'url': 'https://docs.crossmint.com/agents/payment-flows/x402.md',
            'excerpt': 'Crossmint wallets pay x402 endpoints through the @x402/core client (prerequisite: "A funded Crossmint EVM wallet on Base with USDC."): on a 402 response the wrapped fetch "reads the payment terms, signs a stablecoin payment, and retries with the payment proof attached", and afterwards getPaymentSettleResponse "extracts the settlement receipt from the response headers, confirming the payment was processed onchain".',
            'fetchedAt': NOW,
        },
        {
            'id': 'crossmint-supp-7',
            'tier': 'claimed-docs',
            'url': 'https://docs.crossmint.com/agents/agent-checkouts-quickstart.md',
            'excerpt': 'Merchant coverage is URL-universal: "Let your agent buy from any merchant with a single API." — hand it "a product URL and a spending cap, and Crossmint completes the checkout on your user\'s behalf — paying with any method the merchant accepts". The lifecycle is poll-driven ("no webhooks in v1" — "you poll until it reaches a terminal state"), and testing is production-only because "there is no staging environment for it".',
            'fetchedAt': NOW,
        },
        {
            'id': 'crossmint-supp-8',
            'tier': 'claimed-docs',
            'url': 'https://docs.crossmint.com/agents/payment-methods/cards/create-agent-card.md',
            'excerpt': '"An agent card is an order intent that gives an agent a bounded amount to spend before a fixed expiration." Merchant locking: "The merchant is fixed for the lifetime of that order intent, and credential requests inherit the restriction." When no card-network rail is usable, an encrypted-card fallback "returns the user\'s saved card encrypted to an RSA public key that you supply, so only the holder of the matching private key can read it" — but the docs prefer network rails because a card-network rail "enforces the allowance at the network level and never exposes the real card number".',
            'fetchedAt': NOW,
        },
        {
            'id': 'crossmint-supp-9',
            'tier': 'claimed-docs',
            'url': 'https://www.crossmint.com/pricing',
            'excerpt': 'Published pricing: wallets are "Free 1,000 Monthly Active Wallets" then "Overages start at $0.05 per MAU. Volume discounts available."; onramps/offramps/checkout are fees per transaction, "typically charged to users. Tiered pricing that improves with volume." No agent-card- or agent-checkout-specific price is published on the pricing page.',
            'fetchedAt': NOW,
        },
        {
            'id': 'crossmint-supp-10',
            'tier': 'claimed-docs',
            'url': 'https://docs.crossmint.com/payments/introduction.md',
            'excerpt': 'For card checkout, Crossmint absorbs dispute risk: "Crossmint will take on the risk and manage disputes directly with the bank.", using an authorization-hold model — "Crossmint places an authorization hold on the user\'s card before initiating the transaction. Funds are only captured once the transaction is successfully completed." Standard limits are $2,000 per user per day ("Limits reset daily at midnight US Eastern Time"). This chargeback/dispute coverage is documented for the general Checkout product, not specifically for agent checkouts.',
            'fetchedAt': NOW,
        },
    ],
    'skyfire': [
        {
            'id': 'skyfire-supp-1',
            'tier': 'claimed-docs',
            'url': 'https://docs.skyfire.xyz/docs/introduction-to-skyfire.md',
            'excerpt': 'Skyfire gives agents verified identity and payment credentials — "No 403 errors, captchas or blocked checkouts. Authenticated access and payment capability, everywhere your agents need to be." Three token types (kya proves identity, pay authorizes payment, kya-pay combines both) drive a four-step loop ending in settlement: "For paid services, the seller charges the token and Skyfire moves the funds between the buyer\'s and seller\'s wallets." A kya "token only proves identity, so it can\'t be charged".',
            'fetchedAt': NOW,
        },
        {
            'id': 'skyfire-supp-2',
            'tier': 'claimed-docs',
            'url': 'https://docs.skyfire.xyz/docs/kya.md',
            'excerpt': '"Skyfire supports identity verification through Know Your Agent (KYA), a single verification that applies to both your buyer and seller agents." The optional paid verification (Individual or Organization subscription) "attaches a real-world individual or organization identity to the agents you control", tokens disclose only the identity fields a service requires, and gating is hard: "If a buyer is not verified to the level a service requires, token creation fails and the transaction does not proceed."',
            'fetchedAt': NOW,
        },
        {
            'id': 'skyfire-supp-3',
            'tier': 'claimed-docs',
            'url': 'https://docs.skyfire.xyz/docs/kyapay-tokens.md',
            'excerpt': '"A KYAPay token is a signed, interoperable credential that packages agent identity and payment intent into a verifiable envelope." Tokens are JWTs, exchanged directly between buyer and seller, and "All Skyfire-issued tokens conform to the open KYAPay protocol, an industry specification for identity-linked payment credentials purpose-built for autonomous systems." (KYAPay.org) — the token format is published as open, though charging, wallets, and settlement all run through Skyfire\'s own APIs.',
            'fetchedAt': NOW,
        },
        {
            'id': 'skyfire-supp-4',
            'tier': 'claimed-docs',
            'url': 'https://docs.skyfire.xyz/docs/payments-settlement.md',
            'excerpt': 'Pay tokens carry committed amounts: "At creation, the token\'s amount is committed against the buyer\'s wallet (which is why token creation requires the amount to be within the buyer\'s available balance)", so "the seller is guaranteed to be paid, up to the token\'s committed amount. Sellers do not carry buyer non-payment risk for charges within a valid token." The committed amount is a ceiling, and "Charges above the token\'s remaining balance are rejected."',
            'fetchedAt': NOW,
        },
        {
            'id': 'skyfire-supp-5',
            'tier': 'claimed-docs',
            'url': 'https://docs.skyfire.xyz/reference/charge-token.md',
            'excerpt': 'Sellers collect via the Charge Token API: "Use this API after delivering a service, tool, or resource to collect payment from a buyer-issued token." and "Tokens may be charged multiple times until their balance is exhausted." Timing windows are explicit — "Skyfire allows charges to be submitted for up to 24 hours after a token expires" (only for tokens validated before expiry) and "Settlement may take up to 51 hours depending on token expiration and charging activity." Overcharges fail with an HTTP 402 PAYMENT_ERROR.',
            'fetchedAt': NOW,
        },
        {
            'id': 'skyfire-supp-6',
            'tier': 'claimed-docs',
            'url': 'https://docs.skyfire.xyz/docs/payments-settlement.md',
            'excerpt': 'Revocation is bounded by design: deactivating an account does not void already-issued pay/kya-pay tokens — "New token creation stops at deactivation, but in-flight tokens are honored so sellers are paid for services they were legitimately asked to deliver." Outstanding tokens stay chargeable until expiry plus the 24-hour grace period; no per-token revocation API is documented, so the practical caps are the token amount and its 10-second-to-24-hour expiry.',
            'fetchedAt': NOW,
        },
        {
            'id': 'skyfire-supp-7',
            'tier': 'claimed-docs',
            'url': 'https://docs.skyfire.xyz/docs/agentic-commerce-with-payment-cards.md',
            'excerpt': 'Cardholder consent bounds card spending: "The agent/agent platform can never spend more than the cardholder approved." — an authorization covers a merchant and an amount, and "That amount is always a ceiling, not a guaranteed charge, even for a purchase completed right away." across documented buy-now and buy-later purchases. Identity travels with every step: "From the merchant\'s side, an agentic purchase is never anonymous." — a kya token is attached from first search through checkout, and the pay token completes the purchase.',
            'fetchedAt': NOW,
        },
        {
            'id': 'skyfire-supp-8',
            'tier': 'claimed-docs',
            'url': 'https://docs.skyfire.xyz/docs/quickstart.md',
            'excerpt': 'Onboarding: signup auto-creates a Buyer Agent with a "pre-funded wallet"; API keys are managed per agent and "each key is scoped to a single agent (Buyer or Seller)", passed in the skyfire-api-key header. Sellers create a service and "provide details like: name, type, pricing, identity requirements, etc." then "Submit for approval." — seller services are approval-gated by Skyfire.',
            'fetchedAt': NOW,
        },
        {
            'id': 'skyfire-supp-9',
            'tier': 'claimed-docs',
            'url': 'https://docs.skyfire.xyz/docs/using-the-skyfire-mcp-server.md',
            'excerpt': 'The Skyfire MCP server at https://mcp.skyfire.xyz/mcp lets agents "Discover sellers", create tokens, and "Orchestrate agent commerce workflows" — documented tools are "find-sellers", "create-kya-token", "create-pay-token", and "create-kya-payment-token", authenticated with the skyfire-api-key header (sandbox at https://mcp-sandbox.skyfire.xyz/mcp).',
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
