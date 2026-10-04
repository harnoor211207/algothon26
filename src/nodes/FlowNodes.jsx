import { Handle, Position } from '@xyflow/react'
import { getCatalogItem } from '../data/nodeCatalog'

function NodeShell({ data, selected, tone, children }) {
  const item = getCatalogItem(data.typeKey)
  const Icon = item?.icon
  return (
    <div className={`fp-node fp-node-${tone} ${selected ? 'is-selected' : ''} ${data.runtimeStatus ? `is-${data.runtimeStatus}` : ''}`}>
      {children}
      <div className="fp-node-head">
        <span className="fp-node-icon">{Icon ? <Icon size={16} /> : null}</span>
        <div>
          <p className="fp-node-kicker">{item?.title || data.category}</p>
          <h4>{data.label}</h4>
        </div>
      </div>
      <p className="fp-node-copy">{data.description}</p>
    </div>
  )
}

export function TriggerNode({ data, selected }) {
  return (
    <NodeShell data={data} selected={selected} tone="trigger">
      <Handle type="source" position={Position.Bottom} />
    </NodeShell>
  )
}

export function ActionNode({ data, selected }) {
  return (
    <NodeShell data={data} selected={selected} tone="action">
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </NodeShell>
  )
}

export function ConditionNode({ data, selected }) {
  const config = data.config || {}
  return (
    <NodeShell data={data} selected={selected} tone="condition">
      <Handle type="target" position={Position.Top} />
      <p className="fp-node-meta">
        {config.field || 'field'} {config.operator || '?'} {config.value || ''}
      </p>
      <div className="fp-branch-labels">
        <span>True</span>
        <span>False</span>
      </div>
      <Handle type="source" position={Position.Bottom} id="true" style={{ left: '28%' }} />
      <Handle type="source" position={Position.Bottom} id="false" style={{ left: '72%' }} />
    </NodeShell>
  )
}

export function TransformNode({ data, selected }) {
  return (
    <NodeShell data={data} selected={selected} tone="transform">
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </NodeShell>
  )
}

export const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
  transform: TransformNode,
}
