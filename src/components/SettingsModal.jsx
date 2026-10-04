export function SettingsModal({ open, settings, onClose, onSave, onReset }) {
  if (!open) return null
  return (
    <div className="fp-modal-backdrop" onClick={onClose}>
      <div className="fp-modal" onClick={(event) => event.stopPropagation()}>
        <h3>Settings</h3>
        <p>This prototype stores everything in localStorage on this browser. There is no account system.</p>
        <label className="fp-field">
          <span>Display name</span>
          <input
            defaultValue={settings.displayName}
            onBlur={(event) => onSave({ displayName: event.target.value || 'Automation Builder' })}
          />
        </label>
        <div className="fp-modal-actions">
          <button type="button" className="fp-btn danger-ghost" onClick={onReset}>
            Reset demo data
          </button>
          <button type="button" className="fp-btn primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
