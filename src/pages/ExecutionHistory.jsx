import { useState } from 'react'
import { EmptyState } from '../components/Feedback'
import { LogList, StepTimeline } from '../components/ExecutionPanel'
import { formatDate, formatDuration } from '../utils/helpers'

export function ExecutionHistory({ executions }) {
  const [selectedId, setSelectedId] = useState(executions[0]?.id || null)
  const selected = executions.find((item) => item.id === selectedId)

  if (!executions.length) {
    return (
      <div className="fp-page">
        <section className="fp-hero">
          <div>
            <p className="fp-kicker">Runs</p>
            <h1>Execution history</h1>
          </div>
        </section>
        <EmptyState
          title="No runs yet"
          message="Open a workflow and click Run Workflow to capture a live execution log."
        />
      </div>
    )
  }

  return (
    <div className="fp-page">
      <section className="fp-hero">
        <div>
          <p className="fp-kicker">Runs</p>
          <h1>Execution history</h1>
          <p>Inspect every run, step by step, with full logs.</p>
        </div>
      </section>
      <div className="fp-split">
        <section className="fp-table">
          {executions.map((item) => (
            <article key={item.id} className={item.id === selectedId ? 'is-active' : ''}>
              <div>
                <h3>{item.workflowName}</h3>
                <p>
                  {formatDate(item.startedAt)} · {item.stepCount} steps · {formatDuration(item.durationMs)}
                </p>
              </div>
              <span className={`fp-pill ${item.status.toLowerCase()}`}>{item.status.toLowerCase()}</span>
              <button type="button" className="fp-btn ghost" onClick={() => setSelectedId(item.id)}>
                View Details
              </button>
            </article>
          ))}
        </section>
        {selected ? (
          <aside className="fp-detail">
            <div className="fp-detail-head">
              <span className={`fp-pill ${selected.status.toLowerCase()}`}>{selected.status.toLowerCase()}</span>
            </div>
            <h2>{selected.workflowName}</h2>
            <p>
              {formatDate(selected.startedAt)} · {formatDuration(selected.durationMs)}
            </p>
            <StepTimeline steps={selected.steps} fallback="No log" />
            <LogList logs={selected.logs} />
          </aside>
        ) : null}
      </div>
    </div>
  )
}
