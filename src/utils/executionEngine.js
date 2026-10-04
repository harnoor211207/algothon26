import { createId, getByPath, interpolate, nowIso, setByPath } from './helpers'
import { evaluateCondition, validateWorkflow } from './validation'

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function parsePayload(raw, fallback) {
  if (!raw) return fallback
  try {
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function outgoingEdges(edges, nodeId) {
  return edges.filter((edge) => edge.source === nodeId)
}

function nextEdges(node, edges, result) {
  const outs = outgoingEdges(edges, node.id)
  if (node.data?.typeKey === 'condition') {
    const handle = result.branch ? 'true' : 'false'
    const matched = outs.filter((edge) => edge.sourceHandle === handle)
    if (matched.length) return matched
    return outs.filter((edge) => !edge.sourceHandle)
  }
  if (node.data?.typeKey === 'filter' && !result.passed) return []
  return outs
}

function applyTransform(data, node) {
  const config = node.data.config || {}
  const typeKey = node.data.typeKey
  const input = getByPath(data, config.inputField)

  if (typeKey === 'format') {
    const text = String(input ?? '')
    const transformed = {
      uppercase: text.toUpperCase(),
      lowercase: text.toLowerCase(),
      trim: text.trim(),
      titlecase: text
        .toLowerCase()
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0].toUpperCase() + part.slice(1))
        .join(' '),
    }[config.transformType] ?? text
    const outputField = config.outputField || config.inputField
    return {
      data: setByPath(data, outputField, transformed),
      log: `Formatted ${config.inputField} → ${outputField} (${config.transformType})`,
    }
  }

  if (typeKey === 'extract') {
    return {
      data: setByPath(data, config.outputField, input),
      log: `Extracted ${config.inputField} into ${config.outputField}`,
    }
  }

  const converted = {
    number: Number(input),
    string: String(input ?? ''),
    boolean: Boolean(input),
    json: JSON.stringify(input ?? null),
  }[config.convertType] ?? input

  return {
    data: setByPath(data, config.outputField || config.inputField, converted),
    log: `Converted ${config.inputField} to ${config.convertType}`,
  }
}

function executeNode(node, data) {
  const config = node.data.config || {}
  const typeKey = node.data.typeKey

  if (typeKey === 'webhook') {
    const payload = parsePayload(config.samplePayload, {
      lead: { name: 'Ava Chen', email: 'ava@acme.com', company: 'Acme Labs', score: 86 },
    })
    return {
      data: { ...data, ...payload },
      log: `Webhook received on ${config.endpoint || '/hooks'} (simulated)`,
    }
  }

  if (typeKey === 'form') {
    const payload = parsePayload(config.samplePayload, {
      form: { name: 'Jordan Blake', email: 'jordan@example.com', message: 'Need a demo' },
    })
    return {
      data: { ...data, ...payload },
      log: `Form submitted: ${config.formName || 'Untitled form'} (simulated)`,
    }
  }

  if (typeKey === 'schedule') {
    const payload = parsePayload(config.samplePayload, {
      schedule: { firedAt: nowIso(), reason: config.interval },
    })
    return {
      data: { ...data, ...payload },
      log: `Schedule fired (${config.interval}) (simulated)`,
    }
  }

  if (typeKey === 'condition') {
    const passed = evaluateCondition(data, config)
    return {
      data,
      branch: passed,
      log: `Condition evaluated: ${passed} (${config.field} ${config.operator} ${config.value ?? ''})`,
    }
  }

  if (typeKey === 'filter') {
    const passed = evaluateCondition(data, config)
    return {
      data,
      passed,
      log: passed
        ? `Filter matched (${config.field})`
        : `Filter blocked remaining steps (${config.field})`,
    }
  }

  if (['format', 'extract', 'convert'].includes(typeKey)) {
    return applyTransform(data, node)
  }

  if (typeKey === 'email') {
    const recipient = interpolate(config.recipient, data)
    const subject = interpolate(config.subject, data)
    return {
      data,
      log: `Email queued to ${recipient} — "${subject}" (simulated)`,
    }
  }

  if (typeKey === 'slack') {
    const channel = interpolate(config.channel, data)
    const message = interpolate(config.message, data)
    return {
      data,
      log: `Slack message posted to ${channel}: ${message} (simulated)`,
    }
  }

  if (typeKey === 'http') {
    const url = interpolate(config.url, data)
    return {
      data: setByPath(data, 'http.lastResponse', { status: 200, ok: true, url }),
      log: `${config.method || 'POST'} ${url} → 200 OK (simulated)`,
    }
  }

  if (typeKey === 'notification') {
    return {
      data,
      log: `Notification created: ${interpolate(config.title, data)} (simulated)`,
    }
  }

  return { data, log: `${node.data.label} executed` }
}

export async function runWorkflow({ nodes, edges, onUpdate }) {
  const startedAt = Date.now()
  const validation = validateWorkflow(nodes, edges)
  const executionId = createId('run')
  const nodeMap = new Map(nodes.map((node) => [node.id, node]))
  const incoming = new Set(edges.map((edge) => edge.target))
  const trigger = nodes.find((node) => node.data?.category === 'trigger' && !incoming.has(node.id))
    || nodes.find((node) => node.data?.category === 'trigger')

  const orderedIds = []
  if (trigger) {
    const seen = new Set()
    const stack = [trigger.id]
    while (stack.length) {
      const id = stack.shift()
      if (seen.has(id)) continue
      seen.add(id)
      orderedIds.push(id)
      outgoingEdges(edges, id).forEach((edge) => stack.push(edge.target))
    }
  }

  let steps = orderedIds.map((id) => {
    const node = nodeMap.get(id)
    return {
      nodeId: id,
      nodeName: node?.data?.label || id,
      nodeType: node?.data?.typeKey,
      status: 'WAITING',
      log: '',
      startedAt: null,
      finishedAt: null,
      durationMs: null,
    }
  })

  const emit = (status, extra = {}) => {
    onUpdate?.({
      id: executionId,
      status,
      startedAt: new Date(startedAt).toISOString(),
      finishedAt: extra.finishedAt || null,
      durationMs: extra.durationMs ?? Date.now() - startedAt,
      steps,
      errors: extra.errors || [],
    })
  }

  const finish = (status, extra = {}) => {
    const payload = {
      id: executionId,
      status,
      startedAt: new Date(startedAt).toISOString(),
      finishedAt: extra.finishedAt || nowIso(),
      durationMs: extra.durationMs ?? Date.now() - startedAt,
      steps,
      errors: extra.errors || [],
    }
    onUpdate?.(payload)
    return payload
  }

  if (!validation.ok) {
    return finish('FAILED', { errors: validation.errors })
  }

  emit('RUNNING')
  let data = {}
  let failed = false
  let cursor = trigger

  while (cursor) {
    const index = steps.findIndex((step) => step.nodeId === cursor.id)
    const t0 = Date.now()
    if (index >= 0) {
      steps = steps.map((step, i) =>
        i === index ? { ...step, status: 'RUNNING', startedAt: nowIso() } : step
      )
      emit('RUNNING')
    }

    await wait(650)
    let result
    try {
      result = executeNode(cursor, data)
    } catch (error) {
      failed = true
      result = { data, log: error.message || 'Node failed' }
    }

    data = result.data
    if (index >= 0) {
      steps = steps.map((step, i) =>
        i === index
          ? {
              ...step,
              status: failed ? 'FAILED' : 'SUCCESS',
              log: result.log,
              finishedAt: nowIso(),
              durationMs: Date.now() - t0,
              output: data,
            }
          : step
      )
      emit(failed ? 'FAILED' : 'RUNNING')
    }

    if (failed) break

    const nxt = nextEdges(cursor, edges, result)
    if (!nxt.length) {
      if (cursor.data?.typeKey === 'condition' && result.branch === false) {
        steps = steps.map((step) =>
          step.status === 'WAITING'
            ? { ...step, status: 'SKIPPED', log: 'Skipped — condition was false' }
            : step
        )
      }
      if (cursor.data?.typeKey === 'filter' && result.passed === false) {
        steps = steps.map((step) =>
          step.status === 'WAITING'
            ? { ...step, status: 'SKIPPED', log: 'Skipped — filter did not match' }
            : step
        )
      }
      break
    }
    cursor = nodeMap.get(nxt[0].target)
  }

  steps = steps.map((step) =>
    step.status === 'WAITING' ? { ...step, status: 'SKIPPED', log: 'Not reached in this run' } : step
  )

  return finish(failed ? 'FAILED' : 'SUCCESS', {
    errors: failed ? ['A node failed during execution.'] : [],
  })
}
