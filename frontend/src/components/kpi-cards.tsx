import type { Metrics } from '../data/schemas'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

export function KpiCards({ metrics }: { metrics: Metrics }) {
  const items = [
    {
      label: 'Access coverage',
      value: `${metrics.accessCoverage}%`,
      hint: 'population with served/partial access',
    },
    {
      label: 'Reliability',
      value: `${metrics.reliability}%`,
      hint: 'mean flow across systems',
    },
    {
      label: 'Affordability',
      value: `${metrics.affordability}`,
      hint: 'population-weighted index',
    },
    {
      label: 'Active alerts',
      value: `${metrics.activeAlerts}`,
      hint: 'open incidents',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardHeader>
            <CardTitle>{item.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{item.value}</p>
            <p className="text-xs text-gray-500">{item.hint}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
