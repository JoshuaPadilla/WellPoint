import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useDomain } from '@/lib/store'
import { useBarangays } from '@/lib/barangays'
import { getUser } from '@/lib/auth'
import { REPORT_STATUSES, REPORT_TYPES, setReportStatus, submitReport, useWaterStore } from '@/lib/water-store'
import type { ReportStatus, ReportType } from '@/lib/water-store'

export const Route = createFileRoute('/dashboard/reports')({ component: Page })

const card = 'rounded-xl border border-line bg-white p-4'
const field = 'w-full rounded-lg border border-line bg-white px-2.5 py-1.5 text-sm'

const when = (iso: string) => new Date(iso).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })

const STATUS_TONE: Record<ReportStatus, string> = {
  new: 'bg-red-100 text-red-700',
  acknowledged: 'bg-amber-100 text-amber-800',
  resolved: 'bg-emerald-100 text-emerald-800',
}

function Page() {
  const domain = useDomain()
  const { role } = useWaterStore()
  const { barangays } = useBarangays()
  const user = typeof window === 'undefined' ? null : getUser()

  // Barangay leaders run the inbox; residents submit reports. LGU/DRRM have no report screen.
  if (role === 'lgu' || role === 'drrm') {
    return (
      <div>
        <h1 className="text-3xl font-extrabold">Reports</h1>
        <p className="mt-5 rounded-xl border border-dashed border-line p-6 text-sm text-ink/70">
          Reports are filed by residents and triaged by barangay leaders. Your alerts view already reflects them.
        </p>
      </div>
    )
  }

  if (role === 'citizen') {
    return <CitizenForm domain={domain} barangays={barangays} />
  }

  return <OfficialInbox domain={domain} barangayPsgc={user?.barangayPsgc ?? ''} />
}

// Residents: submit a report for their own barangay, and see their past submissions.
function CitizenForm({ domain, barangays }: { domain: ReturnType<typeof useDomain>; barangays: { psgcCode: string; name: string }[] }) {
  const user = typeof window === 'undefined' ? null : getUser()
  const [type, setType] = useState<ReportType>('no_water')
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState('')

  const brgyName = barangays.find((b) => b.psgcCode === user?.barangayPsgc)?.name ?? ''

  const submit = async () => {
    if (!user?.barangayPsgc) return
    setBusy(true)
    setErr('')
    const error = await submitReport({
      reporterId: user.id,
      barangayPsgc: user.barangayPsgc,
      type,
      description: description.trim(),
    })
    setBusy(false)
    if (error) setErr(error)
    else {
      setDone(true)
      setDescription('')
      window.setTimeout(() => setDone(false), 4000)
    }
  }

  const mine = domain.reports.filter((r) => r.reporterId === user?.id)

  return (
    <div>
      <h1 className="text-3xl font-extrabold">Report a problem</h1>
      <p className="mt-2 max-w-xl text-ink/70">
        Tell your barangay leader when the water stops, runs low, or looks unsafe. They'll see it in their inbox.
      </p>

      <section className={cn(card, 'mt-5')}>
        <h2 className="text-lg font-extrabold">New report · {brgyName || 'your barangay'}</h2>
        <label className="mt-3 block text-sm font-semibold">
          Type
          <select className={cn(field, 'mt-1')} value={type} onChange={(e) => setType(e.target.value as ReportType)}>
            {Object.entries(REPORT_TYPES).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </label>
        <label className="mt-3 block text-sm font-semibold">
          Description
          <textarea
            className={cn(field, 'mt-1 min-h-20')}
            placeholder="What happened, and since when?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button onClick={() => void submit()} disabled={busy || !user?.barangayPsgc}>
            <Send className="size-3.5" aria-hidden="true" /> {busy ? 'Sending…' : 'Submit report'}
          </Button>
          {done && <p className="text-sm font-semibold text-emerald-700">Report submitted.</p>}
          {err && <p className="text-sm text-orange-700">{err}</p>}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-extrabold">Your reports ({mine.length})</h2>
        {mine.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-line p-6 text-sm text-ink/70">You haven't submitted a report yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {mine.map((r) => (
              <li key={r.id} className={cn(card, 'space-y-1')}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-extrabold">{REPORT_TYPES[r.type]}</p>
                  <p className="text-xs text-ink/60">{when(r.createdAt)}</p>
                </div>
                {r.description && <p className="text-sm">{r.description}</p>}
                <span className={cn('inline-block rounded-full px-2 py-0.5 text-xs font-bold', STATUS_TONE[r.status])}>
                  {REPORT_STATUSES[r.status]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

// Barangay leaders: an inbox of their barangay's reports with triage actions.
function OfficialInbox({ domain, barangayPsgc }: { domain: ReturnType<typeof useDomain>; barangayPsgc: string }) {
  const reports = domain.reports.filter((r) => r.barangayPsgc === barangayPsgc)
  const open = reports.filter((r) => r.status !== 'resolved')

  return (
    <div>
      <h1 className="text-3xl font-extrabold">Reports inbox</h1>
      <p className="mt-2 max-w-xl text-ink/70">
        Reports from residents of your barangay. Acknowledge a report and mark it resolved once it's handled.
      </p>

      {reports.length === 0 ? (
        <p className="mt-5 rounded-xl border border-dashed border-line p-6 text-sm text-ink/70">No reports in your barangay yet.</p>
      ) : (
        <ul className="mt-5 space-y-3">
          {reports.map((r) => (
            <li key={r.id} className={cn(card, 'space-y-2')}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-extrabold">{REPORT_TYPES[r.type]}</p>
                <p className="text-xs text-ink/60">{when(r.createdAt)}</p>
              </div>
              <p className="text-sm text-ink/70">by {r.reporterName || 'a resident'}</p>
              {r.description && <p className="text-sm">{r.description}</p>}
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn('rounded-full px-2 py-0.5 text-xs font-bold', STATUS_TONE[r.status])}>
                  {REPORT_STATUSES[r.status]}
                </span>
                {r.status === 'new' && (
                  <button type="button" className="text-sm font-semibold text-well underline" onClick={() => void setReportStatus(r.id, 'acknowledged')}>
                    Acknowledge
                  </button>
                )}
                {r.status !== 'resolved' && (
                  <button type="button" className="text-sm font-semibold text-well underline" onClick={() => void setReportStatus(r.id, 'resolved')}>
                    Resolve
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-3 text-xs text-ink/60">{open.length} open · {reports.length - open.length} resolved</p>
    </div>
  )
}
