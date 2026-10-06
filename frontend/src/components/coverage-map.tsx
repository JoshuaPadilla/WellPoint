import type { Community } from '../data/schemas'
import { boundaryToPath, buildProjector } from '../lib/geo'
import { accessStateColor, accessStateLabel } from '../lib/status'

export function CoverageMap({
  communities,
  height = 440,
}: {
  communities: Community[]
  height?: number
}) {
  const width = 800
  const project = buildProjector(
    communities.map((c) => c.boundary),
    width,
    height,
  )

  return (
    <div className="space-y-2">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full rounded-xl border border-gray-200 bg-white"
        role="img"
        aria-label="Barangay coverage map"
      >
        {communities.map((community) => {
          if (!community.boundary) return null
          return (
            <path
              key={community.id}
              d={boundaryToPath(community.boundary, project)}
              fill={accessStateColor[community.accessState]}
              fillOpacity={0.78}
              stroke="#ffffff"
              strokeWidth={0.6}
            />
          )
        })}
      </svg>
      <div className="flex flex-wrap gap-4 text-xs text-gray-600">
        {(['served', 'partial', 'underserved'] as const).map((state) => (
          <span key={state} className="flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-3 rounded-sm"
              style={{ backgroundColor: accessStateColor[state] }}
            />
            {accessStateLabel[state]}
          </span>
        ))}
      </div>
    </div>
  )
}
