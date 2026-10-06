// Aggregate read model: composes the Supabase-backed store (assets, reports,
// warnings, barangays, systems), the deterministic seed fallback, and the derived
// alerts / metrics / vulnerability into one object the UI consumes via useDomain().
import { useMemo } from 'react'
import { useBarangays } from './barangays'
import { useWaterStore } from './water-store'
import type { WaterState } from './water-store'
import { PILOT_SYSTEMS, TICKS_BY_SYSTEM, buildCommunities } from './seed'
import type { GeoBarangay } from './seed'
import { deriveDomain } from './derive'
import type { DomainState } from './derive'
import { activeAlerts, allAlerts, sortAlerts } from './alerts'
import { computeMetrics } from './metrics'
import type { Alert, BarangayDetail, BarangayOfficial, Community, Metrics, Warning } from '@/data/types'

export interface Domain extends DomainState {
  warnings: Warning[]
  officials: BarangayOfficial[]
  alerts: Alert[]
  activeAlerts: Alert[]
  metrics: Metrics
}

type BarangayAt = (a: { lng: number; lat: number }) => GeoBarangay | null

export function buildDomain(water: WaterState, geos: GeoBarangay[], barangayAt: BarangayAt): Domain {
  const communities: Community[] = water.barangays.length > 0 ? water.barangays : buildCommunities(geos)
  const nameByPsgc = new Map(communities.map((c) => [c.psgcCode, c.name]))

  // Resolve each system's barangay (the FK is barangays.system_id, not the system row).
  const systems = (water.systems.length > 0 ? water.systems : PILOT_SYSTEMS).map((s) => {
    const c = communities.find((x) => x.systemId === s.id)
    return { ...s, barangayId: c?.psgcCode ?? s.barangayId }
  })

  const reports = water.reports.map((r) => ({ ...r, area: nameByPsgc.get(r.barangayPsgc) ?? (r.barangayPsgc || 'Unknown') }))

  const sources = water.assets.map((a) => {
    if (a.barangayPsgc) return a
    const b = barangayAt(a)
    const systemId = systems.find((s) => s.barangayId === b?.psgcCode)?.id ?? ''
    return { ...a, barangayPsgc: b?.psgcCode ?? '', systemId }
  })

  const domain = deriveDomain(communities, systems, sources, reports, water.statusOverrides)
  const active = activeAlerts(domain, water.warnings)
  const metrics = computeMetrics(domain, active)
  // Barangay officials come from real registered profiles (role 'official', scoped by barangay).
  const officials: BarangayOfficial[] = water.users
    .filter((u) => u.role === 'official' && u.barangayPsgc)
    .map((u) => ({ id: u.id, barangayPsgc: u.barangayPsgc, name: u.name, email: u.email }))
  return {
    ...domain,
    warnings: water.warnings,
    officials,
    alerts: sortAlerts(allAlerts(domain, water.warnings), domain),
    activeAlerts: active,
    metrics,
  }
}

export function useDomain(): Domain {
  const water = useWaterStore()
  const { barangays, barangayAt } = useBarangays()
  return useMemo(() => buildDomain(water, barangays, barangayAt), [water, barangays, barangayAt])
}

export const barangayName = (communities: Community[], psgc: string) =>
  communities.find((c) => c.psgcCode === psgc)?.name ?? psgc

/** Per-barangay drill-down: access state, vulnerability breakdown, trend, reports, alerts,
 *  source count, officials, and the serving system (if any). */
export function barangayDetail(domain: Domain, psgcCode: string): BarangayDetail | null {
  const community = domain.communities.find((c) => c.psgcCode === psgcCode)
  if (!community) return null
  const vuln = domain.vulnerabilityByPsgc[psgcCode]
  const status = domain.statusByPsgc[psgcCode]
  const trend = community.systemId ? (TICKS_BY_SYSTEM[community.systemId] ?? []).map((t) => t.flow) : []
  const openReports = domain.reports.filter((r) => r.barangayPsgc === psgcCode && r.status !== 'resolved')
  const alerts = domain.alerts.filter((a) => a.area === community.name)
  const system = domain.systems.find((s) => s.barangayId === psgcCode) ?? null
  return {
    community,
    affordability: domain.affordabilityByPsgc[psgcCode] ?? community.affordability,
    accessState: domain.accessByPsgc[psgcCode],
    vulnerabilityTier: vuln.tier,
    vulnerabilityBreakdown: {
      isolation: vuln.isolation,
      serviceLevel: vuln.serviceLevel,
      capacityMargin: vuln.capacityMargin,
    },
    status,
    trend,
    openReports,
    alerts,
    sourceCount: domain.sources.filter((s) => s.barangayPsgc === psgcCode).length,
    officials: domain.officials.filter((o) => o.barangayPsgc === psgcCode),
    system: system ? { name: system.name, level: system.level, serviceHours: system.serviceHours, operator: system.operator } : null,
  }
}
