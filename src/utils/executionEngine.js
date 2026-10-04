import { createId, getByPath, interpolate, nowIso, setByPath } from './helpers.js'
import { createExecutionLogger } from './executionLog.js'
import { EXECUTION_STATUS } from './workflowModel.js'
import { evaluateCondition, findStartTrigger, validateWorkflow } from './validation.js'

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function parseJsonObject(raw, label) {
  if (raw == null || String(raw).trim() === '') {
    return { ok: true, value: null, empty: true }
  }
  try {
    const value = JSON.parse(raw)
    return { ok: true, value, empty: false }
  } catch {
    return { ok: false, error: `${label} is not valid JSON.` }
  }
}

function outgoingEdges(edges, nodeId) {
  return edges.filter((edge) => edge.source === nodeId)
}

export function selectOutgoingEdges(node, edges, result) {
  const outs = outgoingEdges(edges, node.id)
  const typeKey = node.data?.typeKey

  if (typeKey === 'condition') {
    const handle = result.branch ? 'true' : 'false'
    const labeled = outs.filter((edge) => edge.sourceHandle === 'true' || edge.sourceHandle === 'false')
    const matched = outs.filter((edge) => edge.sourceHandle === handle)
    if (labeled.length) return matched
    return result.branch ? outs.filter((edge) => !edge.sourceHandle) : []
  }

  if (typeKey === 'filter' && !result.passed) return []
  return outs
}

function fail(message, data, extra = {}) {
  return { ok: false, data, error: message, log: message, ...extra }
}

function ok(log, data, output, extra = {}) {
  return { ok: true, data, output, log, ...extra }
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
    }[config.transformType]
    if (transformed == null) {
      return fail(`Unknown transformation type "${config.transformType}".`, data)
    }
    const outputField = config.outputField || config.inputField
    return ok(`Formatted ${config.inputField} → ${outputField} (${config.transformType})`, setByPath(data, outputField, transformed), {
      simulated: false,
      inputField: config.inputField,
      outputField,
      value: transformed,
    })
  }

  if (typeKey === 'extract') {
    if (input === undefined) {
      return fail(`Cannot extract missing field "${config.inputField}".`, data)
    }
    return ok(`Extracted ${config.inputField} into ${config.outputField}`, setByPath(data, config.outputField, input), {
      inputField: config.inputField,
      outputField: config.outputField,
      value: input,
    })
  }

  const converters = {
    number: () => {
      const num = Number(input)
      if (Number.isNaN(num)) throw new Error(`Cannot convert "${config.inputField}" to a number.`)
      return num
    },
    string: () => String(input ?? ''),
    boolean: () => Boolean(input),
    json: () => JSON.stringify(input ?? null),
  }
  const convert = converters[config.convertType]
  if (!convert) {
    return fail(`Unknown conversion type "${config.convertType}".`, data)
  }
  try {
    const converted = convert()
    const outputField = config.outputField || config.inputField
    return ok(`Converted ${config.inputField} to ${config.convertType}`, setByPath(data, outputField, converted), {
      convertType: config.convertType,
      outputField,
      value: converted,
    })
  } catch (error) {
    return fail(error.message, data)
  }
}

export function executeNode(node, data) {
  const config = node.data?.config || {}
  const typeKey = node.data?.typeKey
  const category = node.data?.category

  if (typeKey === 'webhook') {
    const parsed = parseJsonObject(config.samplePayload, 'Webhook sample payload')
    if (!parsed.ok) return fail(parsed.error, data)
    const payload = parsed.empty
      ? { lead: { name: 'Ava Chen', email: 'ava@acme.com', company: 'Acme Labs', score: 86 } }
      : parsed.value
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return fail('Webhook sample payload must be a JSON object.', data)
    }
    return ok(`Webhook received on ${config.endpoint || '/hooks'} (simulated)`, { ...data, ...payload }, {
      simulated: true,
      endpoint: config.endpoint,
      payload,
    })
  }

  if (typeKey === 'form') {
    const parsed = parseJsonObject(config.samplePayload, 'Form sample payload')
    if (!parsed.ok) return fail(parsed.error, data)
    const payload = parsed.empty
      ? { form: { name: 'Jordan Blake', email: 'jordan@example.com', message: 'Need a demo' } }
      : parsed.value
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return fail('Form sample payload must be a JSON object.', data)
    }
    return ok(`Form submitted: ${config.formName || 'Untitled form'} (simulated)`, { ...data, ...payload }, {
      simulated: true,
      formName: config.formName,
      payload,
    })
  }

  if (typeKey === 'schedule') {
    const parsed = parseJsonObject(config.samplePayload, 'Schedule sample payload')
    if (!parsed.ok) return fail(parsed.error, data)
    const payload = parsed.empty
      ? { schedule: { firedAt: nowIso(), reason: config.interval } }
      : parsed.value
    return ok(`Schedule fired (${config.interval}) (simulated)`, { ...data, ...(payload || {}) }, {
      simulated: true,
      interval: config.interval,
      payload,
    })
  }

  if (typeKey === 'condition') {
    const passed = evaluateCondition(data, config)
    return ok(
      `Condition evaluated: ${passed} (${config.field} ${config.operator} ${config.value ?? ''})`,
      data,
      { branch: passed, field: config.field, actual: getByPath(data, config.field) },
      { branch: passed }
    )
  }

  if (typeKey === 'filter') {
    const passed = evaluateCondition(data, config)
    return ok(
      passed ? `Filter matched (${config.field})` : `Filter blocked remaining steps (${config.field})`,
      data,
      { passed, field: config.field, actual: getByPath(data, config.field) },
      { passed }
    )
  }

  if (['format', 'extract', 'convert'].includes(typeKey)) {
    return applyTransform(data, node)
  }

  if (typeKey === 'email') {
    const recipient = interpolate(config.recipient, data).trim()
    const subject = interpolate(config.subject, data)
    const message = interpolate(config.message, data)
    if (!recipient || !recipient.includes('@')) {
      return fail(`Email not sent: recipient "${recipient || '(empty)'}" is invalid after resolving template fields.`, data)
    }
    return ok(`Email queued to ${recipient} — "${subject}" (simulated — no mail server contacted)`, data, {
      simulated: true,
      recipient,
      subject,
      message,
    })
  }

  if (typeKey === 'slack') {
    const channel = interpolate(config.channel, data).trim()
    const message = interpolate(config.message, data)
    if (!channel) {
      return fail('Slack message not posted: channel resolved to an empty value.', data)
    }
    return ok(`Slack message posted to ${channel}: ${message} (simulated — Slack API was not contacted)`, data, {
      simulated: true,
      channel,
      message,
    })
  }

  if (typeKey === 'http') {
    const url = interpolate(config.url, data).trim()
    const method = (config.method || 'POST').toUpperCase()
    const body = interpolate(config.body, data)
    if (!/^https?:\/\//i.test(url)) {
      return fail(`HTTP request not sent: "${url || '(empty)'}" is not a valid http(s) URL.`, data)
    }
    if (config.simulateFailure === true || /(?:^|[./])fail(?:ure)?(?:[./]|$)/i.test(url)) {
      return fail(`HTTP ${method} ${url} failed (simulated failure). No external request was made.`, data, {
        output: { simulated: true, method, url, status: 500, ok: false },
      })
    }
    if (body.trim().startsWith('{') || body.trim().startsWith('[')) {
      const parsedBody = parseJsonObject(body, 'HTTP request body')
      if (!parsedBody.ok) return fail(parsedBody.error, data)
    }
    const response = { status: 200, ok: true, url, method, simulated: true }
    return ok(
      `${method} ${url} → 200 OK (simulated — no network request was made)`,
      setByPath(data, 'http.lastResponse', response),
      response
    )
  }

  if (typeKey === 'notification') {
    const title = interpolate(config.title, data).trim()
    if (!title) {
      return fail('Notification not created: title resolved to an empty value.', data)
    }
    const body = interpolate(config.body, data)
    return ok(`Notification created: ${title} (simulated — in-app only)`, data, {
      simulated: true,
      title,
      body,
    })
  }

  return fail(
    `Cannot execute node "${node.data?.label || node.id}": unsupported type "${typeKey}" in category "${category}".`,
    data
  )
}

function createStep(node) {
  return {
    nodeId: node.id,
    nodeName: node.data?.label || node.id,
    nodeType: node.data?.typeKey,
    status: EXECUTION_STATUS.WAITING,
    log: '',
    startedAt: null,
    finishedAt: null,
    durationMs: null,
    output: null,
    error: null,
  }
}

export async function runWorkflow({ nodes, edges, onUpdate, delayMs = 650, initialData = {} } = {}) {
  const startedAt = Date.now()
  const executionId = createId('run')
  const logger = createExecutionLogger()
  const validation = validateWorkflow(nodes || [], edges || [])
  const nodeMap = new Map((nodes || []).map((node) => [node.id, node]))
  const trigger = findStartTrigger(nodes || [], edges || [])

  const orderedIds = []
  if (trigger) {
    const seen = new Set()
    const stack = [trigger.id]
    while (stack.length) {
      const id = stack.shift()
      if (seen.has(id) || !nodeMap.has(id)) continue
      seen.add(id)
      orderedIds.push(id)
      outgoingEdges(edges || [], id).forEach((edge) => stack.push(edge.target))
    }
  }

  let steps = orderedIds.map((id) => createStep(nodeMap.get(id)))
  let nodeOutputs = {}
  let nodeErrors = {}

  const emit = (status, extra = {}) => {
    onUpdate?.({
      id: executionId,
      status,
      startedAt: extra.startedAt || new Date(startedAt).toISOString(),
      finishedAt: extra.finishedAt || null,
      durationMs: extra.durationMs ?? Date.now() - startedAt,
      steps,
      logs: logger.logs,
      nodeOutputs,
      nodeErrors,
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
      logs: logger.logs,
      nodeOutputs,
      nodeErrors,
      errors: extra.errors || [],
    }
    onUpdate?.(payload)
    return payload
  }

  if (!validation.ok) {
    logger.error(validation.errors[0])
    return finish(EXECUTION_STATUS.FAILED, { errors: validation.errors })
  }

  logger.info(`Starting workflow at trigger "${trigger.data?.label || trigger.id}"`)
  emit(EXECUTION_STATUS.RUNNING)

  let data = { ...initialData }
  let failed = false
  const executed = new Set()
  const queue = [trigger.id]

  while (queue.length) {
    const currentId = queue.shift()
    if (executed.has(currentId)) continue
    const cursor = nodeMap.get(currentId)
    if (!cursor) {
      failed = true
      const message = `Execution stopped: connected node "${currentId}" does not exist.`
      logger.error(message)
      break
    }

    executed.add(currentId)
    const index = steps.findIndex((step) => step.nodeId === cursor.id)
    const t0 = Date.now()
    if (index >= 0) {
      steps = steps.map((step, i) =>
        i === index ? { ...step, status: EXECUTION_STATUS.RUNNING, startedAt: nowIso() } : step
      )
      emit(EXECUTION_STATUS.RUNNING)
    }

    if (delayMs > 0) await wait(delayMs)

    let result
    try {
      result = executeNode(cursor, data)
    } catch (error) {
      result = fail(error.message || 'Node failed', data)
    }

    if (!result.ok) {
      failed = true
      const message = result.error || result.log || 'Node failed'
      nodeErrors = { ...nodeErrors, [cursor.id]: message }
      logger.error(message, cursor.id)
      if (index >= 0) {
        steps = steps.map((step, i) =>
          i === index
            ? {
                ...step,
                status: EXECUTION_STATUS.FAILED,
                log: message,
                error: message,
                output: result.output ?? null,
                finishedAt: nowIso(),
                durationMs: Date.now() - t0,
              }
            : step
        )
      }
      emit(EXECUTION_STATUS.FAILED)
      break
    }

    data = result.data
    nodeOutputs = { ...nodeOutputs, [cursor.id]: result.output ?? null }
    logger.info(result.log, cursor.id)
    if (index >= 0) {
      steps = steps.map((step, i) =>
        i === index
          ? {
              ...step,
              status: EXECUTION_STATUS.SUCCESS,
              log: result.log,
              error: null,
              output: result.output ?? null,
              finishedAt: nowIso(),
              durationMs: Date.now() - t0,
            }
          : step
      )
      emit(EXECUTION_STATUS.RUNNING)
    }

    const nxt = selectOutgoingEdges(cursor, edges || [], result)
    nxt.forEach((edge) => {
      if (!executed.has(edge.target)) queue.push(edge.target)
    })
  }

  const skipReason = failed ? 'Skipped — a previous node failed' : 'Not reached in this run'
  steps = steps.map((step) =>
    step.status === EXECUTION_STATUS.WAITING
      ? { ...step, status: EXECUTION_STATUS.SKIPPED, log: skipReason }
      : step
  )
  steps
    .filter((step) => step.status === EXECUTION_STATUS.SKIPPED)
    .forEach((step) => logger.warn(step.log, step.nodeId))

  if (failed) logger.error('Workflow finished with errors.')
  else logger.info('Workflow finished successfully.')

  return finish(failed ? EXECUTION_STATUS.FAILED : EXECUTION_STATUS.SUCCESS, {
    errors: failed ? Object.values(nodeErrors) : [],
  })
}
