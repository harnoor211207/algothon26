import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from '@xyflow/react'
import { ArrowLeft, Download, Play, Save, Upload } from 'lucide-react'
import { NodePalette } from '../components/NodePalette'
import { PropertiesPanel } from '../components/PropertiesPanel'
import { ExecutionPanel } from '../components/ExecutionPanel'
import { getCatalogItem } from '../data/nodeCatalog'
import { nodeTypes } from '../nodes/FlowNodes'
import { runWorkflow } from '../utils/executionEngine'
import { clone, createId } from '../utils/helpers'
import { validateWorkflow } from '../utils/validation'
import '@xyflow/react/dist/style.css'

function BuilderCanvas({ workflow, store, onBack, onOpen }) {
  const { screenToFlowPosition, fitView } = useReactFlow()
  const [name, setName] = useState(workflow.name)
  const [status, setStatus] = useState(workflow.status)
  const [nodes, setNodes, onNodesChange] = useNodesState(workflow.nodes || [])
  const [edges, setEdges, onEdgesChange] = useEdgesState(workflow.edges || [])
  const [selectedId, setSelectedId] = useState(null)
  const [execution, setExecution] = useState(null)
  const [errors, setErrors] = useState([])
  const [running, setRunning] = useState(false)
  const [saving, setSaving] = useState(false)
  const importRef = useRef(null)

  const selected = nodes.find((node) => node.id === selectedId) || null

  useEffect(() => {
    setName(workflow.name)
    setStatus(workflow.status)
    setNodes(workflow.nodes || [])
    setEdges(workflow.edges || [])
    setSelectedId(null)
    setExecution(null)
    setErrors([])
  }, [workflow.id, setEdges, setNodes])

  const persistGraph = useCallback(
    (patch = {}) => {
      store.updateWorkflow(workflow.id, {
        name,
        status,
        nodes,
        edges,
        ...patch,
      })
    },
    [edges, name, nodes, status, store, workflow.id]
  )

  const addNodeAt = useCallback(
    (typeKey, position) => {
      const item = getCatalogItem(typeKey)
      if (!item) return
      const node = {
        id: createId('node'),
        type: item.category,
        position,
        data: {
          typeKey: item.id,
          label: item.title,
          description: item.description,
          category: item.category,
          config: { ...item.defaults },
        },
      }
      setNodes((current) => [...current, node])
      setSelectedId(node.id)
    },
    [setNodes]
  )

  const addNode = useCallback(
    (typeKey) => {
      addNodeAt(typeKey, {
        x: 240 + (nodes.length % 4) * 36,
        y: 80 + nodes.length * 28,
      })
    },
    [addNodeAt, nodes.length]
  )

  const onConnect = useCallback(
    (connection) => {
      setEdges((current) =>
        addEdge(
          {
            ...connection,
            type: 'smoothstep',
            animated: true,
          },
          current
        )
      )
    },
    [setEdges]
  )

  const onDrop = useCallback(
    (event) => {
      event.preventDefault()
      const typeKey = event.dataTransfer.getData('application/flowpilot')
      if (!typeKey) return
      addNodeAt(typeKey, screenToFlowPosition({ x: event.clientX, y: event.clientY }))
    },
    [addNodeAt, screenToFlowPosition]
  )

  const updateSelected = useCallback(
    (config, extra = {}) => {
      if (!selectedId) return
      setNodes((current) =>
        current.map((node) =>
          node.id === selectedId
            ? { ...node, data: { ...node.data, ...extra, config } }
            : node
        )
      )
    },
    [selectedId, setNodes]
  )

  const deleteSelected = useCallback(() => {
    if (!selectedId) return
    setNodes((current) => current.filter((node) => node.id !== selectedId))
    setEdges((current) => current.filter((edge) => edge.source !== selectedId && edge.target !== selectedId))
    setSelectedId(null)
  }, [selectedId, setEdges, setNodes])

  const duplicateSelected = useCallback(() => {
    const node = nodes.find((item) => item.id === selectedId)
    if (!node) return
    const copy = {
      ...clone(node),
      id: createId('node'),
      position: { x: node.position.x + 48, y: node.position.y + 48 },
      selected: false,
    }
    setNodes((current) => [...current, copy])
    setSelectedId(copy.id)
  }, [nodes, selectedId, setNodes])

  const save = useCallback(() => {
    setSaving(true)
    persistGraph({ name, status: 'active' })
    store.pushToast('success', 'Workflow saved')
    setTimeout(() => setSaving(false), 400)
  }, [name, persistGraph, status, store])

  const applyRuntime = useCallback(
    (live) => {
      const statusByNode = Object.fromEntries((live.steps || []).map((step) => [step.nodeId, step.status.toLowerCase()]))
      setNodes((current) =>
        current.map((node) => ({
          ...node,
          data: { ...node.data, runtimeStatus: statusByNode[node.id] || null },
        }))
      )
    },
    [setNodes]
  )

  const execute = useCallback(async () => {
    const validation = validateWorkflow(nodes, edges)
    if (!validation.ok) {
      setErrors(validation.errors)
      setExecution(null)
      store.pushToast('error', validation.errors[0])
      return
    }
    setErrors([])
    setRunning(true)
    persistGraph()
    const result = await runWorkflow({
      nodes,
      edges,
      onUpdate: (live) => {
        setExecution(live)
        applyRuntime(live)
      },
    })
    store.recordExecution(workflow.id, result)
    setRunning(false)
    store.pushToast(result.status === 'SUCCESS' ? 'success' : 'error', `Workflow ${result.status.toLowerCase()}`)
  }, [applyRuntime, edges, nodes, persistGraph, store, workflow.id])

  useEffect(() => {
    const onKey = (event) => {
      const tag = event.target.tagName
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
          event.preventDefault()
          save()
        }
        return
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        save()
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'd') {
        event.preventDefault()
        duplicateSelected()
      }
      if (event.key === 'Delete' || event.key === 'Backspace') deleteSelected()
      if (event.key === 'Escape') setSelectedId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [deleteSelected, duplicateSelected, save])

  const defaultEdgeOptions = useMemo(
    () => ({
      type: 'smoothstep',
      animated: true,
    }),
    []
  )

  return (
    <div className="fp-builder">
      <header className="fp-builder-bar">
        <button type="button" className="fp-btn ghost" onClick={onBack}>
          <ArrowLeft size={16} />
          Back
        </button>
        <input
          className="fp-name-input"
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-label="Workflow name"
        />
        <button
          type="button"
          className={`fp-pill toggle ${status}`}
          onClick={() => setStatus((current) => (current === 'active' ? 'draft' : 'active'))}
        >
          {status}
        </button>
        <div className="fp-builder-actions">
          <button type="button" className="fp-btn ghost" onClick={() => importRef.current?.click()} title="Import workflow">
            <Upload size={15} />
            Import
          </button>
          <button
            type="button"
            className="fp-btn ghost"
            onClick={() => store.exportWorkflow({ ...workflow, name, status, nodes, edges })}
            title="Export workflow"
          >
            <Download size={15} />
            Export
          </button>
          <button type="button" className="fp-btn ghost" onClick={save} disabled={saving}>
            <Save size={15} />
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button type="button" className="fp-btn ghost" onClick={execute} disabled={running}>
            Test Run
          </button>
          <button type="button" className="fp-btn primary" onClick={execute} disabled={running}>
            <Play size={15} />
            {running ? 'Running…' : 'Run Workflow'}
          </button>
        </div>
        <input
          ref={importRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={async (event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (!file) return
            const created = await store.importWorkflow(file)
            if (created) {
              store.updateWorkflow(workflow.id, { name, status, nodes, edges })
              onOpen?.(created.id)
            }
          }}
        />
      </header>

      <div className="fp-builder-body">
        <NodePalette onAdd={addNode} />
        <div className="fp-canvas" onDragOver={(event) => event.preventDefault()} onDrop={onDrop}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            onNodeClick={(_, node) => setSelectedId(node.id)}
            onPaneClick={() => setSelectedId(null)}
            onSelectionChange={({ nodes: selectedNodes }) => {
              if (selectedNodes[0]) setSelectedId(selectedNodes[0].id)
            }}
            fitView
            deleteKeyCode={['Delete', 'Backspace']}
          >
            <Background gap={18} color="#eadfd6" />
            <MiniMap pannable zoomable />
            <Controls showInteractive={false} />
          </ReactFlow>
          <button type="button" className="fp-fit" onClick={() => fitView({ padding: 0.2 })}>
            Fit View
          </button>
        </div>
        <aside className="fp-builder-side">
          <PropertiesPanel
            node={selected}
            onChange={updateSelected}
            onDuplicate={duplicateSelected}
            onDelete={deleteSelected}
          />
          <ExecutionPanel execution={execution} errors={errors} />
        </aside>
      </div>
    </div>
  )
}

export function WorkflowBuilder(props) {
  return (
    <ReactFlowProvider>
      <BuilderCanvas {...props} />
    </ReactFlowProvider>
  )
}
