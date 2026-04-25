import { PipelineStatus } from './types'
import { nextStatusAfterQueued, nextStatusAfterRunning, nowIso } from './utils'

/**
 * A tiny "real-time" simulator:
 * - queued -> running (after a short delay)
 * - running -> success/failed/cancelled (randomized)
 * - duration increases while running
 */
export function tickPipelines(pipelines) {
  const now = Date.now()
  return pipelines.map((p) => {
    if (p.status === PipelineStatus.queued) {
      // After ~4-12s in queued, start running.
      const queuedForMs = now - new Date(p.lastRunAt).getTime()
      if (queuedForMs > 4000 + Math.random() * 8000) {
        return {
          ...p,
          status: nextStatusAfterQueued(),
          lastRunAt: nowIso(),
          durationSec: 0,
          lastError: '',
        }
      }
      return p
    }

    if (p.status === PipelineStatus.running) {
      const durationSec = (p.durationSec || 0) + 3
      // After ~15-45s, finish.
      if (durationSec > 15 + Math.random() * 30) {
        const status = nextStatusAfterRunning()
        return {
          ...p,
          status,
          durationSec,
          lastRunAt: nowIso(),
          lastError:
            status === PipelineStatus.failed
              ? sampleFailureReason(p.repo)
              : status === PipelineStatus.cancelled
                ? 'Cancelled by user'
                : '',
        }
      }
      return { ...p, durationSec }
    }

    return p
  })
}

export function sampleFailureReason(repo) {
  const reasons = [
    'Unit tests failed: snapshot mismatch.',
    'Build failed: missing environment variable.',
    'Docker push failed: permission denied to registry.',
    'Deployment failed: readiness probe timeout.',
    'Terraform plan failed: provider authentication error.',
    'Integration tests failed: upstream dependency timeout.',
  ]
  const idx = Math.floor(Math.random() * reasons.length)
  return `${repo}: ${reasons[idx]}`
}

