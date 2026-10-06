import { useEffect, useMemo, useRef, useState } from 'react'
import type { DragEvent } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import type { ExpressionSpecification, Map as MapLibreMap } from 'maplibre-gl'
import { Map, MapControls, MapGeoJSON, useMap } from '@/components/ui/map'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { AssetMarkers, MapBridge, RolePanel } from '@/components/WaterAssets'
import { addAsset } from '#/lib/WaterStore'
import type { AssetKind } from '#/lib/WaterStore'

export const Route = createFileRoute('/dashboard/map')({ component: BarangayMap })

// Copy the seed file to frontend/public/catbalogan-brgys.geojson so Vite serves it as-is.
const DATA_URL = '/catbalogan-brgys.geojson'
const CITY_PCODE = 'PH0806005' // City of Catbalogan; guards against a file that holds more than one city
const MAX_SUGGESTIONS = 8

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
  const [sheetOpen, setSheetOpen] = useState(false)
  const mapRef = useRef<MapLibreMap | null>(null)

  // A palette item dropped on the map becomes an asset at the drop point (the store checks the role).
  const onDrop = (e: DragEvent<HTMLElement>) => {
    const kind = e.dataTransfer.getData('text/kind') as AssetKind
    const map = mapRef.current
    if (!kind || !map) return
    e.preventDefault()
    const r = e.currentTarget.getBoundingClientRect()
    const ll = map.unproject([e.clientX - r.left, e.clientY - r.top])
    addAsset(kind, ll.lng, ll.lat)
  }

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
  const cityBounds = data ? boundsOf(data.features.map((f) => f.geometry)) : null

  const colors = useMemo(
    () => ({ well: themeColor('--color-well', '#0077b6'), foam: themeColor('--color-foam', '#90e0ef') }),
    [],
  )

  // Paint expressions react to selection and search, so no layers are rebuilt by hand.
  const isSelected = ['==', ['get', 'ADM4_PCODE'], selectedId ?? ''] as ExpressionSpecification
  const inMatches = ['in', ['get', 'ADM4_PCODE'], ['literal', matches.map((b) => b.id)]] as ExpressionSpecification
  const fillOpacity = (
    filtering ? ['case', isSelected, 0.6, inMatches, 0.3, 0.04] : ['case', isSelected, 0.6, 0.2]
  ) as ExpressionSpecification

  // Select a barangay, fly to it and open the sheet.
  const pick = (id: string) => {
    const b = items.find((i) => i.id === id)
    if (!b) return
    setSelectedId(id)
    setFocus((f) => ({ bounds: b.bounds, n: (f?.n ?? 0) + 1 }))
    setQuery('')
    setSheetOpen(true)
  }

  return (
    <div>
      <h1 className="text-3xl font-extrabold">Barangay map</h1>
      <p className="mt-2 max-w-xl text-ink/70">
        {data ? `The ${items.length} barangays of Catbalogan. ` : ''}
        Search for a barangay or select one on the map to see its details.
      </p>

      <RolePanel />

      <section
        aria-label="Map of Catbalogan barangays"
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className="relative mt-4 h-[70vh] min-h-[480px] overflow-hidden rounded-2xl border border-line bg-sky/40"
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
              <MapBridge mapRef={mapRef} />
              <MapControls position="bottom-right" />
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
                  setSelectedId(e.feature.properties.ADM4_PCODE)
                  setSheetOpen(true)
                }}
              />
              <AssetMarkers />
            </Map>

            {/* Search sits on top of the map */}
            <div className="absolute left-3 top-3 w-[min(22rem,calc(100%-9rem))]">
              <Input
                type="search"
                aria-label="Find a barangay"
                placeholder="Find a barangay"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setQuery('')
                  if (e.key === 'Enter' && matches[0]) pick(matches[0].id)
                }}
                className="bg-white shadow-sm"
              />
              {filtering && (
                <ul className="mt-1 max-h-72 overflow-y-auto rounded-lg border border-line bg-white p-1 shadow-md">
                  {matches.slice(0, MAX_SUGGESTIONS).map((b) => (
                    <li key={b.id}>
                      <button
                        type="button"
                        onClick={() => pick(b.id)}
                        className="w-full rounded-md px-3 py-1.5 text-left text-sm hover:bg-sky"
                      >
                        {b.name}
                      </button>
                    </li>
                  ))}
                  {matches.length === 0 && <li className="px-3 py-2 text-sm text-ink/70">No barangay matches "{query}".</li>}
                  {matches.length > MAX_SUGGESTIONS && (
                    <li className="px-3 py-1.5 text-xs text-ink/60">
                      {matches.length - MAX_SUGGESTIONS} more. Keep typing to narrow the list.
                    </li>
                  )}
                </ul>
              )}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSheetOpen(true)}
              className="absolute right-3 top-3 bg-white shadow-sm"
            >
              {selected ? 'Details' : 'All barangays'}
            </Button>

            <div className="pointer-events-none absolute bottom-3 left-3 flex flex-col items-start gap-2">
              {hovered && (
                <p aria-live="polite" className="rounded-lg bg-white/90 px-3 py-1.5 text-sm font-semibold shadow-sm">
                  {hovered.name}
                </p>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => cityBounds && setFocus({ bounds: cityBounds, n: focus.n + 1 })}
                className="pointer-events-auto bg-white shadow-sm"
              >
                Show whole city
              </Button>
            </div>
          </>
        )}
      </section>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="bg-white/70 backdrop-blur-sm">
          <SheetHeader>
            <SheetTitle>{selected ? selected.name : 'Barangays'}</SheetTitle>
            <SheetDescription>
              {selected ? 'Barangay details' : 'Pick a barangay to zoom to it on the map.'}
            </SheetDescription>
          </SheetHeader>

          <div className="flex min-h-0 flex-1 flex-col gap-5 px-4">
            {selected && (
              <div>
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
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
                <div className="mt-4 flex gap-2">
                  <Button type="button" size="sm" onClick={() => pick(selected.id)}>
                    Zoom to barangay
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setSelectedId(null)}>
                    Clear selection
                  </Button>
                </div>
              </div>
            )}

            <div className="flex min-h-0 flex-1 flex-col">
              <h3 className="text-sm font-bold">All barangays ({items.length})</h3>
              <ul className="mt-2 min-h-0 flex-1 overflow-y-auto">
                {items.map((b) => (
                  <li key={b.id}>
                    <button
                      type="button"
                      aria-pressed={b.id === selectedId}
                      onClick={() => pick(b.id)}
                      className={cn(
                        'w-full rounded-md px-3 py-1.5 text-left text-sm',
                        b.id === selectedId ? 'bg-well font-semibold text-white' : 'hover:bg-sky',
                      )}
                    >
                      {b.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}