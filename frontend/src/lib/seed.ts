// Deterministic client-side helpers. Static reference data (barangays + the 5
// pilot systems) now lives in Supabase and is seeded by supabase/schema.sql; this
// module keeps (a) the deterministic flow series + isolation math used by the
// derived logic, and (b) a client-side fallback seed so the demo still renders if
// the `barangays` / `water_systems` tables are not yet applied.
import { km } from './geo'
import type { Community, ServiceStatus, WaterSystem } from '@/data/types'

export const BASE_SEED = 20261006

// The barangay that anchors the "distance from city center" measure.
export const POBLACION_PSGC = '0806005034'

// Fixed system UUIDs — must match the seed in supabase/schema.sql so the client
// flow series can key off the seeded systems deterministically.
export const SYSTEM_IDS = {
  poblacion: '10000000-0000-4000-8000-000000000001',
  sanAndres: '10000000-0000-4000-8000-000000000002',
  mercedes: '10000000-0000-4000-8000-000000000003',
  bangon: '10000000-0000-4000-8000-000000000004',
  canlapwas: '10000000-0000-4000-8000-000000000005',
} as const

/** Minimal barangay shape the GeoJSON loader hands to the fallback seeder. */
export interface GeoBarangay {
  name: string
  psgcCode: string
  areaSqKm: number
  lat: number
  lng: number
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const tick = (available: boolean, flow: number, quality: ServiceStatus['quality'] = 'safe', reason: ServiceStatus['reason'] = null): ServiceStatus => ({
  available,
  flow,
  quality,
  reason,
})

// Fallback systems (used only when Supabase water_systems is unavailable). UUIDs
// match supabase/schema.sql.
export const PILOT_SYSTEMS: WaterSystem[] = [
  { id: SYSTEM_IDS.poblacion, name: 'Poblacion 1 Water System', level: 'III', barangayId: '0806005034', serviceHours: 24, operator: 'Catbalogan Water District', affordability: 80, population: 8500 },
  { id: SYSTEM_IDS.sanAndres, name: 'San Andres Spring System', level: 'II', barangayId: '0806005051', serviceHours: 18, operator: 'Barangay Water Association', affordability: 55, population: 4200 },
  { id: SYSTEM_IDS.mercedes, name: 'Mercedes Groundwater System', level: 'II', barangayId: '0806005027', serviceHours: 20, operator: 'Barangay Water Association', affordability: 50, population: 3000 },
  { id: SYSTEM_IDS.bangon, name: 'Bangon Spring System', level: 'I', barangayId: '0806005003', serviceHours: 12, operator: 'Barangay Council', affordability: 30, population: 2500 },
  { id: SYSTEM_IDS.canlapwas, name: 'Canlapwas Spring System', level: 'I', barangayId: '0806005014', serviceHours: 10, operator: 'Barangay Council', affordability: 25, population: 1500 },
]

/** Status history per pilot system (index-aligned with PILOT_SYSTEMS). */
const PILOT_TICKS: ServiceStatus[][] = [
  [tick(true, 86), tick(true, 88), tick(true, 90), tick(true, 89), tick(true, 90), tick(true, 91)],
  [tick(true, 58), tick(true, 57), tick(true, 58), tick(true, 59), tick(true, 58), tick(true, 59)],
  [tick(true, 70), tick(true, 68), tick(false, 0, 'safe', 'maintenance'), tick(false, 0, 'safe', 'maintenance'), tick(true, 65), tick(true, 68)],
  [tick(true, 34), tick(true, 33), tick(true, 35), tick(true, 34), tick(true, 33), tick(true, 34)],
  [tick(true, 48), tick(true, 47), tick(true, 46), tick(true, 45), tick(true, 45), tick(true, 45, 'unsafe', 'contamination')],
]

export const TICKS_BY_SYSTEM: Partial<Record<string, ServiceStatus[]>> = Object.fromEntries(
  PILOT_SYSTEMS.map((s, i) => [s.id, PILOT_TICKS[i]]),
)

export const SYSTEM_BY_BARANGAY: Partial<Record<string, WaterSystem>> = Object.fromEntries(
  PILOT_SYSTEMS.map((s) => [s.barangayId, s]),
)

const ISOLATION_CAP = 0.95

/** Structural isolation (0-1) from geometry: larger, farther-from-center barangays score higher. */
export function isolationOf(areaSqKm: number, distanceToCenterKm: number): number {
  return 0.5 * Math.min(1, areaSqKm / 10) + 0.5 * Math.min(1, distanceToCenterKm / 15)
}

// Non-pilot barangays get a deterministic baseline flow that degrades with geographic isolation.
export function baselineFlow(isolation: number): number {
  return Math.round(100 - isolation * 80 * ISOLATION_CAP)
}

export interface DisruptionOverride {
  systemId: string
  type: ServiceStatus['reason'] & string
}

export function disruptionStatus(type: DisruptionOverride['type']): ServiceStatus {
  switch (type) {
    case 'typhoon':
      return tick(false, 0, 'advisory', 'typhoon')
    case 'drought':
      return tick(true, 28, 'safe', 'drought')
    case 'contamination':
      return tick(true, 45, 'unsafe', 'contamination')
    case 'maintenance':
      return tick(false, 0, 'safe', 'maintenance')
    default:
      return tick(true, 90)
  }
}

/** Current status for a pilot system, honouring any active disruption override. */
export function pilotStatus(systemId: string, disruption: DisruptionOverride | null): ServiceStatus {
  const ticks = TICKS_BY_SYSTEM[systemId]
  if (!ticks) return tick(true, 90)
  if (disruption && disruption.systemId === systemId) return disruptionStatus(disruption.type)
  return ticks[ticks.length - 1]
}

/** Fallback: build Community records from the GeoJSON when Supabase barangays is empty. */
export function buildCommunities(geos: GeoBarangay[]): Community[] {
  if (geos.length === 0) return []
  const center = geos.find((g) => g.psgcCode === POBLACION_PSGC) ?? geos[0]
  const centerPoint = { lat: center.lat, lng: center.lng }
  const rng = mulberry32(BASE_SEED)

  return geos.map((g) => {
    const system = SYSTEM_BY_BARANGAY[g.psgcCode]
    const distanceToCenterKm = km(centerPoint, { lat: g.lat, lng: g.lng })
    const population = system
      ? system.population
      : Math.max(400, Math.round(g.areaSqKm * (350 + rng() * 450)))
    const affordability = system ? system.affordability : 45 + Math.round(rng() * 30)
    return {
      psgcCode: g.psgcCode,
      name: g.name,
      areaSqKm: g.areaSqKm,
      lat: g.lat,
      lng: g.lng,
      distanceToCenterKm: Number(distanceToCenterKm.toFixed(3)),
      population,
      affordability,
      systemId: system ? system.id : '',
    }
  })
}
