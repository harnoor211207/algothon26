import { catalogByCategory } from '../data/nodeCatalog'

export function NodePalette({ onAdd }) {
  return (
    <aside className="fp-palette">
      <div className="fp-palette-head">
        <h3>Node palette</h3>
        <p>Click or drag a step onto the canvas.</p>
      </div>
      {catalogByCategory().map((group) => (
        <section key={group.category}>
          <h4>{group.label}</h4>
          {group.items.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                type="button"
                className={`fp-palette-item tone-${group.tone}`}
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData('application/flowpilot', JSON.stringify(item.id))
                  event.dataTransfer.effectAllowed = 'move'
                }}
                onClick={() => onAdd(item.id)}
              >
                <span className="fp-palette-icon">
                  <Icon size={16} />
                </span>
                <span>
                  <strong>{item.title}</strong>
                  <em>{item.description}</em>
                </span>
              </button>
            )
          })}
        </section>
      ))}
    </aside>
  )
}
