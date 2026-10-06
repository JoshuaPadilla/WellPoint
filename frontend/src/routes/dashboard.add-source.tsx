import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ExpressionSpecification, MapMouseEvent } from 'maplibre-gl'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { LocateFixed, Send } from 'lucide-react'
import { Map, MapControls, MapGeoJSON, MapMarker, MarkerContent, useMap } from '@/components/ui/map'
import { Button } from '@/components/ui/button'
import { LoadingScreen } from '@/components/LoadingScreen'
import { cn } from '@/lib/utils'
import { getUser } from '@/lib/auth'
import { useMyLocation } from '@/lib/geo'
import { useBarangays } from '@/lib/barangays'
import { KINDS, STATUSES, registerSource, useWaterStore } from '@/lib/water-store'
import type { AssetKind, Status } from '@/lib/water-store'

export const Route = createFileRoute('/dashboard/add-source')({ component: Page })

const card = 'rounded-xl border border-line bg-white p-4 shadow-lg'
const field = 'w-full rounded-lg border border-line bg-white px-2.5 py-1.5 text-sm'
const DATA_URL = '/catbalogan-brgys.geojson'
const CITY_PCODE = 'PH0806005'

type Props = {
  ADM4_EN: string
  ADM4_PCODE: string
  ADM3_PCODE: string
  AREA_SQKM: number
}
type Geom = GeoJSON.Polygon | GeoJSON.MultiPolygon
type Collection = GeoJSON.FeatureCollection<Geom, Props>
type Bounds = [[number, number], [number, number]]
type Focus = { bounds: Bounds; n: number }

function boundsOf(geoms: Geom[]): Bounds {
  let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity
  for (const g of geoms)
    for (const poly of g.type === 'Polygon' ? [g.coordinates] : g.coordinates)
      for (const ring of poly)
        for (const [lon, lat] of ring) {
          w = Math.min(w, lon)
          e = Math.max(e, lon)
          s = Math.min(s, lat)
          n = Math.max(n, lat)
        }
  return [
    [w, s],
    [e, n],
  ]
}

function themeColor(name: string, fallback: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return /^(#|rgb|hsl)/i.test(v) ? v : fallback
}

// Fits the view to a focus. n = 0 is the first fit (no animation).
function FitTo({ focus }: { focus: Focus }) {
  const { map, isLoaded } = useMap()
  useEffect(() => {
    if (!map || !isLoaded) return
    map.fitBounds(focus.bounds, {
      padding: 56,
      maxZoom: 16,
      duration: focus.n === 0 ? 0 : 700,
    })
  }, [map, isLoaded, focus])
  return null
}

// Lives inside <Map>: turns a click into a picked point, leaving the map free to pan and zoom.
function ClickToPick({ onPick }: { onPick: (lng: number, lat: number) => void }) {
  const { map, isLoaded } = useMap()
  const pickRef = useRef(onPick)
  pickRef.current = onPick
  useEffect(() => {
    if (!map || !isLoaded) return
    const handle = (e: MapMouseEvent) => pickRef.current(e.lngLat.lng, e.lngLat.lat)
    map.on('click', handle)
    return () => {
      map.off('click', handle)
    }
  }, [map, isLoaded])
  return null
}

function Page() {
  const { role } = useWaterStore()
  const user = typeof window === 'undefined' ? null : getUser()
  const navigate = useNavigate()
  const { barangayAt } = useBarangays()
  const { here, locate, asking, denied } = useMyLocation(false)

  const ownPsgc = user?.barangayPsgc ?? ''
  const ownName = user?.barangay ?? 'your barangay'

  const [data, setData] = useState<Collection | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [focus, setFocus] = useState<Focus | null>(null)

  const [name, setName] = useState('')
  const [kind, setKind] = useState<AssetKind>('pump')
  const [status, setStatus] = useState<Status>('ok')
  const [point, setPoint] = useState<{ lng: number; lat: number } | null>(null)
  const [hit, setHit] = useState<{ psgc: string; name: string; own: boolean } | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    const ctrl = new AbortController()
    fetch(DATA_URL, { signal: ctrl.signal })
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status))
        return r.json() as Promise<Collection>
      })
      .then((raw) => {
        const features = raw.features.filter((f) => f.properties.ADM3_PCODE === CITY_PCODE)
        setData({ type: 'FeatureCollection', features })
        // Start zoomed into the official's own barangay so the allowed area is clear.
        const own = features.find((f) => f.properties.ADM4_PCODE === `PH${ownPsgc}`)
        const targets = own ? [own.geometry] : features.map((f) => f.geometry)
        setFocus({ bounds: boundsOf(targets), n: 0 })
      })
      .catch((e) => {
        if (e.name !== 'AbortError') setLoadError(true)
      })
    return () => ctrl.abort()
  }, [ownPsgc])

  const items = useMemo(
    () =>
      (data?.features ?? []).map((f) => ({
        id: f.properties.ADM4_PCODE,
        name: f.properties.ADM4_EN,
        bounds: boundsOf([f.geometry]),
      })),
    [data],
  )

  // Validate a picked point against the barangay boundaries and the official's scope.
  const pick = useCallback(
    (lng: number, lat: number) => {
      const b = barangayAt({ lng, lat })
      const own = b?.psgcCode === ownPsgc
      setPoint({ lng, lat })
      setHit(b ? { psgc: b.psgcCode, name: b.name, own } : null)
      setErr('')
      if (b) {
        const item = items.find((i) => i.id === `PH${b.psgcCode}`)
        if (item) setFocus((f) => ({ bounds: item.bounds, n: (f?.n ?? 0) + 1 }))
        if (!own) setErr(`That point is in ${b.name}, not your barangay.`)
      } else {
        setErr('That point is outside the city boundaries.')
      }
    },
    [barangayAt, items, ownPsgc],
  )

  useEffect(() => {
    if (here) pick(here.lng, here.lat)
  }, [here, pick])

  if (role !== 'official') {
    return (
      <div>
        <h1 className="text-3xl font-extrabold">Add water source</h1>
        <p className="mt-5 rounded-xl border border-dashed border-line p-6 text-sm text-ink/70">
          Only barangay leaders can register water sources in their barangay.
        </p>
      </div>
    )
  }

  const colors = useMemo(
    () => ({ well: themeColor('--color-well', '#0077b6'), foam: themeColor('--color-foam', '#90e0ef') }),
    [],
  )

  // Highlight the official's own barangay (green); a clicked point in another
  // barangay turns that barangay red so the boundary violation is obvious.
  const ownId = `PH${ownPsgc}`
  const badId = hit && !hit.own ? `PH${hit.psgc}` : ''
  const fillColor = [
    'case',
    ['==', ['get', 'ADM4_PCODE'], badId], '#ef4444',
    ['==', ['get', 'ADM4_PCODE'], ownId], '#10b981',
    colors.foam,
  ] as ExpressionSpecification
  const fillOpacity = [
    'case',
    ['==', ['get', 'ADM4_PCODE'], badId], 0.7,
    ['==', ['get', 'ADM4_PCODE'], ownId], 0.5,
    0.18,
  ] as ExpressionSpecification
  const lineWidth = [
    'case',
    ['==', ['get', 'ADM4_PCODE'], badId], 3,
    ['==', ['get', 'ADM4_PCODE'], ownId], 3,
    1,
  ] as ExpressionSpecification

  const submit = async () => {
    if (!name.trim() || !point || !hit?.own) return
    setBusy(true)
    setErr('')
    const error = await registerSource({
      name: name.trim(),
      kind,
      status,
      lng: point.lng,
      lat: point.lat,
      barangayPsgc: ownPsgc,
    })
    setBusy(false)
    if (error) setErr(error)
    else navigate({ to: '/dashboard/map' })
  }

  return (
    <div className="relative h-[calc(100dvh-6.5rem)] min-h-[420px] overflow-hidden rounded-2xl border border-line bg-sky/40 md:h-[calc(100dvh-2.5rem)] md:min-h-[540px]">
      {loadError && (
        <p role="alert" className="p-8 text-ink">
          Couldn't load the barangay map. Check that <code>catbalogan-brgys.geojson</code> is in the frontend{' '}
          <code>public</code> folder, then refresh.
        </p>
      )}
      {!loadError && !data && <LoadingScreen label="Loading map…" className="py-16" />}

      {data && focus && (
        <Map theme="light" center={[124.89, 11.78]} zoom={11} className="h-full w-full">
          <FitTo focus={focus} />
          <MapControls position="bottom-right" />
          <MapGeoJSON<Props>
            data={data}
            promoteId="ADM4_PCODE"
            fillPaint={{ 'fill-color': fillColor, 'fill-opacity': fillOpacity }}
            linePaint={{ 'line-color': colors.well, 'line-width': lineWidth }}
          />
          <ClickToPick onPick={pick} />
          {point && (
            <MapMarker longitude={point.lng} latitude={point.lat}>
              <MarkerContent>
                <div
                  className={cn(
                    'size-4 rounded-full border-2 border-white shadow-md ring-4',
                    hit?.own ? 'bg-emerald-500 ring-emerald-500/25' : 'bg-red-500 ring-red-500/25',
                  )}
                />
              </MarkerContent>
            </MapMarker>
          )}
        </Map>
      )}

      {/* Form overlays the full map */}
      <div className="absolute left-3 top-3 z-10 w-[min(21rem,calc(100%-1.5rem))] space-y-3">
        <section className={cn(card, 'space-y-3')}>
          <div>
            <h2 className="text-lg font-extrabold">Add water source</h2>
            <p className="text-sm text-ink/70">
              Allowed area: <strong>{ownName}</strong>. Tap the map inside the highlighted barangay.
            </p>
          </div>

          <label className="block text-sm font-semibold">
            Name
            <input className={cn(field, 'mt-1')} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sitio Lower spring" />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-sm font-semibold">
              Type
              <select className={cn(field, 'mt-1')} value={kind} onChange={(e) => setKind(e.target.value as AssetKind)}>
                {(['pump', 'well', 'reservoir'] as AssetKind[]).map((k) => (
                  <option key={k} value={k}>{KINDS[k]}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold">
              Status
              <select className={cn(field, 'mt-1')} value={status} onChange={(e) => setStatus(e.target.value as Status)}>
                {Object.entries(STATUSES).map(([v, s]) => (
                  <option key={v} value={v}>{s.label}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="text-xs text-ink/70">
            {hit?.own ? (
              <p className="font-semibold text-emerald-700">Point is inside {hit.name}. Ready to register.</p>
            ) : err ? (
              <p className="font-semibold text-red-600">{err}</p>
            ) : (
              <p>Tap the map or use your location.</p>
            )}
            {point && !hit?.own && (
              <p className="mt-1">Selected {point.lat.toFixed(4)}, {point.lng.toFixed(4)}.</p>
            )}
            {denied && <p> Location is unavailable or blocked.</p>}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => locate()} disabled={asking}>
              <LocateFixed className="size-3.5" aria-hidden="true" /> {asking ? 'Finding you…' : 'Use my location'}
            </Button>
            <Button onClick={() => void submit()} disabled={busy || !name.trim() || !point || !hit?.own}>
              <Send className="size-3.5" aria-hidden="true" /> {busy ? 'Saving…' : 'Register source'}
            </Button>
          </div>
          {err && <p className="text-sm text-orange-700">{err}</p>}
        </section>
      </div>
    </div>
  )
}
