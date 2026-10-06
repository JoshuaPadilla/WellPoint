import { useEffect, useMemo } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { GlassWater, Navigation } from 'lucide-react'
import {
  Map,
  MapControls,
  MapMarker,
  MarkerContent,
  MarkerTooltip,
  useMap,
} from '@/components/ui/map'
import { Button } from '@/components/ui/button'
import { LoadingScreen } from '@/components/LoadingScreen'
import { cn } from '@/lib/utils'
import { useBarangays } from '@/lib/barangays'
import { directionsUrl, formatKm, km, useMyLocation } from '@/lib/geo'
import type { LatLng } from '@/lib/geo'
import { STATUSES, useWaterStore } from '@/lib/water-store'

export const Route = createFileRoute('/dashboard/deliveries')({
  component: Page,
})

const card = 'rounded-xl border border-line bg-white p-4'

// Lives inside <Map>: moves the view to the user once their location is known.
function FlyTo({ to }: { to: LatLng | null }) {
  const { map, isLoaded } = useMap()
  useEffect(() => {
    if (map && isLoaded && to)
      map.flyTo({ center: [to.lng, to.lat], zoom: 14, duration: 800 })
  }, [map, isLoaded, to])
  return null
}

// Filling stations placed by DRRM, nearest first. Working stations come before closed ones.
function Page() {
  const { assets, loading } = useWaterStore()
  const { barangayOf } = useBarangays()
  const { here, origin, locate, asking, denied } = useMyLocation(true)

  const stations = useMemo(
    () =>
      assets
        .filter((a) => a.kind === 'station')
        .map((a) => ({
          a,
          dist: km(origin, a),
          open: a.status === 'ok' || a.status === 'low',
        }))
        .sort((x, y) => Number(y.open) - Number(x.open) || x.dist - y.dist),
    [assets, origin],
  )
  const nearest = stations.find((s) => s.open)

  return (
    <div>
      <h1 className="text-3xl font-extrabold">Deliveries</h1>
      <p className="mt-2 max-w-xl text-ink/70">
        Filling stations set up by DRRM, nearest to you first.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button size="sm" variant="outline" onClick={locate} disabled={asking}>
          {asking
            ? 'Finding you…'
            : here
              ? 'Update my location'
              : 'Use my location'}
        </Button>
        <p className="text-sm text-ink/70">
          {here
            ? 'Distances are from your location.'
            : 'Distances are from the city center until you share your location.'}
          {denied && ' Location is unavailable or blocked.'}
        </p>
      </div>

      {nearest && (
        <div
          className={cn(
            card,
            'mt-5 flex flex-wrap items-center justify-between gap-3 border-l-4 border-l-aqua',
          )}
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-ink/60">
              Nearest open station
            </p>
            <p className="text-lg font-extrabold">{nearest.a.name}</p>
            <p className="text-sm text-ink/70">
              {barangayOf(nearest.a) ?? 'Barangay unknown'} ·{' '}
              {formatKm(nearest.dist)} away
            </p>
          </div>
          <a
            href={directionsUrl(nearest.a)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-well px-4 py-2 text-sm font-bold text-white hover:bg-deep"
          >
            <Navigation className="size-4" aria-hidden="true" /> Directions
          </a>
        </div>
      )}

      <section
        aria-label="Map of filling stations"
        className="relative mt-5 h-[360px] overflow-hidden rounded-2xl border border-line bg-sky/40"
      >
        <Map
          theme="light"
          center={[origin.lng, origin.lat]}
          zoom={13}
          className="h-full w-full"
        >
          <MapControls position="bottom-right" />
          <FlyTo to={here} />
          {here && (
            <MapMarker longitude={here.lng} latitude={here.lat}>
              <MarkerContent>
                <div className="size-4 rounded-full border-2 border-white bg-blue-600 shadow-md ring-4 ring-blue-600/25" />
              </MarkerContent>
              <MarkerTooltip className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-ink shadow">
                You are here
              </MarkerTooltip>
            </MapMarker>
          )}
          {stations.map(({ a, open }) => (
            <MapMarker key={a.id} longitude={a.lng} latitude={a.lat}>
              <MarkerContent>
                <div
                  className={cn(
                    'grid size-9 place-items-center rounded-full border-2 border-white text-white shadow-md',
                    open ? 'bg-aqua' : 'bg-slate-500',
                  )}
                >
                  <GlassWater className="size-4" aria-hidden="true" />
                </div>
              </MarkerContent>
              <MarkerTooltip className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-ink shadow">
                {a.name}
              </MarkerTooltip>
            </MapMarker>
          ))}
        </Map>
      </section>

      {loading ? (
        <LoadingScreen label="Loading stations…" />
      ) : stations.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-line p-6 text-sm text-ink/70">
          No filling stations yet. DRRM adds them on the{' '}
          <Link
            to="/dashboard/map"
            className="font-semibold text-well underline"
          >
            barangay map
          </Link>
          .
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {stations.map(({ a, dist, open }) => (
            <li
              key={a.id}
              className={cn(
                card,
                'flex flex-wrap items-center justify-between gap-3',
                !open && 'opacity-70',
              )}
            >
              <div>
                <p className="font-extrabold">{a.name}</p>
                <p className="text-sm text-ink/70">
                  {barangayOf(a) ?? 'Barangay unknown'} · {formatKm(dist)} away
                </p>
                <p
                  className={cn(
                    'mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-bold',
                    STATUSES[a.status].badge,
                  )}
                >
                  {STATUSES[a.status].label}
                </p>
              </div>
              <a
                href={directionsUrl(a)}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-semibold text-well underline"
              >
                Directions
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
