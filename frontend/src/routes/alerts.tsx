import { createFileRoute } from '@tanstack/react-router'
import { AlertsList } from '../components/alerts-list'
import { useAlerts } from '../data/queries'

export const Route = createFileRoute('/alerts')({ component: Alerts })

function Alerts() {
  const alerts = useAlerts()

  if (alerts.isLoading) {
    return <p className="text-sm text-gray-500">Loading…</p>
  }
  if (alerts.isError || !alerts.data) {
    return <p className="text-sm text-red-600">Failed to load alerts.</p>
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Alerts</h1>
        <p className="text-sm text-gray-600">
          Early-warning rules fire from live status, source health, and
          community reports. Each alert states the cause and the recommended
          action.
        </p>
      </div>
      <AlertsList alerts={alerts.data} />
    </div>
  )
}
