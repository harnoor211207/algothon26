import { Activity, AlertTriangle, ArrowRight, CheckCircle2, Clock3, History, Plus, Workflow } from 'lucide-react'
import { TEMPLATES } from '../data/templates'
import { EmptyState } from '../components/Feedback'
import { FlowStrip, TemplateCard, TYPE_LABEL } from '../components/FlowGlyphs'
import { formatDate, formatDuration } from '../utils/helpers'

const TYPE_ORDER = ['trigger', 'transform', 'action', 'condition']

function percent(part, whole) {
  return whole ? Math.round((part / whole) * 100) : 0
}

export function Dashboard({ store, onCreate, onOpen, onTemplates, onUseTemplate }) {
  const { workflows, stats, settings, executions = [] } = store
  const allNodes = workflows.flatMap((workflow) => workflow.nodes || [])
  const totalRuns = stats.successful + stats.failed

  const composition = TYPE_ORDER.map((type) => ({
    type,
    count: allNodes.filter((node) => node.type === type).length,
  }))

  const recentRuns = [...executions]
    .sort((a, b) => new Date(b.startedAt || 0) - new Date(a.startedAt || 0))
    .slice(0, 5)

  return (
    <div className="fp-page fp-dashboard">
      <section className="fp-hero">
        <div>
          <p className="fp-kicker">
            <span className="fp-status-dot" aria-hidden="true" />
            Engine ready · local workspace
          </p>

          <h1>
            {greetingText()}, {settings.displayName}
          </h1>

          <p>
            Connect triggers, transforms, conditions and actions — then watch every step execute live.
          </p>
        </div>

        <button type="button" className="fp-btn primary lg" onClick={onCreate}>
          <Plus size={16} />
          Create Workflow
        </button>
      </section>

      <section className="fp-stats" aria-label="Workspace stats">
        <Stat
          icon={Workflow}
          label="Total Workflows"
          value={stats.total}
          tone="trigger"
          note={`${allNodes.length} nodes on canvas`}
        />

        <Stat
          icon={Activity}
          label="Active Workflows"
          value={stats.active}
          tone="action"
          meter={percent(stats.active, stats.total)}
          note={
            stats.total
              ? `${percent(stats.active, stats.total)}% of workflows live`
              : 'No workflows yet'
          }
        />

        <Stat
          icon={CheckCircle2}
          label="Successful Runs"
          value={stats.successful}
          tone="success"
          meter={percent(stats.successful, totalRuns)}
          note={
            totalRuns
              ? `${percent(stats.successful, totalRuns)}% success rate`
              : 'No runs yet'
          }
        />

        <Stat
          icon={AlertTriangle}
          label="Failed Runs"
          value={stats.failed}
          tone="danger"
          meter={percent(stats.failed, totalRuns)}
          note={
            totalRuns
              ? `${percent(stats.failed, totalRuns)}% of all runs`
              : 'No runs yet'
          }
        />
      </section>

      <div className="fp-dash-grid">

        {/* LEFT COLUMN */}
        <div className="fp-dash-main">

          {/* RECENT WORKFLOWS */}
          <section className="fp-section">
            <div className="fp-section-head">
              <h2>
                Recent workflows{' '}
                <span className="fp-count">{workflows.length}</span>
              </h2>
            </div>

            {workflows.length === 0 ? (
              <EmptyState
                title="No workflows yet"
                message="Create a blank workflow or start from a template to see the canvas."
                action={
                  <button
                    type="button"
                    className="fp-btn primary"
                    onClick={onCreate}
                  >
                    Create Workflow
                  </button>
                }
              />
            ) : (
              <div className="fp-card-grid">
                {workflows.map((workflow) => (
                  <article
                    key={workflow.id}
                    className="fp-card fp-wf-card"
                  >
                    <div className="fp-card-top">
                      <div className="fp-card-title">
                        <h3>{workflow.name}</h3>
                      </div>

                      <span className={`fp-pill ${workflow.status}`}>
                        {workflow.status}
                      </span>
                    </div>

                    <p>{workflow.description}</p>

                    <FlowStrip nodes={workflow.nodes} />

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

                    <button
                      type="button"
                      className="fp-card-open"
                      onClick={() => onOpen(workflow.id)}
                    >
                      Open in builder
                      <ArrowRight size={14} />
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* START FROM A TEMPLATE */}
          <section className="fp-section">
            <div className="fp-section-head">
              <h2>Start from a template</h2>

              <button
                type="button"
                className="fp-link"
                onClick={onTemplates}
              >
                View all
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="fp-template-grid">
              {TEMPLATES.map((template, index) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  index={index}
                  onUse={onUseTemplate}
                />
              ))}
            </div>
          </section>

        </div>

        {/* RIGHT COLUMN */}
        <aside className="fp-dash-side">

          {/* RECENT RUNS */}
          <section className="fp-panel">
            <h2>
              <History size={14} />
              Recent runs
            </h2>

            {recentRuns.length ? (
              <ul className="fp-runs">
                {recentRuns.map((run) => {
                  const status = run.status?.toLowerCase()

                  return (
                    <li
                      key={run.id}
                      className={`is-${status}`}
                    >
                      <span
                        className="fp-runs-dot"
                        aria-hidden="true"
                      />

                      <div>
                        <strong>{run.workflowName}</strong>

                        <span>
                          <Clock3 size={11} />
                          {formatDate(run.startedAt)} ·{' '}
                          {formatDuration(run.durationMs)}
                        </span>
                      </div>

                      <em>{status}</em>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="fp-panel-note">
                Runs appear here after you execute a workflow.
              </p>
            )}
          </section>

          {/* NODE COMPOSITION */}
          <section className="fp-panel">
            <h2>
              <Workflow size={14} />
              Node composition
            </h2>

            <div
              className="fp-compo-bar"
              aria-hidden="true"
            >
              {composition.map((part) =>
                part.count ? (
                  <span
                    key={part.type}
                    className={`tone-${part.type}`}
                    style={{ flexGrow: part.count }}
                  />
                ) : null
              )}

              {!allNodes.length ? (
                <span className="is-empty" />
              ) : null}
            </div>

            <ul className="fp-compo-legend">
              {composition.map((part) => (
                <li
                  key={part.type}
                  className={`tone-${part.type}`}
                >
                  <span
                    className="fp-compo-swatch"
                    aria-hidden="true"
                  />

                  {TYPE_LABEL[part.type]}

                  <b>{part.count}</b>
                </li>
              ))}
            </ul>
          </section>

        </aside>
      </div>
    </div>
  )
}

function greetingText() {
  const hour = new Date().getHours()

  if (hour < 12) return 'Good morning'
  if (hour < 16) return 'Good afternoon'
  return 'Good evening'
}

function Stat({ icon: Icon, label, value, tone, note, meter }) {
  return (
    <article className={`fp-stat tone-${tone}`}>
      <div className="fp-stat-head">
        <span className="fp-stat-icon">
          <Icon size={15} />
        </span>

        <p>{label}</p>
      </div>

      <strong>{value}</strong>

      <div className="fp-stat-foot">
        {meter != null ? (
          <span
            className="fp-stat-meter"
            aria-hidden="true"
          >
            <span style={{ width: `${meter}%` }} />
          </span>
        ) : null}

        <span className="fp-stat-note">
          {note}
        </span>
      </div>
    </article>
  )
}