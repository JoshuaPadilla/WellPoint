// Canonical domain model for WellPoint. Field names are stable: the Supabase
// schema, the store, the derived logic, and the UI all depend on them.
//
// Derived read-model values (access state, vulnerability tier, alerts, metrics)
// are NEVER persisted — they are recomputed in frontend/src/lib/* from the
// inputs below.

export type Role = 'citizen' | 'official' | 'lgu' | 'drrm'
export type AssetKind = 'pump' | 'well' | 'reservoir' | 'station'
export type SourceStatus = 'ok' | 'low' | 'empty' | 'repair' | 'unsafe'
export type ServiceLevel = 'I' | 'II' | 'III'
export type Quality = 'safe' | 'advisory' | 'unsafe'

/** A physical water source (a map marker). Persisted in Supabase `water_sources`. */
export interface Asset {
  id: string
  kind: AssetKind
  name: string
  lng: number
  lat: number
  status: SourceStatus
  barangayPsgc: string
  systemId: string
}

/** A pilot water system (Level I / II / III) serving a barangay. Seeded in Supabase. */
export interface WaterSystem {
  id: string
  name: string
  level: ServiceLevel
  barangayId: string // barangay psgcCode
  serviceHours: number
  operator: string
  affordability: number
  population: number
}

/** A barangay (community). Metadata from Supabase `barangays`. */
export interface Community {
  psgcCode: string
  name: string
  areaSqKm: number
  lat: number
  lng: number
  distanceToCenterKm: number
  population: number
  affordability: number
  systemId: string
}

/** Derived per-system service status (latest tick). Never stored. */
export interface ServiceStatus {
  available: boolean
  flow: number // % of nominal (0-100+)
  quality: Quality
  reason: DisruptionReason | null
}

export type DisruptionReason = 'drought' | 'typhoon' | 'maintenance' | 'contamination' | 'low-flow' | 'advisory' | 'outage'
export type DisruptionType = 'drought' | 'typhoon' | 'maintenance' | 'contamination'

/** A persisted per-barangay status override (supabase `barangay_status`). A row
 *  replaces the seeded/derived live values for one barangay; no row means the
 *  deterministic seed applies. Managed by the LGU water office. */
export interface BarangayStatus {
  psgcCode: string
  available: boolean
  flow: number // % of nominal (0-200)
  quality: Quality
  affordability: number // 0-100
  setBy: string
  updatedAt: string
}

/** A barangay official — a real registered user with role 'official' scoped to that barangay. */
export interface BarangayOfficial {
  id: string
  barangayPsgc: string
  name: string
  email: string
}

export type AccessState = 'served' | 'partial' | 'underserved'
export type VulnerabilityTier = 'low' | 'medium' | 'high'

export type ReportType = 'no_water' | 'low_pressure' | 'contamination' | 'infrastructure_damage' | 'other'
export type ReportStatus = 'new' | 'acknowledged' | 'resolved'

/** A community report. Persisted in Supabase `reports`; authored by users. */
export interface CommunityReport {
  id: string
  reporterId: string
  reporterName: string
  barangayPsgc: string
  area: string
  type: ReportType
  description: string
  status: ReportStatus
  createdAt: string
}

export type AlertType = 'shortage' | 'contamination' | 'outage'
export type AlertSeverity = 'info' | 'warning' | 'critical'

/** A derived or authored alert. Never hand-entered; recomputed/merged from inputs. */
export interface Alert {
  id: string
  source: 'derived' | 'authored'
  type: AlertType
  severity: AlertSeverity
  area: string
  systemId?: string
  reportId?: string
  warningId?: string
  raisedAt: string
  status: 'active' | 'resolved'
  reason: string
  message: string
  action: string
}

export type WarningType = 'outage' | 'contamination' | 'disaster' | 'maintenance' | 'advisory'
export type WarningStatus = 'active' | 'resolved' | 'cancelled'

/** A DRRM/LGU-authored early warning. Persisted in Supabase `warnings`. */
export interface Warning {
  id: string
  authorId: string
  authorName: string
  type: WarningType
  severity: AlertSeverity
  title: string
  message: string
  action: string
  status: WarningStatus
  barangayPsgcs: string[]
  createdAt: string
}

export interface Metrics {
  accessCoveragePct: number
  reliabilityPct: number
  affordability: number
  activeAlerts: number
  score: number
  band: 'Secure' | 'Watch' | 'Critical'
}

export interface BarangayDetail {
  community: Community
  affordability: number // effective (override wins over seeded)
  accessState: AccessState
  vulnerabilityTier: VulnerabilityTier
  vulnerabilityBreakdown: {
    isolation: number
    serviceLevel: ServiceLevel | null
    capacityMargin: number
  }
  status: ServiceStatus
  trend: number[]
  openReports: CommunityReport[]
  alerts: Alert[]
  sourceCount: number
  officials: BarangayOfficial[]
  system: { name: string; level: ServiceLevel; serviceHours: number; operator: string } | null
}
