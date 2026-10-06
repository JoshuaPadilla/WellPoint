import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/lgudashboard/sources')({ component: Page })

function Page() {
  return <h1 className="text-3xl font-extrabold">Water sources</h1>
}
