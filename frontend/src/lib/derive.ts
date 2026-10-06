// Pure derivation of the read model: effective service status per barangay and
// access state. These run entirely in the browser (no backend) — see docs.
import { baselineFlow, isolationOf, pilotStatus } from './seed'
import { vulnerability } from './vulnerability'
import type { VulnerabilityBreakdown } from './vulnerability'
import type { AccessState, Asset, Community, CommunityReport, DisruptionReason, ServiceStatus, WaterSystem } from '@/data/types'

export interface Disruption {
  systemId: string
  type: DisruptionReason
}

export const LOW_AFFORDABILITY = 35

/** Effective status for a barangay: pilot systems use their seed ticks (plus any
 *  disruption override); everyone else gets a deterministic isolation-degraded baseline. */
export function effectiveStatus(community: Community, disruption: Disruption | null): ServiceStatus {
  if (community.systemId) {
    return pilotStatus(community.systemId, disruption ?? null)
  }
  const isolation = isolationOf(community.areaSqKm, community.distanceToCenterKm)
  return { available: true, flow: baselineFlow(isolation), quality: 'safe', reason: null }
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
  disruption: Disruption | null
  statusByPsgc: Record<string, ServiceStatus>
  accessByPsgc: Record<string, AccessState>
  vulnerabilityByPsgc: Record<string, VulnerabilityBreakdown>
  sourceArea: Record<string, string>
}

export function deriveDomain(
  communities: Community[],
  systems: WaterSystem[],
  sources: Asset[],
  reports: CommunityReport[],
  disruption: Disruption | null,
): DomainState {
  const statusByPsgc: Record<string, ServiceStatus> = {}
  const accessByPsgc: Record<string, AccessState> = {}
  const vulnerabilityByPsgc: Record<string, VulnerabilityBreakdown> = {}
  const nameByPsgc = new Map(communities.map((c) => [c.psgcCode, c.name]))
  const sourceArea: Record<string, string> = {}
  for (const s of sources) sourceArea[s.id] = nameByPsgc.get(s.barangayPsgc) ?? 'Unknown barangay'

  for (const c of communities) {
    const system = systems.find((s) => s.id === c.systemId) ?? null
    const status = effectiveStatus(c, disruption)
    statusByPsgc[c.psgcCode] = status
    accessByPsgc[c.psgcCode] = accessStateOf(status, c.affordability)
    vulnerabilityByPsgc[c.psgcCode] = vulnerability(c, system?.level ?? null)
  }
  return { communities, systems, sources, reports, disruption, statusByPsgc, accessByPsgc, vulnerabilityByPsgc, sourceArea }
}
