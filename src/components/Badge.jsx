import { statusMeta } from '../lib/utils'

export function Badge({ status }) {
  const meta = statusMeta(status)
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${meta.cls}`}
      title={meta.label}
    >
      {meta.label}
    </span>
  )
}

