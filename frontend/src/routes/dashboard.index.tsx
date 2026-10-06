import { createFileRoute, redirect } from '@tanstack/react-router'

// The map is the main screen for every role. The LGU score summary lives in a
// "Summary" overlay on the map (see components/SummaryPanel.tsx).
export const Route = createFileRoute('/dashboard/')({
  beforeLoad: () => {
    throw redirect({ to: '/dashboard/map' })
  },
})
