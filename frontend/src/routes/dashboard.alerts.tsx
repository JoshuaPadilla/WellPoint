import { useMemo, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getUser } from '@/lib/auth'
import { useBarangays } from '@/lib/barangays'
import { formatKm, km, useMyLocation } from '@/lib/geo'
import { KINDS, STATUSES, isShort, useWaterStore } from '@/lib/water-store'
import type { Asset } from '@/lib/water-store'

export const Route = createFileRoute('/dashboard/alerts')({ component: Page })

const card = 'rounded-xl border border-line bg-white p-4'
const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase()

function Page() {
  const { assets, reports, loading } = useWaterStore()
  const { barangayOf } = useBarangays()
  const { here, origin, locate, asking, denied } = useMyLocation()
  const myBarangay = typeof window === 'undefined' ? '' : (getUser()?.barangay ?? '')
  const [onlyMine, setOnlyMine] = useState(false)

  // Empty first, then low; nearest first within each.
  const alerts = useMemo(() => {
    const list = assets
      .filter((a) => isShort(a.status))
      .map((a) => ({ a, brgy: barangayOf(a), dist: km(origin, a) }))
      .filter((x) => !onlyMine || (x.brgy !== null && same(x.brgy, myBarangay)))
    return list.sort((x, y) => Number(y.a.status === 'empty') - Number(x.a.status === 'empty') || x.dist - y.dist)
  }, [assets, barangayOf, origin, onlyMine, myBarangay])

  const emptyCount = alerts.filter((x) => x.a.status === 'empty').length
  const lowCount = alerts.length - emptyCount

  return (
    <div>
      <h1 className="text-3xl font-extrabold">Outage alerts</h1>
      <p className="mt-2 max-w-xl text-ink/70">Water sources that are empty or running low right now.</p>

      <div className="mt-5 flex flex-wrap gap-3">
        <Summary label="Empty" count={emptyCount} tone="bg-red-600 text-white" />
        <Summary label="Low / near empty" count={lowCount} tone="bg-amber-500 text-white" />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <Button size="sm" variant="outline" onClick={locate} disabled={asking}>
          {asking ? 'Finding you…' : 'Sort by distance from me'}
        </Button>
        {myBarangay && (
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={onlyMine} onChange={(e) => setOnlyMine(e.target.checked)} />
            Only Brgy. {myBarangay}
          </label>
        )}
        <p className="text-sm text-ink/70">
          {here ? 'Distances are from your location.' : 'Distances are from the city center.'}
          {denied && ' Location is unavailable or blocked.'}
        </p>
      </div>

      {loading ? null : alerts.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-line p-6 text-sm text-ink/70">
          {onlyMine ? `No outages in Brgy. ${myBarangay} right now.` : 'No outages right now. Every water source has water.'}
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {alerts.map(({ a, brgy, dist }) => (
            <AlertCard key={a.id} a={a} brgy={brgy} dist={dist} reportCount={reports.filter((r) => r.assetId === a.id).length} />
          ))}
        </ul>
      )}
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

function AlertCard({ a, brgy, dist, reportCount }: { a: Asset; brgy: string | null; dist: number; reportCount: number }) {
  const s = STATUSES[a.status]
  return (
    <li className={cn(card, 'flex flex-wrap items-center justify-between gap-3 border-l-4', a.status === 'empty' ? 'border-l-red-600' : 'border-l-amber-500')}>
      <div>
        <p className="font-extrabold">{a.name}</p>
        <p className="text-sm text-ink/70">
          {KINDS[a.kind]} · {brgy ?? 'Barangay unknown'} · {formatKm(dist)} away
          {reportCount > 0 && ` · ${reportCount} report(s)`}
        </p>
        <p className={cn('mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-bold', s.badge)}>{s.label}</p>
      </div>
      <div className="flex gap-4 text-sm font-semibold">
        <Link to="/dashboard/deliveries" className="text-well underline">Nearest filling station</Link>
        <Link to="/dashboard/map" className="text-well underline">See on map</Link>
      </div>
    </li>
  )
}
