import { GitBranch, LayoutDashboard, History, Layers, Settings, Sparkles } from 'lucide-react'

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
    <header className="fp-header">
      <button type="button" className="fp-brand" onClick={() => onNavigate('dashboard')}>
        <span className="fp-logo">
          <Sparkles size={16} />
        </span>
        <span>
          <strong>FlowPilot</strong>
          <em>Build. Automate. Execute.</em>
        </span>
      </button>
      <nav className="fp-nav">
        {NAV.map((item) => {
          const Icon = item.icon
          const active = view === item.id || (item.id === 'workflows' && view === 'builder')
          return (
            <button
              key={item.id}
              type="button"
              className={active ? 'is-active' : ''}
              onClick={() => onNavigate(item.id)}
            >
              <Icon size={16} />
              {item.label}
            </button>
          )
        })}
      </nav>
      <div className="fp-header-end">
        <button type="button" className="fp-icon-btn" title="Settings" onClick={onOpenSettings}>
          <Settings size={18} />
        </button>
        <div className="fp-avatar" title={displayName}>
          {initials}
        </div>
      </div>
    </header>
  )
}
