import { useState } from 'react'
import { ArrowRight, GitBranch, Plus, Trash2 } from 'lucide-react'
import { formatDate } from '../utils/helpers'
import { ConfirmModal, EmptyState } from '../components/Feedback'

export function WorkflowsPage({ workflows, onOpen, onCreate, onDelete }) {
  const [pending, setPending] = useState(null)

  return (
    <div className="fp-page">
      <section className="fp-hero">
        <div>
          <p className="fp-kicker">Library</p>
          <h1>Workflows</h1>
          <p>Every saved automation lives here and survives a browser refresh.</p>
        </div>
        <button type="button" className="fp-btn primary lg" onClick={onCreate}>
          <Plus size={16} />
          Create Workflow
        </button>
      </section>
      {workflows.length === 0 ? (
        <EmptyState
          title="No workflows yet"
          message="Create a workflow to start connecting triggers, actions, and conditions."
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
                <div className="fp-card-title">
                  <span className="fp-card-icon">
                    <GitBranch size={16} />
                  </span>
                  <h3>{workflow.name}</h3>
                </div>
                <span className={`fp-pill ${workflow.status}`}>{workflow.status}</span>
              </div>
              <p>{workflow.description}</p>
              <div className="fp-card-foot">
                <span className="fp-muted">Updated {formatDate(workflow.updatedAt)}</span>
                <div className="fp-row">
                  <button type="button" className="fp-btn danger-ghost" onClick={() => setPending(workflow)}>
                    <Trash2 size={14} />
                    Delete
                  </button>
                  <button type="button" className="fp-btn ghost" onClick={() => onOpen(workflow.id)}>
                    Open
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      <ConfirmModal
        open={Boolean(pending)}
        title="Delete workflow?"
        message={`This will remove “${pending?.name}” from this browser. Execution history is kept.`}
        onCancel={() => setPending(null)}
        onConfirm={() => {
          onDelete(pending.id)
          setPending(null)
        }}
      />
    </div>
  )
}
