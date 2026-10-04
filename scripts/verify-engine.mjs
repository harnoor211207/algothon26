import { inspectImportedWorkflow, parseWorkflowJsonText, serializeWorkflow } from '../src/utils/importExport.js'
import { runWorkflow } from '../src/utils/executionEngine.js'
import { validateWorkflow } from '../src/utils/validation.js'

function node(id, typeKey, category, config, extra = {}) {
  return {
    id,
    type: category,
    position: extra.position || { x: 0, y: 0 },
    data: {
      typeKey,
      label: extra.label || typeKey,
      description: extra.description || '',
      category,
      config,
    },
  }
}

function edge(id, source, target, sourceHandle) {
  return {
    id,
    source,
    target,
    ...(sourceHandle ? { sourceHandle } : {}),
    type: 'smoothstep',
    animated: true,
  }
}

function demoGraph({ score = 86, url = 'https://api.example.com/leads' } = {}) {
  const payload = JSON.stringify({
    lead: { name: 'Ava Chen', email: 'ava@acme.com', company: 'Acme Labs', score },
  })
  const nodes = [
    node('n-webhook', 'webhook', 'trigger', { endpoint: '/hooks/new-lead', samplePayload: payload }),
    node('n-http', 'http', 'action', { method: 'POST', url, body: '{"email":"{{lead.email}}"}' }),
    node('n-condition', 'condition', 'condition', { field: 'lead.score', operator: 'gt', value: '70' }),
    node('n-slack', 'slack', 'action', { channel: '#sales-alerts', message: 'Hot lead {{lead.name}}' }),
    node('n-note', 'notification', 'action', { title: 'Low score', body: '{{lead.name}} scored {{lead.score}}' }),
    node('n-email', 'email', 'action', { recipient: '{{lead.email}}', subject: 'Hi {{lead.name}}', message: 'Thanks' }),
  ]
  const edges = [
    edge('e1', 'n-webhook', 'n-http'),
    edge('e2', 'n-http', 'n-condition'),
    edge('e3', 'n-condition', 'n-slack', 'true'),
    edge('e4', 'n-condition', 'n-note', 'false'),
    edge('e5', 'n-slack', 'n-email'),
    edge('e6', 'n-note', 'n-email'),
  ]
  return { nodes, edges }
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function statuses(result) {
  return Object.fromEntries(result.steps.map((step) => [step.nodeId, step.status]))
}

const successGraph = demoGraph({ score: 86 })
assert(validateWorkflow(successGraph.nodes, successGraph.edges).ok, 'Demo graph should validate')

const success = await runWorkflow({ ...successGraph, delayMs: 0 })
assert(success.status === 'SUCCESS', `Expected SUCCESS, got ${success.status}: ${success.errors.join('; ')}`)
const successMap = statuses(success)
assert(successMap['n-webhook'] === 'SUCCESS', 'Trigger should succeed')
assert(successMap['n-http'] === 'SUCCESS', 'HTTP should succeed as simulated')
assert(successMap['n-condition'] === 'SUCCESS', 'Condition should succeed')
assert(successMap['n-slack'] === 'SUCCESS', 'True branch Slack should run')
assert(successMap['n-email'] === 'SUCCESS', 'Email should run after Slack')
assert(successMap['n-note'] === 'SKIPPED', 'False branch notification should be skipped')
assert(success.logs.some((entry) => /simulated/.test(entry.message)), 'Logs should mark simulated actions')
assert(success.nodeOutputs['n-http']?.simulated === true, 'HTTP output should be marked simulated')
assert(success.startedAt && success.finishedAt && success.durationMs != null, 'Timestamps and duration required')

const branched = await runWorkflow({ ...demoGraph({ score: 12 }), delayMs: 0 })
assert(branched.status === 'SUCCESS', `Low-score branch should still succeed, got ${branched.status}`)
const branchMap = statuses(branched)
assert(branchMap['n-note'] === 'SUCCESS', 'False branch notification should run')
assert(branchMap['n-slack'] === 'SKIPPED', 'True branch Slack should be skipped')
assert(branchMap['n-email'] === 'SUCCESS', 'Email should still run from the false branch')

const failed = await runWorkflow({ ...demoGraph({ url: 'not-a-url' }), delayMs: 0 })
assert(failed.status === 'FAILED', `Expected FAILED for bad HTTP URL, got ${failed.status}`)
const failMap = statuses(failed)
assert(failMap['n-http'] === 'FAILED', 'HTTP node should fail')
assert(failMap['n-condition'] === 'SKIPPED', 'Downstream nodes should be skipped after failure')
assert(Object.keys(failed.nodeErrors).includes('n-http'), 'Node error map should include HTTP')
const httpStep = failed.steps.find((step) => step.nodeId === 'n-http')
assert(/not a valid http/.test(httpStep.error || httpStep.log), 'HTTP failure message should be explicit')

const exported = serializeWorkflow({
  name: 'Round trip',
  description: 'Export then import',
  status: 'draft',
  nodes: successGraph.nodes,
  edges: successGraph.edges,
})
const parsed = parseWorkflowJsonText(JSON.stringify(exported))
assert(parsed.ok, parsed.error)
const inspected = inspectImportedWorkflow(parsed.value)
assert(inspected.ok, inspected.error)

const badImport = inspectImportedWorkflow({ name: 'Broken', nodes: [{ id: 'x' }], edges: [] })
assert(!badImport.ok, 'Malformed workflow should be rejected')

const emptyImport = parseWorkflowJsonText('{')
assert(!emptyImport.ok, 'Invalid JSON should be rejected')

console.log('Engine checks passed:')
console.log('- success path:', success.steps.map((step) => `${step.nodeName}:${step.status}`).join(' -> '))
console.log('- false branch:', branched.steps.map((step) => `${step.nodeName}:${step.status}`).join(' -> '))
console.log('- http failure:', failed.steps.map((step) => `${step.nodeName}:${step.status}`).join(' -> '))
