import { useState } from 'react'
import { GripVertical, Search } from 'lucide-react'
import { catalogByCategory } from '../data/nodeCatalog'

export function NodePalette({ onAdd }) {
  const [query, setQuery] = useState('')
  const needle = query.trim().toLowerCase()
  const groups = catalogByCategory()
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !needle || item.title.toLowerCase().includes(needle) || item.description.toLowerCase().includes(needle)
      ),
    }))
    .filter((group) => group.items.length)

  return (
    <aside className="fp-palette" aria-label="Node palette">
      <div className="fp-palette-head">
        <h3>Nodes</h3>
        <p>Click to add or drag onto the canvas</p>
        <label className="fp-palette-search">
          <Search size={13} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search steps"
            aria-label="Search nodes"
          />
        </label>
      </div>
      <div className="fp-palette-scroll">
        {groups.map((group) => (
          <section key={group.category} className={`fp-palette-group tone-${group.tone}`}>
            <h4>
              <span className="fp-palette-swatch" aria-hidden="true" />
              {group.label}
              <span className="fp-palette-count">{group.items.length}</span>
            </h4>
            {group.items.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`fp-palette-item tone-${group.tone}`}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData('application/flowpilot', item.id)
                    event.dataTransfer.effectAllowed = 'move'
                  }}
                  onClick={() => onAdd(item.id)}
                >
                  <span className="fp-palette-icon">
                    <Icon size={14} />
                  </span>
                  <span className="fp-palette-text">
                    <strong>{item.title}</strong>
                    <em>{item.description}</em>
                  </span>
                  <GripVertical size={14} className="fp-palette-grip" aria-hidden="true" />
                </button>
              )
            })}
          </section>
        ))}
        {!groups.length ? <p className="fp-palette-none">No steps match “{query}”.</p> : null}
      </div>
    </aside>
  )
}
