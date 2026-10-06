import { createFileRoute } from '@tanstack/react-router'
import { ReportForm } from '../components/report-form'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { useTransitionReport } from '../data/mutations'
import { useMe, useReports } from '../data/queries'
import type { CommunityReport } from '../data/schemas'

export const Route = createFileRoute('/reports')({ component: Reports })

const STATUS_BADGE: Record<CommunityReport['status'], string> = {
  new: 'bg-blue-100 text-blue-800',
  acknowledged: 'bg-amber-100 text-amber-800',
  resolved: 'bg-green-100 text-green-800',
}

function Reports() {
  const reports = useReports()
  const me = useMe()
  const ack = useTransitionReport('acknowledged')
  const resolve = useTransitionReport('resolved')

  const canCreate = me.data?.permissions.includes('report:create')
  const canAck = me.data?.permissions.includes('report:ack')
  const canResolve = me.data?.permissions.includes('report:resolve')

  if (reports.isLoading) {
    return <p className="text-sm text-gray-500">Loading…</p>
  }
  if (reports.isError || !reports.data) {
    return <p className="text-sm text-red-600">Failed to load reports.</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          Community reports
        </h1>
        <p className="text-sm text-gray-600">
          Reports from barangay officials appear here and immediately surface as
          alerts.
        </p>
      </div>

      {canCreate && <ReportForm />}

      {reports.data.length === 0 ? (
        <p className="text-sm text-gray-500">No reports yet.</p>
      ) : (
        <ul className="space-y-3">
          {reports.data.map((report) => (
            <li
              key={report.id}
              className="rounded-lg border border-gray-200 bg-white p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={STATUS_BADGE[report.status]}>
                    {report.status}
                  </Badge>
                  <Badge variant="slate">{report.type}</Badge>
                </div>
                <span className="shrink-0 text-xs text-gray-500">
                  {new Date(report.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="mt-2 font-medium text-gray-900">
                {report.area}{' '}
                <span className="font-normal text-gray-500">
                  · {report.reporter}
                </span>
              </p>
              <p className="text-sm text-gray-700">{report.description}</p>
              {(canAck || canResolve) && report.status !== 'resolved' && (
                <div className="mt-2 flex gap-2">
                  {canAck && report.status === 'new' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => ack.mutate(report.id)}
                      disabled={ack.isPending}
                    >
                      Acknowledge
                    </Button>
                  )}
                  {canResolve && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resolve.mutate(report.id)}
                      disabled={resolve.isPending}
                    >
                      Resolve
                    </Button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
