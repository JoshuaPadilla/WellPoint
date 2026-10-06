import { useState } from 'react'
import { RefreshCw, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useDomain } from '@/lib/store'
import { resetDemo, simulateDisruption, useWaterStore } from '@/lib/water-store'
import type { BarangayStatus, DisruptionType } from '@/data/types'

const DISRUPTIONS: { id: DisruptionType; label: string }[] = [
  { id: 'typhoon', label: 'Typhoon' },
  { id: 'drought', label: 'Drought' },
  { id: 'contamination', label: 'Contamination' },
  { id: 'maintenance', label: 'Maintenance' },
]

function describe(b: BarangayStatus): string {
  if (!b.available) return 'out of service'
  if (b.quality === 'unsafe') return 'unsafe to drink'
  if (b.quality === 'advisory') return 'under advisory'
  if (b.flow < 40) return 'running low'
  return 'disrupted'
}

const field = 'h-8 rounded-lg border border-line bg-white px-2.5 text-sm'

export function DemoControls({ compact = false }: { compact?: boolean }) {
  const { role, statusOverrides } = useWaterStore()
  const { systems, communities } = useDomain()
  const [type, setType] = useState<DisruptionType>('typhoon')
  const [systemId, setSystemId] = useState(systems[0]?.id ?? '')

  const canDemo = role === 'lgu'
  if (!canDemo) return null

  const activePsgc = Object.keys(statusOverrides)[0] ?? ''
  const activeCommunity = activePsgc ? communities.find((c) => c.psgcCode === activePsgc) ?? null : null
  const active = activeCommunity ? { name: activeCommunity.name, override: statusOverrides[activePsgc] } : null

  return (
    <div className={cn('rounded-2xl border border-line bg-white', compact ? 'p-3' : 'p-4')}>
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex items-center gap-1.5 text-sm font-bold">
          <Zap className="size-4 text-signal" aria-hidden="true" /> Demo controls
        </span>
        <label className="flex items-center gap-1.5 text-sm">
          <span className="text-ink/70">Disruption</span>
          <select className={field} value={type} onChange={(e) => setType(e.target.value as DisruptionType)}>
            {DISRUPTIONS.map((d) => (
              <option key={d.id} value={d.id}>{d.label}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-sm">
          <span className="text-ink/70">System</span>
          <select className={field} value={systemId} onChange={(e) => setSystemId(e.target.value)}>
            {systems.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>
        <Button size="sm" onClick={() => void simulateDisruption(type, systemId)}>
          Simulate disruption
        </Button>
        <Button size="sm" variant="outline" onClick={() => void resetDemo()}>
          <RefreshCw className="size-3.5" aria-hidden="true" /> Reset demo
        </Button>
      </div>
      {active && (
        <p className="mt-2 text-xs text-ink/70">
          Active: <span className="font-semibold text-signal">{active.name}</span> is {describe(active.override)}. Press “Reset demo” to restore the known-good state.
        </p>
      )}
    </div>
  )
}
