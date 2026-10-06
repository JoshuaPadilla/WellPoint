import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/alerts')({ component: Page })

function Page() {
  return <h1 className="text-3xl font-extrabold">Outage alerts</h1>
}
