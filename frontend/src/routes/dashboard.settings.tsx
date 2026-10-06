import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/settings')({ component: Page })

function Page() {
  return <h1 className="text-3xl font-extrabold">Settings</h1>
}
