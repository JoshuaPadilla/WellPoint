<<<<<<< HEAD
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
=======
import { useEffect, useMemo, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { getUser } from '@/lib/auth'
import { useBarangays } from '@/lib/barangays'
import { CAN_SET_STATUS, ISSUES, KINDS, STATUSES, loadResolvedReports, setStatus, useWaterStore } from '@/lib/water-store'
import type { Asset, Issue, Report, Status } from '@/lib/water-store'

export const Route = createFileRoute('/dashboard/reports')({ component: Page })

type Tab = 'open' | 'resolved'

const card = 'rounded-xl border border-line bg-white p-4'
const field = 'rounded-lg border border-line bg-white px-3 py-2 text-sm'
const when = (t: number) => new Date(t).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })
const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase()

// Reports from citizens. The database decides what comes back:
// LGU gets every barangay, a barangay official only reports about sources in their barangay.
function Page() {
  const { role, assets, reports: openReports, loading } = useWaterStore()
  const { names, loaded: boundariesLoaded } = useBarangays()
  const myBarangay = typeof window === 'undefined' ? '' : (getUser()?.barangay ?? '')
  const isLgu = role === 'lgu'

  const [tab, setTab] = useState<Tab>('open')
  const [issue, setIssue] = useState<Issue | 'all'>('all')
  const [barangay, setBarangay] = useState('all')
  const [query, setQuery] = useState('')

  // Resolved reports are only fetched when that tab is opened.
  const [resolved, setResolved] = useState<Report[] | null>(null)
  const [resolvedError, setResolvedError] = useState('')
  useEffect(() => {
    if (tab !== 'resolved' || resolved !== null) return
    loadResolvedReports()
      .then(setResolved)
      .catch((e: Error) => {
        setResolvedError(e.message)
        setResolved([])
      })
  }, [tab, resolved])

  const byId = useMemo(() => new Map(assets.map((a) => [a.id, a])), [assets])
  const source = tab === 'open' ? openReports : (resolved ?? [])

  // LGU can narrow by barangay; the list only offers barangays that actually have reports.
  const barangaysWithReports = useMemo(
    () => [...new Set(source.map((r) => r.sourceBarangay).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'en', { numeric: true })),
    [source],
  )

  const q = query.trim().toLowerCase()
  const shown = source.filter((r) => {
    if (issue !== 'all' && r.issue !== issue) return false
    if (isLgu && barangay !== 'all' && r.sourceBarangay !== barangay) return false
    if (!q) return true
    const a = byId.get(r.assetId)
    return [a?.name, r.reporterName, r.sourceBarangay, r.note].some((t) => t?.toLowerCase().includes(q))
  })

  const counts = (Object.keys(ISSUES) as Issue[]).map((k) => ({ k, n: openReports.filter((r) => r.issue === k).length }))

  if (role !== 'lgu' && role !== 'official') {
    return (
      <div>
        <h1 className="text-3xl font-extrabold">Reports</h1>
        <p className="mt-4 rounded-xl border border-dashed border-line p-6 text-sm text-ink/70">
          Reports from citizens are handled by the LGU and barangay officials.
          {role === 'citizen' && (
            <>
              {' '}You can follow the problems you reported in{' '}
              <Link to="/dashboard/my-reports" className="font-semibold text-well underline">My reports</Link>.
            </>
          )}
>>>>>>> d57b73fa1274ad1dd4a0c1679f937505514d5ad7
        </p>
      </div>
    )
  }

<<<<<<< HEAD
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
=======
  const barangayKnown = names.some((n) => same(n, myBarangay))

  return (
    <div>
      <h1 className="text-3xl font-extrabold">Reports</h1>
      <p className="mt-2 max-w-xl text-ink/70">
        {isLgu
          ? 'Problems citizens reported about water sources across Catbalogan.'
          : `Problems citizens reported about water sources in Brgy. ${myBarangay || '—'}.`}
      </p>

      {!isLgu && boundariesLoaded && !barangayKnown && (
        <p role="alert" className="mt-4 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
          Your profile's barangay ("{myBarangay || 'not set'}") doesn't match a barangay on the map, so no reports can reach
          you. Ask the LGU to correct it in Supabase (Table Editor → profiles → barangay).
        </p>
      )}

      {/* Open reports by issue */}
      <dl className="mt-5 flex flex-wrap gap-3">
        {counts.map(({ k, n }) => (
          <div key={k} className={cn(card, 'min-w-36 py-3')}>
            <dt className="text-sm text-ink/70">{ISSUES[k]}</dt>
            <dd className="text-2xl font-extrabold">{n}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div role="group" aria-label="Open or resolved" className="flex gap-1 rounded-xl bg-sky p-1 text-sm font-bold">
          {(['open', 'resolved'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={tab === t}
              onClick={() => setTab(t)}
              className={cn('rounded-lg px-3 py-1.5', tab === t ? 'bg-white text-ink shadow' : 'text-ink/70')}
            >
              {t === 'open' ? `Open (${openReports.length})` : 'Resolved'}
            </button>
          ))}
        </div>

        <select aria-label="Filter by problem" value={issue} onChange={(e) => setIssue(e.target.value as Issue | 'all')} className={field}>
          <option value="all">All problems</option>
          {(Object.keys(ISSUES) as Issue[]).map((k) => (
            <option key={k} value={k}>{ISSUES[k]}</option>
          ))}
        </select>

        {isLgu && (
          <select aria-label="Filter by barangay" value={barangay} onChange={(e) => setBarangay(e.target.value)} className={field}>
            <option value="all">All barangays</option>
            {barangaysWithReports.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        )}

        <input
          type="search"
          aria-label="Search reports"
          placeholder="Search source, reporter or note"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={cn(field, 'min-w-56 flex-1')}
        />
      </div>

      {resolvedError && tab === 'resolved' && (
        <p role="alert" className="mt-4 text-sm text-orange-700">{resolvedError}</p>
      )}

      {loading || (tab === 'resolved' && resolved === null) ? (
        <p className="mt-6 text-sm text-ink/60">Loading reports…</p>
      ) : shown.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-line p-6 text-sm text-ink/70">
          {source.length === 0
            ? tab === 'open'
              ? 'No open reports right now. New reports show up here as citizens send them.'
              : 'No resolved reports yet.'
            : 'No reports match these filters.'}
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {shown.map((r) => (
            <ReportRow key={r.id} r={r} asset={byId.get(r.assetId)} />
          ))}
        </ul>
      )}
    </div>
  )
}

function ReportRow({ r, asset }: { r: Report; asset: Asset | undefined }) {
  const { role } = useWaterStore()
  const resolved = r.resolvedAt !== null
  const canSet = !resolved && asset && CAN_SET_STATUS[role].includes(asset.kind)

  return (
    <li className={cn(card, 'space-y-2 border-l-4', resolved ? 'border-l-emerald-500' : r.issue === 'empty' ? 'border-l-red-600' : 'border-l-amber-500')}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-extrabold">
          {asset ? asset.name : 'Removed water source'}
          {asset && <span className="ml-2 text-sm font-normal text-ink/60">{KINDS[asset.kind]}</span>}
        </p>
        <p className="text-xs text-ink/60">{when(r.at)}</p>
      </div>
      <p className="font-semibold">{ISSUES[r.issue]}</p>
      {r.note && <p className="text-sm">{r.note}</p>}
      <p className="text-xs text-ink/60">
        {r.sourceBarangay ? `Brgy. ${r.sourceBarangay}` : 'Barangay not recorded'}
        {r.reporterName && `, reported by ${r.reporterName}`}
      </p>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {resolved ? (
          <p className="text-sm text-emerald-800">Resolved {when(r.resolvedAt!)}</p>
        ) : canSet ? (
          <label className="flex items-center gap-2 text-sm font-semibold">
            Status
            <select
              value={asset.status}
              onChange={(e) => setStatus(asset.id, e.target.value as Status)}
              className="rounded-md border border-line bg-white px-2 py-1.5 font-normal"
            >
              {Object.entries(STATUSES).map(([v, s]) => (
                <option key={v} value={v}>{s.label}</option>
              ))}
            </select>
          </label>
        ) : asset ? (
          <span className={cn('rounded-full px-2 py-0.5 text-xs font-bold', STATUSES[asset.status].badge)}>
            {STATUSES[asset.status].label}
          </span>
        ) : (
          <span />
        )}
        <Link to="/dashboard/map" className="text-sm font-semibold text-well underline">
          See on map
        </Link>
      </div>
    </li>
  )
>>>>>>> d57b73fa1274ad1dd4a0c1679f937505514d5ad7
}
