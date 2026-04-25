import { formatRelativeTime } from '../lib/utils'

export function AuditLog({ entries }) {
  return (
    <div className="rounded-xl bg-slate-950/40 p-4 ring-1 ring-slate-800">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-100">Audit log</div>
        <div className="text-xs text-slate-500">{entries.length} events</div>
      </div>

      <div className="mt-3 space-y-2">
        {entries.length === 0 ? (
          <div className="text-sm text-slate-400">No actions yet.</div>
        ) : (
          entries.slice(0, 12).map((e) => (
            <div key={e.id} className="rounded-lg bg-slate-900/60 p-3 ring-1 ring-slate-800">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs font-semibold text-slate-200">{e.action}</div>
                <div className="text-xs text-slate-500">{formatRelativeTime(e.at)}</div>
              </div>
              <div className="mt-1 text-xs text-slate-400">{e.details}</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

