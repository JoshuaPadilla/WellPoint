// Water-security metrics (docs/architecture.md §5.2), ported to pure client-side
// functions. Every metric is derived from current signals — never stored or seeded —
// so the score cannot be gamed by its own labels.
import type { DomainState } from './derive'
import type { Alert, Metrics } from '@/data/types'

const round1 = (n: number) => Math.round(n * 10) / 10

export function computeMetrics(domain: DomainState, alerts: Alert[]): Metrics {
  let totalPop = 0
  let coveredPop = 0
  let flowWeighted = 0
  let affordabilityWeighted = 0
  let critical = 0
  let warning = 0
  let info = 0

  for (const c of domain.communities) {
    totalPop += c.population
    const access = domain.accessByPsgc[c.psgcCode]
    if (access !== 'underserved') coveredPop += c.population
    const status = domain.statusByPsgc[c.psgcCode]
    flowWeighted += c.population * (status.available ? status.flow : 0)
    affordabilityWeighted += c.population * c.affordability
  }

  for (const a of alerts) {
    if (a.status !== 'active') continue
    if (a.severity === 'critical') critical++
    else if (a.severity === 'warning') warning++
    else info++
  }

  const accessCoveragePct = totalPop ? (coveredPop / totalPop) * 100 : 0
  const reliabilityPct = totalPop ? flowWeighted / totalPop : 0
  const affordability = totalPop ? affordabilityWeighted / totalPop : 0
  const penalty = Math.min(30, 10 * critical + 4 * warning + 1 * info)
  const score = Math.max(0, Math.min(100, 0.4 * accessCoveragePct + 0.3 * reliabilityPct + 0.3 * affordability - penalty))
  const band: Metrics['band'] = score >= 75 ? 'Secure' : score >= 50 ? 'Watch' : 'Critical'

  return {
    accessCoveragePct: round1(accessCoveragePct),
    reliabilityPct: round1(reliabilityPct),
    affordability: round1(affordability),
    activeAlerts: critical + warning + info,
    score: Math.round(score),
    band,
  }
}
