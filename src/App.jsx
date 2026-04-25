import { useEffect, useMemo, useState } from 'react'
import { createInitialPipelines } from './lib/mockData'
import { Environments, PipelineStatus } from './lib/types'
import { tickPipelines } from './lib/simEngine'
import { auditEntry } from './lib/audit'
import { Filters } from './components/Filters'
import { PipelineCard } from './components/PipelineCard'
import { ReleasePanel } from './components/ReleasePanel'
import { AuditLog } from './components/AuditLog'
import { DetailsModal } from './components/DetailsModal'
import { nowIso } from './lib/utils'
import { fetchGitHubPipelines } from './lib/githubClient'

function Header({ mode, setMode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <div className="text-xl font-semibold text-white">Release Management Dashboard</div>
        <div className="mt-1 text-sm text-slate-400">
          Manage 10–12 GitHub Actions pipelines (mock now, real API later).
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-400">Data</span>
        <button
          type="button"
          onClick={() => setMode(mode === 'mock' ? 'github' : 'mock')}
          className="rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-100 ring-1 ring-slate-800 hover:bg-slate-800"
          title="GitHub mode is stubbed in this version"
        >
          {mode === 'mock' ? 'Mock' : 'GitHub API (stub)'}
        </button>
      </div>
    </div>
  )
}

function groupByEnv(pipelines) {
  const lanes = {
    [Environments.dev]: [],
    [Environments.staging]: [],
    [Environments.production]: [],
  }
  for (const p of pipelines) lanes[p.environment].push(p)
  return lanes
}

export default function App() {
  const [mode, setMode] = useState('mock')
  const [pipelines, setPipelines] = useState(() => createInitialPipelines())
  const [audit, setAudit] = useState(() => [])
  const [selectedId, setSelectedId] = useState(null)
  const [detailsId, setDetailsId] = useState(null)
  const [githubError, setGithubError] = useState('')
  const [filters, setFilters] = useState({
    status: 'all',
    env: 'all',
    team: 'all',
    sort: 'lastRunDesc',
  })

  useEffect(() => {
    const t = setInterval(() => {
      setPipelines((prev) => (mode === 'mock' ? tickPipelines(prev) : prev))
    }, 3000)
    return () => clearInterval(t)
  }, [mode])

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (mode !== 'github') return
      try {
        setGithubError('')
        const data = await fetchGitHubPipelines()
        if (cancelled) return
        setPipelines(data.pipelines || [])
        addAudit('Refresh from GitHub', `Loaded ${data.count || (data.pipelines || []).length} runs`)
      } catch (e) {
        if (cancelled) return
        setGithubError(String(e?.message || e))
      }
    }
    load()
    const t = setInterval(load, 15000)
    return () => {
      cancelled = true
      clearInterval(t)
    }
  }, [mode])

  const teams = useMemo(() => {
    return Array.from(new Set(pipelines.map((p) => p.team))).sort()
  }, [pipelines])

  const selected = useMemo(() => pipelines.find((p) => p.id === selectedId) || null, [pipelines, selectedId])
  const details = useMemo(() => pipelines.find((p) => p.id === detailsId) || null, [pipelines, detailsId])

  const visible = useMemo(() => {
    let list = pipelines.slice()
    if (filters.status !== 'all') list = list.filter((p) => p.status === filters.status)
    if (filters.env !== 'all') list = list.filter((p) => p.environment === filters.env)
    if (filters.team !== 'all') list = list.filter((p) => p.team === filters.team)

    const sorters = {
      lastRunDesc: (a, b) => new Date(b.lastRunAt) - new Date(a.lastRunAt),
      lastRunAsc: (a, b) => new Date(a.lastRunAt) - new Date(b.lastRunAt),
      repoAsc: (a, b) => a.repo.localeCompare(b.repo),
      statusAsc: (a, b) => a.status.localeCompare(b.status),
    }
    list.sort(sorters[filters.sort] || sorters.lastRunDesc)
    return list
  }, [pipelines, filters])

  const lanes = useMemo(() => groupByEnv(visible), [visible])

  function addAudit(action, details) {
    setAudit((prev) => [auditEntry(action, details), ...prev])
  }

  function updatePipeline(id, updater) {
    setPipelines((prev) => prev.map((p) => (p.id === id ? updater(p) : p)))
  }

  function trigger(id) {
    updatePipeline(id, (p) => ({
      ...p,
      status: PipelineStatus.queued,
      lastRunAt: nowIso(),
      durationSec: 0,
      lastError: '',
      actor: 'you',
      commitSha: Math.random().toString(16).slice(2, 9),
    }))
    addAudit('Trigger workflow', `Triggered ${id}`)
  }

  function rerunFailed(id) {
    updatePipeline(id, (p) => ({
      ...p,
      status: PipelineStatus.queued,
      lastRunAt: nowIso(),
      durationSec: 0,
      lastError: '',
      actor: 'you',
    }))
    addAudit('Re-run failed jobs', `Re-run requested for ${id}`)
  }

  function cancel(id) {
    updatePipeline(id, (p) => ({
      ...p,
      status: PipelineStatus.cancelled,
      lastRunAt: nowIso(),
    }))
    addAudit('Cancel run', `Cancelled in-progress run for ${id}`)
  }

  function approveProd(id) {
    updatePipeline(id, (p) => ({
      ...p,
      approvals: {
        ...p.approvals,
        production: {
          ...(p.approvals?.production || { required: true }),
          approved: true,
          note: 'Approved in dashboard',
        },
      },
    }))
    addAudit('Approve production', `Production gate approved for ${id}`)
  }

  function promote(id, toEnv) {
    updatePipeline(id, (p) => ({
      ...p,
      environment: toEnv,
      status: PipelineStatus.queued,
      lastRunAt: nowIso(),
      durationSec: 0,
      lastError: '',
    }))
    addAudit('Promote', `Promoted ${id} to ${toEnv}`)
  }

  function rollback(id) {
    updatePipeline(id, (p) => ({
      ...p,
      currentReleaseTag: p.lastStableTag,
      status: PipelineStatus.queued,
      lastRunAt: nowIso(),
      durationSec: 0,
      lastError: '',
    }))
    addAudit('Rollback', `Rollback ${id} to ${pipelines.find((x) => x.id === id)?.lastStableTag || 'last stable'}`)
  }

  function proposeRelease(id, tag, changelog) {
    updatePipeline(id, (p) => ({ ...p, currentReleaseTag: tag }))
    addAudit('Propose release', `${id} -> ${tag}${changelog?.trim() ? ` | changelog: ${changelog.trim().slice(0, 120)}…` : ''}`)
  }

  function openDetails(id) {
    setDetailsId(id)
    setSelectedId(id)
  }

  return (
    <div className="min-h-full">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <Header mode={mode} setMode={setMode} />
        {mode === 'github' && githubError ? (
          <div className="mt-4 rounded-xl bg-rose-950/30 p-4 text-sm text-rose-200 ring-1 ring-rose-900/50">
            <div className="font-semibold">GitHub API error</div>
            <div className="mt-1 font-mono text-xs text-rose-100/90">{githubError}</div>
            <div className="mt-2 text-xs text-rose-200/80">
              Fix your GitHub App env vars in the server, then refresh.
            </div>
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Filters value={filters} teams={teams} onChange={setFilters} />

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              {[
                { key: Environments.dev, title: 'Dev' },
                { key: Environments.staging, title: 'Staging' },
                { key: Environments.production, title: 'Production' },
              ].map((lane) => (
                <div key={lane.key} className="rounded-2xl bg-slate-950/30 p-3 ring-1 ring-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-slate-100">{lane.title}</div>
                    <div className="text-xs text-slate-500">{lanes[lane.key].length} pipelines</div>
                  </div>
                  <div className="mt-3 space-y-3">
                    {lanes[lane.key].map((p) => (
                      <div
                        key={p.id}
                        onClick={() => setSelectedId(p.id)}
                        className={[
                          'rounded-xl transition',
                          selectedId === p.id ? 'ring-2 ring-emerald-500' : 'ring-0',
                        ].join(' ')}
                      >
                        <PipelineCard
                          pipeline={p}
                          onTrigger={trigger}
                          onRerunFailed={rerunFailed}
                          onCancel={cancel}
                          onPromote={promote}
                          onApproveProd={approveProd}
                          onRollback={rollback}
                          onOpenDetails={openDetails}
                        />
                      </div>
                    ))}
                    {lanes[lane.key].length === 0 ? (
                      <div className="rounded-xl bg-slate-900/40 p-4 text-sm text-slate-400 ring-1 ring-slate-800">
                        No pipelines in this lane.
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <ReleasePanel selected={selected} onProposeRelease={proposeRelease} />
            <AuditLog entries={audit} />
            <div className="rounded-xl bg-slate-950/40 p-4 ring-1 ring-slate-800">
              <div className="text-sm font-semibold text-slate-100">GitHub API mode (next)</div>
              <div className="mt-2 text-sm text-slate-400">
                In the next step we’ll replace the simulator with real GitHub REST calls (list workflow runs, rerun, cancel).
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Current mode: <span className="font-semibold text-slate-200">{mode}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DetailsModal pipeline={details} onClose={() => setDetailsId(null)} />
    </div>
  )
}
