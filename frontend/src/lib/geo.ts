import { useCallback, useEffect, useState } from 'react'

export type LatLng = { lat: number; lng: number }

export const CITY_CENTER: LatLng = { lat: 11.78, lng: 124.89 } // Catbalogan

// Straight-line distance in kilometres.
export function km(a: LatLng, b: LatLng) {
  const rad = Math.PI / 180
  const h =
    Math.sin(((b.lat - a.lat) * rad) / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(((b.lng - a.lng) * rad) / 2) ** 2
  return 12742 * Math.asin(Math.sqrt(h))
}

export const formatKm = (d: number) => (d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`)

// Google Maps directions from wherever the phone is to this point.
export const directionsUrl = (p: LatLng) => `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`

// The device location, if the user allows it. `origin` falls back to the city center.
export function useMyLocation(askOnLoad = false) {
  const [here, setHere] = useState<LatLng | null>(null)
  const [status, setStatus] = useState<'idle' | 'asking' | 'denied'>('idle')

  const locate = useCallback(() => {
    if (!('geolocation' in navigator)) return setStatus('denied')
    setStatus('asking')
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setHere({ lat: p.coords.latitude, lng: p.coords.longitude })
        setStatus('idle')
      },
      () => setStatus('denied'),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 60_000 },
    )
  }, [])

  useEffect(() => {
    if (askOnLoad) locate()
  }, [askOnLoad, locate])

  return { here, origin: here ?? CITY_CENTER, locate, asking: status === 'asking', denied: status === 'denied' }
}
