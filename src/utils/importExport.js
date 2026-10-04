import { nowIso } from './helpers.js'
import { createEmptyWorkflow, WORKFLOW_EXPORT_KIND, WORKFLOW_EXPORT_VERSION } from './workflowModel.js'
import { validateImportedWorkflow } from './validation.js'

export function serializeWorkflow(workflow) {
  return {
    kind: WORKFLOW_EXPORT_KIND,
    version: WORKFLOW_EXPORT_VERSION,
    exportedAt: nowIso(),
    workflow: {
      name: workflow.name,
      description: workflow.description,
      status: workflow.status,
      nodes: workflow.nodes || [],
      edges: workflow.edges || [],
    },
  }
}

export function parseWorkflowJsonText(text) {
  if (text == null || String(text).trim() === '') {
    return { ok: false, error: 'Imported file is empty.' }
  }
  try {
    return { ok: true, value: JSON.parse(text) }
  } catch {
    return { ok: false, error: 'Could not parse JSON file. Check for trailing commas or invalid syntax.' }
  }
}

export function inspectImportedWorkflow(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { ok: false, error: 'File is not a valid workflow JSON object.' }
  }

  if (payload.kind && payload.kind !== WORKFLOW_EXPORT_KIND) {
    return { ok: false, error: `Incompatible file kind "${payload.kind}". Expected ${WORKFLOW_EXPORT_KIND}.` }
  }

  if (payload.version != null && Number(payload.version) !== WORKFLOW_EXPORT_VERSION) {
    return { ok: false, error: `Unsupported export version ${payload.version}. Expected ${WORKFLOW_EXPORT_VERSION}.` }
  }

  const workflow = payload.workflow || payload
  const validation = validateImportedWorkflow(workflow)
  if (!validation.ok) {
    return { ok: false, error: validation.errors[0], errors: validation.errors }
  }

  return { ok: true, workflow }
}

export function workflowFromImport(imported, extras = {}) {
  return createEmptyWorkflow({
    name: imported.name,
    description: imported.description || 'Imported workflow',
    status: imported.status === 'active' ? 'active' : 'draft',
    nodes: extras.nodes ?? imported.nodes,
    edges: extras.edges ?? imported.edges,
  })
}
