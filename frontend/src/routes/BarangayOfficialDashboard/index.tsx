import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/BarangayOfficialDashboard/')({ component: Page })

function Page() {
  return <h1 className="text-3xl font-extrabold">Barangay dashboard</h1>
}
