<<<<<<< HEAD
import { createFileRoute, redirect } from '@tanstack/react-router'

// The map is the main screen for every role. The LGU score summary lives in a
// "Summary" overlay on the map (see components/SummaryPanel.tsx).
export const Route = createFileRoute('/dashboard/')({
  beforeLoad: () => {
    throw redirect({ to: '/dashboard/map' })
  },
})
=======
import { useMemo, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { SupplyOutlook } from '@/components/SupplyOutlook'
import { useBarangays } from '@/lib/barangays'
import { getUser } from '@/lib/auth'
import { CAN_SET_STATUS, ISSUES, STATUSES, hasStatus, isShort, setStatus, useWaterStore } from '@/lib/water-store'
import type { Asset, Role, Status } from '@/lib/water-store'

export const Route = createFileRoute('/dashboard/')({ component: Page })

// The four roles. The user's role comes from their profile in Supabase (set in dashboard.tsx).
const PERSONAS: { role: Role; label: string; blurb: string }[] = [
  { role: 'lgu', label: 'LGU', blurb: 'Citizen reports, newest first, and every water source that is not working.' },
  { role: 'official', label: 'Barangay official', blurb: 'Reports and pumps and wells in your barangay. Update their status as it changes.' },
  { role: 'drrm', label: 'DRRM', blurb: 'Barangays with the most empty or low pumps and wells.' },
  { role: 'citizen', label: 'Household', blurb: 'Pumps and wells near you that are empty or have problems.' },
]

const CITY_CENTER = { lat: 11.78, lng: 124.89 }

function km(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const rad = Math.PI / 180
  const h =
    Math.sin(((b.lat - a.lat) * rad) / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(((b.lng - a.lng) * rad) / 2) ** 2
  return 12742 * Math.asin(Math.sqrt(h))
}

const when = (t: number) => new Date(t).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })
const card = 'rounded-xl border border-line bg-white p-4'
const empty = (text: string) => <p className="rounded-xl border border-dashed border-line p-6 text-sm text-ink/70">{text}</p>

function Page() {
  const { role } = useWaterStore()
  const current = PERSONAS.find((p) => p.role === role) ?? PERSONAS[3]
  const { barangayOf } = useBarangays()

  return (
    <div>
      <h1 className="text-3xl font-extrabold">Dashboard</h1>

      <div className="mt-5">
        <SupplyOutlook />
      </div>

      <p className="mt-5 text-sm">
        Viewing as <span className="rounded-lg bg-ink px-3 py-1 font-bold text-white">{current.label}</span>
      </p>
      <p className="mt-3 max-w-xl text-ink/70">{current.blurb}</p>

      <section aria-label={current.label} className="mt-6">
        {role === 'lgu' && <LguView barangayOf={barangayOf} />}
        {role === 'official' && <OfficialView barangayOf={barangayOf} />}
        {role === 'drrm' && <DrrmView barangayOf={barangayOf} />}
        {role === 'citizen' && <HouseholdView barangayOf={barangayOf} />}
      </section>
    </div>
  )
}

function StatusBadge({ status }: { status: Status }) {
  return (
    <p className={cn('mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-bold', STATUSES[status].badge)}>
      {STATUSES[status].label}
    </p>
  )
}

function StatusPicker({ asset }: { asset: Asset }) {
  const { role } = useWaterStore()
  if (!CAN_SET_STATUS[role].includes(asset.kind)) return <StatusBadge status={asset.status} />
  return (
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
  )
}

type ViewProps = { barangayOf: (a: { lng: number; lat: number }) => string | null }

function MapLink() {
  return (
    <Link to="/dashboard/map" className="text-sm font-semibold text-well underline">
      See on map
    </Link>
  )
}

const WORST_FIRST: Status[] = ['empty', 'unsafe', 'low', 'repair', 'ok']
const byWorst = (a: Asset, b: Asset) => WORST_FIRST.indexOf(a.status) - WORST_FIRST.indexOf(b.status)

// LGU: citizen reports (only the LGU can read these), then every source that isn't working.
function LguView({ barangayOf }: ViewProps) {
  const { assets, reports } = useWaterStore()
  const byId = useMemo(() => new Map(assets.map((a) => [a.id, a])), [assets])
  const reportRows = reports.filter((r) => byId.has(r.assetId)) // already newest first
  const down = assets.filter((a) => a.status !== 'ok').sort(byWorst)

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-lg font-extrabold">Citizen reports ({reportRows.length})</h2>
        {reportRows.length === 0 ? (
          empty('No reports right now. New reports from citizens show up here as they come in.')
        ) : (
          <ul className="space-y-3">
            {reportRows.map((r) => {
              const a = byId.get(r.assetId)!
              return (
                <li key={r.id} className={cn(card, 'space-y-2')}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-extrabold">{a.name}</p>
                    <p className="text-xs text-ink/60">{when(r.at)}</p>
                  </div>
                  <p className="text-sm text-ink/70">{barangayOf(a) ?? 'Barangay unknown'}</p>
                  <p className="font-semibold">{ISSUES[r.issue]}</p>
                  {r.note && <p className="text-sm">{r.note}</p>}
                  {r.reporterName && (
                    <p className="text-xs text-ink/60">
                      Reported by {r.reporterName}
                      {r.reporterBarangay && ` · Brgy. ${r.reporterBarangay}`}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <StatusPicker asset={a} />
                    <MapLink />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-extrabold">Not working ({down.length})</h2>
        {down.length === 0 ? (
          empty('Every water source is working right now.')
        ) : (
          <ul className="space-y-3">
            {down.map((a) => (
              <li key={a.id} className={cn(card, 'flex flex-wrap items-center justify-between gap-3')}>
                <div>
                  <p className="font-extrabold">{a.name}</p>
                  <p className="text-sm text-ink/70">
                    {barangayOf(a) ?? 'Barangay unknown'} · {reports.filter((r) => r.assetId === a.id).length} report(s)
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <StatusPicker asset={a} />
                  <MapLink />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase()

// Barangay official: open reports from their barangay (the database only returns those),
// then the pumps and wells inside their barangay, problems first, each with a status dropdown.
function OfficialView({ barangayOf }: ViewProps) {
  const { assets, reports } = useWaterStore()
  const { names, loaded } = useBarangays()
  const myBarangay = typeof window === 'undefined' ? '' : (getUser()?.barangay ?? '')
  const known = names.some((n) => same(n, myBarangay))
  const byId = useMemo(() => new Map(assets.map((a) => [a.id, a])), [assets])
  const reportRows = reports.filter((r) => byId.has(r.assetId))
  const mine = assets
    .filter((a) => hasStatus(a.kind) && (!known || same(barangayOf(a) ?? '', myBarangay)))
    .sort((a, b) => byWorst(a, b) || a.name.localeCompare(b.name))

  return (
    <div className="space-y-8">
      {loaded && !known && (
        <p role="alert" className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
          Your profile's barangay ("{myBarangay || 'not set'}") doesn't match a barangay on the map, so you won't receive
          reports. Ask the LGU to correct it in Supabase (Table Editor → profiles → barangay).
        </p>
      )}

      <section>
        <h2 className="mb-3 text-lg font-extrabold">
          Reports in Brgy. {myBarangay || '—'} ({reportRows.length})
        </h2>
        {reportRows.length === 0 ? (
          empty('No open reports in your barangay right now.')
        ) : (
          <ul className="space-y-3">
            {reportRows.map((r) => {
              const a = byId.get(r.assetId)!
              return (
                <li key={r.id} className={cn(card, 'space-y-2')}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-extrabold">{a.name}</p>
                    <p className="text-xs text-ink/60">{when(r.at)}</p>
                  </div>
                  <p className="font-semibold">{ISSUES[r.issue]}</p>
                  {r.note && <p className="text-sm">{r.note}</p>}
                  {r.reporterName && <p className="text-xs text-ink/60">Reported by {r.reporterName}</p>}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <StatusPicker asset={a} />
                    <MapLink />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-extrabold">
          {known ? `Pumps and wells in Brgy. ${myBarangay}` : 'All pumps and wells'} ({mine.length})
        </h2>
        {mine.length === 0 ? (
          empty('No pumps or wells on the map in your barangay yet.')
        ) : (
          <ul className="space-y-3">
            {mine.map((a) => (
              <li key={a.id} className={cn(card, 'flex flex-wrap items-center justify-between gap-3')}>
                <div>
                  <p className="font-extrabold">{a.name}</p>
                  <p className="text-sm text-ink/70">{barangayOf(a) ?? 'Barangay unknown'}</p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <StatusPicker asset={a} />
                  <MapLink />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

// DRRM: barangays ranked by how many of their pumps and wells are empty or low.
function DrrmView({ barangayOf }: ViewProps) {
  const { assets } = useWaterStore()
  const rows = useMemo(() => {
    const m = new Map<string, { name: string; total: number; short: number; empty: number }>()
    for (const a of assets) {
      if (!hasStatus(a.kind)) continue
      const name = barangayOf(a) ?? 'Barangay unknown'
      const row = m.get(name) ?? { name, total: 0, short: 0, empty: 0 }
      row.total++
      if (isShort(a.status)) row.short++
      if (a.status === 'empty') row.empty++
      m.set(name, row)
    }
    return [...m.values()]
      .filter((r) => r.short > 0)
      .sort((a, b) => b.empty - a.empty || b.short - a.short || a.name.localeCompare(b.name))
  }, [assets, barangayOf])

  if (rows.length === 0) return empty('No barangay is short on water right now.')
  return (
    <ol className="space-y-3">
      {rows.map((r, i) => (
        <li key={r.name} className={cn(card, 'flex flex-wrap items-center justify-between gap-3')}>
          <div>
            <p className="font-extrabold">{i + 1}. {r.name}</p>
            <p className="text-sm text-ink/70">
              {r.empty} empty · {r.short - r.empty} low · out of {r.total} pump(s)/well(s)
            </p>
          </div>
          <Link to="/dashboard/deliveries" className="text-sm font-semibold text-well underline">
            Filling stations
          </Link>
        </li>
      ))}
    </ol>
  )
}

// Household: empty or problem pumps, nearest first. Uses the device location if allowed.
function HouseholdView({ barangayOf }: ViewProps) {
  const { assets } = useWaterStore()
  const [here, setHere] = useState<{ lat: number; lng: number } | null>(null)
  const [denied, setDenied] = useState(false)
  const origin = here ?? CITY_CENTER

  const locate = () =>
    navigator.geolocation?.getCurrentPosition(
      (p) => {
        setHere({ lat: p.coords.latitude, lng: p.coords.longitude })
        setDenied(false)
      },
      () => setDenied(true),
    ) ?? setDenied(true)

  const pumps = assets.filter((a) => hasStatus(a.kind)) // pumps and wells
  const dist = (a: Asset) => km(origin, a)
  const problems = pumps
    .filter((a) => a.status !== 'ok')
    .sort((a, b) => Number(isShort(b.status)) - Number(isShort(a.status)) || dist(a) - dist(b))
  const nearestWorking = pumps.filter((a) => a.status === 'ok').sort((a, b) => dist(a) - dist(b))[0]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" variant="outline" onClick={locate}>Use my location</Button>
        <p className="text-sm text-ink/70">
          {here ? 'Distances are from your location.' : 'Distances are from the city center until you share your location.'}
          {denied && ' Location is unavailable or blocked.'}
        </p>
      </div>

      {nearestWorking && (
        <p className={cn(card, 'text-sm')}>
          Nearest working pump or well: <strong>{nearestWorking.name}</strong> ({barangayOf(nearestWorking) ?? 'barangay unknown'}),{' '}
          {dist(nearestWorking).toFixed(1)} km away.
        </p>
      )}

      {problems.length === 0 ? (
        empty('No empty pumps, wells or problems reported near you.')
      ) : (
        <ul className="space-y-3">
          {problems.map((a) => (
            <li key={a.id} className={cn(card, 'flex flex-wrap items-center justify-between gap-3')}>
              <div>
                <p className="font-extrabold">{a.name}</p>
                <p className="text-sm text-ink/70">
                  {barangayOf(a) ?? 'Barangay unknown'} · {dist(a).toFixed(1)} km away
                </p>
                <StatusBadge status={a.status} />
              </div>
              <MapLink />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
>>>>>>> d57b73fa1274ad1dd4a0c1679f937505514d5ad7
