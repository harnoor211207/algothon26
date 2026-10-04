import { getByPath } from './helpers'

export const OPERATORS = [
  { id: 'equals', label: 'equals' },
  { id: 'not_equals', label: 'does not equal' },
  { id: 'contains', label: 'contains' },
  { id: 'gt', label: 'greater than' },
  { id: 'gte', label: 'greater than or equal' },
  { id: 'lt', label: 'less than' },
  { id: 'lte', label: 'less than or equal' },
  { id: 'exists', label: 'exists' },
]

export function evaluateCondition(data, config) {
  const field = config?.field?.trim()
  const operator = config?.operator || 'equals'
  const expected = config?.value
  const actual = getByPath(data, field)

  const asNumber = (value) => {
    const num = Number(value)
    return Number.isNaN(num) ? null : num
  }

  switch (operator) {
    case 'equals':
      return String(actual ?? '') === String(expected ?? '')
    case 'not_equals':
      return String(actual ?? '') !== String(expected ?? '')
    case 'contains':
      return String(actual ?? '').toLowerCase().includes(String(expected ?? '').toLowerCase())
    case 'gt':
      return asNumber(actual) != null && asNumber(actual) > asNumber(expected)
    case 'gte':
      return asNumber(actual) != null && asNumber(actual) >= asNumber(expected)
    case 'lt':
      return asNumber(actual) != null && asNumber(actual) < asNumber(expected)
    case 'lte':
      return asNumber(actual) != null && asNumber(actual) <= asNumber(expected)
    case 'exists':
      return actual != null && actual !== ''
    default:
      return false
  }
}

function required(config, key, label) {
  if (!String(config?.[key] ?? '').trim()) return `${label} is required.`
  return null
}

export function nodeConfigErrors(node) {
  const config = node.data?.config || {}
  const typeKey = node.data?.typeKey
  const name = node.data?.label || 'Node'

  const checks = {
    webhook: [required(config, 'endpoint', `${name}: endpoint name`)],
    form: [required(config, 'formName', `${name}: form name`)],
    schedule: [required(config, 'interval', `${name}: schedule`)],
    email: [
      required(config, 'recipient', `${name} requires a recipient`),
      required(config, 'subject', `${name} requires a subject`),
    ],
    slack: [
      required(config, 'channel', `${name} requires a channel`),
      required(config, 'message', `${name} requires a message`),
    ],
    http: [required(config, 'url', `${name} requires a URL`)],
    notification: [required(config, 'title', `${name} requires a title`)],
    condition: [
      required(config, 'field', `${name} requires a field`),
      required(config, 'operator', `${name} requires an operator`),
    ],
    filter: [
      required(config, 'field', `${name} requires a field`),
      required(config, 'operator', `${name} requires an operator`),
    ],
    format: [
      required(config, 'inputField', `${name} requires an input field`),
      required(config, 'transformType', `${name} requires a transformation type`),
    ],
    extract: [
      required(config, 'inputField', `${name} requires an input field`),
      required(config, 'outputField', `${name} requires an output field`),
    ],
    convert: [
      required(config, 'inputField', `${name} requires an input field`),
      required(config, 'convertType', `${name} requires a conversion type`),
    ],
  }

  return (checks[typeKey] || []).filter(Boolean)
}

export function reachableFromTriggers(nodes, edges) {
  const triggers = nodes.filter((node) => node.data?.category === 'trigger')
  const outgoing = new Map()
  edges.forEach((edge) => {
    const list = outgoing.get(edge.source) || []
    list.push(edge)
    outgoing.set(edge.source, list)
  })

  const seen = new Set()
  const queue = triggers.map((node) => node.id)
  queue.forEach((id) => seen.add(id))

  while (queue.length) {
    const id = queue.shift()
    for (const edge of outgoing.get(id) || []) {
      if (!seen.has(edge.target)) {
        seen.add(edge.target)
        queue.push(edge.target)
      }
    }
  }

  return seen
}

export function validateWorkflow(nodes, edges) {
  const errors = []
  if (!nodes.length) {
    return { ok: false, errors: ['Workflow cannot run: add at least one node.'] }
  }

  const triggers = nodes.filter((node) => node.data?.category === 'trigger')
  if (!triggers.length) {
    errors.push('Workflow cannot run: add a trigger node.')
  }

  const incoming = new Set(edges.map((edge) => edge.target))
  const start = triggers.find((node) => !incoming.has(node.id)) || triggers[0]
  if (triggers.length && !start) {
    errors.push('Workflow cannot run: no valid starting point.')
  }

  if (nodes.length > 1 && !edges.length) {
    errors.push('Connect your nodes before running the workflow.')
  }

  const reachable = reachableFromTriggers(nodes, edges)
  const disconnected = nodes.filter(
    (node) => node.data?.category !== 'trigger' && !reachable.has(node.id)
  )
  if (disconnected.length) {
    errors.push(
      `Disconnected node${disconnected.length > 1 ? 's' : ''}: ${disconnected
        .map((node) => node.data?.label || node.id)
        .join(', ')}.`
    )
  }

  nodes.forEach((node) => {
    errors.push(...nodeConfigErrors(node))
  })

  return { ok: errors.length === 0, errors }
}
