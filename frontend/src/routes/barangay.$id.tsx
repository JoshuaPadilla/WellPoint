import { createFileRoute } from '@tanstack/react-router'
import { AlertsList } from '../components/alerts-list'
import { Badge } from '../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { useBarangay } from '../data/queries'
import type { ServiceStatus } from '../data/schemas'
import { tierBadge, tierLabel } from '../lib/status'

export const Route = createFileRoute('/barangay/$id')({
  component: BarangayDetail,
})

function BarangayDetail() {
  const { id } = Route.useParams()
  const detail = useBarangay(id)

  if (detail.isLoading) {
    return <p className="text-sm text-gray-500">Loading…</p>
  }
  if (detail.isError || !detail.data) {
    return <p className="text-sm text-red-600">Barangay not found.</p>
  }

  const { community, system, sources, statusHistory, alerts, vulnerability } =
    detail.data
  const latest: ServiceStatus | undefined =
    statusHistory.length > 0
      ? statusHistory[statusHistory.length - 1]
      : undefined

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          {community.name}
        </h1>
        <p className="text-sm text-gray-600">
          PSGC {community.psgcCode} · {community.population.toLocaleString()}{' '}
          residents
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Structural vulnerability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Badge className={tierBadge[vulnerability.tier]}>
              {tierLabel[vulnerability.tier]}
            </Badge>
            <dl className="text-sm text-gray-600">
              <div className="flex justify-between">
                <dt>Isolation</dt>
                <dd>{vulnerability.isolation.toFixed(2)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Service-level risk</dt>
                <dd>{vulnerability.levelRisk.toFixed(2)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Capacity risk</dt>
                <dd>{vulnerability.capacityRisk.toFixed(2)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current service</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600">
            {system ? (
              <>
                <p>
                  <span className="font-medium">System:</span> {system.name} (
                  Level {system.level})
                </p>
                <p>
                  <span className="font-medium">Operator:</span>{' '}
                  {system.operator}
                </p>
                <p>
                  <span className="font-medium">Status:</span>{' '}
                  {latest ? (
                    <>
                      {latest.available ? 'Available' : 'Down'} · {latest.flow}%
                      flow · {latest.quality}
                      {latest.reason ? ` · ${latest.reason}` : ''}
                    </>
                  ) : (
                    'No status'
                  )}
                </p>
              </>
            ) : (
              <p>No piped system modeled for this barangay.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {sources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Water sources</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm text-gray-600">
              {sources.map((source) => (
                <li key={source.id}>
                  {source.name} — {source.type},{' '}
                  {source.capacity.toLocaleString()} m³/day ({source.status})
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-lg font-semibold text-gray-900">Alerts</h2>
        <AlertsList alerts={alerts} />
      </div>
    </div>
  )
}
