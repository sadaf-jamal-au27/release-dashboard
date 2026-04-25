import { Environments, PipelineStatus } from './types'

export function formatRelativeTime(iso) {
  const t = new Date(iso).getTime()
  const diffMs = Date.now() - t
  const sec = Math.max(0, Math.floor(diffMs / 1000))
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  return `${hr}h ago`
}

export function formatDuration(sec) {
  if (!sec) return '-'
  if (sec < 60) return `${sec}s`
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}m ${s}s`
}

export function statusMeta(status) {
  switch (status) {
    case PipelineStatus.queued:
      return { label: 'Queued', cls: 'bg-slate-700 text-slate-100 ring-slate-600' }
    case PipelineStatus.running:
      return { label: 'Running', cls: 'bg-blue-600 text-white ring-blue-400' }
    case PipelineStatus.success:
      return { label: 'Success', cls: 'bg-emerald-600 text-white ring-emerald-400' }
    case PipelineStatus.failed:
      return { label: 'Failed', cls: 'bg-rose-600 text-white ring-rose-400' }
    case PipelineStatus.cancelled:
      return { label: 'Cancelled', cls: 'bg-amber-600 text-white ring-amber-400' }
    default:
      return { label: status, cls: 'bg-slate-600 text-white ring-slate-400' }
  }
}

export function envMeta(env) {
  switch (env) {
    case Environments.dev:
      return { label: 'Dev', cls: 'text-sky-200' }
    case Environments.staging:
      return { label: 'Staging', cls: 'text-violet-200' }
    case Environments.production:
      return { label: 'Production', cls: 'text-amber-200' }
    default:
      return { label: env, cls: 'text-slate-200' }
  }
}

export function shortSha(sha) {
  if (!sha) return ''
  return sha.slice(0, 7)
}

export function nowIso() {
  return new Date().toISOString()
}

export function nextStatusAfterQueued() {
  return PipelineStatus.running
}

export function nextStatusAfterRunning() {
  const roll = Math.random()
  if (roll < 0.72) return PipelineStatus.success
  if (roll < 0.92) return PipelineStatus.failed
  return PipelineStatus.cancelled
}

