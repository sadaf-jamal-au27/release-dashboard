import { Environments } from '../lib/types'

const statuses = ['all', 'queued', 'running', 'success', 'failed', 'cancelled']
const envs = ['all', Environments.dev, Environments.staging, Environments.production]

export function Filters({ value, teams, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-950/40 p-4 ring-1 ring-slate-800">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-300">Status</span>
        <select
          className="rounded-md bg-slate-900 px-2 py-1 text-sm text-slate-100 ring-1 ring-slate-800"
          value={value.status}
          onChange={(e) => onChange({ ...value, status: e.target.value })}
        >
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-300">Env</span>
        <select
          className="rounded-md bg-slate-900 px-2 py-1 text-sm text-slate-100 ring-1 ring-slate-800"
          value={value.env}
          onChange={(e) => onChange({ ...value, env: e.target.value })}
        >
          {envs.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-300">Team</span>
        <select
          className="rounded-md bg-slate-900 px-2 py-1 text-sm text-slate-100 ring-1 ring-slate-800"
          value={value.team}
          onChange={(e) => onChange({ ...value, team: e.target.value })}
        >
          <option value="all">all</option>
          {teams.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-300">Sort</span>
        <select
          className="rounded-md bg-slate-900 px-2 py-1 text-sm text-slate-100 ring-1 ring-slate-800"
          value={value.sort}
          onChange={(e) => onChange({ ...value, sort: e.target.value })}
        >
          <option value="lastRunDesc">lastRun: newest</option>
          <option value="lastRunAsc">lastRun: oldest</option>
          <option value="repoAsc">repo: A→Z</option>
          <option value="statusAsc">status</option>
        </select>
      </div>
    </div>
  )
}

