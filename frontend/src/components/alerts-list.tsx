import type { Alert } from '../data/schemas'
import { severityBadge } from '../lib/status'
import { Badge } from './ui/badge'

export function AlertsList({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) {
    return <p className="text-sm text-gray-500">No alerts right now.</p>
  }

  return (
    <ul className="space-y-3">
      {alerts.map((alert) => (
        <li
          key={alert.id}
          className="rounded-lg border border-gray-200 bg-white p-3"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={severityBadge[alert.severity]}>
                {alert.severity}
              </Badge>
              <Badge variant="slate">{alert.type}</Badge>
              {alert.status === 'resolved' && (
                <Badge variant="green">resolved</Badge>
              )}
            </div>
            <span className="shrink-0 text-xs text-gray-500">
              {new Date(alert.raisedAt).toLocaleString()}
            </span>
          </div>
          <p className="mt-2 font-medium text-gray-900">{alert.area}</p>
          <p className="text-sm text-gray-700">{alert.message}</p>
          <p className="mt-1 text-sm text-gray-500">
            <span className="font-medium">Action:</span> {alert.action}
          </p>
        </li>
      ))}
    </ul>
  )
}
