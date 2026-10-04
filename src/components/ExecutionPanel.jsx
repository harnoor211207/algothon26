import { AlertCircle, CheckCircle2, CircleDashed, Clock3, Loader2, Terminal, XCircle, Zap } from 'lucide-react'
import { formatDate, formatDuration } from '../utils/helpers'

const STEP_ICON = {
  running: Loader2,
  success: CheckCircle2,
  failed: XCircle,
  skipped: CircleDashed,
  waiting: Clock3,
}

export function StepTimeline({ steps, fallback, showDuration = false }) {
  if (!steps?.length) return null
  return (
    <div className="fp-timeline">
      {steps.map((step) => {
        const status = step.status.toLowerCase()
        const Icon = STEP_ICON[status] || Clock3
        return (
          <article key={step.nodeId} className={`fp-run-step is-${status}`}>
            <span className="fp-step-dot" aria-hidden="true">
              <Icon size={12} strokeWidth={2.5} />
            </span>
            <div>
              <strong>{step.nodeName}</strong>
              <span className="fp-step-log">{step.error || step.log || fallback}</span>
            </div>
            <em>
              {status}
              {showDuration && step.durationMs != null ? ` · ${formatDuration(step.durationMs)}` : ''}
            </em>
          </article>
        )
      })}
    </div>
  )
}

export function LogList({ logs }) {
  if (!logs?.length) return null
  return (
    <div className="fp-run-logs">
      <h4>
        <Terminal size={12} />
        Logs
      </h4>
      <div className="fp-log-list">
        {logs.map((entry, index) => (
          <p key={`${entry.timestamp}-${index}`} className={`fp-log fp-log-${entry.level}`}>
            {entry.message}
          </p>
        ))}
      </div>
    </div>
  )
}

export function ExecutionPanel({ execution, errors }) {
  if (!execution && !errors?.length) {
    return (
      <div className="fp-run-panel">
        <h3>
          <Zap size={14} />
          Live execution
        </h3>
        <div className="fp-panel-empty">
          <Zap size={18} />
          {'Run the workflow to watch each node move from waiting → running → success.'}
        </div>
      </div>
    )
  }

  return (
    <div className="fp-run-panel">
      <div className="fp-run-head">
        <h3>
          <Zap size={14} />
          Live execution
        </h3>
        {execution ? <span className={`fp-pill ${execution.status.toLowerCase()}`}>{execution.status.toLowerCase()}</span> : null}
      </div>
      {errors?.length ? (
        <ul className="fp-errors">
          {errors.map((error) => (
            <li key={error}>
              <AlertCircle size={13} />
              <span>{error}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <StepTimeline steps={execution?.steps} fallback="Waiting for previous steps" showDuration />
      {execution?.startedAt ? (
        <p className="fp-run-meta">
          <Clock3 size={12} />
          Started {formatDate(execution.startedAt)}
          {execution.finishedAt ? ` · ${formatDuration(execution.durationMs)}` : ''}
        </p>
      ) : null}
      <LogList logs={execution?.logs} />
    </div>
  )
}
