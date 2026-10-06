import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { BellRing } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useDomain, barangayName } from '@/lib/store'
import { getUser } from '@/lib/auth'
import { WARNING_STATUSES, WARNING_TYPES, createWarning, setWarningStatus, useWaterStore } from '@/lib/water-store'
import type { WarningStatus, WarningType } from '@/lib/water-store'
import type { AlertSeverity } from '@/data/types'

export const Route = createFileRoute('/dashboard/warnings')({ component: Page })

const card = 'rounded-xl border border-line bg-white p-4'
const field = 'w-full rounded-lg border border-line bg-white px-2.5 py-1.5 text-sm'

const SEVERITY: Record<AlertSeverity, string> = {
  info: 'bg-sky text-well',
  warning: 'bg-amber-100 text-amber-800',
  critical: 'bg-red-100 text-red-700',
}
const STATUS_TONE: Record<WarningStatus, string> = {
  active: 'bg-red-100 text-red-700',
  resolved: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-slate-200 text-slate-700',
}

const when = (iso: string) => new Date(iso).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })

function Page() {
  const domain = useDomain()
  const { role, warnings } = useWaterStore()
  const user = typeof window === 'undefined' ? null : getUser()
  const canAuthor = role === 'drrm'

  const [type, setType] = useState<WarningType>('outage')
  const [severity, setSeverity] = useState<AlertSeverity>('warning')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [action, setAction] = useState('')
  const [targets, setTargets] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState('')

  const toggleTarget = (psgc: string) =>
    setTargets((t) => (t.includes(psgc) ? t.filter((x) => x !== psgc) : [...t, psgc]))

  const submit = async () => {
    if (!user || !title.trim()) return
    setBusy(true)
    setErr('')
    const error = await createWarning({
      authorId: user.id,
      type,
      severity,
      title: title.trim(),
      message: message.trim(),
      action: action.trim(),
      barangayPsgcs: targets,
    })
    setBusy(false)
    if (error) setErr(error)
    else {
      setDone(true)
      setTitle('')
      setMessage('')
      setAction('')
      setTargets([])
      window.setTimeout(() => setDone(false), 4000)
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-extrabold">Early warnings</h1>
      <p className="mt-2 max-w-xl text-ink/70">
        DRRM issues early warnings to affected barangays so they can prepare before an interruption or disaster.
      </p>

      {canAuthor ? (
        <section className={cn(card, 'mt-5')}>
          <h2 className="text-lg font-extrabold">Issue a warning</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-semibold">
              Type
              <select className={cn(field, 'mt-1')} value={type} onChange={(e) => setType(e.target.value as WarningType)}>
                {Object.entries(WARNING_TYPES).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold">
              Severity
              <select className={cn(field, 'mt-1')} value={severity} onChange={(e) => setSeverity(e.target.value as AlertSeverity)}>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </select>
            </label>
          </div>
          <label className="mt-3 block text-sm font-semibold">
            Title
            <input className={cn(field, 'mt-1')} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short headline, e.g. Typhoon warning" />
          </label>
          <label className="mt-3 block text-sm font-semibold">
            Message
            <textarea className={cn(field, 'mt-1 min-h-20')} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="What should residents know and do?" />
          </label>
          <label className="mt-3 block text-sm font-semibold">
            Recommended action
            <input className={cn(field, 'mt-1')} value={action} onChange={(e) => setAction(e.target.value)} placeholder="e.g. Store drinking water now" />
          </label>
          <div className="mt-4">
            <p className="text-sm font-semibold">Affected barangays</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setTargets([])}
                className={cn('rounded-full px-3 py-1 text-xs font-semibold', targets.length === 0 ? 'bg-well text-white' : 'bg-mist text-ink/70')}
              >
                Whole city
              </button>
              {domain.communities.map((c) => (
                <button
                  key={c.psgcCode}
                  type="button"
                  onClick={() => toggleTarget(c.psgcCode)}
                  className={cn('rounded-full px-3 py-1 text-xs font-semibold', targets.includes(c.psgcCode) ? 'bg-well text-white' : 'bg-mist text-ink/70')}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button onClick={() => void submit()} disabled={busy || !title.trim()}>
              <BellRing className="size-3.5" aria-hidden="true" /> {busy ? 'Sending…' : 'Issue warning'}
            </Button>
            {done && <p className="text-sm font-semibold text-emerald-700">Warning issued.</p>}
            {err && <p className="text-sm text-orange-700">{err}</p>}
          </div>
        </section>
      ) : (
        <p className="mt-5 rounded-xl border border-dashed border-line p-6 text-sm text-ink/70">
          Early warnings are issued by DRRM.
        </p>
      )}

      <section className="mt-6">
        <h2 className="text-lg font-extrabold">Active warnings ({warnings.filter((w) => w.status === 'active').length})</h2>
        {warnings.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-line p-6 text-sm text-ink/70">No warnings issued yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {warnings.map((w) => (
              <li key={w.id} className={cn(card, 'space-y-2', w.status !== 'active' && 'opacity-70')}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-extrabold">{w.title}</p>
                  <p className="text-xs text-ink/60">{when(w.createdAt)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-mist px-2 py-0.5 text-xs font-semibold text-ink/70">{WARNING_TYPES[w.type]}</span>
                  <span className={cn('rounded-full px-2 py-0.5 text-xs font-bold', SEVERITY[w.severity])}>{w.severity}</span>
                  <span className={cn('rounded-full px-2 py-0.5 text-xs font-bold', STATUS_TONE[w.status])}>{WARNING_STATUSES[w.status]}</span>
                </div>
                {w.message && <p className="text-sm">{w.message}</p>}
                {w.action && <p className="text-xs font-semibold text-ink/60">Recommended: {w.action}</p>}
                <p className="text-xs text-ink/60">
                  Targets: {w.barangayPsgcs.length === 0 ? 'Whole city' : w.barangayPsgcs.map((p) => barangayName(domain.communities, p)).join(', ')}
                  {w.authorName ? ` · by ${w.authorName}` : ''}
                </p>
                {canAuthor && w.status === 'active' && (
                  <div className="flex gap-2">
                    <button type="button" className="text-sm font-semibold text-well underline" onClick={() => void setWarningStatus(w.id, 'resolved')}>
                      Resolve
                    </button>
                    <button type="button" className="text-sm font-semibold text-ink/60 underline" onClick={() => void setWarningStatus(w.id, 'cancelled')}>
                      Cancel
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
