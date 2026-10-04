import { createId, nowIso } from './helpers.js'

/** UI and engine share these uppercase statuses; CSS maps them via toLowerCase(). */
export const EXECUTION_STATUS = {
  WAITING: 'WAITING',
  RUNNING: 'RUNNING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  SKIPPED: 'SKIPPED',
}

export const NODE_CATEGORIES = ['trigger', 'action', 'condition', 'transform']

export const TRIGGER_TYPE_KEYS = ['webhook', 'form', 'schedule']
export const ACTION_TYPE_KEYS = ['email', 'slack', 'http', 'notification']
export const CONDITION_TYPE_KEYS = ['condition', 'filter']
export const TRANSFORM_TYPE_KEYS = ['format', 'extract', 'convert']

export const SUPPORTED_TYPE_KEYS = [
  ...TRIGGER_TYPE_KEYS,
  ...ACTION_TYPE_KEYS,
  ...CONDITION_TYPE_KEYS,
  ...TRANSFORM_TYPE_KEYS,
]

export const WORKFLOW_EXPORT_KIND = 'flowpilot-workflow'
export const WORKFLOW_EXPORT_VERSION = 1

export function supportedTypeKeySet() {
  return new Set(SUPPORTED_TYPE_KEYS)
}

export function createEmptyWorkflow(partial = {}) {
  return {
    id: partial.id || createId('wf'),
    name: partial.name || 'Untitled workflow',
    description: partial.description || 'A new FlowPilot automation',
    status: partial.status || 'draft',
    nodes: partial.nodes || [],
    edges: partial.edges || [],
    createdAt: partial.createdAt || nowIso(),
    updatedAt: partial.updatedAt || nowIso(),
    lastRunAt: partial.lastRunAt ?? null,
    lastRunStatus: partial.lastRunStatus ?? null,
  }
}

export function createNodeFromSpec({ id, typeKey, category, label, description, config, position }) {
  return {
    id: id || createId('node'),
    type: category,
    position: position || { x: 0, y: 0 },
    data: {
      typeKey,
      label: label || typeKey,
      description: description || '',
      category,
      config: config || {},
    },
  }
}

export function createEdgeFromSpec({ id, source, target, sourceHandle }) {
  return {
    id: id || createId('edge'),
    source,
    target,
    ...(sourceHandle ? { sourceHandle } : {}),
    type: 'smoothstep',
    animated: true,
  }
}

export function isWorkflowShape(value) {
  return Boolean(
    value &&
      typeof value === 'object' &&
      typeof value.id === 'string' &&
      typeof value.name === 'string' &&
      Array.isArray(value.nodes) &&
      Array.isArray(value.edges)
  )
}

export function isExecutionShape(value) {
  return Boolean(
    value &&
      typeof value === 'object' &&
      typeof value.id === 'string' &&
      typeof value.status === 'string' &&
      Array.isArray(value.steps)
  )
}

export function summarizeRunStatus(status) {
  if (status === EXECUTION_STATUS.SUCCESS) return 'success'
  if (status === EXECUTION_STATUS.FAILED) return 'failed'
  return String(status || '').toLowerCase() || null
}
