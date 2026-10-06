import { useMemo, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { Droplet, Droplets, GlassWater, Waves } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useBarangays } from '@/lib/barangays'
import { CAN_SET_STATUS, KINDS, STATUSES, setStatus, useWaterStore } from '@/lib/water-store'
import type { Asset, AssetKind, Status } from '@/lib/water-store'

export const Route = createFileRoute('/dashboard/sources')({ component: Page })

const ICONS: Record<AssetKind, LucideIcon> = { pump: Droplet, well: Droplets, reservoir: Waves, station: GlassWater }
const OUTSIDE = 'Outside the barangay boundaries'
const field = 'h-7 rounded-md border border-line bg-white px-1.5 text-xs'

function Source({ a }: { a: Asset }) {
  const { role } = useWaterStore()
  const Icon = ICONS[a.kind]
  return (
    <li className="flex items-center justify-between gap-3 rounded-lg bg-mist px-3 py-2 text-sm">
      <span className="flex items-center gap-2 font-semibold">
        <Icon className="size-4 text-well" aria-hidden="true" />
        {a.name}
        <span className="font-normal text-ink/60">{KINDS[a.kind]}</span>
      </span>
      <span className="flex items-center gap-2">
        {CAN_SET_STATUS[role].includes(a.kind) ? (
          <select
            className={field}
            value={a.status}
            onChange={(e) => setStatus(a.id, e.target.value as Status)}
            aria-label={`Status for ${a.name}`}
          >
            {Object.entries(STATUSES).map(([v, s]) => (
              <option key={v} value={v}>{s.label}</option>
            ))}
          </select>
        ) : (
          <span className={cn('rounded-full px-2 py-0.5 text-xs font-bold', STATUSES[a.status].badge)}>
            {STATUSES[a.status].label}
          </span>
        )}
      </span>
    </li>
  )
}

function Page() {
  const { assets } = useWaterStore()
  const { names, barangayOf, loaded } = useBarangays()
  const [query, setQuery] = useState('')
  const [onlyWith, setOnlyWith] = useState(false)

  // Every barangay gets a list, filled with the sources whose marker sits inside its boundary.
  const groups = useMemo(() => {
    const m = new Map<string, Asset[]>(names.map((n) => [n, []]))
    for (const a of assets) {
      const key = barangayOf(a) ?? OUTSIDE
      m.set(key, [...(m.get(key) ?? []), a])
    }
    return [...m.entries()].filter(([n, list]) => n !== OUTSIDE || list.length > 0)
  }, [assets, names, barangayOf])

  const q = query.trim().toLowerCase()
  const shown = groups.filter(([n, list]) => n.toLowerCase().includes(q) && (!onlyWith || list.length > 0))

  return (
    <div>
      <h1 className="text-3xl font-extrabold">Water sources</h1>
      <p className="mt-2 max-w-xl text-ink/70">
        Each barangay with the water sources inside its boundary. Add or move sources on the{' '}
        <Link to="/dashboard/map" className="font-semibold text-well underline">barangay map</Link>.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <Input
          type="search"
          aria-label="Find a barangay"
          placeholder="Find a barangay"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs bg-white"
        />
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={onlyWith} onChange={(e) => setOnlyWith(e.target.checked)} />
          Only barangays with sources
        </label>
      </div>

      {loaded && names.length === 0 && (
        <p role="alert" className="mt-4 rounded-xl border border-line bg-white p-4 text-sm">
          Couldn't load the barangay boundaries, so sources can't be grouped. Check that <code>catbalogan-brgys.geojson</code> is in the{' '}
          <code>public</code> folder, then refresh.
        </p>
      )}

      <ul className="mt-6 grid gap-4 lg:grid-cols-2">
        {shown.map(([name, list]) => (
          <li key={name} className="rounded-xl border border-line bg-white p-4">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="font-extrabold">{name}</h2>
              <p className="text-xs text-ink/60">{list.length} source{list.length === 1 ? '' : 's'}</p>
            </div>
            {list.length === 0 ? (
              <p className="mt-2 text-sm text-ink/70">No water sources recorded.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {list.map((a) => <Source key={a.id} a={a} />)}
              </ul>
            )}
          </li>
        ))}
      </ul>
      {loaded && shown.length === 0 && names.length > 0 && <p className="mt-4 text-sm text-ink/70">No barangay matches "{query}".</p>}
    </div>
  )
}