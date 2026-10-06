import { useMemo, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { ISSUES, KINDS, STATUSES, useWaterStore } from '@/lib/water-store'
import type { Asset, Report } from '@/lib/water-store'

export const Route = createFileRoute('/dashboard/my-reports')({ component: Page })

type Filter = 'all' | 'open' | 'resolved'
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Open' },
  { id: 'resolved', label: 'Resolved' },
]

const card = 'rounded-xl border border-line bg-white p-4'
const when = (t: number) => new Date(t).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })

// Citizens: every report they filed, newest first. The database only returns their own.
function Page() {
  const { role, assets, myReports, loading } = useWaterStore()
  const [filter, setFilter] = useState<Filter>('all')
  const byId = useMemo(() => new Map(assets.map((a) => [a.id, a])), [assets])

  const open = myReports.filter((r) => r.resolvedAt === null).length
  const shown = myReports.filter((r) =>
    filter === 'all' ? true : filter === 'open' ? r.resolvedAt === null : r.resolvedAt !== null,
  )

  if (role !== 'citizen') {
    return (
      <div>
        <h1 className="text-3xl font-extrabold">My reports</h1>
        <p className="mt-4 rounded-xl border border-dashed border-line p-6 text-sm text-ink/70">
          This page is for citizens to follow the problems they reported. Reports you can act on are on the{' '}
          <Link to="/dashboard" className="font-semibold text-well underline">dashboard</Link>.
        </p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-extrabold">My reports</h1>
      <p className="mt-2 max-w-xl text-ink/70">
        Problems you reported and whether they've been fixed. A report is resolved when the water source is marked
        working again.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div role="group" aria-label="Filter reports" className="flex gap-1 rounded-xl bg-sky p-1 text-sm font-bold">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={cn('rounded-lg px-3 py-1.5', filter === f.id ? 'bg-white text-ink shadow' : 'text-ink/70')}
            >
              {f.label}
              {f.id === 'open' && open > 0 && ` (${open})`}
            </button>
          ))}
        </div>
        <Link to="/dashboard/map" className="text-sm font-semibold text-well underline">
          Report a new problem on the map
        </Link>
      </div>

      {loading ? null : myReports.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-line p-6 text-sm text-ink/70">
          You haven't reported anything yet. Open the{' '}
          <Link to="/dashboard/map" className="font-semibold text-well underline">barangay map</Link>, select a pump or
          well, and tell us what's wrong.
        </p>
      ) : shown.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-line p-6 text-sm text-ink/70">
          No {filter} reports.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {shown.map((r) => (
            <ReportCard key={r.id} r={r} source={byId.get(r.assetId)} />
          ))}
        </ul>
      )}
    </div>
  )
}

function ReportCard({ r, source }: { r: Report; source: Asset | undefined }) {
  const resolved = r.resolvedAt !== null
  return (
    <li className={cn(card, 'space-y-2 border-l-4', resolved ? 'border-l-emerald-500' : 'border-l-amber-500')}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-extrabold">{source ? source.name : 'Removed water source'}</p>
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-xs font-bold',
            resolved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800',
          )}
        >
          {resolved ? 'Resolved' : 'Open'}
        </span>
      </div>
      <p className="text-sm text-ink/70">
        {source ? KINDS[source.kind] : 'Water source'}
        {r.sourceBarangay && ` · Brgy. ${r.sourceBarangay}`} · Reported {when(r.at)}
      </p>
      <p className="font-semibold">{ISSUES[r.issue]}</p>
      {r.note && <p className="text-sm">{r.note}</p>}
      <div className="flex flex-wrap items-center gap-3 text-sm">
        {resolved ? (
          <p className="text-emerald-800">Marked working again {when(r.resolvedAt!)}.</p>
        ) : (
          source && (
            <p>
              Current status:{' '}
              <span className={cn('rounded-full px-2 py-0.5 text-xs font-bold', STATUSES[source.status].badge)}>
                {STATUSES[source.status].label}
              </span>
            </p>
          )
        )}
      </div>
    </li>
  )
}
