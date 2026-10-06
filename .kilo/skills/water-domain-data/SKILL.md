---
name: water-domain-data
description: Use when modeling water-security domain data or building water-specific features for WellPoint — water sources, service status, coverage, alerts/early warning, geospatial Region VIII data, simulated sensor telemetry, or community reports. Trigger when creating seed data, dashboards, maps, or disruption/alert logic.
---

# Water Domain Data — Sources, Status, Alerts

This skill turns the challenge themes into concrete data and logic. It pairs with `solution-architecture` (contracts) and `tanstack-start-ui` (rendering).

Reference: `docs/draw_challenge.md` (context areas) and `docs/hackathon_guidelines.md` (problem areas).

## Domain framing

Water security = access, not just availability. Model the gap between where water exists and who can reliably, safely, and affordably reach it, especially under disruption (drought, typhoon, contamination, infrastructure failure).

The six context areas to reflect: climate/environmental risk, infrastructure/service coverage, water availability, community access, livelihoods/food security, disasters/emergencies.

## Core entities

Put types and seed data in `frontend/src/data/`. Suggested shape:

```ts
type WaterSource = {
  id: string
  name: string
  type: 'river' | 'spring' | 'groundwater' | 'reservoir'
  lat: number
  lng: number
  barangay: string
  capacity: number        // m3/day
  status: 'ok' | 'low' | 'contaminated' | 'offline'
}

type WaterSystem = {
  id: string
  name: string
  level: 'I' | 'II' | 'III'   // service level
  coverageArea: string
  serviceHours: number
  operator: string
  sourceIds: string[]
}

type ServiceStatus = {
  systemId: string
  timestamp: string
  available: boolean
  flow: number            // % of nominal
  quality: 'safe' | 'advisory' | 'unsafe'
  reason?: string         // 'drought' | 'typhoon' | 'maintenance' | 'contamination'
}

type Alert = {
  id: string
  type: 'shortage' | 'contamination' | 'outage'
  severity: 'info' | 'warning' | 'critical'
  area: string
  raisedAt: string
  status: 'active' | 'resolved'
}
```

Add a `Household`/`Community` entity with population, access level, and an affordability indicator so inequity is visible.

## Simulated telemetry

Generate plausible, deterministic data (fixed seed) so every demo run looks identical:

- Daily and seasonal variation in `flow` and `quality`.
- Occasional disruptions driven by a `reason` (typhoon, drought, maintenance, contamination).
- At least 3–5 barangays/systems across Region VIII, including one well-served and one underserved area.
- A manual `simulateDisruption(type, area)` function the presenter can trigger live.

```ts
// frontend/src/data/simulate.ts
export function tickStatus(prev: ServiceStatus[], rng: () => number): ServiceStatus[] { /* ... */ }
```

Keep the generator pure and side-effect free so it is easy to demo and test.

## Early-warning logic

Derive alerts from status thresholds, and document the thresholds:

- `flow < 40%` for a system → `shortage` / `warning`
- `quality === 'unsafe'` → `contamination` / `critical`
- `available === false` for > N hours → `outage` / `critical`
- Downward trend over several ticks → predictive `warning` ("expected shortage in X hours")

Make the rule set small, explainable, and visible in the UI. Judges value transparency over black-box scoring.

## Geospatial

- Use real Region VIII locations (Catbalogan City, Samar and nearby municipalities/barangays) so the map feels local and credible.
- If using a map library, keep it lightweight and add attribution. If avoiding a map dependency, a schematic coverage grid or region outline is acceptable and safer for the demo.
- Always show both served and underserved areas.

## Demo data guarantees

- App must render fully with **no network** and **no database**.
- Seed at least one active critical alert and one resolved alert so the alerts UI is never empty.
- Include a "reset demo" action to return to the known-good starting state.

## Done when

- [ ] Entities implemented as types in `frontend/src/data/`
- [ ] Deterministic simulated telemetry with disruption controls
- [ ] Alert thresholds documented and derived from status
- [ ] 3–5 Region VIII areas including one underserved
- [ ] App renders with zero network dependency and has a reset action
