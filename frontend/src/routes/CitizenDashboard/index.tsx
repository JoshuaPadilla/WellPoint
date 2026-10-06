import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/CitizenDashboard/')({ component: Page })

function Page() {
  return <h1 className="text-3xl font-extrabold">Citizen dashboard</h1>
}
