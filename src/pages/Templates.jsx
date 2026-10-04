import { TEMPLATES } from '../data/templates'
import { TemplateCard } from '../components/FlowGlyphs'

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
      <div className="fp-template-grid">
        {TEMPLATES.map((template, index) => (
          <TemplateCard key={template.id} template={template} index={index} onUse={onUseTemplate} />
        ))}
      </div>
    </div>
  )
}
