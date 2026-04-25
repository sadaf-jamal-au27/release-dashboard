import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { App } from '@octokit/app'
import { Octokit } from '@octokit/rest'

const PORT = process.env.PORT || 8787
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173'

function requiredEnv(name) {
  const v = process.env[name]
  if (!v) throw new Error(`Missing required env: ${name}`)
  return v
}

function parseReposCsv(csv) {
  return (csv || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((full) => {
      const [owner, repo] = full.split('/')
      if (!owner || !repo) throw new Error(`Invalid repo "${full}". Use owner/repo.`)
      return { owner, repo }
    })
}

function readPrivateKey() {
  // Accept either raw PEM in env (with \n) or base64.
  if (process.env.GITHUB_APP_PRIVATE_KEY_PEM) {
    return process.env.GITHUB_APP_PRIVATE_KEY_PEM.replace(/\\n/g, '\n')
  }
  if (process.env.GITHUB_APP_PRIVATE_KEY_BASE64) {
    return Buffer.from(process.env.GITHUB_APP_PRIVATE_KEY_BASE64, 'base64').toString('utf8')
  }
  throw new Error(
    'Missing GitHub App private key. Set GITHUB_APP_PRIVATE_KEY_PEM or GITHUB_APP_PRIVATE_KEY_BASE64.',
  )
}

async function getInstallationOctokit() {
  const appId = requiredEnv('GITHUB_APP_ID')
  const installationId = requiredEnv('GITHUB_APP_INSTALLATION_ID')
  const privateKey = readPrivateKey()

  const app = new App({ appId, privateKey })
  const { token } = await app.getInstallationAccessToken({
    installationId: Number(installationId),
  })

  return new Octokit({ auth: token })
}

function mapRunToPipeline({ repoFull, branch, run }) {
  const conclusion = run.conclusion
  const status = run.status

  let mappedStatus = 'queued'
  if (status === 'queued' || status === 'waiting') mappedStatus = 'queued'
  else if (status === 'in_progress') mappedStatus = 'running'
  else if (status === 'completed') {
    if (conclusion === 'success') mappedStatus = 'success'
    else if (conclusion === 'cancelled' || conclusion === 'skipped') mappedStatus = 'cancelled'
    else mappedStatus = 'failed'
  }

  const startedAt = run.run_started_at || run.created_at
  const updatedAt = run.updated_at || run.created_at
  const durationSec =
    startedAt && updatedAt ? Math.max(0, Math.floor((Date.parse(updatedAt) - Date.parse(startedAt)) / 1000)) : 0

  return {
    id: `${repoFull}:${branch}:${run.id}`,
    repo: repoFull.split('/')[1],
    branch,
    team: 'Team-Unknown',
    environment: guessEnvironmentFromBranch(branch),
    status: mappedStatus,
    lastRunAt: updatedAt || new Date().toISOString(),
    durationSec,
    actor: run.actor?.login || 'unknown',
    commitSha: (run.head_sha || '').slice(0, 7),
    prNumber: (run.pull_requests && run.pull_requests[0] && run.pull_requests[0].number) || 0,
    lastError: mappedStatus === 'failed' ? `Workflow run failed (see GitHub run ${run.html_url}).` : '',
    lastStableTag: 'v0.0.0',
    currentReleaseTag: 'v0.0.0',
    approvals: { production: { required: true, approved: false, note: '' } },
    _links: { htmlUrl: run.html_url },
  }
}

function guessEnvironmentFromBranch(branch) {
  const b = (branch || '').toLowerCase()
  if (b === 'main' || b === 'master') return 'staging'
  if (b.startsWith('release/')) return 'production'
  if (b.startsWith('hotfix/')) return 'production'
  return 'dev'
}

const app = express()
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: false,
  }),
)

app.get('/health', (req, res) => res.json({ ok: true }))

app.get('/api/pipelines', async (req, res) => {
  try {
    const repos = parseReposCsv(requiredEnv('GITHUB_REPOS'))
    const branch = process.env.GITHUB_BRANCH || 'main'
    const perRepo = Number(process.env.GITHUB_RUNS_PER_REPO || '1')

    const octokit = await getInstallationOctokit()

    const results = []
    for (const r of repos) {
      const repoFull = `${r.owner}/${r.repo}`
      const runsResp = await octokit.actions.listWorkflowRunsForRepo({
        owner: r.owner,
        repo: r.repo,
        branch,
        per_page: Math.min(10, Math.max(1, perRepo)),
      })
      const runs = runsResp.data.workflow_runs || []
      for (const run of runs) {
        results.push(mapRunToPipeline({ repoFull, branch, run }))
      }
    }

    res.json({ mode: 'github-app', branch, count: results.length, pipelines: results })
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) })
  }
})

app.listen(PORT, () => {
  console.log(`Server on http://localhost:${PORT}`)
})

