import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/reports')({ component: Page })

function Page() {
  return <h1 className="text-3xl font-extrabold">Reports</h1>
}
