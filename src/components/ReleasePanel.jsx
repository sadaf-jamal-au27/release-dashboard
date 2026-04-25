import { useMemo, useState } from 'react'

function bump(version, kind) {
  const m = /^v?(\d+)\.(\d+)\.(\d+)(.*)?$/.exec(version.trim())
  if (!m) return version
  let [maj, min, pat] = [Number(m[1]), Number(m[2]), Number(m[3])]
  if (kind === 'major') {
    maj += 1
    min = 0
    pat = 0
  } else if (kind === 'minor') {
    min += 1
    pat = 0
  } else {
    pat += 1
  }
  return `v${maj}.${min}.${pat}`
}

export function ReleasePanel({ selected, onProposeRelease }) {
  const [kind, setKind] = useState('patch')
  const [changelog, setChangelog] = useState('')

  const nextTag = useMemo(() => {
    if (!selected) return ''
    return bump(selected.lastStableTag || selected.currentReleaseTag || 'v0.0.0', kind)
  }, [selected, kind])

  if (!selected) {
    return (
      <div className="rounded-xl bg-slate-950/40 p-4 ring-1 ring-slate-800">
        <div className="text-sm font-semibold text-slate-100">Release versioning</div>
        <div className="mt-2 text-sm text-slate-400">Select a pipeline to propose a release.</div>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-slate-950/40 p-4 ring-1 ring-slate-800">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-100">Release versioning</div>
          <div className="mt-1 text-xs text-slate-400">
            Pipeline: <span className="font-semibold text-slate-200">{selected.repo}</span>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Last stable: <span className="font-mono font-semibold text-slate-200">{selected.lastStableTag}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400">Next tag</div>
          <div className="font-mono text-sm font-semibold text-slate-100">{nextTag}</div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {['major', 'minor', 'patch'].map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={[
              'rounded-md px-2 py-1 text-xs font-semibold ring-1',
              kind === k
                ? 'bg-slate-100 text-slate-900 ring-slate-200'
                : 'bg-slate-900 text-slate-100 ring-slate-800 hover:bg-slate-800',
            ].join(' ')}
          >
            {k}
          </button>
        ))}
      </div>

      <div className="mt-3">
        <div className="text-xs font-semibold text-slate-300">Changelog</div>
        <textarea
          className="mt-2 h-28 w-full resize-none rounded-lg bg-slate-900 p-3 text-sm text-slate-100 ring-1 ring-slate-800 placeholder:text-slate-500"
          placeholder={'- Describe changes\n- Link PRs\n- Note risk/rollout plan'}
          value={changelog}
          onChange={(e) => setChangelog(e.target.value)}
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="text-xs text-slate-500">
          Tip: keep changelog actionable for on-call + rollback.
        </div>
        <button
          type="button"
          onClick={() => onProposeRelease(selected.id, nextTag, changelog)}
          className="rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
        >
          Propose release
        </button>
      </div>
    </div>
  )
}

