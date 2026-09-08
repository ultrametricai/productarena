# Mintlify: English Documentation

> Mintlify is a platform for building and hosting documentation websites. It provides a set of tools and services for maintaining documentation and making it accessible to AI agents.

## Documentation

### Get started

- [Introduction](https://www.mintlify.com/docs/index.md): Mintlify is an AI-native documentation platform built for developers, with beautiful defaults, interactive API playgrounds, and smart search.
- [Quickstart](https://www.mintlify.com/docs/quickstart.md): Get started with Mintlify by deploying your documentation site in minutes and making your first content change with the web editor or Git.
- [AI-native documentation](https://www.mintlify.com/docs/ai-native.md): Discover how AI-native features enhance reading, writing, and discovering your documentation with the assistant, agent, and Model Context Protocol (MCP) server.

#### CLI

- [Mintlify CLI](https://www.mintlify.com/docs/cli/index.md): Use the Mintlify CLI to preview docs locally, test changes in real time, and run accessibility, link, and validation checks before deploying.
- [Install the CLI](https://www.mintlify.com/docs/cli/install.md): Install the Mintlify CLI to preview documentation locally, test changes in real time, and catch build errors before deploying to production.
- [Mintlify MDX extension](https://www.mintlify.com/docs/cli/mdx-extension.md): Install the Mintlify MDX extension for autocomplete, inline diagnostics, hover documentation, and an in-editor preview while you write MDX locally.
- [Preview locally](https://www.mintlify.com/docs/cli/preview.md): Run a local preview of your Mintlify documentation site with live reload, full-text search, and AI assistant support using mint dev.
- [Mintlify CLI command reference](https://www.mintlify.com/docs/cli/commands.md): Complete reference for Mintlify CLI commands and flags, including mint index, mint dev, mint validate, mint broken-links, and more.

#### Migration guide

- [Migration overview](https://www.mintlify.com/docs/migration/index.md): Choose a migration path for moving existing documentation from Docusaurus, ReadMe, GitBook, Fern, Document360, or another platform to Mintlify.
- [Migrate from Docusaurus](https://www.mintlify.com/docs/migration/docusaurus.md): Migrate Docusaurus documentation to Mintlify, including MDX pages, sidebars, versions, localized content, assets, and custom components.
- [Migrate from ReadMe](https://www.mintlify.com/docs/migration/readme.md): Migrate ReadMe guides, API references, recipes, custom pages, versions, reusable content, and assets to Mintlify with the scraper or a project export.
- [Migrate from GitBook](https://www.mintlify.com/docs/migration/gitbook.md): Migrate GitBook sections, Markdown, navigation, reusable content, variants, assets, and OpenAPI documentation to Mintlify using Git Sync or the scraper.
- [Migrate from Fern](https://www.mintlify.com/docs/migration/fern.md): Migrate a Fern site to Mintlify. Convert MDX content, docs.yml navigation, products, versions, assets, API references, and components.
- [Migrate from Document360](https://www.mintlify.com/docs/migration/document360.md): Export a Document360 project ZIP and migrate its workspaces, languages, articles, categories, media, reusable content, and API references to Mintlify.
- [Migrate from another platform](https://www.mintlify.com/docs/migration/manual.md): Convert documentation from any source platform to Mintlify pages, navigation, components, API references, assets, and redirects.

### Create content

- [Reusable snippets](https://www.mintlify.com/docs/create/reusable-snippets.md): Create reusable content snippets with variables to maintain consistency across documentation pages and reduce duplication in your MDX files.
- [Personalized content](https://www.mintlify.com/docs/create/personalization.md): Show personalized content based on identified visitor data, group memberships, and custom variables to tailor documentation per audience.
- [CI checks](https://www.mintlify.com/docs/deploy/ci.md): Automate documentation quality checks in your CI/CD pipeline with broken link detection, linting, grammar validation, and build previews.

#### Pages

- [Pages](https://www.mintlify.com/docs/organize/pages.md): Configure page metadata, titles, descriptions, icons, and layout modes using YAML frontmatter properties at the top of your MDX documentation.
- [Hidden pages](https://www.mintlify.com/docs/organize/hidden-pages.md): Hide documentation pages from the sidebar navigation while keeping them accessible via direct URL, search, or AI assistant for special use cases.
- [Related topics](https://www.mintlify.com/docs/organize/related-pages.md): Add a related topics section at the bottom of each page using automatic recommendations or manually curated links defined in page frontmatter.

#### Formatting

- [Format text](https://www.mintlify.com/docs/create/text.md): Format text in your documentation with Markdown headings, bold, italic, links, blockquotes, and other inline styling options in MDX pages.
- [Format code](https://www.mintlify.com/docs/create/code.md): Format code in your documentation with syntax highlighting, line numbers, diffs, copy buttons, and interactive code group features in MDX.
- [Lists and tables](https://www.mintlify.com/docs/create/list-table.md): Format structured data in your documentation with Markdown tables, ordered and unordered lists, nested structures, and task list checkboxes.

#### Components

- [Components overview](https://www.mintlify.com/docs/components/index.md): Browse the full Mintlify component library for layout, emphasis, API documentation, and navigation elements available in your MDX pages.
- [Accordions](https://www.mintlify.com/docs/components/accordions.md): Use the accordion component to show and hide content sections, organize related information, and enable progressive disclosure in your docs.
- [Badge](https://www.mintlify.com/docs/components/badge.md): Use the badge component to highlight status indicators, version labels, or metadata inline with customizable colors and hover tooltips.
- [Banner](https://www.mintlify.com/docs/components/banner.md): Add a dismissible banner at the top of your documentation site to display important announcements, release notes, or notifications.
- [Callouts](https://www.mintlify.com/docs/components/callouts.md): Add info, notes, tips, checks, warnings, danger, and custom callout components to highlight important information in your documentation.
- [Cards](https://www.mintlify.com/docs/components/cards.md): Use the Mintlify Card component to display links, icons, images, and grouped content as visual containers, including horizontal layouts and CardGroup grids.
- [Code groups](https://www.mintlify.com/docs/components/code-groups.md): Use the CodeGroup component to display multiple code examples in a tabbed interface and let readers compare implementations across languages.
- [Color](https://www.mintlify.com/docs/components/color.md): Display color swatches with hex values and click-to-copy capability using the color component for design system and branding documentation.
- [Columns](https://www.mintlify.com/docs/components/columns.md): Arrange cards and other components in a responsive multi-column grid layout with the columns component, including customizable column counts.
- [Examples](https://www.mintlify.com/docs/components/examples.md): Display code examples in the right sidebar panel on desktop devices to show request and response samples alongside API documentation.
- [Expandables](https://www.mintlify.com/docs/components/expandables.md): Use the expandable component to toggle nested object properties in API documentation, showing child fields for request and response objects.
- [Fields](https://www.mintlify.com/docs/components/fields.md): Use ParamField and ResponseField components to document API request and response parameters with types, defaults, and validation rules.
- [Frames](https://www.mintlify.com/docs/components/frames.md): Wrap images, videos, and other components with the frame component to add styled borders, captions, and visual emphasis to your content.
- [GitHub](https://www.mintlify.com/docs/components/github.md): Use the GitHub component to embed a public repository card with a live description, star count, and fork count on any documentation page.
- [Icons](https://www.mintlify.com/docs/components/icons.md): Add icons from Font Awesome, Lucide, Tabler, or custom sources to your documentation pages using the icon component with size and color options.
- [MDX](https://www.mintlify.com/docs/components/mdx.md): Use the MDX component to render Markdown inside JSX expressions and conditionals so headings, code blocks, and tables compile like the rest of your page.
- [Mermaid](https://www.mintlify.com/docs/components/mermaid-diagrams.md): Create flowcharts, sequence diagrams, and other visualizations in your documentation using Mermaid syntax with automatic rendering.
- [Panel](https://www.mintlify.com/docs/components/panel.md): Customize the right side panel content on documentation pages to display supplementary information, examples, or navigation elements.
- [Prompt](https://www.mintlify.com/docs/components/prompt.md): Display pre-built AI prompts with one-click copy and Cursor integration buttons so users can quickly use prompts in their AI tools.
- [Response fields](https://www.mintlify.com/docs/components/responses.md): Document API response fields using the ResponseField component with type annotations, descriptions, and required or optional indicators.
- [Steps](https://www.mintlify.com/docs/components/steps.md): Create numbered step-by-step procedures with the steps component to guide users through sequential tasks, tutorials, and setup workflows.
- [Tabs](https://www.mintlify.com/docs/components/tabs.md): Use the tab component to organize content into switchable panels for showing different options, platform versions, or language examples.
- [Tiles](https://www.mintlify.com/docs/components/tiles.md): Use the tiles component to display visual previews with image thumbnails, titles, and descriptions in a responsive grid layout for your docs.
- [Tooltips](https://www.mintlify.com/docs/components/tooltips.md): Add tooltips to display contextual definitions and explanations when users hover over terms, abbreviations, or technical concepts in your documentation.
- [Tree](https://www.mintlify.com/docs/components/tree.md): Use the tree component to display hierarchical file and folder structures with collapsible nodes and syntax highlighting for path names.
- [Update](https://www.mintlify.com/docs/components/update.md): Use the update component to display product updates, release notes, and changelog entries in a structured timeline format with dates.
- [View](https://www.mintlify.com/docs/components/view.md): Use the view component to create switchable content panels for different programming languages, frameworks, or configuration alternatives.
- [Visibility](https://www.mintlify.com/docs/components/visibility.md): Use the visibility component to show different content to humans on the web UI and to AI agents in Markdown output for conditional rendering.
- [React components](https://www.mintlify.com/docs/customize/react-components.md): Build interactive and reusable elements with custom React components in your Mintlify documentation using JSX, state, and client-side logic.

#### Media

- [Images and embeds](https://www.mintlify.com/docs/create/image-embeds.md): Add images, embed YouTube videos, and include iframes in your MDX pages to enhance documentation with visual and interactive media content.
- [Files](https://www.mintlify.com/docs/create/files.md): Serve static assets like images, videos, PDFs, and data files from your documentation repository with automatic optimization and CDN delivery.

#### Editor

- [Editor overview](https://www.mintlify.com/docs/editor/index.md): Create, edit, and publish content in your browser with the Mintlify editor. Supports real-time collaboration and continuous Git sync.
- [How to use the editor](https://www.mintlify.com/docs/editor/tutorial.md): Step-by-step walkthrough of the Mintlify editor: create a branch, edit pages, share a preview deployment for review, and publish your changes.
- [Create and edit pages](https://www.mintlify.com/docs/editor/pages.md): Create pages, edit content, add media, organize your navigation, restore earlier page versions, and manage private pages in the editor.
- [Publish changes](https://www.mintlify.com/docs/editor/publish.md): Publish changes from the editor to your live site. Branches and protection rules determine what happens when you publish.
- [Review changes](https://www.mintlify.com/docs/editor/review.md): Preview changes before they go live, share them with your team, and approve and merge pull requests from the editor.
- [Collaborate in the editor](https://www.mintlify.com/docs/editor/collaborate.md): Leave comments, propose changes as suggestions, and edit alongside teammates in real time in the editor.
- [Ask agent](https://www.mintlify.com/docs/editor/agent.md): Use the editor's built-in AI agent to write content, edit pages, leave comments and suggestions, search your site, upload files, and configure settings.
- [Editor settings for AI and publishing](https://www.mintlify.com/docs/editor/settings.md): Configure editor appearance, AI instructions, and publishing defaults to control how the Mintlify web editor looks and how it commits and merges changes.
- [Keyboard shortcuts](https://www.mintlify.com/docs/editor/keyboard-shortcuts.md): View the complete list of keyboard shortcuts for the Mintlify web editor, including text formatting, navigation, and editing commands.

### Manage your site

- [Navigation](https://www.mintlify.com/docs/organize/navigation.md): Configure your documentation site navigation with groups, pages, dropdowns, tabs, and anchors in docs.json to build a sidebar structure.
- [Contextual menu](https://www.mintlify.com/docs/ai/contextual-menu.md): Add a contextual menu to your docs with one-click AI integrations for ChatGPT, Claude, Perplexity, Google AI Studio, Devin, Devin Desktop, and MCP tools.
- [Bring your own model](https://www.mintlify.com/docs/ai/bring-your-own-model.md): Use your own LLM provider API key and choose the model that powers the Mintlify assistant, agent, and automations on Enterprise plans.
- [Redirects](https://www.mintlify.com/docs/create/redirects.md): Configure URL redirects in docs.json for moved, renamed, or deleted documentation pages to preserve SEO rankings and prevent broken links.
- [Exclude files from publishing](https://www.mintlify.com/docs/organize/mintignore.md): Exclude specific files and directories from your published documentation using a .mintignore file with glob patterns, similar to .gitignore syntax.

#### Global settings

- [Global settings](https://www.mintlify.com/docs/organize/settings.md): Configure your Mintlify documentation site with docs.json, the required configuration file that controls navigation, appearance, integrations, and more.
- [Appearance and branding](https://www.mintlify.com/docs/organize/settings-appearance.md): Configure theme, colors, logo, favicon, fonts, and background in docs.json to control the visual identity of your documentation site.
- [Site structure](https://www.mintlify.com/docs/organize/settings-structure.md): Configure navbar, navigation groups, footer links, banner, contextual menu, redirects, and other structural elements in your docs.json file.
- [API settings](https://www.mintlify.com/docs/organize/settings-api.md): Configure OpenAPI and AsyncAPI specs, the interactive API playground, SDK code examples, and authentication settings in your docs.json file.
- [Integrations](https://www.mintlify.com/docs/organize/settings-integrations.md): Connect analytics platforms, chat widgets, and third-party services to your Mintlify documentation site through the docs.json integrations config.
- [SEO and search](https://www.mintlify.com/docs/organize/settings-seo.md): Configure SEO settings in docs.json including site description, search engine indexing, meta tags, search bar placeholder, and page timestamps.
- [docs.json schema reference](https://www.mintlify.com/docs/organize/settings-reference.md): Complete reference for every docs.json configuration property with types, default values, descriptions, and usage examples for your docs site.

#### Repository setup

- [Monorepo setup](https://www.mintlify.com/docs/deploy/monorepo.md): Configure the documentation path and content directory in a monorepo project so Mintlify deploys only from your designated docs folder.
- [Multi-repository deployments](https://www.mintlify.com/docs/deploy/multi-repo.md): Combine multiple Git repositories into one Mintlify site, with a dedicated URL path for each source repo's content and navigation.

#### Visual customization

- [Themes](https://www.mintlify.com/docs/customize/themes.md): Choose and configure a theme to customize your documentation site's colors, dark mode behavior, layout style, and overall visual appearance.
- [Fonts](https://www.mintlify.com/docs/customize/fonts.md): Customize typography on your documentation site with Google Fonts or self-hosted font files for headings, body text, and code blocks.
- [Custom scripts](https://www.mintlify.com/docs/customize/custom-scripts.md): Add custom JavaScript and CSS for analytics, widgets, styling, third-party integrations, and API playground server variables on your documentation site.
- [Custom 404 page](https://www.mintlify.com/docs/customize/custom-404-page.md): Customize the title, description, and appearance of your documentation site's 404 error page to match your brand and guide visitors.

#### Analytics

- [Analytics overview](https://www.mintlify.com/docs/analytics/index.md): Explore the Mintlify analytics dashboard to measure documentation traffic, assistant conversations, search queries, engagement, and reader feedback.
- [Analyze documentation traffic](https://www.mintlify.com/docs/analytics/traffic.md): Review traffic analytics to track visitors, page views, referrals, popular pages, and traffic from both human readers and AI agents.
- [Analyze assistant conversations](https://www.mintlify.com/docs/analytics/assistant.md): Review assistant analytics in the Mintlify dashboard to explore conversation categories, topics, satisfaction, chat history, and content gaps.
- [Analyze documentation searches](https://www.mintlify.com/docs/analytics/search.md): Review documentation search analytics to track query volume, spot searches returning no results, and improve result click-through rates.
- [Analyze user engagements](https://www.mintlify.com/docs/analytics/user-engagements.md): Use engagement analytics to measure content actions, CTA click-through rates, user flows through your docs, and search and assistant funnels.
- [Collect page feedback from users and AI agents](https://www.mintlify.com/docs/optimize/feedback.md): Enable feedback widgets, page ratings, contextual notes, code snippet reactions, and agent feedback to find and fix documentation gaps.
- [Export analytics to CSV](https://www.mintlify.com/docs/analytics/export.md): Export traffic, referrals, assistant, search, and feedback analytics to CSV from your Mintlify dashboard and interpret each export field.
- [Stream analytics events to Amazon S3](https://www.mintlify.com/docs/analytics/streaming.md): Configure Enterprise analytics streaming to send selected event categories from your Mintlify deployments to Amazon S3 in near real time.

#### Deployments

- [Deployments](https://www.mintlify.com/docs/deploy/deployments.md): Manage documentation deployments in the Mintlify dashboard, including viewing deployment history, monitoring build status, and troubleshooting.
- [GitHub](https://www.mintlify.com/docs/deploy/github.md): Connect your GitHub repository to Mintlify for automated deployments, pull request preview builds, and continuous documentation synchronization.
- [GitHub Enterprise Server](https://www.mintlify.com/docs/deploy/ghes.md): Install and configure the Mintlify GitHub App on your GitHub Enterprise Server instance for automated documentation deployments and syncing.
- [GitLab](https://www.mintlify.com/docs/deploy/gitlab.md): Connect your GitLab repository to Mintlify for automated documentation deployments, merge request previews, and continuous synchronization.
- [Bitbucket Cloud](https://www.mintlify.com/docs/deploy/bitbucket.md): Connect a Bitbucket Cloud repository to Mintlify for automatic deployments, pull request previews, and continuous synchronization.
- [Preview deployments](https://www.mintlify.com/docs/deploy/preview-deployments.md): Get unique preview URLs for each pull request so reviewers can see documentation changes in a live environment before merging to production.
- [Rollbacks](https://www.mintlify.com/docs/deploy/rollbacks.md): Restore your live Mintlify site to a previous successful build from your dashboard without reverting commits or waiting for a rebuild.

#### Hosting

- [Custom domain](https://www.mintlify.com/docs/customize/custom-domain.md): Host your site at your own domain, subdomain, or subpath with DNS records, automatic TLS certificates, and Mintlify-managed or proxy traffic routing.
- [Content Security Policy (CSP) configuration](https://www.mintlify.com/docs/deploy/csp-configuration.md): Configure Content Security Policy headers to allow Mintlify resources while maintaining security for reverse proxies and strict network policies.
- [Self-host](https://www.mintlify.com/docs/deploy/self-host.md): Run Mintlify inside your own cloud or on-premises environment, on AWS or any Kubernetes platform including Azure, Google Cloud, Oracle Cloud, and OpenShift.
- [Custom developer portals](https://www.mintlify.com/docs/deploy/custom-portal.md): Deploy a fully custom developer portal on top of self-hosted Mintlify, designed and built by Mintlify and delivered through versioned releases.

##### Subpath hosting

- [Host docs at a subpath](https://www.mintlify.com/docs/deploy/docs-subpath.md): Host your Mintlify documentation at a subpath like /docs on your main domain using Cloudflare Workers, Vercel rewrites, or an nginx reverse proxy.
- [Deploy at a subpath with Cloudflare Workers](https://www.mintlify.com/docs/deploy/cloudflare.md): Deploy your Mintlify documentation at a subpath on your domain using Cloudflare Workers with step-by-step setup and DNS configuration.
- [Deploy at a subpath with AWS Route 53 and CloudFront](https://www.mintlify.com/docs/deploy/route53-cloudfront.md): Deploy your Mintlify documentation at a subpath on AWS by combining Route 53 DNS routing, a CloudFront distribution, and cache behaviors.
- [Deploy at a subpath with Vercel](https://www.mintlify.com/docs/deploy/vercel.md): Serve your Mintlify site at a subpath on your main domain using Vercel rewrites, with a step-by-step vercel.json configuration walkthrough.
- [Reverse proxy](https://www.mintlify.com/docs/deploy/reverse-proxy.md): Configure a custom reverse proxy with nginx or a similar tool to serve your Mintlify documentation at a subpath on your own domain.

#### Export your site

- [Offline export](https://www.mintlify.com/docs/deploy/export.md): Export your documentation site as a self-contained zip archive for offline viewing, internal distribution, or air-gapped environment hosting.
- [PDF exports](https://www.mintlify.com/docs/optimize/pdf-exports.md): Export your entire documentation site as a single PDF with a navigable table of contents for offline reading, sharing, and print distribution.

#### Authentication

- [Authentication setup](https://www.mintlify.com/docs/deploy/authentication-setup.md): Set up user authentication to control access to pages and API references using password, OAuth, JWT, or Mintlify-managed private access.
- [Single sign-on (SSO)](https://www.mintlify.com/docs/dashboard/sso.md): Set up single sign-on with SAML or OIDC identity providers like Okta, Azure AD, and Google Workspace for secure team authentication.
- [SCIM user provisioning](https://www.mintlify.com/docs/dashboard/scim.md): Automatically provision, deprovision, and map users to roles for Mintlify dashboard members from Okta or another SCIM 2.0 identity provider.
- [Session security](https://www.mintlify.com/docs/dashboard/session-security.md): Configure dashboard session timeouts, maximum session lifetime, and an IP allowlist to enforce stricter authentication and network access policies.

#### Security

- [Dashboard access policies](https://www.mintlify.com/docs/dashboard/network-access.md): Restrict Mintlify dashboard access to trusted IP addresses and control how long dashboard sessions stay valid with idle timeouts and maximum session lifetimes.
- [Roles](https://www.mintlify.com/docs/dashboard/roles.md): Assign admin, editor, or viewer roles to team members to control access levels, editing permissions, and deployment capabilities in Mintlify.
- [Audit logs](https://www.mintlify.com/docs/dashboard/audit-logs.md): Review, export, and stream audit logs to Amazon S3 or Datadog to track deployments, configuration changes, and permission updates in your organization.
- [Security contact](https://www.mintlify.com/docs/dashboard/security-contact.md): Configure a security contact email address for your organization to receive vulnerability reports, security alerts, and compliance updates.

### Agent

- [What is the agent?](https://www.mintlify.com/docs/agent/index.md): Learn how the Mintlify agent researches, plans, and writes documentation, then opens pull requests with proposed changes for your team to review.
- [Add the agent to Slack](https://www.mintlify.com/docs/agent/slack.md): Install the Mintlify agent in Slack to ask questions about your product, create content updates from team conversations, and capture knowledge in pull requests.
- [Customize agent behavior](https://www.mintlify.com/docs/agent/customize.md): Customize agent behavior with an `AGENTS.md` configuration file to control how the agent handles documentation tasks and follows your conventions.
- [Write effective prompts](https://www.mintlify.com/docs/agent/effective-prompts.md): Write clear, specific prompts to get better results from the Mintlify agent, with examples of effective instructions and tips for common patterns.
- [Mintlify agent use cases and examples](https://www.mintlify.com/docs/agent/use-cases.md): Explore real-world examples of using the Mintlify agent to automate documentation updates, capture knowledge, and maintain accurate docs.

#### Automations

- [Automations overview](https://www.mintlify.com/docs/automations/index.md): Automate content maintenance with Mintlify automations by running the agent on a schedule, on repository pushes, or on connected integration events.
- [Create a custom automation](https://www.mintlify.com/docs/automations/create.md): Create a Mintlify automation that runs on a schedule, repository push, or integration event. Add context repositories and a custom agent prompt.
- [Manage automations](https://www.mintlify.com/docs/automations/manage.md): Enable, disable, trigger, and delete automations from your dashboard. Configure repository, schedule, and integration triggers; context repos; and automerge.
- [Integrations for the agent and automations](https://www.mintlify.com/docs/automations/integrations.md): Connect third-party apps so the Mintlify agent can use live context in Slack, during automation runs, or as a trigger for custom automations.
- [Predefined automations](https://www.mintlify.com/docs/automations/reference.md): Reference for all predefined Mintlify automations, including default trigger, update mode, context repository support, and required configurations.
- [Self-hosted GitLab OAuth](https://www.mintlify.com/docs/deploy/gitlab-self-hosted.md): Connect a self-hosted GitLab instance to Mintlify via OAuth so automations can clone repositories, push commits, and open merge requests on your behalf.

### Assistant

- [Assistant](https://www.mintlify.com/docs/assistant/index.md): Add an AI-powered chat assistant to your documentation site that answers user questions, cites sources, and generates code examples on demand.
- [Configure the assistant](https://www.mintlify.com/docs/assistant/configure.md): Configure the AI assistant in your Mintlify dashboard: toggle availability, customize responses, add starter questions, set bot protection, and manage billing.
- [Customize assistant behavior](https://www.mintlify.com/docs/assistant/customize.md): Customize the AI assistant by adding an Assistant.md file with system instructions that shape its tone, persona, focus areas, and response behavior.
- [Embed the AI assistant widget](https://www.mintlify.com/docs/assistant/widget.md): Install and configure the Mintlify widget to embed an AI assistant trained on your content into any website, web app, or dashboard.
- [Add assistant skills](https://www.mintlify.com/docs/assistant/skills.md): Tune the assistant's responses with topic-specific Markdown guides that the assistant loads on demand to answer specific questions with your team's guidance.
- [Use the assistant](https://www.mintlify.com/docs/assistant/use.md): Open the assistant with keyboard shortcuts, highlighted text, code blocks, file attachments, or URL parameters. Test assistant behavior in local preview.

### Agent-ready content

- [Admin Model Context Protocol (MCP) server](https://www.mintlify.com/docs/ai/mintlify-mcp.md): Give AI tools like Claude, ChatGPT, and Cursor write access to your Mintlify content and dashboard so they can edit pages, update settings, and open PRs.
- [Search Model Context Protocol (MCP) server](https://www.mintlify.com/docs/ai/model-context-protocol.md): Connect AI tools like Claude, Cursor, and ChatGPT to your hosted search MCP server so they can search and retrieve content from your site.
- [llms.txt](https://www.mintlify.com/docs/ai/llmstxt.md): Automatically generate llms.txt and llms-full.txt files so AI tools like ChatGPT and Claude can index and understand your documentation.
- [skill.md](https://www.mintlify.com/docs/ai/skillmd.md): Make your documentation agent-ready with automatically generated skill.md files that describe your product's capabilities for AI agents.
- [Markdown export](https://www.mintlify.com/docs/ai/markdown-export.md): Export clean Markdown versions of your documentation pages for AI tools, LLM integrations, and automated content processing workflows.

#### Mintlify Index

- [Index](https://www.mintlify.com/docs/search-index/index.md): Give coding agents current technical context from publisher-maintained documentation and the web through one MCP server or REST API.
- [Connect Mintlify Index to your coding agent](https://www.mintlify.com/docs/search-index/connect.md): Set up the Mintlify Index MCP server in Claude Code, Cursor, VS Code, Codex, OpenCode, Windsurf, or Zed with the CLI or manual configuration.
- [Mintlify Index MCP server](https://www.mintlify.com/docs/search-index/mcp.md): Reference for the public Mintlify Index MCP server: connection URL, the context tool, parameters, response format, rate limits, and usage examples.

### Search and SEO

- [Configure in-product search ranking, results, and filters](https://www.mintlify.com/docs/optimize/search.md): Configure the in-product search bar on your Mintlify docs site: ranking boosts, maximum results per query, and product and version search filters.
- [SEO](https://www.mintlify.com/docs/optimize/seo.md): Configure meta tags, Open Graph properties, canonical URLs, and page-level SEO settings to improve your documentation's search engine ranking.

### Document APIs

- [API playground overview](https://www.mintlify.com/docs/api-playground/overview.md): Let developers test API endpoints directly in your documentation with an interactive playground that sends real requests and shows responses.
- [Troubleshooting](https://www.mintlify.com/docs/api-playground/troubleshooting.md): Troubleshoot common issues with API playground configuration, including OpenAPI validation errors, missing endpoints, and auth problems.

#### API specifications

- [OpenAPI setup](https://www.mintlify.com/docs/api-playground/openapi-setup.md): Generate interactive API documentation from OpenAPI specification files with automatic endpoint pages, request builders, and navigation.
- [AsyncAPI setup](https://www.mintlify.com/docs/api-playground/asyncapi-setup.md): Set up real-time WebSocket documentation using AsyncAPI specification files to generate interactive channel and message reference pages.
- [GraphQL setup](https://www.mintlify.com/docs/api-playground/graphql-setup.md): Generate reference pages for your GraphQL API from a schema definition file, with linked types and example queries, mutations, and responses.

##### SDK reference setup

- [Generate SDK reference pages from doc-tool output](https://www.mintlify.com/docs/api-playground/sdk-reference-setup.md): Publish SDK reference documentation in Mintlify from TypeDoc, DocFX, Javadoc, Sphinx, or phpDocumentor artifacts using the sdk navigation property.
- [Add SDK examples](https://www.mintlify.com/docs/api-playground/adding-sdk-examples.md): Add SDK code samples to your API documentation with the x-codeSamples OpenAPI extension or automatically with Speakeasy.

#### Endpoint pages

- [Complex data types](https://www.mintlify.com/docs/api-playground/complex-data-types.md): Describe APIs with flexible schemas using oneOf, anyOf, and allOf keywords for optional properties, polymorphism, and multiple data formats.
- [Multiple responses](https://www.mintlify.com/docs/api-playground/multiple-responses.md): Document multiple response variations for API endpoints, including success and error cases, with status codes and example payloads.
- [Manage page visibility](https://www.mintlify.com/docs/api-playground/managing-page-visibility.md): Control which API endpoints appear in your documentation navigation by hiding, filtering, or organizing autogenerated OpenAPI pages.
- [Create manual API pages](https://www.mintlify.com/docs/api-playground/mdx-setup.md): Create API reference pages manually with MDX files when you need full control over layout for small APIs, prototypes, or custom docs.

### Integrations

#### Analytics

- [Analytics integrations](https://www.mintlify.com/docs/integrations/analytics/overview.md): Connect your Mintlify documentation to analytics platforms like Google Analytics, Mixpanel, PostHog, and more to track visitor engagement.
- [Adobe Analytics](https://www.mintlify.com/docs/integrations/analytics/adobe.md): Integrate Adobe Analytics with your Mintlify documentation site using Adobe Experience Platform Launch tags for detailed usage tracking.
- [Amplitude](https://www.mintlify.com/docs/integrations/analytics/amplitude.md): Integrate Amplitude analytics with your Mintlify documentation site to track user behavior, page views, and content engagement metrics.
- [Clarity](https://www.mintlify.com/docs/integrations/analytics/clarity.md): Integrate Microsoft Clarity with your Mintlify documentation site to capture session recordings, heatmaps, and user interaction analytics.
- [Clearbit](https://www.mintlify.com/docs/integrations/analytics/clearbit.md): Integrate Clearbit with your Mintlify documentation to enrich visitor data, identify visiting companies, and track enterprise engagement.
- [Fathom](https://www.mintlify.com/docs/integrations/analytics/fathom.md): Integrate Fathom Analytics with your Mintlify documentation for privacy-focused, GDPR-compliant visitor tracking with a simple site ID setup.
- [Google Analytics 4](https://www.mintlify.com/docs/integrations/analytics/google-analytics.md): Integrate Google Analytics 4 with your Mintlify documentation to track visitor behavior, page views, and content engagement with your GA4 ID.
- [Google Tag Manager](https://www.mintlify.com/docs/integrations/analytics/google-tag-manager.md): Integrate Google Tag Manager with your Mintlify documentation to manage analytics tags, conversion tracking, and marketing events centrally.
- [Heap](https://www.mintlify.com/docs/integrations/analytics/heap.md): Integrate Heap analytics with your Mintlify documentation site to automatically capture user interactions and events for behavioral analysis.
- [Hightouch](https://www.mintlify.com/docs/integrations/analytics/hightouch.md): Integrate Hightouch with your Mintlify documentation to sync analytics data for audience activation, segmentation, and downstream tool routing.
- [Hotjar](https://www.mintlify.com/docs/integrations/analytics/hotjar.md): Integrate Hotjar with your Mintlify documentation site to capture session recordings, heatmaps, and user feedback for experience insights.
- [LogRocket](https://www.mintlify.com/docs/integrations/analytics/logrocket.md): Integrate LogRocket with your Mintlify documentation to replay user sessions, monitor frontend errors, and debug interaction issues in detail.
- [Mixpanel](https://www.mintlify.com/docs/integrations/analytics/mixpanel.md): Integrate Mixpanel with your Mintlify documentation site to track product analytics, user behavior funnels, and content engagement events.
- [Pirsch](https://www.mintlify.com/docs/integrations/analytics/pirsch.md): Integrate Pirsch with your Mintlify documentation for GDPR-compliant, cookie-free analytics that tracks page views without collecting personal data.
- [Plausible](https://www.mintlify.com/docs/integrations/analytics/plausible.md): Integrate Plausible Analytics with your Mintlify documentation for lightweight, privacy-respecting visitor tracking without cookies or consent banners.
- [PostHog](https://www.mintlify.com/docs/integrations/analytics/posthog.md): Integrate PostHog with your Mintlify documentation site to track product analytics, feature usage, and user behavior with your API key.
- [Segment](https://www.mintlify.com/docs/integrations/analytics/segment.md): Integrate Segment with your Mintlify documentation to route analytics events to downstream tools like warehouses, CRMs, and marketing platforms.

#### Support

- [Support integrations](https://www.mintlify.com/docs/integrations/support/overview.md): Connect your Mintlify documentation to support platforms like Intercom and Front so visitors can get live help directly from your docs pages.
- [Intercom](https://www.mintlify.com/docs/integrations/support/intercom.md): Integrate the Intercom chat widget into your Mintlify documentation site to provide real-time customer messaging, support, and onboarding help.
- [Front](https://www.mintlify.com/docs/integrations/support/front.md): Integrate Front chat with your Mintlify documentation site so visitors can start customer support conversations directly from your docs pages.

#### Privacy

- [Privacy integrations](https://www.mintlify.com/docs/integrations/privacy/overview.md): Connect your Mintlify documentation site to privacy platforms like Osano and Transcend to manage cookie consent, compliance banners, and user preferences.
- [Osano](https://www.mintlify.com/docs/integrations/privacy/osano.md): Integrate Osano with your Mintlify documentation site to manage cookie consent banners, privacy preferences, and regulatory compliance.
- [Transcend](https://www.mintlify.com/docs/integrations/privacy/transcend.md): Integrate Transcend Consent Management with your Mintlify docs to gate analytics behind visitor consent using your existing Transcend bundle.

### Reference

- [Concepts](https://www.mintlify.com/docs/reference/concepts.md): Learn how Mintlify connects your organization, documentation repository, editing workflows, previews, deployments, analytics, and AI features.
- [Glossary](https://www.mintlify.com/docs/reference/glossary.md): Definitions for Mintlify product, content, navigation, deployment, Git, API playground, and AI terminology used throughout the documentation.
- [Credit pricing](https://www.mintlify.com/docs/credits.md): Understand how your organization's credit balance works, what consumes credits, and how Mintlify bills credit add-ons, overages, and rollovers.
