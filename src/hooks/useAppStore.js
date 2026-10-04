import { useCallback, useMemo, useState } from 'react'
import { TEMPLATES, buildTemplateGraph } from '../data/templates'
import { clone, createId, downloadJson, nowIso } from '../utils/helpers'
import { isValidImportedWorkflow, loadState, persist, resetState } from '../utils/storage'

export function useAppStore() {
  const [state, setState] = useState(() => loadState())
  const [toasts, setToasts] = useState([])

  const commit = useCallback((updater) => {
    setState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      persist(next)
      return next
    })
  }, [])

  const pushToast = useCallback((tone, message) => {
    const id = createId('toast')
    setToasts((prev) => [...prev, { id, tone, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, 3200)
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const createWorkflow = useCallback((partial = {}) => {
    const workflow = {
      id: createId('wf'),
      name: partial.name || 'Untitled workflow',
      description: partial.description || 'A new FlowPilot automation',
      status: 'draft',
      nodes: partial.nodes || [],
      edges: partial.edges || [],
      createdAt: nowIso(),
      updatedAt: nowIso(),
      lastRunAt: null,
      lastRunStatus: null,
    }
    commit((prev) => ({ ...prev, workflows: [workflow, ...prev.workflows] }))
    return workflow
  }, [commit])

  const createFromTemplate = useCallback((templateId) => {
    const template = TEMPLATES.find((item) => item.id === templateId)
    const graph = buildTemplateGraph(template.kind)
    return createWorkflow({
      name: template.name,
      description: template.description,
      nodes: graph.nodes,
      edges: graph.edges,
    })
  }, [createWorkflow])

  const updateWorkflow = useCallback((id, patch) => {
    commit((prev) => ({
      ...prev,
      workflows: prev.workflows.map((workflow) =>
        workflow.id === id ? { ...workflow, ...patch, updatedAt: nowIso() } : workflow
      ),
    }))
  }, [commit])

  const deleteWorkflow = useCallback((id) => {
    commit((prev) => ({
      ...prev,
      workflows: prev.workflows.filter((workflow) => workflow.id !== id),
    }))
  }, [commit])

  const recordExecution = useCallback((workflowId, execution) => {
    commit((prev) => {
      const workflows = prev.workflows.map((workflow) =>
        workflow.id === workflowId
          ? {
              ...workflow,
              lastRunAt: execution.startedAt,
              lastRunStatus: execution.status === 'SUCCESS' ? 'success' : 'failed',
              updatedAt: nowIso(),
            }
          : workflow
      )
      const workflow = workflows.find((item) => item.id === workflowId)
      const record = {
        ...execution,
        workflowId,
        workflowName: workflow?.name || 'Untitled workflow',
        stepCount: execution.steps?.length || 0,
      }
      return {
        ...prev,
        workflows,
        executions: [record, ...prev.executions].slice(0, 80),
      }
    })
  }, [commit])

  const exportWorkflow = useCallback((workflow) => {
    downloadJson(`${workflow.name.replace(/\s+/g, '-').toLowerCase()}.flowpilot.json`, {
      version: 1,
      exportedAt: nowIso(),
      workflow: {
        name: workflow.name,
        description: workflow.description,
        status: workflow.status,
        nodes: workflow.nodes,
        edges: workflow.edges,
      },
    })
    pushToast('success', 'Workflow exported')
  }, [pushToast])

  const importWorkflow = useCallback(async (file) => {
    const text = await file.text()
    let parsed
    try {
      parsed = JSON.parse(text)
    } catch {
      pushToast('error', 'Could not parse JSON file.')
      return null
    }
    const result = isValidImportedWorkflow(parsed)
    if (!result.ok) {
      pushToast('error', result.error)
      return null
    }
    const created = createWorkflow({
      name: result.workflow.name,
      description: result.workflow.description || 'Imported workflow',
      nodes: clone(result.workflow.nodes),
      edges: clone(result.workflow.edges),
    })
    pushToast('success', 'Workflow imported')
    return created
  }, [createWorkflow, pushToast])

  const updateSettings = useCallback((patch) => {
    commit((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }))
  }, [commit])

  const reset = useCallback(() => {
    const next = resetState()
    setState(next)
    pushToast('success', 'Workspace reset to the demo workflow')
  }, [pushToast])

  const stats = useMemo(() => {
    const successful = state.executions.filter((item) => item.status === 'SUCCESS').length
    const failed = state.executions.filter((item) => item.status === 'FAILED').length
    return {
      total: state.workflows.length,
      active: state.workflows.filter((item) => item.status === 'active').length,
      successful,
      failed,
    }
  }, [state.executions, state.workflows])

  return {
    ...state,
    stats,
    toasts,
    pushToast,
    dismissToast,
    createWorkflow,
    createFromTemplate,
    updateWorkflow,
    deleteWorkflow,
    recordExecution,
    exportWorkflow,
    importWorkflow,
    updateSettings,
    reset,
  }
}
