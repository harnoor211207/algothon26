import { AlertCircle, CheckCircle2, X } from 'lucide-react'

export function ToastStack({ toasts, onDismiss }) {
  if (!toasts.length) return null
  return (
    <div className="fp-toasts" role="status">
      {toasts.map((toast) => (
        <div key={toast.id} className={`fp-toast fp-toast-${toast.tone}`}>
          {toast.tone === 'success' ? <CheckCircle2 size={16} /> : null}
          {toast.tone === 'error' ? <AlertCircle size={16} /> : null}
          <span>{toast.message}</span>
          <button type="button" className="fp-icon-btn" onClick={() => onDismiss(toast.id)} aria-label="Dismiss">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}

export function ConfirmModal({ open, title, message, confirmLabel = 'Delete', onConfirm, onCancel }) {
  if (!open) return null
  return (
    <div className="fp-modal-backdrop" onClick={onCancel}>
      <div className="fp-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="fp-modal-actions">
          <button type="button" className="fp-btn ghost" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="fp-btn danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export function EmptyState({ title, message, action }) {
  return (
    <div className="fp-empty">
      <h3>{title}</h3>
      <p>{message}</p>
      {action}
    </div>
  )
}
