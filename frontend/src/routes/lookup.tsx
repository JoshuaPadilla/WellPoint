import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Badge } from '../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { usePublicBarangay, usePublicBarangays } from '../data/queries'

export const Route = createFileRoute('/lookup')({ component: Lookup })

function Lookup() {
  const barangays = usePublicBarangays()
  const [selected, setSelected] = useState<string>('')
  const status = usePublicBarangay(selected || undefined)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          Check your barangay’s water status
        </h1>
        <p className="text-sm text-gray-600">
          No sign-in needed. Select a barangay to see its current water status.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">Select a barangay…</option>
            {(barangays.data ?? []).map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {status.data && (
          <Card>
            <CardHeader>
              <CardTitle>{status.data.barangay}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant={status.data.available ? 'green' : 'red'}>
                  {status.data.available ? 'Available' : 'Unavailable'}
                </Badge>
                <Badge
                  variant={status.data.quality === 'safe' ? 'green' : 'amber'}
                >
                  {status.data.quality}
                </Badge>
                <Badge variant={status.data.affordable ? 'green' : 'amber'}>
                  {status.data.affordable ? 'Affordable' : 'Cost concern'}
                </Badge>
              </div>
              <p className="text-sm text-gray-700">{status.data.summary}</p>
              {status.data.alerts.length > 0 && (
                <ul className="space-y-2 text-sm text-gray-600">
                  {status.data.alerts.map((alert) => (
                    <li key={`${alert.type}-${alert.message}`}>
                      <span className="font-medium">{alert.severity}:</span>{' '}
                      {alert.message} — {alert.action}
                    </li>
                  ))}
                </ul>
              )}
              <div className="border-t pt-3 text-xs text-gray-500">
                {status.data.contacts.map((contact) => (
                  <p key={contact.name}>
                    {contact.name}: {contact.contact}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
