import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { CheckCircle2, Clock, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getUser } from '@/lib/auth'
import { useWaterStore } from '@/lib/water-store'
import { useDeliveries, verifyDeliveryPayment } from '@/lib/deliveries'
import { RequestDelivery } from '@/components/deliveries/RequestDelivery'
import { MyDeliveries } from '@/components/deliveries/MyDeliveries'
import { DeliveryQueue, forBarangay } from '@/components/deliveries/DeliveryQueue'
import { NearbyStations } from '@/components/deliveries/NearbyStations'

export const Route = createFileRoute('/dashboard/deliveries')({ component: Page })

function Page() {
  const { role } = useWaterStore()
  const { deliveries, loading, error } = useDeliveries()
  const myBarangay = typeof window === 'undefined' ? '' : (getUser()?.barangay ?? '')

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-extrabold">Deliveries</h1>
        <p className="mt-2 max-w-xl text-ink/70">
          {role === 'citizen' && 'Get water brought to your home, and follow your requests.'}
          {(role === 'lgu' || role === 'drrm') && 'Paid delivery requests from residents, and the filling stations.'}
          {role === 'official' && 'Water deliveries to your barangay, and the filling stations.'}
        </p>
      </div>

      <PaymentReturn />

      {role === 'citizen' && (
        <>
          <NearbyStations />
          <RequestDelivery />
          <MyDeliveries deliveries={deliveries} loading={loading} error={error} />
        </>
      )}
      {(role === 'lgu' || role === 'drrm') && (
        <DeliveryQueue
          deliveries={deliveries}
          loading={loading}
          error={error}
          title="Delivery queue"
          blurb="Barangays with the least water come first, then whoever has waited longest."
        />
      )}
      {role === 'official' && (
        <DeliveryQueue
          deliveries={forBarangay(deliveries, myBarangay)}
          loading={loading}
          error={error}
          readOnly
          title={`Deliveries in Brgy. ${myBarangay || '—'}`}
          blurb="DRRM and the LGU schedule these. You can follow them here."
        />
      )}

      {role !== 'citizen' && <NearbyStations />}
    </div>
  )
}

type ReturnState =
  | { kind: 'none' }
  | { kind: 'checking' }
  | { kind: 'paid' }
  | { kind: 'waiting'; id: string }
  | { kind: 'cancelled' }
  | { kind: 'error'; message: string; id: string }

// PayMongo sends residents back with ?paid=<id> or ?cancelled=<id>. For "paid" we ask the server
// to confirm with PayMongo (the webhook may not have arrived yet) before saying it went through.
function PaymentReturn() {
  const [state, setState] = useState<ReturnState>({ kind: 'none' })

  const check = async (id: string, attempt = 1) => {
    setState({ kind: 'checking' })
    try {
      const status = await verifyDeliveryPayment(id)
      if (status === 'pending_payment') {
        if (attempt < 4) setTimeout(() => void check(id, attempt + 1), 2500) // give PayMongo a moment
        else setState({ kind: 'waiting', id })
      } else setState({ kind: 'paid' })
    } catch (e) {
      setState({ kind: 'error', message: (e as Error).message, id })
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const paid = params.get('paid')
    const cancelled = params.get('cancelled')
    if (!paid && !cancelled) return
    window.history.replaceState(null, '', window.location.pathname) // a refresh shouldn't repeat this
    if (paid) void check(paid)
    else setState({ kind: 'cancelled' })
  }, [])

  if (state.kind === 'none') return null
  const box = 'flex flex-wrap items-start gap-3 rounded-xl border px-4 py-3 text-sm'

  if (state.kind === 'checking')
    return (
      <p role="status" className={`${box} border-line bg-white`}>
        <Clock className="size-5 text-well" aria-hidden="true" /> Confirming your payment with PayMongo…
      </p>
    )
  if (state.kind === 'paid')
    return (
      <div role="status" className={`${box} border-emerald-200 bg-emerald-50 text-emerald-900`}>
        <CheckCircle2 className="size-5" aria-hidden="true" />
        <p>
          <strong>Payment received.</strong> Your delivery request is in the queue. You'll see it move to Scheduled
          below once DRRM picks a time.
        </p>
      </div>
    )
  if (state.kind === 'cancelled')
    return (
      <div role="status" className={`${box} border-line bg-white`}>
        <XCircle className="size-5 text-ink/60" aria-hidden="true" />
        <p>
          Payment cancelled and you weren't charged. Your request is saved under My deliveries: pay for it there or cancel
          it.
        </p>
      </div>
    )
  return (
    <div role="alert" className={`${box} border-orange-200 bg-orange-50 text-orange-900`}>
      <Clock className="size-5" aria-hidden="true" />
      <p className="flex-1">
        {state.kind === 'waiting'
          ? "PayMongo hasn't confirmed your payment yet. If you completed it, it will show as Paid within a few minutes."
          : `Couldn't confirm your payment: ${state.message}`}
      </p>
      <Button size="sm" variant="outline" onClick={() => void check(state.id)}>
        Check again
      </Button>
    </div>
  )
}
