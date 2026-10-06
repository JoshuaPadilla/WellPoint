import { useMemo, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Gauge,
  HandCoins,
  Sparkles,
  TrendingDown,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDomain } from '@/lib/store'
import { LoadingScreen } from '@/components/LoadingScreen'
import { useWaterStore } from '@/lib/water-store'
import {
  PRIORITY_LABEL,
  CATEGORY_LABEL,
  recommendActions,
  rankBarangays,
} from '@/lib/insights'
import type { Recommendation, RecommendationPriority } from '@/lib/insights'
import type { AccessState, Quality, VulnerabilityTier } from '@/data/types'

export const Route = createFileRoute('/dashboard/insights')({ component: Page })

const card = 'rounded-xl border border-line bg-white p-4'

const ACCESS: Record<
  AccessState,
  { label: string; tone: string; fill: string }
> = {
  served: {
    label: 'Served',
    tone: 'bg-emerald-100 text-emerald-800',
    fill: '#10b981',
  },
  partial: {
    label: 'Partial',
    tone: 'bg-amber-100 text-amber-800',
    fill: '#f59e0b',
  },
  underserved: {
    label: 'Underserved',
    tone: 'bg-red-100 text-red-700',
    fill: '#ef4444',
  },
}
const VULN_TONE: Record<VulnerabilityTier, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-800',
  low: 'bg-emerald-100 text-emerald-800',
}
const QUALITY: Record<Quality, { label: string; tone: string }> = {
  safe: { label: 'Safe', tone: 'bg-emerald-100 text-emerald-800' },
  advisory: { label: 'Advisory', tone: 'bg-amber-100 text-amber-800' },
  unsafe: { label: 'Not safe', tone: 'bg-red-100 text-red-700' },
}
const PRIORITY_TONE: Record<
  RecommendationPriority,
  { badge: string; border: string }
> = {
  critical: { badge: 'bg-red-600 text-white', border: 'border-l-red-600' },
  high: { badge: 'bg-orange-500 text-white', border: 'border-l-orange-500' },
  medium: {
    badge: 'bg-amber-100 text-amber-800',
    border: 'border-l-amber-500',
  },
  low: {
    badge: 'bg-emerald-100 text-emerald-800',
    border: 'border-l-emerald-500',
  },
}

function Page() {
  const { role, loading } = useWaterStore()

  if (role !== 'lgu') {
    return (
      <div>
        <h1 className="text-3xl font-extrabold">Insights</h1>
        <p className="mt-5 rounded-xl border border-dashed border-line p-6 text-sm text-ink/70">
          City-wide analytics and recommended actions are for the LGU.
        </p>
      </div>
    )
  }

  if (loading) return <LoadingScreen label="Crunching the numbers…" />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">Insights</h1>
        <p className="mt-2 max-w-2xl text-ink/70">
          Rule-based analytics and recommended actions, derived live from every
          system, source, and report. Prioritize where to act first.
        </p>
      </div>

      <RecommendedActions />
      <Analytics />
    </div>
  )
}

function RecommendedActions() {
  const domain = useDomain()
  const recs = useMemo(() => recommendActions(domain), [domain])
  const critical = recs.filter((r) => r.priority === 'critical').length
  const high = recs.filter((r) => r.priority === 'high').length

  return (
    <section>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-extrabold">Recommended actions</h2>
        {critical > 0 && (
          <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
            {critical} critical
          </span>
        )}
        {high > 0 && (
          <span className="rounded-full bg-orange-500 px-2 py-0.5 text-xs font-bold text-white">
            {high} high
          </span>
        )}
      </div>
      <ul className="mt-3 space-y-3">
        {recs.map((r) => (
          <RecCard key={r.id} rec={r} />
        ))}
      </ul>
    </section>
  )
}

function RecCard({ rec }: { rec: Recommendation }) {
  const tone = PRIORITY_TONE[rec.priority]
  return (
    <li className={cn(card, 'border-l-4 space-y-2', tone.border)}>
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-xs font-bold',
            tone.badge,
          )}
        >
          {PRIORITY_LABEL[rec.priority]}
        </span>
        <span className="rounded-full bg-mist px-2 py-0.5 text-xs font-semibold text-ink/70">
          {CATEGORY_LABEL[rec.category]}
        </span>
        <p className="font-extrabold">{rec.title}</p>
      </div>
      <p className="text-sm text-ink/70">{rec.detail}</p>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {rec.areas.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {rec.areas.map((a) => (
              <span
                key={a}
                className="rounded-full bg-sky/60 px-2 py-0.5 text-xs font-semibold text-well"
              >
                {a}
              </span>
            ))}
          </div>
        )}
        {rec.action && (
          <Link
            to={rec.action.to}
            className="inline-flex items-center gap-1 rounded-lg bg-well px-3 py-1.5 text-sm font-bold text-white hover:bg-deep"
          >
            {rec.action.label}{' '}
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </Link>
        )}
      </div>
    </li>
  )
}

function Analytics() {
  const domain = useDomain()
  const { metrics, communities, reports, activeAlerts } = domain
  const ranked = useMemo(() => rankBarangays(domain), [domain])
  const [sort, setSort] = useState<'need' | 'name' | 'population'>('need')

  const total = communities.length || 1
  const dist: Record<AccessState, number> = {
    served: 0,
    partial: 0,
    underserved: 0,
  }
  for (const c of communities) dist[domain.accessByPsgc[c.psgcCode]]++
  const highVuln = communities.filter(
    (c) => domain.vulnerabilityByPsgc[c.psgcCode].tier === 'high',
  ).length
  const openReports = reports.filter((r) => r.status !== 'resolved').length

  const rows = [...ranked].sort((a, b) =>
    sort === 'name'
      ? a.community.name.localeCompare(b.community.name)
      : sort === 'population'
        ? b.community.population - a.community.population
        : b.needScore - a.needScore ||
          a.community.name.localeCompare(b.community.name),
  )

  return (
    <>
      <section>
        <h2 className="text-xl font-extrabold">City analytics</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi
            icon={Sparkles}
            label="Water-security score"
            value={`${metrics.score}`}
            sub={`${metrics.band} band`}
            tone="text-well"
          />
          <Kpi
            icon={Users}
            label="Access coverage"
            value={`${metrics.accessCoveragePct}%`}
            sub={`${dist.served + dist.partial} of ${total} barangays covered`}
            tone="text-emerald-600"
          />
          <Kpi
            icon={Gauge}
            label="Reliability"
            value={`${metrics.reliabilityPct}%`}
            sub="population-weighted flow"
            tone="text-aqua"
          />
          <Kpi
            icon={HandCoins}
            label="Affordability"
            value={`${metrics.affordability}`}
            sub="index (0–100)"
            tone="text-amber-600"
          />
          <Kpi
            icon={CheckCircle2}
            label="Active alerts"
            value={`${activeAlerts.length}`}
            sub="live signals"
            tone="text-signal"
          />
          <Kpi
            icon={Users}
            label="Open reports"
            value={`${openReports}`}
            sub="not yet resolved"
            tone="text-orange-600"
          />
          <Kpi
            icon={ArrowRight}
            label="Underserved"
            value={`${dist.underserved}`}
            sub={`${Math.round((dist.underserved / total) * 100)}% of barangays`}
            tone="text-red-600"
          />
          <Kpi
            icon={ArrowRight}
            label="High vulnerability"
            value={`${highVuln}`}
            sub="structurally at risk"
            tone="text-red-600"
          />
        </div>
      </section>

      <section>
        <h2 className="text-xl font-extrabold">Access distribution</h2>
        <div className={cn(card, 'mt-3')}>
          <div
            className="flex h-4 w-full overflow-hidden rounded-full"
            role="img"
            aria-label="Access state distribution"
          >
            {(Object.keys(ACCESS) as AccessState[]).map((s) =>
              dist[s] > 0 ? (
                <div
                  key={s}
                  style={{
                    width: `${(dist[s] / total) * 100}%`,
                    background: ACCESS[s].fill,
                  }}
                />
              ) : null,
            )}
          </div>
          <ul className="mt-3 flex flex-wrap gap-4 text-sm">
            {(Object.keys(ACCESS) as AccessState[]).map((s) => (
              <li key={s} className="flex items-center gap-2">
                <span
                  className="inline-block size-2.5 rounded-full"
                  style={{ background: ACCESS[s].fill }}
                  aria-hidden="true"
                />
                <span className="font-semibold">{ACCESS[s].label}</span>
                <span className="text-ink/60">{dist[s]}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-extrabold">Barangay priority</h2>
          <label className="flex items-center gap-2 text-sm text-ink/70">
            Sort by
            <select
              className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-sm"
              value={sort}
              onChange={(e) =>
                setSort(e.target.value as 'need' | 'name' | 'population')
              }
              aria-label="Sort barangays by"
            >
              <option value="need">Priority (need score)</option>
              <option value="name">Name</option>
              <option value="population">Population</option>
            </select>
          </label>
        </div>
        <div className={cn(card, 'mt-3 space-y-3 md:hidden')}>
          {rows.map((r, i) => (
            <div
              key={r.community.psgcCode}
              className={cn(
                'space-y-2.5 rounded-xl border border-line bg-white p-3.5',
                i === 0 && r.needScore > 0 && 'border-red-200 bg-red-50/60',
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="flex items-center gap-1.5 font-extrabold">
                  {r.community.name}
                  {r.declining && (
                    <TrendingDown
                      className="size-3.5 shrink-0 text-amber-600"
                      aria-label="Declining flow"
                    />
                  )}
                </p>
                <span className="rounded-full bg-ink px-2 py-0.5 text-xs font-extrabold text-white">
                  {r.needScore}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-bold',
                    ACCESS[r.accessState].tone,
                  )}
                >
                  {ACCESS[r.accessState].label}
                </span>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-bold',
                    VULN_TONE[r.vulnerabilityTier],
                  )}
                >
                  {r.vulnerabilityTier}
                </span>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-bold',
                    QUALITY[r.quality].tone,
                  )}
                >
                  {QUALITY[r.quality].label}
                </span>
              </div>
              <dl className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-mist px-2 py-1.5">
                  <dt className="text-ink/60">Flow</dt>
                  <dd className="font-semibold">{Math.round(r.flow)}%</dd>
                </div>
                <div className="rounded-lg bg-mist px-2 py-1.5">
                  <dt className="text-ink/60">Affordability</dt>
                  <dd className="font-semibold">{r.affordability}</dd>
                </div>
                <div className="rounded-lg bg-mist px-2 py-1.5">
                  <dt className="text-ink/60">Population</dt>
                  <dd className="font-semibold">
                    {r.community.population.toLocaleString()}
                  </dd>
                </div>
                <div className="rounded-lg bg-mist px-2 py-1.5">
                  <dt className="text-ink/60">Open reports</dt>
                  <dd className="font-semibold">{r.openReports}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
        <div className={cn(card, 'mt-3 hidden p-0 md:block')}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink/60">
                <th className="px-3 py-2.5 font-bold">Barangay</th>
                <th className="px-3 py-2.5 font-bold">Access</th>
                <th className="px-3 py-2.5 font-bold">Vulnerability</th>
                <th className="px-3 py-2.5 font-bold">Flow</th>
                <th className="px-3 py-2.5 font-bold">Quality</th>
                <th className="px-3 py-2.5 font-bold">Affordability</th>
                <th className="px-3 py-2.5 text-right font-bold">Population</th>
                <th className="px-3 py-2.5 text-right font-bold">
                  Open reports
                </th>
                <th className="px-3 py-2.5 font-bold">Need</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={r.community.psgcCode}
                  className={cn(
                    'border-b border-line/60 last:border-0',
                    i === 0 && r.needScore > 0 && 'bg-red-50/60',
                  )}
                >
                  <td className="px-3 py-2 font-semibold">
                    <div className="flex items-center gap-1.5">
                      {r.community.name}
                      {r.declining && (
                        <TrendingDown
                          className="size-3.5 shrink-0 text-amber-600"
                          aria-label="Declining flow"
                        />
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-bold',
                        ACCESS[r.accessState].tone,
                      )}
                    >
                      {ACCESS[r.accessState].label}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-bold',
                        VULN_TONE[r.vulnerabilityTier],
                      )}
                    >
                      {r.vulnerabilityTier}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-semibold">
                    {Math.round(r.flow)}%
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-bold',
                        QUALITY[r.quality].tone,
                      )}
                    >
                      {QUALITY[r.quality].label}
                    </span>
                  </td>
                  <td className="px-3 py-2">{r.affordability}</td>
                  <td className="px-3 py-2 text-right">
                    {r.community.population.toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-right">{r.openReports}</td>
                  <td className="px-3 py-2 font-extrabold">{r.needScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}

function Kpi({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: LucideIcon
  label: string
  value: string
  sub: string
  tone: string
}) {
  return (
    <div className={cn(card, 'flex items-center gap-3 py-3')}>
      <span
        className={cn(
          'grid size-10 shrink-0 place-items-center rounded-full bg-mist',
          tone,
        )}
      >
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink/60">
          {label}
        </p>
        <p className="text-2xl font-extrabold leading-tight">{value}</p>
        <p className="truncate text-xs text-ink/60">{sub}</p>
      </div>
    </div>
  )
}
