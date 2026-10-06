import { createFileRoute } from '@tanstack/react-router'
import { DemoControls } from '@/components/DemoControls'
import { useDomain } from '@/lib/store'

export const Route = createFileRoute('/dashboard/settings')({ component: Page })

const card = 'rounded-xl border border-line bg-white p-4'

function Page() {
  const domain = useDomain()
  return (
    <div>
      <h1 className="text-3xl font-extrabold">Demo controls</h1>
      <p className="mt-2 max-w-xl text-ink/70">
        Rehearse a disruption and reset the demo to a known-good state. The simulation is deterministic — every reset reproduces the same starting point.
      </p>

      <div className="mt-5">
        <DemoControls />
      </div>

      <section className={card + ' mt-6'}>
        <h2 className="text-lg font-extrabold">Pilot systems</h2>
        <p className="mt-1 text-sm text-ink/70">Five curated pilot systems show the access gap across Catbalogan City.</p>
        <ul className="mt-3 space-y-2">
          {domain.systems.map((s) => {
            const community = domain.communities.find((c) => c.systemId === s.id)
            const access = community ? domain.accessByPsgc[community.psgcCode] : null
            const vuln = community ? domain.vulnerabilityByPsgc[community.psgcCode].tier : null
            return (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-mist px-3 py-2 text-sm">
                <div>
                  <p className="font-semibold">{s.name}</p>
                  <p className="text-xs text-ink/60">Level {s.level} · {s.operator} · {s.serviceHours} h/day</p>
                </div>
                <div className="text-right text-xs">
                  <p className="font-semibold capitalize">{access ?? '—'}</p>
                  {vuln && <p className="text-ink/60">vulnerability {vuln}</p>}
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      <section className={card + ' mt-4'}>
        <h2 className="text-lg font-extrabold">How the score works</h2>
        <p className="mt-1 text-sm text-ink/70">
          Coverage (40%), reliability (30%), and affordability (30%) are population-weighted across all 57 barangays, minus an alert penalty
          (10 per critical, 4 per warning, 1 per info, capped at 30). Access state is <em>derived</em>: a barangay is only fully served when its
          system is available, flow is ≥ 40%, quality is safe, and affordability is not low — covered ≠ accessed.
        </p>
      </section>
    </div>
  )
}
