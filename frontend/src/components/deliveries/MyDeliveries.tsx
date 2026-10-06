import { useState } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { DELIVERY_STATUSES, peso, updateDelivery, when } from '@/lib/deliveries'
import type { Delivery, DeliveryStatus } from '@/lib/deliveries'

// The four stages a paid delivery goes through, in order.
const STEPS: { status: DeliveryStatus; label: string }[] = [
  { status: 'paid', label: 'Paid' },
  { status: 'scheduled', label: 'Scheduled' },
  { status: 'on_the_way', label: 'On the way' },
  { status: 'delivered', label: 'Delivered' },
]

// Residents: their own requests (the database only returns those), newest first.
export function MyDeliveries({ deliveries, loading, error }: { deliveries: Delivery[]; loading: boolean; error: string }) {
  return (
    <section aria-labelledby="mine-heading">
      <h2 id="mine-heading" className="text-xl font-extrabold">My deliveries</h2>
      {error && <p role="alert" className="mt-3 text-sm text-orange-700">{error}</p>}
      {loading ? (
        <p className="mt-3 text-sm text-ink/60">Loading your deliveries…</p>
      ) : deliveries.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-line p-6 text-sm text-ink/70">
          No delivery requests yet. Fill in the form above to get water brought to you.
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {deliveries.map((d) => (
            <MyDelivery key={d.id} d={d} />
          ))}
        </ul>
      )}
    </section>
  )
}

function MyDelivery({ d }: { d: Delivery }) {
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')
  const reached = STEPS.findIndex((s) => s.status === d.status)
  const tracking = d.status !== 'pending_payment' && d.status !== 'cancelled'

  const cancel = async () => {
    if (!window.confirm('Cancel this delivery request? You have not been charged.')) return
    setBusy(true)
    setActionError('')
    try {
      await updateDelivery(d.id, { status: 'cancelled' })
    } catch (e) {
      setActionError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <li className="rounded-xl border border-line bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-extrabold">
            {d.containers} container{d.containers === 1 ? '' : 's'} ({d.containers * 20} litres)
          </p>
          <p className="text-sm text-ink/70">
            {d.address}, Brgy. {d.barangay}
          </p>
        </div>
        <span className={cn('rounded-full px-2 py-0.5 text-xs font-bold', DELIVERY_STATUSES[d.status].badge)}>
          {DELIVERY_STATUSES[d.status].label}
        </span>
      </div>

      {tracking && (
        <ol className="mt-4 grid grid-cols-4 gap-1" aria-label="Delivery progress">
          {STEPS.map((s, i) => {
            const done = i <= reached
            return (
              <li key={s.status} className="flex flex-col items-center gap-1 text-center text-xs">
                <span
                  className={cn(
                    'grid size-6 place-items-center rounded-full border-2',
                    done ? 'border-well bg-well text-white' : 'border-line bg-white text-ink/40',
                  )}
                  aria-hidden="true"
                >
                  {done ? <Check className="size-3.5" /> : i + 1}
                </span>
                <span className={done ? 'font-semibold' : 'text-ink/60'}>{s.label}</span>
                <span className="sr-only">{done ? 'done' : 'not yet'}</span>
              </li>
            )
          })}
        </ol>
      )}

      <div className="mt-3 space-y-1 text-sm">
        {d.status === 'scheduled' && d.scheduledFor && <p>Expected <strong>{when(d.scheduledFor)}</strong></p>}
        {d.status === 'delivered' && d.deliveredAt && <p className="text-emerald-800">Delivered {when(d.deliveredAt)}</p>}
        {d.status === 'cancelled' && (
          <p className="text-ink/70">
            Cancelled{d.cancelledAt ? ` ${when(d.cancelledAt)}` : ''}.
            {d.paidAt && ' If you paid, contact the LGU about your refund.'}
          </p>
        )}
        {d.staffNote && <p className="text-ink/80">Message from the team: {d.staffNote}</p>}
        <p className="text-xs text-ink/60">
          Requested {when(d.createdAt)}
          {d.paidAt ? `, paid ${peso(d.fee)} on ${when(d.paidAt)}` : ''}
        </p>
      </div>

      {d.status === 'pending_payment' && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {d.checkoutUrl && (
            <Button size="sm" onClick={() => window.location.assign(d.checkoutUrl!)} disabled={busy}>
              Pay {peso(d.fee)}
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={cancel} disabled={busy}>
            Cancel request
          </Button>
          <p className="text-xs text-ink/60">If the payment page has expired, cancel this and request again.</p>
        </div>
      )}
      {actionError && <p role="alert" className="mt-2 text-sm text-orange-700">{actionError}</p>}
    </li>
  )
}
