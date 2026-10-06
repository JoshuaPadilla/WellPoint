import { useEffect, useRef, useState } from 'react'
import type { MapMouseEvent } from 'maplibre-gl'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { LocateFixed, Send } from 'lucide-react'
import { Map, MapControls, MapMarker, MarkerContent, useMap } from '@/components/ui/map'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getUser } from '@/lib/auth'
import { useMyLocation } from '@/lib/geo'
import { KINDS, STATUSES, registerSource, useWaterStore } from '@/lib/water-store'
import type { AssetKind, Status } from '@/lib/water-store'

export const Route = createFileRoute('/dashboard/add-source')({ component: Page })

const card = 'rounded-xl border border-line bg-white p-4'
const field = 'w-full rounded-lg border border-line bg-white px-2.5 py-1.5 text-sm'
const ZOOM = 16

// Lives inside <Map>: zooms in on the user once their location is known.
function FlyTo({ to }: { to: { lng: number; lat: number } | null }) {
  const { map, isLoaded } = useMap()
  useEffect(() => {
    if (map && isLoaded && to) map.flyTo({ center: [to.lng, to.lat], zoom: ZOOM, duration: 800 })
  }, [map, isLoaded, to])
  return null
}

// Lives inside <Map>: turns a click into a picked point, leaving the map free to pan and zoom.
function ClickToPick({ onPick }: { onPick: (lng: number, lat: number) => void }) {
  const { map, isLoaded } = useMap()
  const pickRef = useRef(onPick)
  pickRef.current = onPick
  useEffect(() => {
    if (!map || !isLoaded) return
    const handle = (e: MapMouseEvent) => pickRef.current(e.lngLat.lng, e.lngLat.lat)
    map.on('click', handle)
    return () => {
      map.off('click', handle)
    }
  }, [map, isLoaded])
  return null
}

function Page() {
  const { role } = useWaterStore()
  const user = typeof window === 'undefined' ? null : getUser()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [kind, setKind] = useState<AssetKind>('pump')
  const [status, setStatus] = useState<Status>('ok')
  const [point, setPoint] = useState<{ lng: number; lat: number } | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const { here, origin, locate, asking, denied } = useMyLocation(false)

  useEffect(() => {
    if (here) setPoint({ lng: here.lng, lat: here.lat })
  }, [here])

  if (role !== 'official') {
    return (
      <div>
        <h1 className="text-3xl font-extrabold">Add water source</h1>
        <p className="mt-5 rounded-xl border border-dashed border-line p-6 text-sm text-ink/70">
          Only barangay leaders can register water sources in their barangay.
        </p>
      </div>
    )
  }

  const submit = async () => {
    if (!name.trim() || !point || !user?.barangayPsgc) return
    setBusy(true)
    setErr('')
    const error = await registerSource({
      name: name.trim(),
      kind,
      status,
      lng: point.lng,
      lat: point.lat,
      barangayPsgc: user.barangayPsgc,
    })
    setBusy(false)
    if (error) setErr(error)
    else navigate({ to: '/dashboard/map' })
  }

  return (
    <div>
      <h1 className="text-3xl font-extrabold">Add water source</h1>
      <p className="mt-2 max-w-xl text-ink/70">
        Register a source in <strong>{user?.barangay || 'your barangay'}</strong>. Set its location from your current
        position or by tapping the map.
      </p>

      <section className={cn(card, 'mt-5')}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-semibold">
            Name
            <input className={cn(field, 'mt-1')} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sitio Lower spring" />
          </label>
          <label className="block text-sm font-semibold">
            Type
            <select className={cn(field, 'mt-1')} value={kind} onChange={(e) => setKind(e.target.value as AssetKind)}>
              {(['pump', 'well', 'reservoir'] as AssetKind[]).map((k) => (
                <option key={k} value={k}>{KINDS[k]}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="mt-3 block text-sm font-semibold">
          Status
          <select className={cn(field, 'mt-1')} value={status} onChange={(e) => setStatus(e.target.value as Status)}>
            {Object.entries(STATUSES).map(([v, s]) => (
              <option key={v} value={v}>{s.label}</option>
            ))}
          </select>
        </label>
      </section>

      <section className="relative mt-4 h-[360px] overflow-hidden rounded-2xl border border-line bg-sky/40">
        <Map theme="light" center={[point?.lng ?? origin.lng, point?.lat ?? origin.lat]} zoom={ZOOM} className="h-full w-full cursor-crosshair">
          <FlyTo to={here} />
          <ClickToPick onPick={(lng, lat) => setPoint({ lng, lat })} />
          <MapControls position="bottom-right" />
          {point && (
            <MapMarker longitude={point.lng} latitude={point.lat}>
              <MarkerContent>
                <div className="size-4 rounded-full border-2 border-white bg-well shadow-md ring-4 ring-well/25" />
              </MarkerContent>
            </MapMarker>
          )}
        </Map>
      </section>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={() => locate()} disabled={asking}>
          <LocateFixed className="size-3.5" aria-hidden="true" /> {asking ? 'Finding you…' : 'Use my location'}
        </Button>
        <p className="text-sm text-ink/70">
          {point
            ? `Selected ${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}.`
            : 'Tap the map or use your location.'}
          {denied && ' Location is unavailable or blocked.'}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button onClick={() => void submit()} disabled={busy || !name.trim() || !point}>
          <Send className="size-3.5" aria-hidden="true" /> {busy ? 'Saving…' : 'Register source'}
        </Button>
        {err && <p className="text-sm text-orange-700">{err}</p>}
      </div>
    </div>
  )
}
