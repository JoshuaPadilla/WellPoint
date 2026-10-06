import { createFileRoute } from '@tanstack/react-router'
import { CoverageMap } from '../components/coverage-map'
import { useBarangays } from '../data/queries'

export const Route = createFileRoute('/coverage')({ component: Coverage })

function Coverage() {
  const barangays = useBarangays()

  if (barangays.isLoading) {
    return <p className="text-sm text-gray-500">Loading…</p>
  }
  if (barangays.isError || !barangays.data) {
    return <p className="text-sm text-red-600">Failed to load coverage map.</p>
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Coverage map</h1>
        <p className="text-sm text-gray-600">
          All 57 barangays of Catbalogan City. Access state is derived from each
          system’s live status, not labeled by hand.
        </p>
      </div>
      <CoverageMap communities={barangays.data} />
    </div>
  )
}
