import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { useDomain } from '@/lib/store'
import { QUALITY_OPTIONS, canEditBarangayStatus, clearBarangayStatus, setBarangayStatus, useWaterStore } from '@/lib/water-store'
import type { BarangayStatusInput } from '@/lib/water-store'
import type { AccessState, BarangayStatus, Community, Quality, ServiceStatus } from '@/data/types'

export const Route = createFileRoute('/dashboard/systems')({ component: Page })

const card = 'rounded-xl border border-line bg-white p-4'
const field = 'rounded-lg border border-line bg-white px-2.5 py-1.5 text-sm'

const ACCESS_LABEL: Record<AccessState, string> = { served: 'Served', partial: 'Partial', underserved: 'Underserved' }
const ACCESS_TONE: Record<AccessState, string> = {
  served: 'bg-emerald-100 text-emerald-800',
  partial: 'bg-amber-100 text-amber-800',
  underserved: 'bg-red-100 text-red-700',
}

function initForm(override: BarangayStatus | undefined, status: ServiceStatus, community: Community): BarangayStatusInput {
  return {
    available: override ? override.available : status.available,
    flow: override ? override.flow : Math.round(status.flow),
    quality: override ? override.quality : status.quality,
    affordability: override ? override.affordability : community.affordability,
  }
}

function StatusRow({ community }: { community: Community }) {
  const domain = useDomain()
  const { statusOverrides } = useWaterStore()
  const [form, setForm] = useState<BarangayStatusInput>(() =>
    initForm(domain.overrides[community.psgcCode], domain.statusByPsgc[community.psgcCode], community),
  )
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [err, setErr] = useState('')

  const override = statusOverrides[community.psgcCode]
  const status = domain.statusByPsgc[community.psgcCode]
  const access = domain.accessByPsgc[community.psgcCode]

  const save = async () => {
    setBusy(true)
    setErr('')
    setSaved(false)
    const error = await setBarangayStatus(community.psgcCode, form)
    setBusy(false)
    if (error) setErr(error)
    else {
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2000)
    }
  }

  const restore = async () => {
    setBusy(true)
    setErr('')
    setSaved(false)
    const error = await clearBarangayStatus(community.psgcCode)
    setBusy(false)
    if (error) setErr(error)
    else {
      setForm(initForm(undefined, domain.statusByPsgc[community.psgcCode], community))
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2000)
    }
  }

  return (
    <li className={cn(card, 'space-y-3')}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-extrabold">{community.name}</p>
          <p className="text-xs text-ink/60">
            {community.population.toLocaleString()} residents · affordability {community.affordability}
          </p>
        </div>
        <div className="flex gap-2">
          <span className={cn('rounded-full px-2 py-0.5 text-xs font-bold', ACCESS_TONE[access])}>{ACCESS_LABEL[access]}</span>
          {override && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">Manual</span>
          )}
        </div>
      </div>

      {status && (
        <p className="text-xs text-ink/60">
          Derived: flow <b>{Math.round(status.flow)}%</b> · {status.available ? 'available' : 'offline'} · quality{' '}
          {status.quality}
        </p>
      )}

      <div className="flex flex-wrap items-end gap-2">
        <label className="flex items-center gap-1.5 text-sm">
          <input
            type="checkbox"
            checked={form.available}
            onChange={(e) => setForm({ ...form, available: e.target.checked })}
            aria-label={`Served toggle for ${community.name}`}
          />
          Served
        </label>
        <label className="block text-xs font-semibold text-ink/60">
          Flow %
          <input
            type="number"
            min={0}
            max={200}
            className={cn(field, 'mt-0.5 w-20')}
            value={form.flow}
            onChange={(e) => setForm({ ...form, flow: Math.max(0, Math.min(200, Number(e.target.value) || 0)) })}
            aria-label={`Flow for ${community.name}`}
          />
        </label>
        <label className="block text-xs font-semibold text-ink/60">
          Quality
          <select
            className={cn(field, 'mt-0.5 w-32')}
            value={form.quality}
            onChange={(e) => setForm({ ...form, quality: e.target.value as Quality })}
            aria-label={`Quality for ${community.name}`}
          >
            {QUALITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-semibold text-ink/60">
          Affordability
          <input
            type="number"
            min={0}
            max={100}
            className={cn(field, 'mt-0.5 w-20')}
            value={form.affordability}
            onChange={(e) => setForm({ ...form, affordability: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })}
            aria-label={`Affordability for ${community.name}`}
          />
        </label>
        <button
          type="button"
          className="rounded-lg bg-well px-3 py-1.5 text-sm font-bold text-white hover:bg-deep disabled:opacity-50"
          onClick={() => void save()}
          disabled={busy}
        >
          Save
        </button>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-bold text-ink/70 hover:bg-mist disabled:opacity-50"
          onClick={() => void restore()}
          disabled={busy || !override}
        >
          <RotateCcw className="size-3.5" aria-hidden="true" /> Restore seeded
        </button>
        {saved && <span className="text-xs font-semibold text-emerald-700">Saved</span>}
        {err && <span className="text-xs text-orange-700">{err}</span>}
      </div>
    </li>
  )
}

function Page() {
  const { role } = useWaterStore()
  const domain = useDomain()
  const [query, setQuery] = useState('')

  if (!canEditBarangayStatus(role)) {
    return (
      <div>
        <h1 className="text-3xl font-extrabold">Water status</h1>
        <p className="mt-5 rounded-xl border border-dashed border-line p-6 text-sm text-ink/70">
          Only the LGU water office / water district can edit a barangay's service status.
        </p>
      </div>
    )
  }

  const q = query.trim().toLowerCase()
  const shown = domain.communities.filter((c) => c.name.toLowerCase().includes(q))

  return (
    <div>
      <h1 className="text-3xl font-extrabold">Water status</h1>
      <p className="mt-2 max-w-xl text-ink/70">
        Edit each barangay's live values — served state, flow %, quality, affordability. Changes persist and
        re-derive the alerts, scores, and map colors for every user in real time.
      </p>

      <Input
        type="search"
        aria-label="Find a barangay"
        placeholder="Find a barangay"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mt-4 max-w-xs bg-white"
      />

      {shown.length === 0 ? (
        <p className="mt-5 rounded-xl border border-dashed border-line p-6 text-sm text-ink/70">No barangay matches "{query}".</p>
      ) : (
        <ul className="mt-5 space-y-3">
          {shown.map((c) => (
            <StatusRow key={c.psgcCode} community={c} />
          ))}
        </ul>
      )}
    </div>
  )
}
