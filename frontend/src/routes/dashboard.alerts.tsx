import { useMemo, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { AlertTriangle, CheckCircle2, Info, ShieldAlert } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDomain } from '@/lib/store'
import { getUser } from '@/lib/auth'
import { setReportStatus, setStatus, setWarningStatus, useWaterStore } from '@/lib/water-store'
import type { Alert, AlertSeverity, AlertType } from '@/data/types'

export const Route = createFileRoute('/dashboard/alerts')({ component: Page })

const card = 'rounded-xl border border-line bg-white p-4'
const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase()

const SEVERITY: Record<AlertSeverity, { label: string; tone: string; border: string; Icon: LucideIcon }> = {
  critical: { label: 'Critical', tone: 'bg-red-600 text-white', border: 'border-l-red-600', Icon: ShieldAlert },
  warning: { label: 'Warning', tone: 'bg-amber-100 text-amber-800', border: 'border-l-amber-500', Icon: AlertTriangle },
  info: { label: 'Info', tone: 'bg-sky text-well', border: 'border-l-aqua', Icon: Info },
}

const TYPE_LABEL: Record<AlertType, string> = { shortage: 'Shortage', contamination: 'Contamination', outage: 'Outage' }

const when = (iso: string) => new Date(iso).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })

function Page() {
  const domain = useDomain()
  const { role } = useWaterStore()
  const myBarangay = typeof window === 'undefined' ? '' : (getUser()?.barangay ?? '')
  const scoped = role === 'citizen' || role === 'official'
  const [busyId, setBusyId] = useState<string | null>(null)
  const [err, setErr] = useState('')

  const active = useMemo(
    () => domain.activeAlerts.filter((a) => !scoped || same(a.area, myBarangay)),
    [domain.activeAlerts, scoped, myBarangay],
  )
  const resolved = domain.alerts.filter((a) => a.status === 'resolved' && (!scoped || same(a.area, myBarangay)))

  const count = (severity: AlertSeverity) => active.filter((a) => a.severity === severity).length

  // LGU triages report-derived and authored-warning alerts city-wide; a barangay
  // official resolves the report/source alerts for their own barangay. System
  // alerts are cleared from the Systems page by the LGU/DRRM water office.
  const canResolve = (a: Alert): boolean => {
    if (role === 'lgu') return !!a.reportId || !!a.warningId
    if (role === 'official') return !!a.reportId || a.id.startsWith('alert-src-')
    return false
  }

  const resolve = async (a: Alert) => {
    setBusyId(a.id)
    setErr('')
    let error: string | null = null
    if (a.reportId) error = await setReportStatus(a.reportId, 'resolved')
    else if (a.warningId) error = await setWarningStatus(a.warningId, 'resolved')
    else if (a.id.startsWith('alert-src-')) setStatus(a.id.slice('alert-src-'.length), 'ok')
    setBusyId(null)
    if (error) setErr(error)
  }

  return (
    <div>
      <h1 className="text-3xl font-extrabold">Alerts</h1>
      <p className="mt-2 max-w-xl text-ink/70">
        {scoped
          ? `Alerts for Brgy. ${myBarangay || 'your barangay'}, derived from your system's status and nearby reports.`
          : 'City-wide early warnings derived from every system, source, and community report — not a black box.'}
      </p>

      {err && (
        <p role="alert" className="mt-4 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
          {err}
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <Summary label="Critical" count={count('critical')} tone="bg-red-600 text-white" />
        <Summary label="Warning" count={count('warning')} tone="bg-amber-500 text-white" />
        <Summary label="Info" count={count('info')} tone="bg-aqua text-white" />
      </div>

      {active.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-line p-6 text-sm text-ink/70">
          {scoped ? `No active alerts in Brgy. ${myBarangay || 'your barangay'}.` : 'No active alerts. Every system is running normally.'}
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {active.map((a) => (
            <AlertCard
              key={a.id}
              alert={a}
              onResolve={canResolve(a) ? () => resolve(a) : undefined}
              busy={busyId === a.id}
            />
          ))}
        </ul>
      )}

      {resolved.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-extrabold">Resolved</h2>
          <ul className="mt-3 space-y-3">
            {resolved.map((a) => <AlertCard key={a.id} alert={a} />)}
          </ul>
        </section>
      )}

      <p className="mt-6 text-sm">
        <Link to="/dashboard/map" className="font-semibold text-well underline">See the map</Link>
        {(role === 'citizen' || role === 'official') && (
          <> · <Link to="/dashboard/reports" className="font-semibold text-well underline">Reports</Link></>
        )}
      </p>
    </div>
  )
}

function Summary({ label, count, tone }: { label: string; count: number; tone: string }) {
  return (
    <div className={cn(card, 'flex items-center gap-3 py-3')}>
      <span className={cn('grid size-9 place-items-center rounded-full text-sm font-extrabold', tone)}>{count}</span>
      <span className="text-sm font-semibold">{label}</span>
    </div>
  )
}

function AlertCard({ alert, onResolve, busy }: { alert: Alert; onResolve?: () => void; busy?: boolean }) {
  const s = SEVERITY[alert.severity]
  const resolved = alert.status === 'resolved'
  return (
    <li className={cn(card, 'border-l-4', s.border, resolved && 'opacity-70')}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <s.Icon className="size-4 text-ink/50" aria-hidden="true" />
          <p className="font-extrabold">{alert.area}</p>
          <span className={cn('rounded-full px-2 py-0.5 text-xs font-bold', s.tone)}>{s.label}</span>
          <span className="rounded-full bg-mist px-2 py-0.5 text-xs font-semibold text-ink/70">{TYPE_LABEL[alert.type]}</span>
        </div>
        <p className="text-xs text-ink/60">{when(alert.raisedAt)}</p>
      </div>
      <p className="mt-2 text-sm">{alert.message}</p>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
        <p className="text-xs font-semibold text-ink/60">Reason: {alert.reason}</p>
        {!resolved && (
          <p className="flex items-center gap-1 text-xs font-bold text-well">
            <CheckCircle2 className="size-3.5" aria-hidden="true" /> Recommended: {alert.action}
          </p>
        )}
        {onResolve && !resolved && (
          <button
            type="button"
            onClick={onResolve}
            disabled={busy}
            className="rounded-lg bg-well px-3 py-1 text-xs font-bold text-white hover:bg-deep disabled:opacity-50"
          >
            {busy ? 'Resolving…' : 'Resolve'}
          </button>
        )}
      </div>
    </li>
  )
}
