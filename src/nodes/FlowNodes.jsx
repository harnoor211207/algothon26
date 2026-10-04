import { Handle, Position } from '@xyflow/react'
import { CheckCircle2, CircleDashed, Clock3, Loader2, XCircle } from 'lucide-react'
import { getCatalogItem } from '../data/nodeCatalog'

const STATUS_ICON = {
  running: Loader2,
  success: CheckCircle2,
  failed: XCircle,
  skipped: CircleDashed,
  waiting: Clock3,
}

function NodeShell({ data, selected, tone, children, footer }) {
  const item = getCatalogItem(data.typeKey)
  const Icon = item?.icon
  const StatusIcon = data.runtimeStatus ? STATUS_ICON[data.runtimeStatus] : null
  return (
    <div className={`fp-node fp-node-${tone} ${selected ? 'is-selected' : ''} ${data.runtimeStatus ? `is-${data.runtimeStatus}` : ''}`}>
      {children}
      <div className="fp-node-body">
        <div className="fp-node-head">
          <span className="fp-node-icon">{Icon ? <Icon size={15} /> : null}</span>
          <div>
            <p className="fp-node-kicker">{item?.title || data.category}</p>
            <h4>{data.label}</h4>
          </div>
          {StatusIcon ? (
            <span className={`fp-node-status is-${data.runtimeStatus}`} title={data.runtimeStatus}>
              <StatusIcon size={16} />
            </span>
          ) : null}
        </div>
        <p className="fp-node-copy">{data.description}</p>
        {footer}
      </div>
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
    <NodeShell
      data={data}
      selected={selected}
      tone="condition"
      footer={
        <>
          <p className="fp-node-meta">
            {config.field || 'field'} {config.operator || '?'} {config.value || ''}
          </p>
          <div className="fp-branch-labels">
            <span className="fp-branch-true">True</span>
            <span className="fp-branch-false">False</span>
          </div>
        </>
      }
    >
      <Handle type="target" position={Position.Top} />
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
