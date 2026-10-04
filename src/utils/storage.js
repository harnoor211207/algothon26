import { buildDemoWorkflow } from '../data/templates'
import { isExecutionShape, isWorkflowShape } from './workflowModel.js'

const STORAGE_KEY = 'flowpilot:v1'
const LEGACY_KEY = 'flowpilot:v1'

export function emptyState() {
  return {
    workflows: [],
    executions: [],
    settings: { displayName: 'Automation Builder' },
    seeded: false,
  }
}

function safeParse(raw) {
  try {
    return { ok: true, value: JSON.parse(raw) }
  } catch {
    return { ok: false, error: 'Malformed localStorage JSON' }
  }
}

function recoverWorkflows(value) {
  if (!Array.isArray(value)) return null
  return value.filter(isWorkflowShape)
}

function recoverExecutions(value) {
  if (!Array.isArray(value)) return []
  return value.filter(isExecutionShape)
}

function seedState(state) {
  return {
    ...state,
    workflows: [buildDemoWorkflow()],
    seeded: true,
  }
}

export function persist(state) {
  try {
    const payload = {
      workflows: Array.isArray(state.workflows) ? state.workflows : [],
      executions: Array.isArray(state.executions) ? state.executions : [],
      settings: state.settings || { displayName: 'Automation Builder' },
      seeded: Boolean(state.seeded),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Storage can fail in private mode; the in-memory state still works for the session.
  }
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_KEY)
    if (!raw) {
      const seeded = seedState(emptyState())
      persist(seeded)
      return seeded
    }

    const parsed = safeParse(raw)
    if (!parsed.ok) {
      const seeded = seedState(emptyState())
      persist(seeded)
      return seeded
    }

    const workflows = recoverWorkflows(parsed.value?.workflows)
    if (!workflows) {
      const seeded = seedState(emptyState())
      persist(seeded)
      return seeded
    }

    return {
      workflows,
      executions: recoverExecutions(parsed.value?.executions),
      settings: parsed.value?.settings && typeof parsed.value.settings === 'object'
        ? { displayName: 'Automation Builder', ...parsed.value.settings }
        : { displayName: 'Automation Builder' },
      seeded: Boolean(parsed.value?.seeded),
    }
  } catch {
    const seeded = seedState(emptyState())
    persist(seeded)
    return seeded
  }
}

export function resetState() {
  const next = seedState(emptyState())
  persist(next)
  return next
}

export function loadWorkflows() {
  return loadState().workflows
}

export function loadExecutions() {
  return loadState().executions
}

export function saveWorkflows(workflows) {
  const state = loadState()
  persist({ ...state, workflows })
}

export function saveExecutions(executions) {
  const state = loadState()
  persist({ ...state, executions })
}

export { inspectImportedWorkflow as isValidImportedWorkflow } from './importExport.js'
