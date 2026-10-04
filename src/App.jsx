import { useMemo, useState } from 'react'
import { AppHeader, TopBar } from './components/AppHeader'
import { SettingsModal } from './components/SettingsModal'
import { ToastStack } from './components/Feedback'
import { useAppStore } from './hooks/useAppStore'
import { Dashboard } from './pages/Dashboard'
import { ExecutionHistory } from './pages/ExecutionHistory'
import { TemplatesPage } from './pages/Templates'
import { WorkflowBuilder } from './pages/WorkflowBuilder'
import { WorkflowsPage } from './pages/Workflows'

export default function App() {
  const store = useAppStore()
  const [view, setView] = useState('dashboard')
  const [activeId, setActiveId] = useState(null)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const activeWorkflow = useMemo(
    () => store.workflows.find((item) => item.id === activeId) || null,
    [activeId, store.workflows]
  )

  const openWorkflow = (id) => {
    setActiveId(id)
    setView('builder')
  }

  const createBlank = () => {
    const workflow = store.createWorkflow()
    openWorkflow(workflow.id)
    store.pushToast('success', 'New workflow created')
  }

  const useTemplate = (templateId) => {
    const workflow = store.createFromTemplate(templateId)
    openWorkflow(workflow.id)
    store.pushToast('success', 'Template loaded')
  }

  const navigate = (next) => {
    if (next !== 'builder') setView(next)
    else if (activeWorkflow) setView('builder')
    else createBlank()
  }

  return (
    <div className="fp-app">
      {view !== 'builder' ? (
        <div className="fp-shell">
          <AppHeader
            view={view}
            onNavigate={navigate}
            displayName={store.settings.displayName}
            onOpenSettings={() => setSettingsOpen(true)}
          />
          <main className="fp-main">
            <TopBar view={view} />
      {view === 'dashboard' && (
        <Dashboard
          store={store}
          onCreate={createBlank}
          onOpen={openWorkflow}
          onTemplates={() => setView('templates')}
          onUseTemplate={useTemplate}
        />
      )}
      {view === 'workflows' && (
        <WorkflowsPage
          workflows={store.workflows}
          onOpen={openWorkflow}
          onCreate={createBlank}
          onDelete={(id) => {
            store.deleteWorkflow(id)
            store.pushToast('success', 'Workflow deleted')
          }}
        />
      )}
      {view === 'templates' && <TemplatesPage onUseTemplate={useTemplate} />}
      {view === 'executions' && <ExecutionHistory executions={store.executions} />}
          </main>
        </div>
      ) : null}
      {view === 'builder' && activeWorkflow && (
        <WorkflowBuilder
          workflow={activeWorkflow}
          store={store}
          onBack={() => setView('dashboard')}
          onOpen={openWorkflow}
        />
      )}

      <SettingsModal
        open={settingsOpen}
        settings={store.settings}
        onClose={() => setSettingsOpen(false)}
        onSave={store.updateSettings}
        onReset={() => {
          store.reset()
          setActiveId(null)
          setView('dashboard')
          setSettingsOpen(false)
        }}
      />
      <ToastStack toasts={store.toasts} onDismiss={store.dismissToast} />
    </div>
  )
}
