import { buildDemoWorkflow } from '../data/templates'

const STORAGE_KEY = 'flowpilot:v1'

export function emptyState() {
  return {
    workflows: [],
    executions: [],
    settings: { displayName: 'Automation Builder' },
    seeded: false,
  }
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const seeded = seedState(emptyState())
      persist(seeded)
      return seeded
    }
    const parsed = JSON.parse(raw)
    if (!parsed || !Array.isArray(parsed.workflows) || !Array.isArray(parsed.executions)) {
      const seeded = seedState(emptyState())
      persist(seeded)
      return seeded
    }
    return {
      workflows: parsed.workflows,
      executions: parsed.executions,
      settings: parsed.settings || { displayName: 'Automation Builder' },
      seeded: Boolean(parsed.seeded),
    }
  } catch {
    const seeded = seedState(emptyState())
    persist(seeded)
    return seeded
  }
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Storage can fail in private mode; the in-memory state still works for the session.
  }
}

export function resetState() {
  const next = seedState(emptyState())
  persist(next)
  return next
}

export function isValidImportedWorkflow(payload) {
  if (!payload || typeof payload !== 'object') return { ok: false, error: 'File is not a valid workflow JSON object.' }
  const workflow = payload.workflow || payload
  if (!workflow.name) return { ok: false, error: 'Imported workflow is missing a name.' }
  if (!Array.isArray(workflow.nodes) || !Array.isArray(workflow.edges)) {
    return { ok: false, error: 'Imported workflow must include nodes and edges arrays.' }
  }
  const nodesOk = workflow.nodes.every(
    (node) => node && node.id && node.position && node.data && node.data.typeKey && node.data.category
  )
  if (!nodesOk) return { ok: false, error: 'One or more imported nodes are missing required fields.' }
  const edgesOk = workflow.edges.every((edge) => edge && edge.source && edge.target)
  if (!edgesOk) return { ok: false, error: 'One or more imported edges are invalid.' }
  return { ok: true, workflow }
}
