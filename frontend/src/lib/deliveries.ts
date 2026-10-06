import { useCallback, useEffect, useState } from 'react'
import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from './supabase'

// Water deliveries (table public.deliveries, see supabase-deliveries.sql).
// Requests are created and paid through the "delivery-checkout" edge function (PayMongo);
// the browser never sets the fee or marks anything paid.

export const DELIVERY_FEE = 20 // pesos — display only, the server sets the real amount
export const MAX_CONTAINERS = 10

export type DeliveryStatus = 'pending_payment' | 'paid' | 'scheduled' | 'on_the_way' | 'delivered' | 'cancelled'

export const DELIVERY_STATUSES: Record<DeliveryStatus, { label: string; badge: string }> = {
  pending_payment: { label: 'Waiting for payment', badge: 'bg-slate-200 text-slate-700' },
  paid: { label: 'Paid, waiting to be scheduled', badge: 'bg-sky text-well' },
  scheduled: { label: 'Scheduled', badge: 'bg-indigo-100 text-indigo-800' },
  on_the_way: { label: 'On the way', badge: 'bg-amber-100 text-amber-800' },
  delivered: { label: 'Delivered', badge: 'bg-emerald-100 text-emerald-800' },
  cancelled: { label: 'Cancelled', badge: 'bg-red-100 text-red-700' },
}

export type Delivery = {
  id: string
  requestedBy: string
  requesterName: string
  contactNumber: string
  barangay: string
  address: string
  lat: number | null
  lng: number | null
  containers: number
  note: string
  fee: number
  status: DeliveryStatus
  checkoutUrl: string | null
  paidAt: number | null
  scheduledFor: number | null
  staffNote: string
  deliveredAt: number | null
  cancelledAt: number | null
  createdAt: number
}

type Row = {
  id: string
  requested_by: string
  requester_name: string
  contact_number: string
  barangay: string
  address: string
  lat: number | null
  lng: number | null
  containers: number
  note: string
  fee: number | string
  status: DeliveryStatus
  checkout_url: string | null
  paid_at: string | null
  scheduled_for: string | null
  staff_note: string
  delivered_at: string | null
  cancelled_at: string | null
  created_at: string
}

const COLUMNS =
  'id, requested_by, requester_name, contact_number, barangay, address, lat, lng, containers, note, fee, status, checkout_url, paid_at, scheduled_for, staff_note, delivered_at, cancelled_at, created_at'

const time = (v: string | null) => (v ? new Date(v).getTime() : null)

const toDelivery = (r: Row): Delivery => ({
  id: r.id,
  requestedBy: r.requested_by,
  requesterName: r.requester_name,
  contactNumber: r.contact_number,
  barangay: r.barangay,
  address: r.address,
  lat: r.lat,
  lng: r.lng,
  containers: r.containers,
  note: r.note,
  fee: Number(r.fee),
  status: r.status,
  checkoutUrl: r.checkout_url,
  paidAt: time(r.paid_at),
  scheduledFor: time(r.scheduled_for),
  staffNote: r.staff_note,
  deliveredAt: time(r.delivered_at),
  cancelledAt: time(r.cancelled_at),
  createdAt: new Date(r.created_at).getTime(),
})

function friendly(message: string) {
  if (/relation .*deliveries.* does not exist|could not find the table/i.test(message))
    return 'The deliveries table is missing. Run supabase-deliveries.sql in Supabase.'
  if (/row-level security|permission denied/i.test(message)) return "You're not allowed to change this delivery."
  return message
}

// Every delivery this person may see (the database filters by role), newest first, kept live.
export function useDeliveries() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    try {
      const { data, error: e } = await supabase().from('deliveries').select(COLUMNS).order('created_at', { ascending: false })
      if (e) throw new Error(e.message)
      setDeliveries((data as Row[]).map(toDelivery))
      setError('')
    } catch (e) {
      setError(friendly((e as Error).message))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
    let channel: ReturnType<ReturnType<typeof supabase>['channel']> | null = null
    try {
      let timer: ReturnType<typeof setTimeout> | undefined
      channel = supabase()
        .channel(`deliveries-${Math.random().toString(36).slice(2)}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'deliveries' }, () => {
          clearTimeout(timer)
          timer = setTimeout(() => void reload(), 300)
        })
        .subscribe()
    } catch {
      /* Supabase not configured; reload already reported it */
    }
    return () => {
      if (channel) void supabase().removeChannel(channel)
    }
  }, [reload])

  return { deliveries, loading, error, reload }
}

// Calls the delivery-checkout edge function and turns any failure into a readable message.
async function callCheckout<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase().functions.invoke('delivery-checkout', { body })
  if (error) {
    let message = error.message
    if (error instanceof FunctionsHttpError) {
      const payload = await error.context.json().catch(() => null)
      if (payload?.error) message = payload.error
    }
    if (/Failed to send a request|Failed to fetch|NetworkError/i.test(message)) {
      message = "Can't reach the payment service. Check your connection, and that the delivery-checkout function is deployed."
    }
    throw new Error(message)
  }
  return data as T
}

export type DeliveryRequest = {
  barangay: string
  address: string
  contactNumber: string
  containers: number
  note: string
  lat: number | null
  lng: number | null
}

// Creates the request and returns the PayMongo checkout page to send the resident to.
export async function startDeliveryCheckout(request: DeliveryRequest): Promise<string> {
  const data = await callCheckout<{ checkoutUrl?: string }>({ action: 'create', ...request })
  if (!data?.checkoutUrl) throw new Error('PayMongo did not return a checkout page. Please try again.')
  return data.checkoutUrl
}

// Asks the server to confirm payment with PayMongo (used when the resident returns from checkout).
export async function verifyDeliveryPayment(deliveryId: string): Promise<DeliveryStatus> {
  const data = await callCheckout<{ status: DeliveryStatus }>({ action: 'verify', deliveryId })
  return data.status
}

export type DeliveryUpdate = { status?: DeliveryStatus; scheduledFor?: number | null; staffNote?: string }

// DRRM/LGU move deliveries along; residents may only cancel an unpaid request.
// The database checks every change (see the trigger in supabase-deliveries.sql).
export async function updateDelivery(id: string, change: DeliveryUpdate): Promise<void> {
  const patch: Record<string, unknown> = {}
  if (change.status) patch.status = change.status
  if (change.scheduledFor !== undefined) patch.scheduled_for = change.scheduledFor ? new Date(change.scheduledFor).toISOString() : null
  if (change.staffNote !== undefined) patch.staff_note = change.staffNote.slice(0, 300)
  const { data, error } = await supabase().from('deliveries').update(patch).eq('id', id).select('id')
  if (error) throw new Error(friendly(error.message))
  if (!data || data.length === 0) throw new Error("You're not allowed to change this delivery.")
}

export const peso = (n: number) => `₱${n.toFixed(2)}`
export const when = (t: number) => new Date(t).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })
