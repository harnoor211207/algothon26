import { useState } from 'react'
import { EmptyState } from '../components/Feedback'
import { formatDate, formatDuration } from '../utils/helpers'

export function ExecutionHistory({ executions }) {
  const [selectedId, setSelectedId] = useState(executions[0]?.id || null)
  const selected = executions.find((item) => item.id === selectedId)

  if (!executions.length) {
    return (
      <div className="fp-page">
        <h1>Execution history</h1>
        <EmptyState
          title="No runs yet"
          message="Open a workflow and click Run Workflow to capture a live execution log."
        />
      </div>
    )
  }

  return (
    <div className="fp-page split">
      <section>
        <h1>Execution history</h1>
        <div className="fp-table">
          {executions.map((item) => (
            <article key={item.id} className={item.id === selectedId ? 'is-active' : ''}>
              <div>
                <h3>{item.workflowName}</h3>
                <p>
                  {formatDate(item.startedAt)} · {item.stepCount} steps · {formatDuration(item.durationMs)}
                </p>
              </div>
              <span className={`fp-pill ${item.status.toLowerCase()}`}>{item.status}</span>
              <button type="button" className="fp-btn ghost" onClick={() => setSelectedId(item.id)}>
                View Details
              </button>
            </article>
          ))}
        </div>
      </section>
      {selected ? (
        <aside className="fp-detail">
          <p className="fp-kicker">{selected.status}</p>
          <h2>{selected.workflowName}</h2>
          <p>
            {formatDate(selected.startedAt)} · {formatDuration(selected.durationMs)}
          </p>
          {selected.steps?.map((step) => (
            <article key={step.nodeId} className={`fp-run-step is-${step.status.toLowerCase()}`}>
              <div>
                <strong>{step.nodeName}</strong>
                <span>{step.log || 'No log'}</span>
              </div>
              <em>{step.status}</em>
            </article>
          ))}
        </aside>
      ) : null}
    </div>
  )
}
