import type { Metrics } from '../data/schemas'
import { bandColor, bandLabel } from '../lib/status'

export function StatusBanner({ metrics }: { metrics: Metrics }) {
  const color = bandColor[metrics.band]
  return (
    <div
      className="rounded-xl border p-4"
      style={{ borderColor: color, backgroundColor: `${color}14` }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">City water-security status</p>
          <p className="text-2xl font-bold" style={{ color }}>
            {bandLabel[metrics.band]}
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold">{metrics.score}</p>
          <p className="text-xs text-gray-500">composite score / 100</p>
        </div>
      </div>
    </div>
  )
}
