import { useMemo, useState } from 'react'
import { MapPin, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useBarangays } from '@/lib/barangays'
import { directionsUrl } from '@/lib/geo'
import { useWaterStore } from '@/lib/water-store'
import type { Asset } from '@/lib/water-store'
import { overall, supplyLevel } from '@/components/BarangayStats'
import { DELIVERY_STATUSES, peso, updateDelivery, when } from '@/lib/deliveries'
import type { Delivery, DeliveryUpdate } from '@/lib/deliveries'

type Tab = 'paid' | 'scheduled' | 'on_the_way' | 'done'
const TABS: { id: Tab; label: string }[] = [
  { id: 'paid', label: 'To schedule' },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'on_the_way', label: 'On the way' },
  { id: 'done', label: 'Done' },
]

const inTab = (d: Delivery, t: Tab) => (t === 'done' ? d.status === 'delivered' || d.status === 'cancelled' : d.status === t)
const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase()

// "2026-10-06T15:00" for a datetime-local input, in the browser's own time zone.
function localInput(t: number) {
  const d = new Date(t - new Date(t).getTimezoneOffset() * 60_000)
  return d.toISOString().slice(0, 16)
}
const nextHour = () => {
  const d = new Date()
  d.setHours(d.getHours() + 1, 0, 0, 0)
  return d.getTime()
}

type Props = { deliveries: Delivery[]; loading: boolean; error: string; readOnly?: boolean; title: string; blurb: string }

// DRRM/LGU: paid requests, barangays with the least water first, then the longest-waiting.
// Barangay officials get the same list for their barangay, without the buttons.
export function DeliveryQueue({ deliveries, loading, error, readOnly = false, title, blurb }: Props) {
  const [tab, setTab] = useState<Tab>('paid')
  const { assets } = useWaterStore()
  const { barangayOf } = useBarangays()

  // Supply level per barangay, from the water sources on the map.
  const sourcesBy = useMemo(() => {
    const m = new Map<string, Asset[]>()
    for (const a of assets) {
      const name = barangayOf(a)
      if (name) m.set(name.toLowerCase(), [...(m.get(name.toLowerCase()) ?? []), a])
    }
    return m
  }, [assets, barangayOf])
  const sourcesOf = (d: Delivery) => sourcesBy.get(d.barangay.trim().toLowerCase()) ?? []

  const visible = deliveries.filter((d) => d.status !== 'pending_payment') // unpaid requests aren't work yet
  const shown = visible
    .filter((d) => inTab(d, tab))
    .sort((a, b) => {
      if (tab === 'done') return (b.deliveredAt ?? b.cancelledAt ?? 0) - (a.deliveredAt ?? a.cancelledAt ?? 0)
      if (tab === 'scheduled') return (a.scheduledFor ?? 0) - (b.scheduledFor ?? 0)
      const need = (d: Delivery) => supplyLevel(sourcesOf(d)) ?? 0.5 // no sources recorded: middle priority
      return need(a) - need(b) || (a.paidAt ?? a.createdAt) - (b.paidAt ?? b.createdAt)
    })

  return (
    <section aria-labelledby="queue-heading">
      <h2 id="queue-heading" className="text-xl font-extrabold">{title}</h2>
      <p className="mt-1 max-w-xl text-ink/70">{blurb}</p>

      <div role="group" aria-label="Delivery stage" className="mt-4 flex flex-wrap gap-1 rounded-xl bg-sky p-1 text-sm font-bold">
        {TABS.map((t) => {
          const n = visible.filter((d) => inTab(d, t.id)).length
          return (
            <button
              key={t.id}
              type="button"
              aria-pressed={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn('rounded-lg px-3 py-1.5', tab === t.id ? 'bg-white text-ink shadow' : 'text-ink/70')}
            >
              {t.label}
              {t.id !== 'done' && n > 0 && ` (${n})`}
            </button>
          )
        })}
      </div>

      {error && <p role="alert" className="mt-3 text-sm text-orange-700">{error}</p>}
      {loading ? (
        <p className="mt-4 text-sm text-ink/60">Loading deliveries…</p>
      ) : shown.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-line p-6 text-sm text-ink/70">
          {tab === 'paid' ? 'No paid requests waiting. New ones appear here as soon as residents pay.' : 'Nothing here right now.'}
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {shown.map((d) => (
            <QueueItem key={d.id} d={d} sources={sourcesOf(d)} readOnly={readOnly} />
          ))}
        </ul>
      )}
    </section>
  )
}

function QueueItem({ d, sources, readOnly }: { d: Delivery; sources: Asset[]; readOnly: boolean }) {
  const [scheduling, setScheduling] = useState(d.status === 'paid')
  const [at, setAt] = useState(localInput(d.scheduledFor ?? nextHour()))
  const [message, setMessage] = useState(d.staffNote)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')
  const verdict = overall(sources)
  const open = d.status !== 'delivered' && d.status !== 'cancelled'

  const run = async (change: DeliveryUpdate, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return
    setBusy(true)
    setActionError('')
    try {
      await updateDelivery(d.id, change)
      setScheduling(false)
    } catch (e) {
      setActionError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const cancelText = d.paidAt
    ? `Cancel this paid delivery? Refund the ${peso(d.fee)} to the resident from your PayMongo dashboard.`
    : 'Cancel this delivery?'

  return (
    <li className="rounded-xl border border-line bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-extrabold">
            {d.requesterName}: {d.containers} container{d.containers === 1 ? '' : 's'} ({d.containers * 20} L)
          </p>
          <p className="text-sm text-ink/70">
            {d.address}, Brgy. {d.barangay}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {open && <span className={cn('rounded-full px-2 py-0.5 text-xs font-bold', verdict.tone)}>{verdict.label}</span>}
          <span className={cn('rounded-full px-2 py-0.5 text-xs font-bold', DELIVERY_STATUSES[d.status].badge)}>
            {DELIVERY_STATUSES[d.status].label}
          </span>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
        <a href={`tel:${d.contactNumber}`} className="flex items-center gap-1 font-semibold text-well underline">
          <Phone className="size-4" aria-hidden="true" /> {d.contactNumber}
        </a>
        {d.lat !== null && d.lng !== null && (
          <a
            href={directionsUrl({ lat: d.lat, lng: d.lng })}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 font-semibold text-well underline"
          >
            <MapPin className="size-4" aria-hidden="true" /> Directions
          </a>
        )}
      </div>
      {d.note && <p className="mt-2 text-sm">Resident's note: {d.note}</p>}

      <p className="mt-2 text-xs text-ink/60">
        {d.paidAt ? `Paid ${peso(d.fee)} on ${when(d.paidAt)}` : `Requested ${when(d.createdAt)}`}
        {d.scheduledFor && d.status !== 'paid' ? `. Scheduled for ${when(d.scheduledFor)}` : ''}
        {d.deliveredAt ? `. Delivered ${when(d.deliveredAt)}` : ''}
        {d.cancelledAt ? `. Cancelled ${when(d.cancelledAt)}` : ''}
      </p>
      {d.staffNote && !scheduling && <p className="mt-1 text-sm text-ink/80">Message to resident: {d.staffNote}</p>}

      {!readOnly && open && (
        <div className="mt-3 border-t border-line pt-3">
          {scheduling && (d.status === 'paid' || d.status === 'scheduled') ? (
            <div className="flex flex-wrap items-end gap-3">
              <label className="text-sm font-semibold">
                Delivery time
                <input
                  type="datetime-local"
                  value={at}
                  onChange={(e) => setAt(e.target.value)}
                  className="mt-1 block rounded-lg border border-line bg-white px-3 py-2 font-normal"
                />
              </label>
              <label className="min-w-48 flex-1 text-sm font-semibold">
                Message to resident (optional)
                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={300}
                  placeholder="e.g. Please prepare your containers"
                  className="mt-1 block w-full rounded-lg border border-line bg-white px-3 py-2 font-normal"
                />
              </label>
              <Button
                size="sm"
                disabled={busy || !at}
                onClick={() => run({ status: 'scheduled', scheduledFor: new Date(at).getTime(), staffNote: message })}
              >
                {d.status === 'scheduled' ? 'Save new time' : 'Schedule'}
              </Button>
              {d.status === 'scheduled' && (
                <Button size="sm" variant="outline" disabled={busy} onClick={() => setScheduling(false)}>
                  Keep current time
                </Button>
              )}
            </div>
          ) : null}

          <div className={cn('flex flex-wrap gap-2', scheduling && (d.status === 'paid' || d.status === 'scheduled') && 'mt-3')}>
            {d.status === 'scheduled' && !scheduling && (
              <Button size="sm" variant="outline" disabled={busy} onClick={() => setScheduling(true)}>
                Change time
              </Button>
            )}
            {(d.status === 'paid' || d.status === 'scheduled') && (
              <Button size="sm" variant={d.status === 'scheduled' ? 'default' : 'outline'} disabled={busy} onClick={() => run({ status: 'on_the_way' })}>
                Mark on the way
              </Button>
            )}
            {d.status === 'on_the_way' && (
              <Button size="sm" disabled={busy} onClick={() => run({ status: 'delivered' })}>
                Mark delivered
              </Button>
            )}
            <Button size="sm" variant="outline" disabled={busy} onClick={() => run({ status: 'cancelled' }, cancelText)}>
              Cancel
            </Button>
          </div>
          {actionError && <p role="alert" className="mt-2 text-sm text-orange-700">{actionError}</p>}
        </div>
      )}
    </li>
  )
}

// Officials: only deliveries in their own barangay (the database already filters; this keeps the label honest).
export function forBarangay(list: Delivery[], barangay: string) {
  return barangay ? list.filter((d) => same(d.barangay, barangay)) : list
}
