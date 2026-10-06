import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/DRRMDashboard/alerts')({ component: Page })

function Page() {
  return <h1 className="text-3xl font-extrabold">Outage alerts</h1>
}
