import { formatDate, formatDuration } from '../utils/helpers'

export function ExecutionPanel({ execution, errors }) {
  if (!execution && !errors?.length) {
    return (
      <div className="fp-run-panel">
        <h3>Live execution</h3>
        <p className="fp-muted">Run the workflow to watch each node move from waiting → running → success.</p>
      </div>
    )
  }

  return (
    <div className="fp-run-panel">
      <div className="fp-run-head">
        <h3>Live execution</h3>
        {execution ? <span className={`fp-pill ${execution.status.toLowerCase()}`}>{execution.status}</span> : null}
      </div>
      {errors?.length ? (
        <ul className="fp-errors">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}
      {execution?.steps?.map((step) => (
        <article key={step.nodeId} className={`fp-run-step is-${step.status.toLowerCase()}`}>
          <div>
            <strong>{step.nodeName}</strong>
            <span>{step.log || 'Waiting for previous steps'}</span>
          </div>
          <em>
            {step.status}
            {step.durationMs != null ? ` · ${formatDuration(step.durationMs)}` : ''}
          </em>
        </article>
      ))}
      {execution?.startedAt ? (
        <p className="fp-run-meta">Started {formatDate(execution.startedAt)}</p>
      ) : null}
    </div>
  )
}
