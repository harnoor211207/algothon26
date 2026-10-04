import { Activity, AlertTriangle, CheckCircle2, Plus, Workflow } from 'lucide-react'
import { TEMPLATES } from '../data/templates'
import { EmptyState } from '../components/Feedback'
import { formatDate } from '../utils/helpers'

export function Dashboard({ store, onCreate, onOpen, onTemplates, onUseTemplate }) {
  const { workflows, stats, settings } = store

  return (
    <div className="fp-page">
      <section className="fp-hero">
        <div>
          <p className="fp-kicker">Workspace</p>
          <h1>
            {greetingText()}, {settings.displayName}
          </h1>
          <p>Design visual automations, connect the steps, and execute them with a live run log.</p>
        </div>
        <button type="button" className="fp-btn primary lg" onClick={onCreate}>
          <Plus size={18} />
          Create Workflow
        </button>
      </section>

      <section className="fp-stats">
        <Stat icon={Workflow} label="Total Workflows" value={stats.total} />
        <Stat icon={Activity} label="Active Workflows" value={stats.active} />
        <Stat icon={CheckCircle2} label="Successful Runs" value={stats.successful} />
        <Stat icon={AlertTriangle} label="Failed Runs" value={stats.failed} />
      </section>

      <section className="fp-section">
        <div className="fp-section-head">
          <h2>Recent workflows</h2>
        </div>
        {workflows.length === 0 ? (
          <EmptyState
            title="No workflows yet"
            message="Create a blank workflow or start from a template to see the canvas."
            action={
              <button type="button" className="fp-btn primary" onClick={onCreate}>
                Create Workflow
              </button>
            }
          />
        ) : (
          <div className="fp-card-grid">
            {workflows.map((workflow) => (
              <article key={workflow.id} className="fp-card">
                <div className="fp-card-top">
                  <h3>{workflow.name}</h3>
                  <span className={`fp-pill ${workflow.status}`}>{workflow.status}</span>
                </div>
                <p>{workflow.description}</p>
                <dl>
                  <div>
                    <dt>Nodes</dt>
                    <dd>{workflow.nodes?.length || 0}</dd>
                  </div>
                  <div>
                    <dt>Last run</dt>
                    <dd>{formatDate(workflow.lastRunAt)}</dd>
                  </div>
                  <div>
                    <dt>Result</dt>
                    <dd className={workflow.lastRunStatus || 'muted'}>
                      {workflow.lastRunStatus || 'Not run'}
                    </dd>
                  </div>
                </dl>
                <button type="button" className="fp-btn ghost" onClick={() => onOpen(workflow.id)}>
                  Open
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="fp-section">
        <div className="fp-section-head">
          <h2>Create from template</h2>
          <button type="button" className="fp-link" onClick={onTemplates}>
            View all
          </button>
        </div>
        <div className="fp-card-grid compact">
          {TEMPLATES.map((template) => (
            <article key={template.id} className="fp-card">
              <p className="fp-kicker">{template.category}</p>
              <h3>{template.name}</h3>
              <p>{template.description}</p>
              <button type="button" className="fp-btn ghost" onClick={() => onUseTemplate(template.id)}>
                Use Template
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

function greetingText() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function Stat({ icon: Icon, label, value }) {
  return (
    <article className="fp-stat">
      <span>
        <Icon size={18} />
      </span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </article>
  )
}
