// Pure derivation of the read model: effective service status per barangay and
// access state. These run entirely in the browser (no backend) — see docs.
import { baselineFlow, isolationOf, pilotStatus } from './seed'
import { vulnerability } from './vulnerability'
import type { VulnerabilityBreakdown } from './vulnerability'
import type { AccessState, Asset, BarangayStatus, Community, CommunityReport, ServiceStatus, WaterSystem } from '@/data/types'

export const LOW_AFFORDABILITY = 35

/** Effective service status for a barangay: a persisted barangay_status override
 *  wins when present; pilot systems otherwise use their seed ticks; everyone
 *  else gets a deterministic isolation-degraded baseline. */
export function effectiveStatus(community: Community, overrides: Record<string, BarangayStatus>): ServiceStatus {
  const override = overrides[community.psgcCode]
  if (override) {
    const reason =
      !override.available
        ? 'outage'
        : override.quality === 'unsafe'
          ? 'contamination'
          : override.quality === 'advisory'
            ? 'advisory'
            : override.flow < 40
              ? 'low-flow'
              : null
    return { available: override.available, flow: override.flow, quality: override.quality, reason }
  }
  if (community.systemId) {
    return pilotStatus(community.systemId, null)
  }
  const isolation = isolationOf(community.areaSqKm, community.distanceToCenterKm)
  return { available: true, flow: baselineFlow(isolation), quality: 'safe', reason: null }
}

/** Effective affordability: an override value wins, else the seeded community value. */
export function effectiveAffordability(community: Community, overrides: Record<string, BarangayStatus>): number {
  return overrides[community.psgcCode]?.affordability ?? community.affordability
}

/** docs/architecture.md §5.2: covered ≠ accessed. */
export function accessStateOf(status: ServiceStatus, affordability: number): AccessState {
  if (!status.available || status.quality === 'unsafe' || status.flow < 25) return 'underserved'
  if (status.flow >= 40 && status.quality === 'safe' && affordability >= LOW_AFFORDABILITY) return 'served'
  return 'partial'
}

export interface DomainState {
  communities: Community[]
  systems: WaterSystem[]
  sources: Asset[]
  reports: CommunityReport[]
  overrides: Record<string, BarangayStatus>
  statusByPsgc: Record<string, ServiceStatus>
  affordabilityByPsgc: Record<string, number>
  accessByPsgc: Record<string, AccessState>
  vulnerabilityByPsgc: Record<string, VulnerabilityBreakdown>
  sourceArea: Record<string, string>
}

export function deriveDomain(
  communities: Community[],
  systems: WaterSystem[],
  sources: Asset[],
  reports: CommunityReport[],
  overrides: Record<string, BarangayStatus>,
): DomainState {
  const statusByPsgc: Record<string, ServiceStatus> = {}
  const affordabilityByPsgc: Record<string, number> = {}
  const accessByPsgc: Record<string, AccessState> = {}
  const vulnerabilityByPsgc: Record<string, VulnerabilityBreakdown> = {}
  const nameByPsgc = new Map(communities.map((c) => [c.psgcCode, c.name]))
  const sourceArea: Record<string, string> = {}
  for (const s of sources) sourceArea[s.id] = nameByPsgc.get(s.barangayPsgc) ?? 'Unknown barangay'

  for (const c of communities) {
    const system = systems.find((s) => s.id === c.systemId) ?? null
    const status = effectiveStatus(c, overrides)
    const affordability = effectiveAffordability(c, overrides)
    statusByPsgc[c.psgcCode] = status
    affordabilityByPsgc[c.psgcCode] = affordability
    accessByPsgc[c.psgcCode] = accessStateOf(status, affordability)
    vulnerabilityByPsgc[c.psgcCode] = vulnerability({ ...c, affordability }, system?.level ?? null)
  }
  return { communities, systems, sources, reports, overrides, statusByPsgc, affordabilityByPsgc, accessByPsgc, vulnerabilityByPsgc, sourceArea }
}
