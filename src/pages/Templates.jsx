import { Layers } from 'lucide-react'
import { TEMPLATES } from '../data/templates'

export function TemplatesPage({ onUseTemplate }) {
  return (
    <div className="fp-page">
      <section className="fp-hero">
        <div>
          <p className="fp-kicker">Gallery</p>
          <h1>Workflow templates</h1>
          <p>Start from a proven path, then customize nodes, conditions, and messages.</p>
        </div>
      </section>
      <div className="fp-card-grid">
        {TEMPLATES.map((template) => (
          <article key={template.id} className="fp-card">
            <div className="fp-card-title">
              <span className="fp-card-icon">
                <Layers size={16} />
              </span>
              <div>
                <p className="fp-kicker" style={{ marginBottom: 2 }}>
                  {template.category}
                </p>
                <h3>{template.name}</h3>
              </div>
            </div>
            <p>{template.description}</p>
            <div className="fp-card-foot">
              <dl>
                <div>
                  <dt>Nodes</dt>
                  <dd>{template.nodeCount}</dd>
                </div>
              </dl>
              <button type="button" className="fp-btn primary" onClick={() => onUseTemplate(template.id)}>
                Use Template
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
