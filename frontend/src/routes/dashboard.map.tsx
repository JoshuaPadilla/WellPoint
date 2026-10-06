import { useEffect, useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import type { ExpressionSpecification } from 'maplibre-gl'
import { Map, MapControls, MapGeoJSON, useMap } from '@/components/ui/map'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/dashboard/map')({ component: BarangayMap })

// Copy the seed file to frontend/public/catbalogan-brgys.geojson so Vite serves it as-is.
const DATA_URL = '/catbalogan-brgys.geojson'
const CITY_PCODE = 'PH0806005' // City of Catbalogan; guards against a file that holds more than one city

type Props = { ADM4_EN: string; ADM4_PCODE: string; ADM3_PCODE: string; AREA_SQKM: number }
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
          w = Math.min(w, lon); e = Math.max(e, lon)
          s = Math.min(s, lat); n = Math.max(n, lat)
        }
  return [[w, s], [e, n]]
}

// MapLibre paint values can't use var(--x), so read the theme colour once. Only formats MapLibre can parse are accepted.
function themeColor(name: string, fallback: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return /^(#|rgb|hsl)/i.test(v) ? v : fallback
}

// Lives inside <Map> so it can reach the MapLibre instance. n = 0 is the first fit (no animation).
function FitTo({ focus }: { focus: Focus }) {
  const { map, isLoaded } = useMap()
  useEffect(() => {
    if (!map || !isLoaded) return
    map.fitBounds(focus.bounds, { padding: 48, maxZoom: 16, duration: focus.n === 0 ? 0 : 700 })
  }, [map, isLoaded, focus])
  return null
}

function BarangayMap() {
  const [data, setData] = useState<Collection | null>(null)
  const [error, setError] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoverId, setHoverId] = useState<string | null>(null)
  const [focus, setFocus] = useState<Focus | null>(null)

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
        setFocus({ bounds: boundsOf(features.map((f) => f.geometry)), n: 0 })
      })
      .catch((e) => {
        if (e.name !== 'AbortError') setError(true)
      })
    return () => ctrl.abort()
  }, [])

  const items = useMemo(
    () =>
      (data?.features ?? [])
        .map((f) => ({
          id: f.properties.ADM4_PCODE,
          name: f.properties.ADM4_EN,
          areaSqKm: f.properties.AREA_SQKM,
          parts: f.geometry.type === 'Polygon' ? 1 : f.geometry.coordinates.length,
          bounds: boundsOf([f.geometry]),
        }))
        .sort((a, b) => a.name.localeCompare(b.name, 'en', { numeric: true })),
    [data],
  )

  const filtering = query.trim() !== ''
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? items.filter((b) => b.name.toLowerCase().includes(q)) : items
  }, [items, query])

  const selected = items.find((b) => b.id === selectedId) ?? null
  const hovered = items.find((b) => b.id === hoverId) ?? null
  const cityBounds = focus && data ? boundsOf(data.features.map((f) => f.geometry)) : null

  const colors = useMemo(
    () => ({ well: themeColor('--color-well', '#0e7490'), foam: themeColor('--color-foam', '#a5f3fc') }),
    [],
  )

  // Paint expressions react to selection and search, so no layers are rebuilt by hand.
  const isSelected = ['==', ['get', 'ADM4_PCODE'], selectedId ?? ''] as ExpressionSpecification
  const inMatches = ['in', ['get', 'ADM4_PCODE'], ['literal', matches.map((b) => b.id)]] as ExpressionSpecification
  const fillOpacity = (
    filtering ? ['case', isSelected, 0.6, inMatches, 0.3, 0.04] : ['case', isSelected, 0.6, 0.2]
  ) as ExpressionSpecification

  const zoomTo = (id: string) => {
    const b = items.find((i) => i.id === id)
    if (!b) return
    setSelectedId(id)
    setFocus((f) => ({ bounds: b.bounds, n: (f?.n ?? 0) + 1 }))
  }

  return (
    <div>
      <h1 className="text-3xl font-extrabold">Barangay map</h1>
      <p className="mt-2 max-w-xl text-ink/70">
        {data ? `The ${items.length} barangays of Catbalogan. ` : ''}
        Select a barangay on the map or from the list to see its details.
      </p>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_320px]">
        <section
          aria-label="Map of Catbalogan barangays"
          className="relative h-[520px] overflow-hidden rounded-2xl border border-line bg-sky/40 lg:h-[640px]"
        >
          {error && (
            <p role="alert" className="p-8 text-ink">
              Couldn't load the barangay map. Check that <code>catbalogan-brgys.geojson</code> is in the frontend{' '}
              <code>public</code> folder, then refresh.
            </p>
          )}
          {!error && !data && <p className="p-8 text-ink/70">Loading map…</p>}

          {data && focus && (
            <>
              <Map theme="light" center={[124.89, 11.78]} zoom={11} className="h-full w-full">
                <FitTo focus={focus} />
                <MapControls position="top-right" />
                <MapGeoJSON<Props>
                  data={data}
                  promoteId="ADM4_PCODE"
                  interactive
                  fillPaint={{ 'fill-color': colors.well, 'fill-opacity': fillOpacity }}
                  fillHoverPaint={{ 'fill-color': colors.foam, 'fill-opacity': 0.55 }}
                  linePaint={{
                    'line-color': colors.well,
                    'line-width': ['case', isSelected, 3, 1] as ExpressionSpecification,
                  }}
                  onHover={(e) => setHoverId(e?.feature.properties.ADM4_PCODE ?? null)}
                  onClick={(e) => {
                    const id = e.feature.properties.ADM4_PCODE
                    setSelectedId((cur) => (cur === id ? null : id))
                  }}
                />
              </Map>

              <p
                aria-live="polite"
                className="pointer-events-none absolute left-3 top-3 rounded-lg bg-white/90 px-3 py-1.5 text-sm font-semibold shadow-sm"
              >
                {hovered?.name ?? selected?.name ?? 'Hover over a barangay'}
              </p>

              <button
                type="button"
                onClick={() => cityBounds && setFocus({ bounds: cityBounds, n: focus.n + 1 })}
                className="absolute bottom-3 left-3 rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-bold text-ink shadow-sm hover:bg-sky focus-visible:outline-2 focus-visible:outline-well"
              >
                Show whole city
              </button>
            </>
          )}
        </section>

        <aside className="flex flex-col gap-5">
          <div className="rounded-2xl border border-line bg-white p-5">
            {selected ? (
              <>
                <h2 className="text-xl font-extrabold">{selected.name}</h2>
                <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                  <dt className="text-ink/70">City</dt>
                  <dd className="font-semibold">Catbalogan</dd>
                  <dt className="text-ink/70">PSGC code</dt>
                  <dd className="font-semibold">{selected.id.replace('PH', '')}</dd>
                  <dt className="text-ink/70">Area</dt>
                  <dd className="font-semibold">{selected.areaSqKm.toLocaleString('en', { maximumFractionDigits: 2 })} km²</dd>
                  {selected.parts > 1 && (
                    <>
                      <dt className="text-ink/70">Land areas</dt>
                      <dd className="font-semibold">{selected.parts} separate parts</dd>
                    </>
                  )}
                </dl>
                <button type="button" className="mt-4 text-sm font-bold text-well underline" onClick={() => zoomTo(selected.id)}>
                  Zoom to barangay
                </button>
              </>
            ) : (
              <p className="text-sm text-ink/70">Select a barangay on the map or from the list to see its details.</p>
            )}
          </div>

          <div className="rounded-2xl border border-line bg-white p-5">
            <label htmlFor="brgy-search" className="text-sm font-bold">
              Find a barangay
            </label>
            <input
              id="brgy-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a name"
              className="mt-2 w-full rounded-lg border border-line px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-well"
            />
            <ul className="mt-3 max-h-80 overflow-y-auto">
              {matches.map((b) => (
                <li key={b.id}>
                  <button
                    type="button"
                    aria-pressed={b.id === selectedId}
                    onClick={() => zoomTo(b.id)}
                    className={cn(
                      'w-full rounded-md px-3 py-1.5 text-left text-sm',
                      b.id === selectedId ? 'bg-well font-semibold text-white' : 'hover:bg-sky',
                    )}
                  >
                    {b.name}
                  </button>
                </li>
              ))}
              {data && matches.length === 0 && <li className="px-3 py-2 text-sm text-ink/70">No barangay matches "{query}".</li>}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}