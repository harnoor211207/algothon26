import { AlertCircle, CheckCircle2, CircleDashed, Clock3, Loader2, Terminal, XCircle, Zap } from 'lucide-react'
import { getCatalogItem } from '../data/nodeCatalog'
import { formatDate, formatDuration } from '../utils/helpers'

const STEP_ICON = {
  running: Loader2,
  success: CheckCircle2,
  failed: XCircle,
  skipped: CircleDashed,
  waiting: Clock3,
}

const DONE = new Set(['success', 'failed', 'skipped'])

function formatClock(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function StepTimeline({ steps, fallback, showDuration = false, nodes }) {
  if (!steps?.length) return null
  const nodeById = nodes ? Object.fromEntries(nodes.map((node) => [node.id, node])) : {}
  return (
    <div className="fp-timeline">
      {steps.map((step) => {
        const status = step.status.toLowerCase()
        const StatusIcon = STEP_ICON[status] || Clock3
        const node = nodeById[step.nodeId]
        const TypeIcon = node ? getCatalogItem(node.data?.typeKey)?.icon : null
        return (
          <article key={step.nodeId} className={`fp-run-step is-${status} ${node ? `tone-${node.type}` : ''}`}>
            <span className="fp-step-dot" aria-hidden="true">
              {TypeIcon ? <TypeIcon size={13} strokeWidth={2.25} /> : <StatusIcon size={12} strokeWidth={2.5} />}
            </span>
            <div className="fp-step-main">
              <strong>{step.nodeName}</strong>
              <span className="fp-step-log">{step.error || step.log || fallback}</span>
            </div>
            <div className="fp-step-side">
              <em className={`fp-step-status is-${status}`}>
                <StatusIcon size={11} strokeWidth={2.5} />
                {status}
              </em>
              {showDuration && step.durationMs != null ? (
                <span className="fp-step-time">{formatDuration(step.durationMs)}</span>
              ) : null}
            </div>
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
        <span>{logs.length}</span>
      </h4>
      <div className="fp-log-list">
        {logs.map((entry, index) => (
          <p key={`${entry.timestamp}-${index}`} className={`fp-log fp-log-${entry.level}`}>
            <time>{formatClock(entry.timestamp)}</time>
            <b>{entry.level}</b>
            <span>{entry.message}</span>
          </p>
        ))}
      </div>
    </div>
  )
}

export function ExecutionPanel({ execution, errors, nodes }) {
  const steps = execution?.steps || []
  const done = steps.filter((step) => DONE.has(step.status.toLowerCase())).length
  const progress = steps.length ? Math.round((done / steps.length) * 100) : 0
  const runStatus = execution?.status?.toLowerCase()

  return (
    <section className={`fp-run-panel ${runStatus ? `is-${runStatus}` : ''}`} aria-label="Live execution">
      <div className="fp-run-head">
        <h3>
          <span className="fp-live-dot" aria-hidden="true" />
          Live execution
        </h3>
        {execution ? (
          <span className={`fp-pill ${runStatus}`}>{runStatus}</span>
        ) : (
          <span className="fp-run-idle">idle</span>
        )}
      </div>

      {execution ? (
        <div className="fp-run-progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <div className="fp-run-progress-meta">
            <span>
              {done}/{steps.length} steps
            </span>
            <span>{progress}%</span>
          </div>
          <div className="fp-run-progress-track">
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : null}

      <div className="fp-run-scroll">
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

        {!execution && !errors?.length ? (
          <div className="fp-console-empty">
            <Zap size={16} />
            <p>
              <strong>Ready to execute</strong>
              <span>{'Run the workflow to stream each node: waiting → running → success.'}</span>
            </p>
          </div>
        ) : null}

        <StepTimeline steps={execution?.steps} fallback="Waiting for previous steps" showDuration nodes={nodes} />
        {execution?.startedAt ? (
          <p className="fp-run-meta">
            <Clock3 size={12} />
            Started {formatDate(execution.startedAt)}
            {execution.finishedAt ? ` · ${formatDuration(execution.durationMs)}` : ''}
          </p>
        ) : null}
        <LogList logs={execution?.logs} />
      </div>
    </section>
  )
}
