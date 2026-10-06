import { useState } from 'react'
import type { FormEvent } from 'react'
import { MapPin, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getUser } from '@/lib/auth'
import { useBarangays } from '@/lib/barangays'
import { useMyLocation } from '@/lib/geo'
import { DELIVERY_FEE, MAX_CONTAINERS, peso, startDeliveryCheckout } from '@/lib/deliveries'

const PHONE = /^(09\d{9}|\+639\d{9})$/
const field = 'block w-full rounded-lg border bg-white px-3 py-2.5 text-base'
const label = 'mb-1 block text-sm font-semibold'

type Errors = Partial<Record<'barangay' | 'address' | 'contactNumber' | 'containers', string>>

// Residents ask for water to be brought to them and pay the ₱20 fee through PayMongo.
export function RequestDelivery() {
  const user = typeof window === 'undefined' ? null : getUser()
  const { names, loaded } = useBarangays()
  const { here, locate, asking, denied } = useMyLocation()

  const [barangay, setBarangay] = useState(user?.barangay ?? '')
  const [address, setAddress] = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [containers, setContainers] = useState(2)
  const [note, setNote] = useState('')
  const [usePin, setUsePin] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)

  const pin = usePin ? here : null

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const phone = contactNumber.replace(/[\s-]/g, '')
    const found: Errors = {}
    if (!barangay.trim()) found.barangay = 'Choose your barangay.'
    if (address.trim().length < 3) found.address = 'Enter your address or a landmark the driver can find.'
    if (!PHONE.test(phone)) found.contactNumber = 'Enter a mobile number like 09171234567.'
    setErrors(found)
    setFormError('')
    if (Object.keys(found).length > 0) return

    setBusy(true)
    try {
      const url = await startDeliveryCheckout({
        barangay: barangay.trim(),
        address: address.trim(),
        contactNumber: phone,
        containers,
        note: note.trim(),
        lat: pin?.lat ?? null,
        lng: pin?.lng ?? null,
      })
      window.location.assign(url) // PayMongo checkout; it sends the resident back here afterwards
    } catch (err) {
      setFormError((err as Error).message)
      setBusy(false)
    }
  }

  const err = (k: keyof Errors) =>
    errors[k] && (
      <p id={`${k}-error`} role="alert" className="mt-1 text-sm text-orange-700">
        {errors[k]}
      </p>
    )
  const invalid = (k: keyof Errors) => cn(field, errors[k] ? 'border-orange-700' : 'border-line')

  return (
    <section aria-labelledby="request-heading" className="rounded-2xl border border-line bg-white p-5 sm:p-6">
      <h2 id="request-heading" className="text-xl font-extrabold">Request a water delivery</h2>
      <p className="mt-1 max-w-xl text-ink/70">
        A tanker brings water to your door. There's a {peso(DELIVERY_FEE)} delivery fee, paid online through PayMongo.
      </p>

      <form noValidate onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="d-barangay" className={label}>Barangay</label>
          {loaded && names.length > 0 ? (
            <select
              id="d-barangay"
              value={barangay}
              onChange={(e) => setBarangay(e.target.value)}
              aria-invalid={!!errors.barangay}
              aria-describedby={errors.barangay ? 'barangay-error' : undefined}
              className={invalid('barangay')}
            >
              <option value="" disabled>Select your barangay</option>
              {!names.includes(barangay) && barangay && <option value={barangay}>{barangay}</option>}
              {names.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          ) : (
            <input id="d-barangay" value={barangay} onChange={(e) => setBarangay(e.target.value)} className={invalid('barangay')} />
          )}
          {err('barangay')}
        </div>

        <div>
          <label htmlFor="d-containers" className={label}>Containers (20 litres each)</label>
          <select
            id="d-containers"
            value={containers}
            onChange={(e) => setContainers(Number(e.target.value))}
            className={cn(field, 'border-line')}
          >
            {Array.from({ length: MAX_CONTAINERS }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} container{n === 1 ? '' : 's'} ({n * 20} litres)
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="d-address" className={label}>Address or landmark</label>
          <input
            id="d-address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            maxLength={200}
            placeholder="e.g. Blue gate beside the chapel, Purok 3"
            aria-invalid={!!errors.address}
            aria-describedby={errors.address ? 'address-error' : undefined}
            className={invalid('address')}
          />
          {err('address')}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={usePin}
                onChange={(e) => {
                  setUsePin(e.target.checked)
                  if (e.target.checked && !here) locate()
                }}
              />
              Share my location with the driver
            </label>
            {usePin && asking && <span className="text-ink/60">Finding you…</span>}
            {usePin && here && (
              <span className="flex items-center gap-1 text-emerald-700">
                <MapPin className="size-4" aria-hidden="true" /> Location added
              </span>
            )}
            {usePin && denied && <span className="text-orange-700">Location is blocked or unavailable.</span>}
          </div>
        </div>

        <div>
          <label htmlFor="d-contact" className={label}>Mobile number</label>
          <input
            id="d-contact"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value)}
            placeholder="09171234567"
            aria-invalid={!!errors.contactNumber}
            aria-describedby={errors.contactNumber ? 'contactNumber-error' : undefined}
            className={invalid('contactNumber')}
          />
          {err('contactNumber')}
        </div>

        <div>
          <label htmlFor="d-note" className={label}>Note for the driver (optional)</label>
          <input
            id="d-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={300}
            placeholder="e.g. Call when you arrive"
            className={cn(field, 'border-line')}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-4 sm:col-span-2">
          <div>
            <p className="text-sm text-ink/70">Delivery fee</p>
            <p className="text-2xl font-extrabold">{peso(DELIVERY_FEE)}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Button type="submit" disabled={busy} className="h-11 px-6 text-base">
              {busy ? 'Opening PayMongo…' : `Pay ${peso(DELIVERY_FEE)} and request`}
            </Button>
            <p className="flex items-center gap-1 text-xs text-ink/60">
              <ShieldCheck className="size-3.5" aria-hidden="true" /> You'll pay on PayMongo's secure page
            </p>
          </div>
        </div>

        {formError && (
          <p role="alert" className="rounded-lg bg-orange-50 px-3 py-2 text-sm text-orange-800 sm:col-span-2">
            {formError}
          </p>
        )}
      </form>
    </section>
  )
}
