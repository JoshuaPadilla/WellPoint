import { useEffect, useState } from 'react'
import type { RefObject } from 'react'
import type { Map as MapLibreMap } from 'maplibre-gl'
import { Droplet, GlassWater, Waves } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { MapMarker, MarkerContent, MarkerPopup, MarkerTooltip, useMap } from '@/components/ui/map'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  CAN_PLACE, ISSUES, KINDS, ROLES,
  fileReport, moveAsset, removeAsset, setRole, setStatus, useWaterStore,
} from '@/lib/WaterStore'
import type { Asset, AssetKind, Issue, Role } from '@/lib/WaterStore'

const ICONS: Record<AssetKind, LucideIcon> = { pump: Droplet, reservoir: Waves, station: GlassWater }
const field = 'w-full rounded-md border border-line bg-white px-2 py-1.5 text-sm'

// Hands the MapLibre instance to the page so a drop can be turned into coordinates.
export function MapBridge({ mapRef }: { mapRef: RefObject<MapLibreMap | null> }) {
  const { map } = useMap()
  useEffect(() => {
    mapRef.current = map ?? null
    return () => {
      mapRef.current = null
    }
  }, [map, mapRef])
  return null
}

export function RolePanel() {
  const { role } = useWaterStore()
  const current = ROLES.find((r) => r.id === role)!
  return (
    <div className="mt-6 rounded-2xl border border-line bg-white p-4">
      <div role="group" aria-label="Choose a role" className="flex flex-wrap gap-2">
        {ROLES.map((r) => (
          <button
            key={r.id}
            type="button"
            aria-pressed={r.id === role}
            onClick={() => setRole(r.id)}
            className={cn(
              'rounded-lg border px-4 py-2 text-sm font-bold',
              r.id === role ? 'border-ink bg-ink text-white' : 'border-line hover:bg-sky',
            )}
          >
            {r.label}
          </button>
        ))}
      </div>
      <p className="mt-3 text-sm text-ink/70">{current.hint}</p>
      {CAN_PLACE[role].length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {CAN_PLACE[role].map((k) => {
            const Icon = ICONS[k]
            return (
              <li
                key={k}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/kind', k)
                  e.dataTransfer.effectAllowed = 'copy'
                }}
                className="flex cursor-grab items-center gap-2 rounded-lg border border-dashed border-well px-3 py-2 text-sm font-semibold text-well active:cursor-grabbing"
              >
                <Icon className="size-4" aria-hidden="true" />
                {KINDS[k]}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export function AssetMarkers() {
  const { role, assets, reports } = useWaterStore()
  return (
    <>
      {assets.map((a) => {
        const canEdit = CAN_PLACE[role].includes(a.kind)
        const Icon = ICONS[a.kind]
        const count = reports.filter((r) => r.assetId === a.id).length
        const tone = a.kind === 'reservoir' ? 'bg-deep' : a.kind === 'station' ? 'bg-aqua' : a.status === 'empty' ? 'bg-red-600' : 'bg-well'
        return (
          // The key changes with edit rights so MapLibre rebuilds the marker with the right draggable setting.
          <MapMarker
            key={`${a.id}-${canEdit}`}
            longitude={a.lng}
            latitude={a.lat}
            draggable={canEdit}
            onDragEnd={(ll) => moveAsset(a.id, ll.lng, ll.lat)}
          >
            <MarkerContent>
              <div className={cn('relative grid size-9 place-items-center rounded-full border-2 border-white text-white shadow-md', tone)}>
                <Icon className="size-4" aria-hidden="true" />
                {role === 'official' && count > 0 && (
                  <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-signal text-[10px] font-bold text-ink">
                    {count}
                  </span>
                )}
              </div>
            </MarkerContent>
            <MarkerTooltip className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-ink shadow">{a.name}</MarkerTooltip>
            <MarkerPopup closeButton className="w-64 rounded-xl border border-line bg-white p-4 text-ink shadow-lg">
              <AssetPopup asset={a} role={role} canEdit={canEdit} />
            </MarkerPopup>
          </MapMarker>
        )
      })}
    </>
  )
}

function AssetPopup({ asset, role, canEdit }: { asset: Asset; role: Role; canEdit: boolean }) {
  const { reports } = useWaterStore()
  const mine = reports.filter((r) => r.assetId === asset.id)
  const [issue, setIssue] = useState<Issue>('empty')
  const [note, setNote] = useState('')
  const [sent, setSent] = useState(false)
  const isPump = asset.kind === 'pump'

  return (
    <div className="space-y-3 text-sm">
      <div>
        <p className="font-extrabold">{asset.name}</p>
        <p className="text-ink/70">{KINDS[asset.kind]}</p>
        {isPump && (
          <p className={cn('mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-bold', asset.status === 'empty' ? 'bg-red-100 text-red-700' : 'bg-sky text-well')}>
            {asset.status === 'empty' ? 'Empty' : 'Working'}
          </p>
        )}
      </div>

      {role === 'citizen' && isPump &&
        (sent ? (
          <p className="font-semibold">Report sent. Your barangay official can see it.</p>
        ) : (
          <form
            className="space-y-2"
            onSubmit={(e) => {
              e.preventDefault()
              fileReport(asset.id, issue, note.trim())
              setSent(true)
            }}
          >
            <label htmlFor={`issue-${asset.id}`} className="block font-semibold">
              What's wrong?
            </label>
            <select id={`issue-${asset.id}`} value={issue} onChange={(e) => setIssue(e.target.value as Issue)} className={field}>
              {Object.entries(ISSUES).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            <textarea aria-label="Note (optional)" placeholder="Add a note (optional)" rows={2} value={note} onChange={(e) => setNote(e.target.value)} className={field} />
            <Button type="submit" size="sm">Send report</Button>
          </form>
        ))}

      {role === 'official' && isPump && (
        <div className="space-y-2">
          <p className="font-semibold">Reports ({mine.length})</p>
          {mine.length === 0 && <p className="text-ink/70">No reports for this pump.</p>}
          <ul className="max-h-32 space-y-1.5 overflow-y-auto">
            {mine.map((r) => (
              <li key={r.id} className="rounded-md bg-mist px-2 py-1.5">
                <p className="font-semibold">{ISSUES[r.issue]}</p>
                {r.note && <p>{r.note}</p>}
                <p className="text-xs text-ink/60">{new Date(r.at).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}</p>
              </li>
            ))}
          </ul>
          {asset.status === 'ok' ? (
            <Button size="sm" variant="destructive" onClick={() => setStatus(asset.id, 'empty')}>Mark as empty</Button>
          ) : (
            <Button size="sm" onClick={() => setStatus(asset.id, 'ok')}>Mark as working</Button>
          )}
        </div>
      )}

      {canEdit && (
        <div className="space-y-2">
          <p className="text-ink/70">Drag the marker to move it.</p>
          <Button size="sm" variant="outline" onClick={() => removeAsset(asset.id)}>Remove</Button>
        </div>
      )}
    </div>
  )
}