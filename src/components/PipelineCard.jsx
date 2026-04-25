import { Badge } from './Badge'
import { envMeta, formatDuration, formatRelativeTime, shortSha } from '../lib/utils'
import { Environments, PipelineStatus } from '../lib/types'

function IconButton({ label, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-slate-100 ring-1 ring-slate-800 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {label}
    </button>
  )
}

export function PipelineCard({
  pipeline,
  onTrigger,
  onRerunFailed,
  onCancel,
  onPromote,
  onApproveProd,
  onRollback,
  onOpenDetails,
}) {
  const env = envMeta(pipeline.environment)
  const prodGate = pipeline.approvals?.production
  const canPromoteToProd =
    pipeline.environment === Environments.staging &&
    pipeline.status === PipelineStatus.success &&
    (!prodGate?.required || prodGate?.approved)

  const canPromoteToStaging =
    pipeline.environment === Environments.dev && pipeline.status === PipelineStatus.success

  return (
    <div className="rounded-xl bg-slate-950/40 p-4 ring-1 ring-slate-800">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenDetails(pipeline.id)}
              className="truncate text-left text-sm font-semibold text-slate-100 hover:underline"
              title="Open details"
            >
              {pipeline.repo}
            </button>
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
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
            <span>
              Actor: <span className="font-semibold text-slate-200">{pipeline.actor}</span>
            </span>
            <span>
              SHA: <span className="font-mono font-semibold text-slate-200">{shortSha(pipeline.commitSha)}</span>
            </span>
            {pipeline.prNumber ? (
              <span>
                PR: <span className="font-semibold text-slate-200">#{pipeline.prNumber}</span>
              </span>
            ) : (
              <span className="text-slate-500">PR: -</span>
            )}
            <span className="text-slate-500">Team: {pipeline.team}</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-wrap justify-end gap-2">
            <IconButton label="Trigger" onClick={() => onTrigger(pipeline.id)} />
            <IconButton
              label="Rerun failed"
              onClick={() => onRerunFailed(pipeline.id)}
              disabled={pipeline.status !== PipelineStatus.failed}
            />
            <IconButton
              label="Cancel"
              onClick={() => onCancel(pipeline.id)}
              disabled={pipeline.status !== PipelineStatus.running && pipeline.status !== PipelineStatus.queued}
            />
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <IconButton
              label="Promote → Staging"
              onClick={() => onPromote(pipeline.id, Environments.staging)}
              disabled={!canPromoteToStaging}
            />
            <IconButton
              label="Approve Prod"
              onClick={() => onApproveProd(pipeline.id)}
              disabled={!prodGate?.required || prodGate?.approved}
            />
            <IconButton
              label="Promote → Prod"
              onClick={() => onPromote(pipeline.id, Environments.production)}
              disabled={!canPromoteToProd}
            />
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <IconButton label="Rollback" onClick={() => onRollback(pipeline.id)} />
          </div>
        </div>
      </div>

      {pipeline.status === PipelineStatus.failed && pipeline.lastError ? (
        <div className="mt-3 rounded-lg bg-rose-950/30 p-3 text-xs text-rose-200 ring-1 ring-rose-900/50">
          <div className="font-semibold">Last error (preview)</div>
          <div className="mt-1 line-clamp-3 font-mono text-rose-100/90">{pipeline.lastError}</div>
          <div className="mt-2 text-rose-200/80">
            Who broke it: <span className="font-semibold">{pipeline.actor}</span>
          </div>
        </div>
      ) : null}
    </div>
  )
}

