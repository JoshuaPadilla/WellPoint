// Rule-based LGU insights: a deterministic recommendation engine and a
// per-barangay priority ranking. Both read the derived Domain (see ./store) and
// are pure client-side functions — nothing here is stored or hand-entered, so
// the guidance always matches what the alerts and score are actually seeing.
import { TICKS_BY_SYSTEM } from './seed'
import type { Domain } from './store'
import type {
  AccessState,
  Community,
  Quality,
  VulnerabilityTier,
} from '@/data/types'

export type RecommendationPriority = 'critical' | 'high' | 'medium' | 'low'
export type RecommendationCategory =
  | 'response'
  | 'quality'
  | 'coverage'
  | 'infrastructure'
  | 'finance'
  | 'governance'
  | 'positive'

export interface Recommendation {
  id: string
  priority: RecommendationPriority
  category: RecommendationCategory
  title: string
  detail: string
  areas: string[]
  action: { label: string; to: string } | null
}

export const PRIORITY_ORDER: Record<RecommendationPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
}
export const PRIORITY_LABEL: Record<RecommendationPriority, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}
export const CATEGORY_LABEL: Record<RecommendationCategory, string> = {
  response: 'Emergency response',
  quality: 'Water quality',
  coverage: 'Coverage & access',
  infrastructure: 'Infrastructure',
  finance: 'Affordability',
  governance: 'Governance',
  positive: 'All clear',
}

const LIMIT = 5

function declining(systemId: string): boolean {
  const ticks = TICKS_BY_SYSTEM[systemId]
  if (!ticks || ticks.length < 3) return false
  const f = ticks.slice(-3).map((t) => t.flow)
  return f[2] < f[1] && f[1] < f[0]
}

/** Prioritized, rule-based recommended actions for the city. */
export function recommendActions(domain: Domain): Recommendation[] {
  const out: Recommendation[] = []
  const seen = new Set<string>()
  const push = (r: Recommendation) => {
    if (seen.has(r.id)) return
    seen.add(r.id)
    out.push(r)
  }

  const {
    metrics,
    activeAlerts,
    communities,
    sources,
    reports,
    accessByPsgc,
    vulnerabilityByPsgc,
    statusByPsgc,
  } = domain

  // 1. Respond to the most severe active alerts, one action per affected area.
  for (const a of activeAlerts
    .filter((x) => x.severity === 'critical')
    .slice(0, LIMIT)) {
    push({
      id: `respond-${a.id}`,
      priority: 'critical',
      category: a.type === 'contamination' ? 'quality' : 'response',
      title:
        a.type === 'contamination'
          ? `Contamination in ${a.area}`
          : `No water in ${a.area}`,
      detail: a.message,
      areas: a.area === 'Catbalogan City' ? [] : [a.area],
      action: { label: 'Open alerts', to: '/dashboard/alerts' },
    })
  }

  // 2. Unsafe drinking-water sources need a boil-water advisory and testing.
  const unsafeSources = sources.filter((s) => s.status === 'unsafe')
  if (unsafeSources.length > 0) {
    const areas = [
      ...new Set(
        unsafeSources.map((s) => domain.sourceArea[s.id] ?? 'Unknown barangay'),
      ),
    ].slice(0, LIMIT)
    push({
      id: 'quality-unsafe-sources',
      priority: 'critical',
      category: 'quality',
      title: `Test water quality — ${unsafeSources.length} source${unsafeSources.length === 1 ? '' : 's'} not safe to drink`,
      detail:
        'Dispatch water-quality testing and keep a boil-water advisory active until the source is cleared.',
      areas,
      action: { label: 'Issue advisory', to: '/dashboard/warnings' },
    })
  }

  // 3. Unsafe water quality in a served barangay (not already covered above).
  const unsafeQuality = communities.filter(
    (c) => statusByPsgc[c.psgcCode].quality === 'unsafe',
  )
  if (unsafeQuality.length > 0) {
    push({
      id: 'quality-unsafe-systems',
      priority: 'critical',
      category: 'quality',
      title: `Boil-water advisory for ${unsafeQuality
        .slice(0, 3)
        .map((c) => c.name)
        .join(', ')}`,
      detail: `${unsafeQuality.length} barangay${unsafeQuality.length === 1 ? '' : 's'} reporting unsafe water. Test, then lift the advisory once safe.`,
      areas: unsafeQuality.slice(0, LIMIT).map((c) => c.name),
      action: { label: 'Issue advisory', to: '/dashboard/warnings' },
    })
  }

  // 4. Open resident reports need triage so issues actually get fixed.
  const openReports = reports.filter((r) => r.status !== 'resolved')
  if (openReports.length > 0) {
    push({
      id: 'governance-triage',
      priority: openReports.length >= 5 ? 'high' : 'medium',
      category: 'governance',
      title: `Triage ${openReports.length} open resident report${openReports.length === 1 ? '' : 's'}`,
      detail:
        'Acknowledge reports with the barangay leader, fix what is fixable, and resolve them so alerts stay accurate.',
      areas: [],
      action: { label: 'Review in alerts', to: '/dashboard/alerts' },
    })
  }

  // 5. Underserved barangays are the coverage gap.
  const underserved = communities.filter(
    (c) => accessByPsgc[c.psgcCode] === 'underserved',
  )
  if (underserved.length > 0) {
    push({
      id: 'coverage-underserved',
      priority: underserved.length >= 3 ? 'high' : 'medium',
      category: 'coverage',
      title: `Extend service to ${underserved.length} underserved barangay${underserved.length === 1 ? '' : 's'}`,
      detail:
        'Access coverage is a top scoring driver. Focus the next capital outlay and filling-station runs here.',
      areas: underserved.slice(0, LIMIT).map((c) => c.name),
      action: { label: 'Open map', to: '/dashboard/map' },
    })
  }

  // 6. Underserved + high structural vulnerability = act first.
  const priorityAreas = underserved
    .filter((c) => vulnerabilityByPsgc[c.psgcCode].tier === 'high')
    .slice(0, 3)
  if (priorityAreas.length > 0) {
    push({
      id: 'coverage-priority',
      priority: 'high',
      category: 'coverage',
      title: `Prioritize ${priorityAreas.map((c) => c.name).join(', ')} for intervention`,
      detail:
        'These barangays are underserved and structurally vulnerable — they lose the most when water fails.',
      areas: priorityAreas.map((c) => c.name),
      action: { label: 'Open map', to: '/dashboard/map' },
    })
  }

  // 7. Declining flow is the early sign of a system in trouble.
  const decliningAreas = communities.filter(
    (c) => c.systemId && declining(c.systemId),
  )
  if (decliningAreas.length > 0) {
    push({
      id: 'infrastructure-declining',
      priority: 'medium',
      category: 'infrastructure',
      title: `Inspect declining flow in ${decliningAreas
        .slice(0, 3)
        .map((c) => c.name)
        .join(', ')}`,
      detail:
        'Flow has dropped for three consecutive readings. Check pumps and springs before it becomes an outage.',
      areas: decliningAreas.slice(0, LIMIT).map((c) => c.name),
      action: { label: 'Open map', to: '/dashboard/map' },
    })
  }

  // 8. Reliability below 60% means many households get partial service.
  if (metrics.reliabilityPct < 60) {
    const lowFlow = communities
      .filter(
        (c) =>
          statusByPsgc[c.psgcCode].available &&
          statusByPsgc[c.psgcCode].flow < 60,
      )
      .map((c) => c.name)
    push({
      id: 'infrastructure-reliability',
      priority: 'high',
      category: 'infrastructure',
      title: `Raise reliability — city flow is at ${Math.round(metrics.reliabilityPct)}%`,
      detail: `Systems in ${lowFlow.slice(0, 3).join(', ') || 'several barangays'} are running below 60% of normal flow.`,
      areas: lowFlow.slice(0, LIMIT),
      action: { label: 'Open map', to: '/dashboard/map' },
    })
  }

  // 9. Affordability below the served threshold weakens the score.
  if (metrics.affordability < 40) {
    push({
      id: 'finance-affordability',
      priority: 'medium',
      category: 'finance',
      title: 'Review water affordability support',
      detail:
        'Affordability is a one-third scoring driver. Consider lifeline rates or subsidies for low-income households.',
      areas: [],
      action: null,
    })
  }

  // 10. When nothing is wrong, say so — the engine still has to decide something.
  if (
    metrics.score >= 75 &&
    !out.some((r) => r.priority === 'critical' || r.priority === 'high')
  ) {
    push({
      id: 'positive-posture',
      priority: 'low',
      category: 'positive',
      title: 'Maintain current posture',
      detail:
        'No critical or high-priority issues right now. Keep monitoring early-warning signals and re-run this screen after disruptions.',
      areas: [],
      action: { label: 'View alerts', to: '/dashboard/alerts' },
    })
  }

  return out.sort(
    (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority],
  )
}

export interface BarangayRank {
  community: Community
  accessState: AccessState
  vulnerabilityTier: VulnerabilityTier
  flow: number
  quality: Quality
  affordability: number
  openReports: number
  declining: boolean
  needScore: number
}

/** Per-barangay need score: where should the LGU act first? */
export function rankBarangays(domain: Domain): BarangayRank[] {
  const rows: BarangayRank[] = []
  for (const c of domain.communities) {
    const access = domain.accessByPsgc[c.psgcCode]
    const vuln = domain.vulnerabilityByPsgc[c.psgcCode]
    const status = domain.statusByPsgc[c.psgcCode]
    const openReports = domain.reports.filter(
      (r) => r.barangayPsgc === c.psgcCode && r.status !== 'resolved',
    ).length
    const isDeclining = Boolean(c.systemId) && declining(c.systemId)

    let score = 0
    if (access === 'underserved') score += 40
    else if (access === 'partial') score += 15
    if (vuln.tier === 'high') score += 25
    else if (vuln.tier === 'medium') score += 10
    score += Math.min(12, 3 * openReports)
    if (!status.available) score += 15
    else if (status.flow < 25) score += 15
    else if (status.flow < 40) score += 10
    else if (status.flow < 60) score += 5
    if (status.quality === 'unsafe') score += 20
    else if (status.quality === 'advisory') score += 5
    if (isDeclining) score += 8
    if (c.affordability < 35) score += 6

    rows.push({
      community: c,
      accessState: access,
      vulnerabilityTier: vuln.tier,
      flow: status.available ? status.flow : 0,
      quality: status.quality,
      affordability: c.affordability,
      openReports,
      declining: isDeclining,
      needScore: score,
    })
  }
  return rows.sort(
    (a, b) =>
      b.needScore - a.needScore ||
      a.community.name.localeCompare(b.community.name),
  )
}
