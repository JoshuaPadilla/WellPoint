import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/DRRMDashboard/deliveries')({ component: Page })

function Page() {
  return <h1 className="text-3xl font-extrabold">Deliveries</h1>
}
