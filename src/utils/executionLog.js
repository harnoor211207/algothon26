import { nowIso } from './helpers.js'

export function createExecutionLogger() {
  const logs = []

  const push = (level, message, nodeId = null) => {
    logs.push({
      timestamp: nowIso(),
      level,
      message,
      nodeId,
    })
    return logs[logs.length - 1]
  }

  return {
    logs,
    info: (message, nodeId) => push('info', message, nodeId),
    warn: (message, nodeId) => push('warn', message, nodeId),
    error: (message, nodeId) => push('error', message, nodeId),
  }
}

export function formatLogLine(entry) {
  if (!entry) return ''
  const node = entry.nodeId ? ` [${entry.nodeId}]` : ''
  return `${entry.timestamp} ${entry.level.toUpperCase()}${node}: ${entry.message}`
}
