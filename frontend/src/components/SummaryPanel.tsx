import { AlertTriangle, CheckCircle2, Gauge, HandCoins, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDomain } from '@/lib/store'
import type { Metrics } from '@/data/types'

const card = 'rounded-xl border border-line bg-white p-4'

const BAND: Record<Metrics['band'], { badge: string; bar: string; label: string }> = {
  Secure: { badge: 'bg-emerald-100 text-emerald-800', bar: 'bg-emerald-500', label: 'Secure' },
  Watch: { badge: 'bg-amber-100 text-amber-800', bar: 'bg-amber-500', label: 'Watch' },
  Critical: { badge: 'bg-red-100 text-red-700', bar: 'bg-red-600', label: 'Critical' },
}

export function SummaryPanel() {
  const domain = useDomain()
  const { metrics } = domain
  const band = BAND[metrics.band]

  let critical = 0
  let warning = 0
  let info = 0
  for (const a of domain.activeAlerts) {
    if (a.severity === 'critical') critical++
    else if (a.severity === 'warning') warning++
    else info++
  }
  const penalty = Math.min(30, 10 * critical + 4 * warning + 1 * info)

  return (
    <div className="space-y-3">
      <div className={cn(card, 'flex items-center gap-4 border-l-4 border-l-current', band.bar)}>
        <div className={cn('grid size-12 shrink-0 place-items-center rounded-full text-white', band.bar)}>
          {metrics.band === 'Critical' ? <AlertTriangle className="size-6" /> : <CheckCircle2 className="size-6" />}
        </div>
        <div className="min-w-0">
          <p className="text-lg font-extrabold">
            Catbalogan City is at <span className={cn('rounded-full px-2 py-0.5', band.badge)}>{band.label}</span>
          </p>
          <p className="text-sm text-ink/70">
            Water-security score {metrics.score}/100 · {metrics.activeAlerts} active alert(s).
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Kpi icon={Users} label="Access coverage" value={`${metrics.accessCoveragePct}%`} sub="population with full or partial access" tone="text-well" />
        <Kpi icon={Gauge} label="Reliability" value={`${metrics.reliabilityPct}%`} sub="population-weighted mean flow" tone="text-aqua" />
        <Kpi icon={AlertTriangle} label="Active alerts" value={`${metrics.activeAlerts}`} sub="derived from live signals" tone="text-signal" />
        <Kpi icon={HandCoins} label="Affordability" value={`${metrics.affordability}`} sub="index (0–100)" tone="text-emerald-600" />
      </div>

      <details className={cn(card)}>
        <summary className="cursor-pointer text-sm font-bold">Why is the score {metrics.score}?</summary>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <Breakdown label="Access coverage" weight="0.4" value={metrics.accessCoveragePct} />
          <Breakdown label="Reliability" weight="0.3" value={metrics.reliabilityPct} />
          <Breakdown label="Affordability" weight="0.3" value={metrics.affordability} />
          <div className="flex items-center justify-between rounded-lg bg-mist px-3 py-2">
            <dt className="text-ink/70">Alert penalty</dt>
            <dd className="font-bold text-red-600">−{penalty}</dd>
          </div>
        </dl>
      </details>
    </div>
  )
}

function Kpi({ icon: Icon, label, value, sub, tone }: { icon: LucideIcon; label: string; value: string; sub: string; tone: string }) {
  return (
    <div className={cn(card, 'flex items-center gap-3 py-3')}>
      <span className={cn('grid size-10 shrink-0 place-items-center rounded-full bg-mist', tone)}>
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink/60">{label}</p>
        <p className="text-2xl font-extrabold leading-tight">{value}</p>
        <p className="truncate text-xs text-ink/60">{sub}</p>
      </div>
    </div>
  )
}

function Breakdown({ label, weight, value }: { label: string; weight: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-mist px-3 py-2">
      <dt className="text-ink/70">{label} ({weight}×)</dt>
      <dd className="font-bold">{Math.round(parseFloat(weight) * value * 10) / 10}</dd>
    </div>
  )
}
