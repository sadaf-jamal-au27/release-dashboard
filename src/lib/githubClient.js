export async function fetchGitHubPipelines() {
  const base = import.meta.env.VITE_API_BASE || 'http://localhost:8787'
  const res = await fetch(`${base}/api/pipelines`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Request failed: ${res.status}`)
  }
  return res.json()
}

