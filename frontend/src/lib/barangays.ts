import { useCallback, useEffect, useMemo, useState } from 'react'
import type { GeoBarangay } from './seed'

// Copy the seed file to frontend/public/catbalogan-brgys.geojson so Vite serves it as-is.
const DATA_URL = '/catbalogan-brgys.geojson'
const CITY_PCODE = 'PH0806005' // City of Catbalogan

type Geom = GeoJSON.Polygon | GeoJSON.MultiPolygon
type Props = { ADM4_EN: string; ADM3_PCODE: string; psgc_code: string; AREA_SQKM: number }
type Raw = GeoJSON.FeatureCollection<Geom, Props>
type Feat = GeoBarangay & { geometry: Geom }

function inRing(x: number, y: number, ring: number[][]) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

function inGeom(g: Geom, x: number, y: number) {
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates
  return polys.some((p) => inRing(x, y, p[0]) && !p.slice(1).some((hole) => inRing(x, y, hole)))
}

// Polygon / multi-polygon centroid (area-weighted), for distance-from-center.
function ringCentroid(ring: number[][]): { cx: number; cy: number; area: number } {
  let area = 0
  let cx = 0
  let cy = 0
  for (let i = 0; i < ring.length - 1; i++) {
    const [x0, y0] = ring[i]
    const [x1, y1] = ring[i + 1]
    const cross = x0 * y1 - x1 * y0
    area += cross
    cx += (x0 + x1) * cross
    cy += (y0 + y1) * cross
  }
  area *= 0.5
  if (area === 0) return { cx: ring[0][0], cy: ring[0][1], area: 0 }
  return { cx: cx / (6 * area), cy: cy / (6 * area), area: Math.abs(area) }
}

function centroid(g: Geom): { lat: number; lng: number } {
  if (g.type === 'Polygon') {
    const { cx, cy } = ringCentroid(g.coordinates[0])
    return { lat: cy, lng: cx }
  }
  let totalArea = 0
  let wx = 0
  let wy = 0
  for (const poly of g.coordinates) {
    const { cx, cy, area } = ringCentroid(poly[0])
    totalArea += area
    wx += cx * area
    wy += cy * area
  }
  if (totalArea === 0) {
    const first = g.coordinates[0][0][0]
    return { lat: first[1], lng: first[0] }
  }
  return { lat: wy / totalArea, lng: wx / totalArea }
}

// The boundary file is downloaded once and shared by every component that uses this hook.
// Each record carries the PSGC code, area and centroid alongside its geometry.
let cache: Promise<Feat[]> | null = null
function loadFeatures(): Promise<Feat[]> {
  cache ??= fetch(DATA_URL)
    .then((r) => (r.ok ? (r.json() as Promise<Raw>) : Promise.reject(new Error(String(r.status)))))
    .then((raw) =>
      raw.features
        .filter((f) => f.properties.ADM3_PCODE === CITY_PCODE)
        .map((f) => {
          const c = centroid(f.geometry)
          return {
            name: f.properties.ADM4_EN,
            psgcCode: f.properties.psgc_code,
            areaSqKm: f.properties.AREA_SQKM,
            lat: c.lat,
            lng: c.lng,
            geometry: f.geometry,
          }
        }),
    )
    .catch((e) => {
      cache = null // allow a retry on the next mount
      throw e
    })
  return cache
}

// `names` is every barangay A-Z; `barangays` are the full records (PSGC code, area, centroid);
// `barangayAt` / `barangayOf` find the one a point falls inside.
export function useBarangays() {
  const [feats, setFeats] = useState<Feat[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let alive = true
    loadFeatures()
      .then((f) => {
        if (!alive) return
        setFeats(f)
        setLoaded(true)
      })
      .catch(() => {
        if (alive) setLoaded(true) // without the file the lists still work, just without barangay names
      })
    return () => {
      alive = false
    }
  }, [])

  const barangays = useMemo<GeoBarangay[]>(
    () => feats.map(({ geometry: _geometry, ...rest }) => rest),
    [feats],
  )

  const names = useMemo(() => barangays.map((f) => f.name).sort((a, b) => a.localeCompare(b, 'en', { numeric: true })), [barangays])

  const barangayAt = useCallback(
    (a: { lng: number; lat: number }) => {
      const feat = feats.find((f) => inGeom(f.geometry, a.lng, a.lat))
      if (!feat) return null
      const { geometry: _geometry, ...rest } = feat
      return rest
    },
    [feats],
  )

  const barangayOf = useCallback((a: { lng: number; lat: number }) => barangayAt(a)?.name ?? null, [barangayAt])

  return { names, barangays, barangayAt, barangayOf, loaded }
}
