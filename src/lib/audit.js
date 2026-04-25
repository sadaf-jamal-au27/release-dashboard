import { nowIso } from './utils'

export function auditEntry(action, details) {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    at: nowIso(),
    action,
    details,
  }
}

