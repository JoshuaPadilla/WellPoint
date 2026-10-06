import { cn } from '@/lib/utils'
import { KINDS, STATUSES } from '@/lib/water-store'
import type { Asset, AssetKind, Status } from '@/lib/water-store'

const KIND_ORDER: AssetKind[] = ['pump', 'well', 'reservoir', 'station']
const STATUS_ORDER: Status[] = ['ok', 'low', 'empty', 'repair', 'unsafe']
// Bar colours per status (same family as the map pins).
const BAR: Record<Status, string> = {
  ok: 'bg-well',
  low: 'bg-amber-500',
  empty: 'bg-red-600',
  repair: 'bg-slate-500',
  unsafe: 'bg-purple-600',
}

// How full a barangay's supply is, 0..1: working sources count fully, low ones half,
// empty / under repair / unsafe not at all. Filling stations don't count. null = no sources.
export function supplyLevel(list: Asset[]): number | null {
  const supply = list.filter((a) => a.kind !== 'station')
  if (supply.length === 0) return null
  return supply.reduce((n, a) => n + (a.status === 'ok' ? 1 : a.status === 'low' ? 0.5 : 0), 0) / supply.length
}

// One-line verdict for the barangay, based on its water sources (filling stations don't count).
export function overall(list: Asset[]): { label: string; tone: string } {
  const supply = list.filter((a) => a.kind !== 'station')
  if (supply.length === 0) return { label: 'No water sources recorded', tone: 'bg-mist text-ink/70' }
  const working = supply.filter((a) => a.status === 'ok').length
  const dry = supply.filter((a) => a.status === 'empty').length
  if (working === supply.length) return { label: 'Normal supply', tone: 'bg-sky text-well' }
  if (dry === supply.length) return { label: 'No water', tone: 'bg-red-100 text-red-700' }
  if (working === 0) return { label: 'Supply problems', tone: 'bg-red-100 text-red-700' }
  return { label: 'Partial supply', tone: 'bg-amber-100 text-amber-800' }
}

type Props = {
  name: string
  sources: Asset[]
  /** Open reports in this barangay, or null when the viewer isn't allowed to see reports. */
  openReports: number | null
  className?: string
}

export function BarangayStats({ name, sources, openReports, className }: Props) {
  const verdict = overall(sources)
  const byStatus = STATUS_ORDER.map((s) => ({ s, n: sources.filter((a) => a.status === s).length })).filter((x) => x.n > 0)
  const byKind = KIND_ORDER.map((k) => ({ k, n: sources.filter((a) => a.kind === k).length })).filter((x) => x.n > 0)

  return (
    <div className={cn('space-y-2 text-sm', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-extrabold">{name}</p>
        <span className={cn('rounded-full px-2 py-0.5 text-xs font-bold', verdict.tone)}>{verdict.label}</span>
      </div>

      {sources.length > 0 && (
        <>
          {/* Share of sources in each status */}
          <div className="flex h-2 overflow-hidden rounded-full bg-mist" aria-hidden="true">
            {byStatus.map(({ s, n }) => (
              <span key={s} className={BAR[s]} style={{ width: `${(n / sources.length) * 100}%` }} />
            ))}
          </div>
          <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
            {byStatus.map(({ s, n }) => (
              <li key={s} className="flex items-center gap-1">
                <span className={cn('size-2 rounded-full', BAR[s])} aria-hidden="true" />
                {n} {STATUSES[s].label.toLowerCase()}
              </li>
            ))}
          </ul>
          <p className="text-xs text-ink/70">
            {sources.length} source{sources.length === 1 ? '' : 's'}: {byKind.map(({ k, n }) => `${n} ${KINDS[k].toLowerCase()}${n === 1 ? '' : 's'}`).join(', ')}
          </p>
        </>
      )}

      {openReports !== null && (
        <p className="text-xs font-semibold">
          {openReports === 0 ? 'No open reports' : `${openReports} open report${openReports === 1 ? '' : 's'}`}
        </p>
      )}
    </div>
  )
}
