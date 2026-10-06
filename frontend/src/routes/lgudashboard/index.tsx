import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/lgudashboard/')({ component: Page })

function Page() {
  return <h1 className="text-3xl font-extrabold">LGU dashboard</h1>
}
