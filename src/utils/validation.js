import { getByPath } from './helpers.js'
import { NODE_CATEGORIES, SUPPORTED_TYPE_KEYS, supportedTypeKeySet } from './workflowModel.js'

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

const OPERATOR_IDS = new Set(OPERATORS.map((item) => item.id))
const CATEGORY_SET = new Set(NODE_CATEGORIES)
const TYPE_SET = supportedTypeKeySet()

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
      return asNumber(actual) != null && asNumber(expected) != null && asNumber(actual) > asNumber(expected)
    case 'gte':
      return asNumber(actual) != null && asNumber(expected) != null && asNumber(actual) >= asNumber(expected)
    case 'lt':
      return asNumber(actual) != null && asNumber(expected) != null && asNumber(actual) < asNumber(expected)
    case 'lte':
      return asNumber(actual) != null && asNumber(expected) != null && asNumber(actual) <= asNumber(expected)
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

  const errors = (checks[typeKey] || []).filter(Boolean)

  if ((typeKey === 'condition' || typeKey === 'filter') && config.operator && !OPERATOR_IDS.has(config.operator)) {
    errors.push(`${name}: operator "${config.operator}" is not supported.`)
  }

  if (
    (typeKey === 'condition' || typeKey === 'filter') &&
    config.operator &&
    config.operator !== 'exists' &&
    !String(config.value ?? '').trim()
  ) {
    errors.push(`${name} requires a comparison value.`)
  }

  return errors
}

export function collectOutgoing(edges) {
  const outgoing = new Map()
  edges.forEach((edge) => {
    const list = outgoing.get(edge.source) || []
    list.push(edge)
    outgoing.set(edge.source, list)
  })
  return outgoing
}

export function reachableFrom(startIds, edges) {
  const outgoing = collectOutgoing(edges)
  const seen = new Set()
  const queue = [...startIds]
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

export function reachableFromTriggers(nodes, edges) {
  const triggers = nodes.filter((node) => node.data?.category === 'trigger')
  return reachableFrom(triggers.map((node) => node.id), edges)
}

export function findStartTrigger(nodes, edges) {
  const triggers = nodes.filter((node) => node.data?.category === 'trigger')
  const incoming = new Set(edges.map((edge) => edge.target))
  const roots = triggers.filter((node) => !incoming.has(node.id))
  if (roots.length) return roots[0]
  return triggers[0] || null
}

function validateGraphShape(nodes, edges) {
  const errors = []

  if (!Array.isArray(nodes) || !Array.isArray(edges)) {
    return { ok: false, errors: ['Workflow must include nodes and edges arrays.'] }
  }

  const ids = new Set()
  nodes.forEach((node, index) => {
    if (!node || typeof node !== 'object') {
      errors.push(`Node at index ${index} is invalid.`)
      return
    }
    if (!node.id || typeof node.id !== 'string') {
      errors.push(`Node at index ${index} is missing a valid id.`)
      return
    }
    if (ids.has(node.id)) {
      errors.push(`Duplicate node id "${node.id}".`)
    }
    ids.add(node.id)

    if (!node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
      errors.push(`Node "${node.data?.label || node.id}" is missing a valid position.`)
    }

    const typeKey = node.data?.typeKey
    const category = node.data?.category
    if (!typeKey) {
      errors.push(`Node "${node.id}" is missing a type.`)
    } else if (!TYPE_SET.has(typeKey)) {
      errors.push(`Node "${node.data?.label || node.id}" uses unsupported type "${typeKey}". Supported: ${SUPPORTED_TYPE_KEYS.join(', ')}.`)
    }

    if (!category) {
      errors.push(`Node "${node.data?.label || node.id}" is missing a category.`)
    } else if (!CATEGORY_SET.has(category)) {
      errors.push(`Node "${node.data?.label || node.id}" uses unsupported category "${category}".`)
    }

    if (typeKey && category) {
      const expected = {
        webhook: 'trigger',
        form: 'trigger',
        schedule: 'trigger',
        email: 'action',
        slack: 'action',
        http: 'action',
        notification: 'action',
        condition: 'condition',
        filter: 'condition',
        format: 'transform',
        extract: 'transform',
        convert: 'transform',
      }[typeKey]
      if (expected && expected !== category) {
        errors.push(`Node "${node.data?.label || node.id}" category "${category}" does not match type "${typeKey}".`)
      }
    }
  })

  const edgeIds = new Set()
  edges.forEach((edge, index) => {
    if (!edge || typeof edge !== 'object') {
      errors.push(`Connection at index ${index} is invalid.`)
      return
    }
    if (edge.id) {
      if (edgeIds.has(edge.id)) errors.push(`Duplicate connection id "${edge.id}".`)
      edgeIds.add(edge.id)
    }
    if (!edge.source || !edge.target) {
      errors.push(`Connection at index ${index} is missing a source or target.`)
      return
    }
    if (!ids.has(edge.source)) {
      errors.push(`Connection "${edge.id || index}" references missing source node "${edge.source}".`)
    }
    if (!ids.has(edge.target)) {
      errors.push(`Connection "${edge.id || index}" references missing target node "${edge.target}".`)
    }
    if (edge.source === edge.target) {
      errors.push(`Connection "${edge.id || index}" cannot connect a node to itself.`)
    }
    const source = nodes.find((node) => node.id === edge.source)
    if (source?.data?.typeKey === 'condition' && edge.sourceHandle && !['true', 'false'].includes(edge.sourceHandle)) {
      errors.push(`Condition connection "${edge.id || index}" must use a true or false branch.`)
    }
  })

  return { ok: errors.length === 0, errors }
}

export function validateWorkflow(nodes, edges) {
  const shape = validateGraphShape(nodes, edges)
  const errors = [...shape.errors]

  if (!Array.isArray(nodes) || !nodes.length) {
    return { ok: false, errors: errors.length ? errors : ['Workflow cannot run: add at least one node.'] }
  }

  const triggers = nodes.filter((node) => node.data?.category === 'trigger')
  if (!triggers.length) {
    errors.push('Workflow cannot run: add a trigger node.')
  }

  const incoming = new Set((edges || []).map((edge) => edge.target))
  const startTriggers = triggers.filter((node) => !incoming.has(node.id))
  if (triggers.length && !startTriggers.length && !findStartTrigger(nodes, edges)) {
    errors.push('Workflow cannot run: no valid starting point.')
  }
  if (startTriggers.length > 1) {
    errors.push('Workflow cannot run: connect from a single starting trigger.')
  }

  if (nodes.length > 1 && !(edges || []).length) {
    errors.push('Connect your nodes before running the workflow.')
  }

  const reachable = reachableFromTriggers(nodes, edges || [])
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

export function validateImportedWorkflow(workflow) {
  if (!workflow || typeof workflow !== 'object' || Array.isArray(workflow)) {
    return { ok: false, errors: ['Imported workflow is missing a valid object.'] }
  }
  if (!String(workflow.name || '').trim()) {
    return { ok: false, errors: ['Imported workflow is missing a name.'] }
  }
  if (!Array.isArray(workflow.nodes) || !Array.isArray(workflow.edges)) {
    return { ok: false, errors: ['Imported workflow must include nodes and edges arrays.'] }
  }
  return validateWorkflow(workflow.nodes, workflow.edges)
}
