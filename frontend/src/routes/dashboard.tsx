import { createFileRoute } from '@tanstack/react-router'
import { DemoControls } from '../components/demo-controls'
import { KpiCards } from '../components/kpi-cards'
import { StatusBanner } from '../components/status-banner'
import { useMe, useMetrics } from '../data/queries'

export const Route = createFileRoute('/dashboard')({ component: Dashboard })

function Dashboard() {
  const metrics = useMetrics()
  const me = useMe()
  const canDemo = me.data?.permissions.includes('demo:simulate')

  if (metrics.isLoading) {
    return <p className="text-sm text-gray-500">Loading…</p>
  }
  if (metrics.isError || !metrics.data) {
    return (
      <p className="text-sm text-red-600">Failed to load dashboard metrics.</p>
    )
  }

  const m = metrics.data

  return (
    <div className="space-y-6">
      <StatusBanner metrics={m} />
      <KpiCards metrics={m} />
      {canDemo && <DemoControls />}
      <p className="text-xs text-gray-500">
        Score = 0.4×coverage + 0.3×reliability + 0.3×affordability − alert
        penalty (max 30). Every run is deterministic; press “Reset demo” to
        restore the starting state.
      </p>
    </div>
  )
}
