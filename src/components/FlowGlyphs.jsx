import { ArrowRight } from 'lucide-react'
import { getCatalogItem } from '../data/nodeCatalog'

export const TYPE_LABEL = {
  trigger: 'Trigger',
  action: 'Action',
  condition: 'Condition',
  transform: 'Transform',
}

export function orderByFlow(nodes = []) {
  return [...nodes].sort((a, b) => (a.position?.y ?? 0) - (b.position?.y ?? 0) || (a.position?.x ?? 0) - (b.position?.x ?? 0))
}

export function FlowStrip({ nodes = [], max = 7, size = 'md' }) {
  if (!nodes.length) {
    return <div className="fp-flowstrip is-empty">Empty canvas · no steps yet</div>
  }
  const ordered = orderByFlow(nodes)
  const visible = ordered.slice(0, max)
  const extra = ordered.length - visible.length
  return (
    <div className={`fp-flowstrip size-${size}`} aria-label={`${nodes.length} steps`}>
      {visible.map((node, index) => {
        const item = getCatalogItem(node.data?.typeKey)
        const Icon = item?.icon
        return (
          <span key={node.id} className="fp-flowstrip-step">
            {index > 0 ? <span className="fp-flowstrip-link" aria-hidden="true" /> : null}
            <span className={`fp-flowstrip-node tone-${node.type}`} title={node.data?.label}>
              {Icon ? <Icon size={size === 'sm' ? 11 : 13} strokeWidth={2.25} /> : null}
            </span>
          </span>
        )
      })}
      {extra > 0 ? <span className="fp-flowstrip-more">+{extra}</span> : null}
    </div>
  )
}

const TEMPLATE_TONES = ['trigger', 'action', 'condition', 'transform']

export function TemplateCard({ template, index = 0, onUse }) {
  const tone = TEMPLATE_TONES[index % TEMPLATE_TONES.length]
  const lead = orderByFlow(template.nodes || [])[0]
  const LeadIcon = getCatalogItem(lead?.data?.typeKey)?.icon
  return (
    <article className={`fp-template tone-${tone}`}>
      <div className="fp-template-top">
        <span className="fp-template-icon">{LeadIcon ? <LeadIcon size={16} /> : null}</span>
        <span className="fp-template-cat">{template.category}</span>
      </div>
      <h3>{template.name}</h3>
      <p>{template.description}</p>
      <FlowStrip nodes={template.nodes} size="sm" max={6} />
      <button type="button" className="fp-template-cta" onClick={() => onUse(template.id)}>
        Use Template
        <ArrowRight size={14} />
      </button>
    </article>
  )
}
