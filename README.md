# Release Management Dashboard (Mock GitHub Actions)

React + Tailwind dashboard to manage 10–12 CI/CD pipelines (GitHub Actions style) with **real-time status simulation**.

## What’s implemented (mock data)
- Dashboard overview of pipelines (repo, branch, status, last run time, environment)
- “Real-time” status tracking simulation: `queued → running → success/failed/cancelled`
- Release versioning panel (semver bump major/minor/patch) + changelog editor + propose release
- Environment lanes: `Dev → Staging → Production` with promotion controls
- Manual controls: trigger, re-run failed, cancel
- Approval gate before Production (approve then promote)
- Failure alert card with last error preview + “who broke it”
- Rollback per pipeline to last stable tag
- Filter/sort by status, environment, team + audit log of actions
- Dark UI (Tailwind)

## Run locally
```bash
cd release-dashboard
npm install
npm run dev
```

## GitHub App mode (recommended “production-like” auth)
This app can load real workflow runs via a **local server** authenticated as a GitHub App.

### 1) Create a GitHub App (once)
- Create a GitHub App with **Actions: Read-only** and **Contents: Read-only**
- Install it on the org/user that owns the repos you want to monitor
- Note:
  - App ID
  - Installation ID
  - Private key (PEM)

### 2) Configure the server
```bash
cp server/.env.example server/.env
```
Edit `server/.env`:
- Set `GITHUB_REPOS` to a comma-separated list like `owner/repo,owner2/repo2`
- Set `GITHUB_APP_ID`, `GITHUB_APP_INSTALLATION_ID`
- Set `GITHUB_APP_PRIVATE_KEY_PEM` (escape newlines as `\n`) **or** `GITHUB_APP_PRIVATE_KEY_BASE64`

### 3) Run backend + frontend
Terminal A:
```bash
npm run dev:server
```

Terminal B:
```bash
npm run dev
```

Then toggle the dashboard to **GitHub API** mode.

## How the “real-time” simulation works
- `src/lib/simEngine.js` ticks pipelines every ~3 seconds
- queued runs start running after a short delay
- running runs finish after a randomized duration (biased toward success)

## Next step (real GitHub API)
We’ll replace the simulator with real GitHub REST calls:
- list workflow runs per repo/branch
- rerun failed jobs
- cancel in-progress runs
- approvals mapped to GitHub Environments / required reviewers

We’ll do this behind a safe configuration layer (PAT for learning, then OIDC GitHub App for production patterns).

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
# release-dashboard
