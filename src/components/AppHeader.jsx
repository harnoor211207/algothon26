import { ChevronRight, GitBranch, LayoutDashboard, History, Layers, Settings, Workflow } from 'lucide-react'

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'workflows', label: 'Workflows', icon: GitBranch, countKey: 'workflows' },
  { id: 'templates', label: 'Templates', icon: Layers, countKey: 'templates' },
  { id: 'executions', label: 'Executions', icon: History, countKey: 'executions' },
]

export function AppHeader({ view, onNavigate, displayName, onOpenSettings, counts = {} }) {
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  return (
    <aside className="fp-sidebar" aria-label="Primary">
      <button type="button" className="fp-brand" onClick={() => onNavigate('dashboard')}>
        <span className="fp-logo">
          <Workflow size={16} strokeWidth={2.25} />
        </span>
        <span>
          <strong>FlowPilot</strong>
          <em>Build · Automate · Execute</em>
        </span>
      </button>

      <div className="fp-workspace">
        <span className="fp-workspace-dots" aria-hidden="true">
          <i className="tone-trigger" />
          <i className="tone-action" />
          <i className="tone-condition" />
          <i className="tone-transform" />
        </span>
        <span>
          <em>Workspace</em>
          <strong>{displayName}&apos;s flows</strong>
        </span>
      </div>

      <p className="fp-nav-label">Navigate</p>
      <nav className="fp-nav">
        {NAV.map((item) => {
          const Icon = item.icon
          const active = view === item.id || (item.id === 'workflows' && view === 'builder')
          const count = item.countKey ? counts[item.countKey] : null
          return (
            <button
              key={item.id}
              type="button"
              className={active ? 'is-active' : ''}
              aria-current={active ? 'page' : undefined}
              onClick={() => onNavigate(item.id)}
            >
              <Icon size={16} />
              <span>{item.label}</span>
              {count != null ? <b className="fp-nav-count">{count}</b> : null}
            </button>
          )
        })}
      </nav>

      <div className="fp-sidebar-legend" aria-label="Node types">
        <p className="fp-nav-label">Node types</p>
        <ul>
          <li className="tone-trigger">Trigger</li>
          <li className="tone-transform">Transform</li>
          <li className="tone-action">Action</li>
          <li className="tone-condition">Condition</li>
        </ul>
      </div>

      <div className="fp-sidebar-foot">
        <div className="fp-avatar" title={displayName}>
          {initials}
        </div>
        <div className="fp-sidebar-user">
          <strong>{displayName}</strong>
          <span>Local workspace</span>
        </div>
        <button type="button" className="fp-icon-btn" title="Settings" aria-label="Settings" onClick={onOpenSettings}>
          <Settings size={16} />
        </button>
      </div>
    </aside>
  )
}

export function TopBar({ view }) {
  const current = NAV.find((item) => item.id === view)
  return (
    <div className="fp-topbar">
      <div className="fp-crumbs">
        <span>FlowPilot</span>
        <ChevronRight size={14} />
        <strong>{current?.label || 'Dashboard'}</strong>
      </div>
      <div className="fp-topbar-end">
        <span className="fp-chip">
          <span className="fp-status-dot" aria-hidden="true" />
          Saved locally
        </span>
      </div>
    </div>
  )
}
