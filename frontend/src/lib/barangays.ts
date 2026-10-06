import { useCallback, useEffect, useMemo, useState } from 'react'

// Copy the seed file to frontend/public/catbalogan-brgys.geojson so Vite serves it as-is.
const DATA_URL = '/catbalogan-brgys.geojson'
const CITY_PCODE = 'PH0806005' // City of Catbalogan

type Geom = GeoJSON.Polygon | GeoJSON.MultiPolygon
type Feat = { name: string; geometry: Geom }
type Raw = GeoJSON.FeatureCollection<Geom, { ADM4_EN: string; ADM3_PCODE: string }>

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

// The boundary file is downloaded once and shared by every component that uses this hook.
let cache: Promise<Feat[]> | null = null
function loadFeatures(): Promise<Feat[]> {
  cache ??= fetch(DATA_URL)
    .then((r) => (r.ok ? (r.json() as Promise<Raw>) : Promise.reject(new Error(String(r.status)))))
    .then((raw) =>
      raw.features
        .filter((f) => f.properties.ADM3_PCODE === CITY_PCODE)
        .map((f) => ({ name: f.properties.ADM4_EN, geometry: f.geometry })),
    )
    .catch((e) => {
      cache = null // allow a retry on the next mount
      throw e
    })
  return cache
}

// `names` is every barangay A-Z; `barangayOf` names the one a point falls inside.
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

  const names = useMemo(() => feats.map((f) => f.name).sort((a, b) => a.localeCompare(b, 'en', { numeric: true })), [feats])
  const barangayOf = useCallback(
    (a: { lng: number; lat: number }) => feats.find((f) => inGeom(f.geometry, a.lng, a.lat))?.name ?? null,
    [feats],
  )
  return { names, barangayOf, loaded }
}
