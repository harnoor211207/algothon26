import { Copy, Trash2 } from 'lucide-react'
import { OPERATORS } from '../utils/validation'

function Field({ label, children }) {
  return (
    <label className="fp-field">
      <span>{label}</span>
      {children}
    </label>
  )
}

export function PropertiesPanel({ node, onChange, onDuplicate, onDelete }) {
  if (!node) {
    return (
      <div className="fp-props">
        <h3>Properties</h3>
        <p className="fp-muted">Select a node to configure it. Connections, zoom, and pan work on the canvas.</p>
      </div>
    )
  }

  const config = node.data.config || {}
  const update = (key, value) => onChange({ ...config, [key]: value })
  const typeKey = node.data.typeKey

  return (
    <div className="fp-props">
      <div className="fp-props-head">
        <div>
          <p className="fp-kicker">{node.data.category}</p>
          <h3>{node.data.label}</h3>
        </div>
        <div className="fp-props-actions">
          <button type="button" className="fp-icon-btn" title="Duplicate node" onClick={onDuplicate}>
            <Copy size={15} />
          </button>
          <button type="button" className="fp-icon-btn" title="Delete node" onClick={onDelete}>
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <Field label="Node name">
        <input
          value={node.data.label}
          onChange={(event) => onChange(config, { label: event.target.value })}
        />
      </Field>

      {typeKey === 'webhook' && (
        <>
          <Field label="Endpoint name">
            <input value={config.endpoint || ''} onChange={(event) => update('endpoint', event.target.value)} />
          </Field>
          <Field label="Sample payload">
            <textarea
              rows={8}
              value={config.samplePayload || ''}
              onChange={(event) => update('samplePayload', event.target.value)}
            />
          </Field>
        </>
      )}

      {typeKey === 'form' && (
        <>
          <Field label="Form name">
            <input value={config.formName || ''} onChange={(event) => update('formName', event.target.value)} />
          </Field>
          <Field label="Sample payload">
            <textarea
              rows={8}
              value={config.samplePayload || ''}
              onChange={(event) => update('samplePayload', event.target.value)}
            />
          </Field>
        </>
      )}

      {typeKey === 'schedule' && (
        <>
          <Field label="Schedule">
            <input value={config.interval || ''} onChange={(event) => update('interval', event.target.value)} />
          </Field>
          <Field label="Sample payload">
            <textarea
              rows={6}
              value={config.samplePayload || ''}
              onChange={(event) => update('samplePayload', event.target.value)}
            />
          </Field>
        </>
      )}

      {typeKey === 'email' && (
        <>
          <Field label="Recipient">
            <input value={config.recipient || ''} onChange={(event) => update('recipient', event.target.value)} />
          </Field>
          <Field label="Subject">
            <input value={config.subject || ''} onChange={(event) => update('subject', event.target.value)} />
          </Field>
          <Field label="Message">
            <textarea rows={6} value={config.message || ''} onChange={(event) => update('message', event.target.value)} />
          </Field>
        </>
      )}

      {typeKey === 'slack' && (
        <>
          <Field label="Channel">
            <input value={config.channel || ''} onChange={(event) => update('channel', event.target.value)} />
          </Field>
          <Field label="Message">
            <textarea rows={5} value={config.message || ''} onChange={(event) => update('message', event.target.value)} />
          </Field>
        </>
      )}

      {typeKey === 'http' && (
        <>
          <Field label="Method">
            <select value={config.method || 'POST'} onChange={(event) => update('method', event.target.value)}>
              <option>GET</option>
              <option>POST</option>
              <option>PUT</option>
              <option>PATCH</option>
            </select>
          </Field>
          <Field label="URL">
            <input value={config.url || ''} onChange={(event) => update('url', event.target.value)} />
          </Field>
          <Field label="Body">
            <textarea rows={5} value={config.body || ''} onChange={(event) => update('body', event.target.value)} />
          </Field>
        </>
      )}

      {typeKey === 'notification' && (
        <>
          <Field label="Title">
            <input value={config.title || ''} onChange={(event) => update('title', event.target.value)} />
          </Field>
          <Field label="Body">
            <textarea rows={4} value={config.body || ''} onChange={(event) => update('body', event.target.value)} />
          </Field>
        </>
      )}

      {(typeKey === 'condition' || typeKey === 'filter') && (
        <>
          <Field label="Field">
            <input value={config.field || ''} onChange={(event) => update('field', event.target.value)} />
          </Field>
          <Field label="Operator">
            <select value={config.operator || 'equals'} onChange={(event) => update('operator', event.target.value)}>
              {OPERATORS.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.label}
                </option>
              ))}
            </select>
          </Field>
          {config.operator !== 'exists' && (
            <Field label="Value">
              <input value={config.value || ''} onChange={(event) => update('value', event.target.value)} />
            </Field>
          )}
        </>
      )}

      {typeKey === 'format' && (
        <>
          <Field label="Input field">
            <input value={config.inputField || ''} onChange={(event) => update('inputField', event.target.value)} />
          </Field>
          <Field label="Transformation type">
            <select
              value={config.transformType || 'titlecase'}
              onChange={(event) => update('transformType', event.target.value)}
            >
              <option value="titlecase">Title case</option>
              <option value="uppercase">Uppercase</option>
              <option value="lowercase">Lowercase</option>
              <option value="trim">Trim</option>
            </select>
          </Field>
          <Field label="Output field">
            <input value={config.outputField || ''} onChange={(event) => update('outputField', event.target.value)} />
          </Field>
        </>
      )}

      {typeKey === 'extract' && (
        <>
          <Field label="Input field">
            <input value={config.inputField || ''} onChange={(event) => update('inputField', event.target.value)} />
          </Field>
          <Field label="Output field">
            <input value={config.outputField || ''} onChange={(event) => update('outputField', event.target.value)} />
          </Field>
        </>
      )}

      {typeKey === 'convert' && (
        <>
          <Field label="Input field">
            <input value={config.inputField || ''} onChange={(event) => update('inputField', event.target.value)} />
          </Field>
          <Field label="Conversion type">
            <select
              value={config.convertType || 'string'}
              onChange={(event) => update('convertType', event.target.value)}
            >
              <option value="string">String</option>
              <option value="number">Number</option>
              <option value="boolean">Boolean</option>
              <option value="json">JSON</option>
            </select>
          </Field>
          <Field label="Output field">
            <input value={config.outputField || ''} onChange={(event) => update('outputField', event.target.value)} />
          </Field>
        </>
      )}
    </div>
  )
}
