import { useMemo, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { SupplyOutlook } from '@/components/SupplyOutlook'
import { useBarangays } from '@/lib/barangays'
import { CAN_SET_STATUS, ISSUES, STATUSES, hasStatus, isShort, setStatus, useWaterStore } from '@/lib/WaterStore'
import type { Asset, Role, Status } from '@/lib/WaterStore'

export const Route = createFileRoute('/dashboard/')({ component: Page })

// The four roles. The user's role comes from their profile in Supabase (set in dashboard.tsx).
const PERSONAS: { role: Role; label: string; blurb: string }[] = [
  { role: 'lgu', label: 'LGU', blurb: 'Water pumps and wells that barangay officials have marked as empty.' },
  { role: 'official', label: 'Barangay official', blurb: 'Problems reported by households, newest first.' },
  { role: 'drrm', label: 'DRRM', blurb: 'Barangays with the most empty or reported pumps and wells.' },
  { role: 'citizen', label: 'Household', blurb: 'Pumps near you that are empty or have problems.' },
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

// LGU: every source that isn't working, worst first.
function LguView({ barangayOf }: ViewProps) {
  const { assets, reports } = useWaterStore()
  const order: Status[] = ['empty', 'unsafe', 'low', 'repair']
  const rows = assets.filter((a) => a.status !== 'ok').sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status))
  if (rows.length === 0) return empty('Every water source is working right now.')
  return (
    <ul className="space-y-3">
      {rows.map((a) => (
        <li key={a.id} className={cn(card, 'flex flex-wrap items-center justify-between gap-3')}>
          <div>
            <p className="font-extrabold">{a.name}</p>
            <p className="text-sm text-ink/70">
              {barangayOf(a) ?? 'Barangay unknown'} · {reports.filter((r) => r.assetId === a.id).length} report(s)
            </p>
            <StatusBadge status={a.status} />
          </div>
          <MapLink />
        </li>
      ))}
    </ul>
  )
}

// Barangay official: the report list, with the same mark empty / working action as the map popup.
function OfficialView({ barangayOf }: ViewProps) {
  const { assets, reports } = useWaterStore()
  const byId = useMemo(() => new Map(assets.map((a) => [a.id, a])), [assets])
  const rows = [...reports].sort((a, b) => b.at - a.at)
  if (rows.length === 0) return empty('No reports yet. Reports from households will show up here.')
  return (
    <ul className="space-y-3">
      {rows.map((r) => {
        const a = byId.get(r.assetId)
        if (!a) return null
        return (
          <li key={r.id} className={cn(card, 'space-y-2')}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-extrabold">{a.name}</p>
              <p className="text-xs text-ink/60">{when(r.at)}</p>
            </div>
            <p className="text-sm text-ink/70">{barangayOf(a) ?? 'Barangay unknown'}</p>
            <p className="font-semibold">{ISSUES[r.issue]}</p>
            {r.note && <p className="text-sm">{r.note}</p>}
            <StatusPicker asset={a} />
          </li>
        )
      })}
    </ul>
  )
}

// DRRM: barangays ranked by how many of their pumps are empty or have reports.
function DrrmView({ barangayOf }: ViewProps) {
  const { assets, reports } = useWaterStore()
  const rows = useMemo(() => {
    const m = new Map<string, { name: string; pumps: number; emptyPumps: number; reports: number }>()
    for (const a of assets) {
      if (!hasStatus(a.kind)) continue
      const name = barangayOf(a) ?? 'Barangay unknown'
      const row = m.get(name) ?? { name, pumps: 0, emptyPumps: 0, reports: 0 }
      row.pumps++
      if (isShort(a.status)) row.emptyPumps++
      row.reports += reports.filter((r) => r.assetId === a.id).length
      m.set(name, row)
    }
    return [...m.values()]
      .filter((r) => r.emptyPumps > 0 || r.reports > 0)
      .sort((a, b) => b.emptyPumps - a.emptyPumps || b.reports - a.reports || a.name.localeCompare(b.name))
  }, [assets, reports, barangayOf])

  if (rows.length === 0) return empty('No barangay is short on water right now.')
  return (
    <ol className="space-y-3">
      {rows.map((r, i) => (
        <li key={r.name} className={cn(card, 'flex flex-wrap items-center justify-between gap-3')}>
          <div>
            <p className="font-extrabold">{i + 1}. {r.name}</p>
            <p className="text-sm text-ink/70">
              {r.emptyPumps} of {r.pumps} pump(s)/well(s) empty or low · {r.reports} report(s)
            </p>
          </div>
          <MapLink />
        </li>
      ))}
    </ol>
  )
}

// Household: empty or problem pumps, nearest first. Uses the device location if allowed.
function HouseholdView({ barangayOf }: ViewProps) {
  const { assets, reports } = useWaterStore()
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
    .filter((a) => a.status !== 'ok' || reports.some((r) => r.assetId === a.id))
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
                {a.status === 'ok' ? (
                  <p className="mt-1 inline-block rounded-full bg-sky px-2 py-0.5 text-xs font-bold text-well">Problem reported</p>
                ) : (
                  <StatusBadge status={a.status} />
                )}
              </div>
              <MapLink />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}