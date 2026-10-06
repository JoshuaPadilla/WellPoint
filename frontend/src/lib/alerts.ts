// Derived early-warning alerts (docs/architecture.md §5.1), ported to pure
// client-side functions. Rules read the latest per-system status, source statuses,
// and open reports; each alert carries a plain-language message and action.
import { TICKS_BY_SYSTEM } from './seed'
import type { DomainState } from './derive'
import type { Alert, AlertSeverity, AlertType, Community, Warning, WarningType } from '@/data/types'

const now = () => new Date().toISOString()

// One resolved sample so the demo shows both an active and a resolved alert.
const RESOLVED_SAMPLE: Alert = {
  id: 'alert-resolved-mercedes',
  source: 'derived',
  type: 'outage',
  severity: 'warning',
  area: 'Mercedes',
  systemId: '10000000-0000-4000-8000-000000000003',
  raisedAt: '2026-10-05T22:00:00.000Z',
  status: 'resolved',
  reason: 'maintenance',
  message: 'The Mercedes groundwater system was offline for scheduled maintenance.',
  action: 'Service has resumed. No action needed.',
}

function impactNote(highVuln: boolean): string {
  return highVuln ? ' Disrupting water here threatens fishing and farming income.' : ''
}

const OUTAGE_ACTION = 'Deploy emergency water within 6 hours.'
const CONTAMINATION_ACTION = 'Issue a boil-water advisory and dispatch water-quality testing.'
const SHORTAGE_ACTION = 'Ask households to conserve water and store drinking water.'

interface SysAlertInput {
  systemId?: string
  reportId?: string
  area: string
  type: AlertType
  severity: AlertSeverity
  reason: string
  message: string
  action: string
}

function mk(input: SysAlertInput & { id: string }): Alert {
  return { ...input, source: 'derived', raisedAt: now(), status: 'active' }
}

function declining(systemId: string): boolean {
  const ticks = TICKS_BY_SYSTEM[systemId]
  if (!ticks || ticks.length < 3) return false
  const f = ticks.slice(-3).map((t) => t.flow)
  return f[2] < f[1] && f[1] < f[0]
}

/** The single most severe status alert for a system, escalated by vulnerability. */
function systemAlert(domain: DomainState, systemId: string, community: Community): Alert | null {
  const status = domain.statusByPsgc[community.psgcCode]
  const vuln = domain.vulnerabilityByPsgc[community.psgcCode]
  const highVuln = vuln.tier === 'high'
  const area = community.name

  let base: SysAlertInput | null = null
  if (!status.available) {
    base = {
      systemId,
      area,
      type: 'outage',
      severity: 'critical',
      reason: status.reason ?? 'outage',
      message: `No water is flowing in ${area}.`,
      action: OUTAGE_ACTION,
    }
  } else if (status.quality === 'unsafe') {
    base = {
      systemId,
      area,
      type: 'contamination',
      severity: 'critical',
      reason: status.reason ?? 'contamination',
      message: `Water in ${area} is unsafe to drink.`,
      action: CONTAMINATION_ACTION,
    }
  } else if (status.flow < 25) {
    base = {
      systemId,
      area,
      type: 'shortage',
      severity: 'critical',
      reason: status.reason ?? 'shortage',
      message: `Service in ${area} has nearly run dry (${Math.round(status.flow)}% of normal flow).`,
      action: OUTAGE_ACTION,
    }
  } else if (status.flow < 40) {
    base = {
      systemId,
      area,
      type: 'shortage',
      severity: 'warning',
      reason: status.reason ?? 'shortage',
      message: `Service in ${area} is running low (${Math.round(status.flow)}% of normal flow).`,
      action: SHORTAGE_ACTION,
    }
  } else if (status.quality === 'advisory') {
    base = {
      systemId,
      area,
      type: 'contamination',
      severity: 'warning',
      reason: status.reason ?? 'advisory',
      message: `Water quality in ${area} is under advisory.`,
      action: CONTAMINATION_ACTION,
    }
  } else if (declining(systemId) && status.flow < 60) {
    base = {
      systemId,
      area,
      type: 'shortage',
      severity: 'warning',
      reason: 'declining-trend',
      message: `Flow in ${area} has been declining and is now ${Math.round(status.flow)}% of normal.`,
      action: SHORTAGE_ACTION,
    }
  }

  if (!base) return null

  // Elevated impact: outage/contamination (or declining shortage) in a
  // high-vulnerability barangay becomes a priority critical alert.
  if (highVuln && base.severity !== 'critical') {
    base = { ...base, severity: 'critical', message: base.message + impactNote(true) }
  } else if (highVuln) {
    base = { ...base, message: base.message + impactNote(true) }
  }

  return mk({ ...base, id: `alert-${systemId}` })
}

const SOURCE_ALERT: Partial<Record<string, { type: AlertType; severity: AlertSeverity; reason: string; action: string }>> = {
  unsafe: { type: 'contamination', severity: 'warning', reason: 'contamination', action: CONTAMINATION_ACTION },
  empty: { type: 'outage', severity: 'warning', reason: 'offline', action: OUTAGE_ACTION },
  repair: { type: 'outage', severity: 'warning', reason: 'offline', action: OUTAGE_ACTION },
  low: { type: 'shortage', severity: 'info', reason: 'low', action: SHORTAGE_ACTION },
}

const REPORT_ALERT: Partial<Record<string, { type: AlertType; severity: AlertSeverity; reason: string }>> = {
  contamination: { type: 'contamination', severity: 'warning', reason: 'report' },
  no_water: { type: 'outage', severity: 'warning', reason: 'report' },
  infrastructure_damage: { type: 'outage', severity: 'warning', reason: 'report' },
  low_pressure: { type: 'shortage', severity: 'warning', reason: 'report' },
}

export function deriveAlerts(domain: DomainState): Alert[] {
  const alerts: Alert[] = []

  // Per-system status alerts.
  const communityBySystem = new Map(domain.systems.map((s) => [s.id, domain.communities.find((c) => c.systemId === s.id)]))
  for (const system of domain.systems) {
    const community = communityBySystem.get(system.id)
    if (!community) continue
    const alert = systemAlert(domain, system.id, community)
    if (alert) alerts.push(alert)
  }

  // Source status alerts (from water_sources markers, non-station kinds).
  for (const source of domain.sources) {
    if (source.kind === 'station' || source.status === 'ok') continue
    const spec = SOURCE_ALERT[source.status]
    if (!spec) continue
    const area = domain.sourceArea[source.id] ?? 'Unknown barangay'
    alerts.push(
      mk({
        id: `alert-src-${source.id}`,
        systemId: source.systemId || undefined,
        area,
        type: spec.type,
        severity: spec.severity,
        reason: spec.reason,
        message:
          source.status === 'low'
            ? `${source.name} in ${area} is running low.`
            : `${source.name} in ${area} is ${source.status === 'unsafe' ? 'not safe to drink' : 'out of service'}.`,
        action: spec.action,
      }),
    )
  }

  // New community reports raise alerts.
  for (const report of domain.reports) {
    if (report.status !== 'new') continue
    const spec = REPORT_ALERT[report.type]
    if (!spec) continue
    alerts.push(
      mk({
        id: `alert-rpt-${report.id}`,
        reportId: report.id,
        area: report.area,
        type: spec.type,
        severity: spec.severity,
        reason: spec.reason,
        message: `A resident reported ${report.type.replace(/_/g, ' ')} in ${report.area}.`,
        action:
          report.type === 'contamination'
            ? CONTAMINATION_ACTION
            : report.type === 'no_water' || report.type === 'infrastructure_damage'
              ? OUTAGE_ACTION
              : SHORTAGE_ACTION,
      }),
    )
  }

  return alerts
}

const WARNING_TO_ALERT_TYPE: Record<WarningType, AlertType> = {
  outage: 'outage',
  contamination: 'contamination',
  disaster: 'outage',
  maintenance: 'outage',
  advisory: 'contamination',
}

/** Maps a DRRM/LGU-authored warning into alert objects (one per targeted barangay). */
export function warningsToAlerts(warnings: Warning[], communities: Community[]): Alert[] {
  const nameByPsgc = new Map(communities.map((c) => [c.psgcCode, c.name]))
  const alerts: Alert[] = []
  for (const w of warnings) {
    if (w.status !== 'active') continue
    const targets = w.barangayPsgcs.length > 0 ? w.barangayPsgcs : ['citywide']
    for (const psgc of targets) {
      alerts.push({
        id: `warn-${w.id}-${psgc}`,
        source: 'authored',
        warningId: w.id,
        type: WARNING_TO_ALERT_TYPE[w.type],
        severity: w.severity,
        area: psgc === 'citywide' ? 'Catbalogan City' : (nameByPsgc.get(psgc) ?? psgc),
        raisedAt: w.createdAt,
        status: 'active',
        reason: w.type,
        message: w.message || w.title,
        action: w.action,
      })
    }
  }
  return alerts
}

export function allAlerts(domain: DomainState, warnings: Warning[] = []): Alert[] {
  return [...deriveAlerts(domain), ...warningsToAlerts(warnings, domain.communities), RESOLVED_SAMPLE]
}

export function activeAlerts(domain: DomainState, warnings: Warning[] = []): Alert[] {
  return allAlerts(domain, warnings).filter((a) => a.status === 'active')
}

/** Priority order: severity first, then high-vulnerability (underserved) first. */
export function sortAlerts(alerts: Alert[], domain: DomainState): Alert[] {
  const rank: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 }
  const vulnOf = (area: string) => {
    const c = domain.communities.find((x) => x.name === area)
    return c ? domain.vulnerabilityByPsgc[c.psgcCode].tier : 'low'
  }
  const tier: Record<string, number> = { high: 0, medium: 1, low: 2 }
  return [...alerts].sort(
    (a, b) => rank[a.severity] - rank[b.severity] || tier[vulnOf(a.area)] - tier[vulnOf(b.area)] || a.area.localeCompare(b.area),
  )
}
