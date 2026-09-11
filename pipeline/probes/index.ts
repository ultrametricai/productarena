// Local probe registry: one module per arena (pipeline/probes/<arena-id>.ts) so parallel
// arena waves never collide in a single literal. To add probes for an arena, edit (or
// create) its module, register it here, and bump EXPECTED counts in
// pipeline/__tests__/probes.test.ts.
//
// Every command here is cheap, keyless, and read-only: --version/--help prints and stdio MCP
// initialize handshakes. Nothing installs, mutates state, or needs credentials.
//
// Imports are explicit (no fs discovery) so the registry stays statically analyzable and
// works under tsx.
import type { LocalProbe } from './types'
import { probes as payments } from './payments'
import { probes as accounting } from './accounting'
import { probes as agentFrameworks } from './agent-frameworks'
import { probes as agentSandboxes } from './agent-sandboxes'
import { probes as aiCoding } from './ai-coding'
import { probes as securityScanners } from './security-scanners'
import { probes as terminals } from './terminals'
import { probes as packageManagers } from './package-managers'
import { probes as mcpInfrastructure } from './mcp-infrastructure'
import { probes as browserAgents } from './browser-agents'
import { probes as vectorDatabases } from './vector-databases'
import { probes as workflowAutomation } from './workflow-automation'
import { probes as observability } from './observability'
import { probes as infraAsCode } from './infra-as-code'
import { probes as aiMemory } from './ai-memory'
import { probes as voiceAgents } from './voice-agents'
import { probes as notesKnowledge } from './notes-knowledge'
import { probes as meetingAi } from './meeting-ai'
import { probes as gpuClouds } from './gpu-clouds'
import { probes as featureFlags } from './feature-flags'
import { probes as serverlessDatabases } from './serverless-databases'
import { probes as agentSkills } from './agent-skills'
import { probes as dataWarehouses } from './data-warehouses'
import { probes as incidentManagement } from './incident-management'
import { probes as dataPipelines } from './data-pipelines'
import { probes as docsPlatforms } from './docs-platforms'
import { probes as customerDataPlatforms } from './customer-data-platforms'
import { probes as ecommercePlatforms } from './ecommerce-platforms'
import { probes as email } from './email'
import { probes as searchInfra } from './search-infra'
import { probes as scheduling } from './scheduling'
import { probes as designTools } from './design-tools'
import { probes as teamChat } from './team-chat'
import { probes as softwareFactory } from './software-factory'
import { probes as vibeCoding } from './vibe-coding'
import { probes as aiSupportAgents } from './ai-support-agents'
import { probes as durableWorkflows } from './durable-workflows'
import { probes as aiCodeReview } from './ai-code-review'
import { probes as documentExtraction } from './document-extraction'
import { probes as legalOps } from './legal-ops'

export type { LocalProbe } from './types'

export const LOCAL_PROBES: Record<string, LocalProbe[]> = {
  payments,
  accounting,
  'agent-frameworks': agentFrameworks,
  'agent-sandboxes': agentSandboxes,
  'ai-coding': aiCoding,
  'security-scanners': securityScanners,
  terminals,
  'package-managers': packageManagers,
  'mcp-infrastructure': mcpInfrastructure,
  'browser-agents': browserAgents,
  'vector-databases': vectorDatabases,
  'workflow-automation': workflowAutomation,
  observability,
  'infra-as-code': infraAsCode,
  'ai-memory': aiMemory,
  'voice-agents': voiceAgents,
  'notes-knowledge': notesKnowledge,
  'meeting-ai': meetingAi,
  'gpu-clouds': gpuClouds,
  'feature-flags': featureFlags,
  'serverless-databases': serverlessDatabases,
  'agent-skills': agentSkills,
  'data-warehouses': dataWarehouses,
  'incident-management': incidentManagement,
  'data-pipelines': dataPipelines,
  'docs-platforms': docsPlatforms,
  'customer-data-platforms': customerDataPlatforms,
  'ecommerce-platforms': ecommercePlatforms,
  email,
  'search-infra': searchInfra,
  scheduling,
  'design-tools': designTools,
  'team-chat': teamChat,
  'software-factory': softwareFactory,
  'vibe-coding': vibeCoding,
  'ai-support-agents': aiSupportAgents,
  'durable-workflows': durableWorkflows,
  'ai-code-review': aiCodeReview,
  'document-extraction': documentExtraction,
  'legal-ops': legalOps,
}
