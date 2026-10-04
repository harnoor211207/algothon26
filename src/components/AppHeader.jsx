import { ChevronRight, GitBranch, LayoutDashboard, History, Layers, Settings, Workflow } from 'lucide-react'

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'workflows', label: 'Workflows', icon: GitBranch },
  { id: 'templates', label: 'Templates', icon: Layers },
  { id: 'executions', label: 'Executions', icon: History },
]

export function AppHeader({ view, onNavigate, displayName, onOpenSettings }) {
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
          <Workflow size={15} strokeWidth={2.25} />
        </span>
        <span>
          <strong>FlowPilot</strong>
          <em>Build. Automate. Execute.</em>
        </span>
      </button>
      <p className="fp-nav-label">Workspace</p>
      <nav className="fp-nav">
        {NAV.map((item) => {
          const Icon = item.icon
          const active = view === item.id || (item.id === 'workflows' && view === 'builder')
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
            </button>
          )
        })}
      </nav>
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
        <span className="fp-chip">Saved locally</span>
      </div>
    </div>
  )
}
