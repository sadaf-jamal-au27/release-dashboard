import { Badge } from './Badge'
import { envMeta, formatDuration, formatRelativeTime, shortSha } from '../lib/utils'
import { PipelineStatus } from '../lib/types'

export function DetailsModal({ pipeline, onClose }) {
  if (!pipeline) return null

  const env = envMeta(pipeline.environment)
  const prodGate = pipeline.approvals?.production

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-slate-950 p-5 ring-1 ring-slate-800">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-base font-semibold text-slate-100">{pipeline.repo}</div>
              <span className="text-xs text-slate-400">({pipeline.branch})</span>
              <Badge status={pipeline.status} />
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
              <span className={env.cls}>
                Env: <span className="font-semibold">{env.label}</span>
              </span>
              <span>
                Last run: <span className="font-semibold">{formatRelativeTime(pipeline.lastRunAt)}</span>
              </span>
              <span>
                Duration: <span className="font-semibold">{formatDuration(pipeline.durationSec)}</span>
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-100 ring-1 ring-slate-800 hover:bg-slate-800"
          >
            Close
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-xl bg-slate-900/50 p-4 ring-1 ring-slate-800">
            <div className="text-xs font-semibold text-slate-200">Run metadata</div>
            <div className="mt-2 space-y-1 text-xs text-slate-400">
              <div>
                Actor: <span className="font-semibold text-slate-200">{pipeline.actor}</span>
              </div>
              <div>
                Commit: <span className="font-mono font-semibold text-slate-200">{shortSha(pipeline.commitSha)}</span>
              </div>
              <div>
                PR: <span className="font-semibold text-slate-200">{pipeline.prNumber || '-'}</span>
              </div>
              <div>
                Team: <span className="font-semibold text-slate-200">{pipeline.team}</span>
              </div>
              <div>
                Current release: <span className="font-mono font-semibold text-slate-200">{pipeline.currentReleaseTag}</span>
              </div>
              <div>
                Last stable: <span className="font-mono font-semibold text-slate-200">{pipeline.lastStableTag}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-slate-900/50 p-4 ring-1 ring-slate-800">
            <div className="text-xs font-semibold text-slate-200">Production gate</div>
            <div className="mt-2 text-xs text-slate-400">
              Required:{' '}
              <span className="font-semibold text-slate-200">{prodGate?.required ? 'yes' : 'no'}</span>
            </div>
            <div className="mt-1 text-xs text-slate-400">
              Approved:{' '}
              <span className="font-semibold text-slate-200">{prodGate?.approved ? 'yes' : 'no'}</span>
            </div>
            <div className="mt-2 text-xs text-slate-400">
              Note:{' '}
              <span className="font-semibold text-slate-200">{prodGate?.note?.trim() || '-'}</span>
            </div>
          </div>
        </div>

        {pipeline.status === PipelineStatus.failed && pipeline.lastError ? (
          <div className="mt-4 rounded-xl bg-rose-950/30 p-4 ring-1 ring-rose-900/50">
            <div className="text-xs font-semibold text-rose-200">Last error log preview</div>
            <pre className="mt-2 max-h-44 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-950/40 p-3 text-xs text-rose-100/90 ring-1 ring-slate-800">
              {pipeline.lastError}
            </pre>
          </div>
        ) : null}
      </div>
    </div>
  )
}

