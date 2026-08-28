import type { Story } from '../lib/schemas'

// Canonical agenticness stories, injected verbatim by normalize into every category's
// taxonomy — never LLM-authored. Ids, titles, and weights are fixed by spec §3 and must
// stay identical across all categories.
export const AGENTIC_STORIES: Story[] = [
  {
    id: 'agentic-public-api',
    persona: 'ai-native',
    title: 'As an AI-native user, I can drive the product through a documented public API',
    theme: 'agenticness',
    group: 'agent-access',
    weight: 3,
  },
  {
    id: 'agentic-official-cli',
    persona: 'ai-native',
    title: 'As an AI-native user, I can use an official CLI',
    theme: 'agenticness',
    group: 'agent-access',
    weight: 2,
  },
  {
    id: 'agentic-mcp-server',
    persona: 'ai-native',
    title: 'As an AI-native user, I can connect an agent via an official MCP server',
    theme: 'agenticness',
    group: 'agent-access',
    weight: 3,
  },
  {
    id: 'agentic-webhooks',
    persona: 'ai-native',
    title: 'As an AI-native user, I can subscribe to events via webhooks',
    theme: 'agenticness',
    group: 'agent-access',
    weight: 2,
  },
  {
    id: 'agentic-sdks',
    persona: 'ai-native',
    title: 'As an AI-native user, I can build against official SDKs',
    theme: 'agenticness',
    group: 'agent-access',
    weight: 2,
  },
  {
    id: 'agentic-agent-docs',
    persona: 'ai-native',
    title: 'As an AI-native user, I can point an agent at llms.txt or agent-oriented docs',
    theme: 'agenticness',
    group: 'agent-access',
    weight: 2,
  },
  {
    id: 'agentic-scoped-keys',
    persona: 'ai-native',
    title: 'As an AI-native user, I can issue scoped/least-privilege API credentials for an agent',
    theme: 'agenticness',
    group: 'agent-access',
    weight: 2,
  },
  {
    id: 'agentic-headless',
    persona: 'ai-native',
    title: 'As an AI-native user, I can run the product headlessly / in CI for automation',
    theme: 'agenticness',
    group: 'agent-access',
    weight: 2,
  },
]

// Canonical agentic-features stories — same injection contract as AGENTIC_STORIES above, but
// scored as a separate group ("does the product act agentically itself" vs "can your agent
// drive it"). Ids, titles, and weights are fixed and must stay identical across all categories.
export const AGENTIC_FEATURE_STORIES: Story[] = [
  {
    id: 'agentic-builtin-assistant',
    persona: 'ai-native',
    title: 'As an AI-native user, I can delegate tasks to a built-in AI assistant inside the product',
    theme: 'agenticness',
    group: 'agentic-features',
    weight: 3,
  },
  {
    id: 'agentic-autonomous-automation',
    persona: 'ai-native',
    title: 'As an AI-native user, I can set up automations that run autonomously in the background',
    theme: 'agenticness',
    group: 'agentic-features',
    weight: 2,
  },
  {
    id: 'agentic-nl-commands',
    persona: 'ai-native',
    title: 'As an AI-native user, I can operate the product with natural-language commands',
    theme: 'agenticness',
    group: 'agentic-features',
    weight: 2,
  },
  {
    id: 'agentic-ai-insights',
    persona: 'ai-native',
    title: 'As an AI-native user, I can get AI-generated insights and suggestions from my data inside the product',
    theme: 'agenticness',
    group: 'agentic-features',
    weight: 2,
  },
]
