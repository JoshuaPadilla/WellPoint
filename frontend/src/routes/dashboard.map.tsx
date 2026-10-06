import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import type { ExpressionSpecification } from 'maplibre-gl'
import { Map, MapControls, MapGeoJSON, useMap } from '@/components/ui/map'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SummaryPanel } from '@/components/SummaryPanel'
import { cn } from '@/lib/utils'
<<<<<<< HEAD
import { AssetMarkers } from '@/components/WaterAssets'
import { useWaterStore } from '@/lib/water-store'
import { barangayDetail, useDomain } from '@/lib/store'
import type { AccessState, VulnerabilityTier } from '@/data/types'
=======
import { AssetMarkers, MapBridge, RolePanel } from '@/components/WaterAssets'
import { BarangayStats } from '@/components/BarangayStats'
import { getUser } from '@/lib/auth'
import { useBarangays } from '@/lib/barangays'
import { addAsset, useWaterStore } from '@/lib/water-store'
import type { Asset, AssetKind } from '@/lib/water-store'
>>>>>>> d57b73fa1274ad1dd4a0c1679f937505514d5ad7

export const Route = createFileRoute('/dashboard/map')({ component: BarangayMap })

const DATA_URL = '/catbalogan-brgys.geojson'
const CITY_PCODE = 'PH0806005' // City of Catbalogan; guards against a file that holds more than one city
const MAX_SUGGESTIONS = 8

const ACCESS_FILL: Record<AccessState, string> = { served: '#10b981', partial: '#f59e0b', underserved: '#ef4444' }
const ACCESS_LABEL: Record<AccessState, string> = { served: 'Served', partial: 'Partial', underserved: 'Underserved' }
const ACCESS_TONE: Record<AccessState, string> = {
  served: 'bg-emerald-100 text-emerald-800',
  partial: 'bg-amber-100 text-amber-800',
  underserved: 'bg-red-100 text-red-700',
}
const VULN_LABEL: Record<VulnerabilityTier, string> = { low: 'Low', medium: 'Medium', high: 'High' }

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

// MapLibre paint values can't use var(--x), so read the theme colour once.
function themeColor(name: string, fallback: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return /^(#|rgb|hsl)/i.test(v) ? v : fallback
}

// Lives inside <Map>: fits the view to a focus. n = 0 is the first fit (no animation).
function FitTo({ focus }: { focus: Focus }) {
  const { map, isLoaded } = useMap()
  useEffect(() => {
    if (!map || !isLoaded) return
    map.fitBounds(focus.bounds, { padding: 48, maxZoom: 16, duration: focus.n === 0 ? 0 : 700 })
  }, [map, isLoaded, focus])
  return null
}

function BarangayMap() {
  const domain = useDomain()
  const { role } = useWaterStore()
  const [data, setData] = useState<Collection | null>(null)
  const [error, setError] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoverId, setHoverId] = useState<string | null>(null)
  const [focus, setFocus] = useState<Focus | null>(null)
<<<<<<< HEAD
  const [summaryOpen, setSummaryOpen] = useState(false)
=======
  const [sheetOpen, setSheetOpen] = useState(false)
  const mapRef = useRef<MapLibreMap | null>(null)
  const { role, assets, reports } = useWaterStore()
  const { barangayOf } = useBarangays()
  const myBarangay = typeof window === 'undefined' ? '' : (getUser()?.barangay ?? '')

  // Water sources grouped by the barangay their marker sits in.
  const sourcesBy = useMemo(() => {
    const m = new globalThis.Map<string, Asset[]>() // `Map` here is the map component
    for (const a of assets) {
      const name = barangayOf(a)
      if (name) m.set(name, [...(m.get(name) ?? []), a])
    }
    return m
  }, [assets, barangayOf])

  // Open-report count for a barangay, or null when this viewer may not see that barangay's reports.
  const openReportsIn = (name: string, list: Asset[]) => {
    const visible = role === 'lgu' || (role === 'official' && name.trim().toLowerCase() === myBarangay.trim().toLowerCase())
    if (!visible) return null
    const ids = new Set(list.map((a) => a.id))
    return reports.filter((r) => ids.has(r.assetId)).length
  }
  const statsFor = (name: string) => {
    const list = sourcesBy.get(name) ?? []
    return { name, sources: list, openReports: openReportsIn(name, list) }
  }

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
>>>>>>> d57b73fa1274ad1dd4a0c1679f937505514d5ad7

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
  const detail = selected ? barangayDetail(domain, selected.id.replace('PH', '')) : null

  const colors = useMemo(
    () => ({ well: themeColor('--color-well', '#0077b6'), foam: themeColor('--color-foam', '#90e0ef') }),
    [],
  )

  const accessColors = useMemo(() => {
    const out: Record<string, string> = {}
    for (const c of domain.communities) out[c.psgcCode] = ACCESS_FILL[domain.accessByPsgc[c.psgcCode]]
    return out
  }, [domain.communities, domain.accessByPsgc])

  const isSelected = ['==', ['get', 'ADM4_PCODE'], selectedId ?? ''] as ExpressionSpecification
  const inMatches = ['in', ['get', 'ADM4_PCODE'], ['literal', matches.map((b) => b.id)]] as ExpressionSpecification
  const fillOpacity = (
    filtering ? ['case', isSelected, 0.75, inMatches, 0.45, 0.1] : ['case', isSelected, 0.75, 0.35]
  ) as ExpressionSpecification
  const fillColor = [
    'coalesce',
    ['get', ['slice', ['get', 'ADM4_PCODE'], 2], ['literal', accessColors]],
    colors.well,
  ] as ExpressionSpecification

  // Select a barangay, fly to it, and show its info overlay.
  const pick = (id: string) => {
    const b = items.find((i) => i.id === id)
    if (!b) return
    setSelectedId(id)
    setFocus((f) => ({ bounds: b.bounds, n: (f?.n ?? 0) + 1 }))
    setQuery('')
  }

  return (
    <div className="relative h-[calc(100dvh-2.5rem)] min-h-[540px] overflow-hidden rounded-2xl border border-line bg-sky/40">
      {error && (
        <p role="alert" className="p-8 text-ink">
          Couldn't load the barangay map. Check that <code>catbalogan-brgys.geojson</code> is in the frontend{' '}
          <code>public</code> folder, then refresh.
        </p>
      )}
      {!error && !data && <p className="p-8 text-ink/70">Loading map…</p>}

      {data && focus && (
        <Map theme="light" center={[124.89, 11.78]} zoom={11} className="h-full w-full">
          <FitTo focus={focus} />
          <MapControls position="bottom-right" />
          <MapGeoJSON<Props>
            data={data}
            promoteId="ADM4_PCODE"
            interactive
            fillPaint={{ 'fill-color': fillColor, 'fill-opacity': fillOpacity }}
            fillHoverPaint={{ 'fill-color': colors.foam, 'fill-opacity': 0.7 }}
            linePaint={{
              'line-color': colors.well,
              'line-width': ['case', isSelected, 3, 1] as ExpressionSpecification,
            }}
            onHover={(e) => setHoverId(e?.feature.properties.ADM4_PCODE ?? null)}
            onClick={(e) => pick(e.feature.properties.ADM4_PCODE)}
          />
          <AssetMarkers />
        </Map>
      )}

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
                <button type="button" onClick={() => pick(b.id)} className="w-full rounded-md px-3 py-1.5 text-left text-sm hover:bg-sky">
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

      {/* Legend + quick actions */}
      <div className="absolute right-3 top-3 flex flex-col items-end gap-2">
        <div className="rounded-lg border border-line bg-white/90 px-3 py-2 text-xs shadow-sm">
          <p className="mb-1.5 font-bold">Access state</p>
          <ul className="space-y-1">
            {(Object.keys(ACCESS_LABEL) as AccessState[]).map((s) => (
              <li key={s} className="flex items-center gap-2">
                <span className="inline-block size-2.5 rounded-full" style={{ background: ACCESS_FILL[s] }} aria-hidden="true" />
                {ACCESS_LABEL[s]}
              </li>
            ))}
          </ul>
        </div>

        {role === 'lgu' && (
          <Fab onClick={() => setSummaryOpen(true)}>Summary</Fab>
        )}
        {role === 'official' && (
          <Link to="/dashboard/add-source" className="rounded-full bg-well px-4 py-2 text-sm font-bold text-white shadow-md hover:bg-deep">
            + Add source
          </Link>
        )}
        {role === 'citizen' && (
          <Link to="/dashboard/reports" className="rounded-full bg-signal px-4 py-2 text-sm font-bold text-ink shadow-md hover:bg-amber-500">
            Report a problem
          </Link>
        )}
        {(role === 'lgu' || role === 'drrm') && (
          <Link to="/dashboard/warnings" className="rounded-full bg-aqua px-4 py-2 text-sm font-bold text-white shadow-md hover:bg-well">
            Issue warning
          </Link>
        )}
      </div>

      {/* Selected barangay info overlay */}
      {selected && detail && (
        <div className="absolute bottom-16 left-3 max-w-xs rounded-xl border border-line bg-white/95 p-4 shadow-lg">
          <div className="flex items-start justify-between gap-2">
            <p className="font-extrabold">{selected.name}</p>
            <button type="button" onClick={() => setSelectedId(null)} aria-label="Close" className="text-ink/50 hover:text-ink">✕</button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className={cn('rounded-full px-2 py-0.5 text-xs font-bold', ACCESS_TONE[detail.accessState])}>{ACCESS_LABEL[detail.accessState]}</span>
            <span className="rounded-full bg-mist px-2 py-0.5 text-xs font-semibold text-ink/70">Vulnerability: {VULN_LABEL[detail.vulnerabilityTier]}</span>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg bg-mist px-2 py-1.5">
              <dt className="text-ink/60">Population</dt>
              <dd className="font-semibold">{detail.community.population.toLocaleString()}</dd>
            </div>
            <div className="rounded-lg bg-mist px-2 py-1.5">
              <dt className="text-ink/60">Flow</dt>
              <dd className="font-semibold">{Math.round(detail.status.flow)}%{detail.status.available ? '' : ' · offline'}</dd>
            </div>
            <div className="rounded-lg bg-mist px-2 py-1.5">
              <dt className="text-ink/60">Quality</dt>
              <dd className="font-semibold capitalize">{detail.status.quality}</dd>
            </div>
            <div className="rounded-lg bg-mist px-2 py-1.5">
              <dt className="text-ink/60">Affordability</dt>
              <dd className="font-semibold">{detail.community.affordability}</dd>
            </div>
          </dl>
          {detail.alerts.length > 0 && (
            <ul className="mt-2 space-y-1">
              {detail.alerts.slice(0, 2).map((a) => (
                <li key={a.id} className="text-xs text-ink/70">• {a.message}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Hover + recentre */}
      <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-2">
        {hovered && (
          <p aria-live="polite" className="rounded-lg bg-white/90 px-3 py-1.5 text-sm font-semibold shadow-sm">
            {hovered.name}
          </p>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            if (!cityBounds) return
            setFocus((f) => ({ bounds: cityBounds, n: (f?.n ?? 0) + 1 }))
          }}
          className="pointer-events-auto bg-white shadow-sm"
        >
          Show whole city
        </Button>
      </div>

<<<<<<< HEAD
      {/* LGU summary overlay */}
      {summaryOpen && (
        <div className="absolute inset-0 z-20 flex flex-col bg-white/95 backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-lg font-extrabold">Water-security summary</h2>
            <button type="button" onClick={() => setSummaryOpen(false)} aria-label="Close" className="text-ink/50 hover:text-ink">✕</button>
=======
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
                <div aria-live="polite" className="w-72 max-w-[calc(100vw-3rem)] rounded-xl bg-white/95 p-3 shadow-md">
                  <BarangayStats {...statsFor(hovered.name)} />
                </div>
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
                <BarangayStats {...statsFor(selected.name)} className="mb-4 rounded-xl border border-line bg-white p-3" />
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
>>>>>>> d57b73fa1274ad1dd4a0c1679f937505514d5ad7
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <SummaryPanel />
          </div>
        </div>
      )}
    </div>
  )
}

function Fab({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="rounded-full bg-well px-4 py-2 text-sm font-bold text-white shadow-md hover:bg-deep">
      {children}
    </button>
  )
}
