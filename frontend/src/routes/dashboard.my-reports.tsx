import { createFileRoute, redirect } from '@tanstack/react-router'

// Residents now file and follow their reports on the Reports page ("Your reports"),
// so this old URL just forwards there.
export const Route = createFileRoute('/dashboard/my-reports')({
  beforeLoad: () => {
    throw redirect({ to: '/dashboard/reports' })
  },
})
