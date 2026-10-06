// Six-day water outlook for a reservoir: weather in, projected storage and a stage out.
// Everything under RESERVOIR is demo data. Replace storageM3 with the real gauge reading and the rest with surveyed values.

export type DayForecast = { date: string; rainMm: number; rainChance: number; tempMax: number; et0Mm: number; code: number }

export const RESERVOIR = {
  name: 'Maulong reservoir',
  lat: 11.796,
  lng: 124.878,
  capacityM3: 40_000, // usable storage when full
  storageM3: 14_000, // current reading (demo)
  servedPeople: 6_900, // Maulong + Guindapunan
  litersPerPersonPerDay: 120,
  catchmentKm2: 2.5, // land that drains into the reservoir
  surfaceKm2: 0.02, // water surface, for evaporation
  baseInflowM3PerDay: 300, // what keeps flowing in with no rain
}

const RUNOFF = 0.3 // share of effective rain that reaches the reservoir
const ABSORB_MM = 5 // the first few mm of rain are soaked up by dry ground
const HEAT_UPLIFT = 0.01 // +1% demand per degree above 30 C

export const STAGES = [
  { id: 'normal', label: 'Normal', tone: 'bg-sky text-well', advice: ['No restrictions. Fix leaks when you see them.'] },
  { id: 'watch', label: 'Watch', tone: 'bg-yellow-100 text-yellow-800', advice: ['Save water where you can.', 'Check taps and pipes for leaks.'] },
  { id: 'warning', label: 'Warning', tone: 'bg-orange-100 text-orange-800', advice: ['Stop non-essential use: no car washing or watering plants with tap water.', 'Expect shorter service hours.', 'Store drinking water for a day.'] },
  { id: 'severe', label: 'Severe', tone: 'bg-red-100 text-red-700', advice: ['Water is for drinking, cooking and hygiene only.', 'Expect scheduled supply. Store water for 2 days.', 'Know where your nearest filling station is.'] },
  { id: 'emergency', label: 'Emergency', tone: 'bg-red-600 text-white', advice: ['Rationing is likely. Follow your barangay announcements.', 'Use filling stations and water deliveries.', 'Keep drinking water for every household member.'] },
] as const

const stageFromPct = (p: number) => (p >= 70 ? 0 : p >= 50 ? 1 : p >= 30 ? 2 : p >= 15 ? 3 : 4)
const stageFromDays = (d: number | null) => (d === null || d >= 30 ? 0 : d >= 14 ? 2 : d >= 7 ? 3 : 4)

export type Outlook = ReturnType<typeof project>

export function project(forecast: DayForecast[], r = RESERVOIR) {
  let storage = r.storageM3
  const baseDemand = (r.servedPeople * r.litersPerPersonPerDay) / 1000 // m3/day
  const days = forecast.map((d) => {
    const demand = baseDemand * (1 + HEAT_UPLIFT * Math.max(0, d.tempMax - 30))
    const evap = (d.et0Mm / 1000) * r.surfaceKm2 * 1e6
    const rainIn = (Math.max(0, d.rainMm - ABSORB_MM) / 1000) * r.catchmentKm2 * 1e6 * RUNOFF
    const inflow = r.baseInflowM3PerDay + rainIn
    storage = Math.min(r.capacityM3, Math.max(0, storage + inflow - demand - evap))
    return { date: d.date, storageM3: storage, pct: (storage / r.capacityM3) * 100, demand, evap, inflow }
  })

  const last = days[days.length - 1]
  const nowPct = (r.storageM3 / r.capacityM3) * 100
  const minPct = days.length ? Math.min(...days.map((d) => d.pct)) : nowPct // lowest level reached during the 6 days
  // If no more rain falls after day 6, how long does what is left last?
  const drawPerDay = last ? last.demand + last.evap - r.baseInflowM3PerDay : 0
  const daysLeft = last && drawPerDay > 0 ? last.storageM3 / drawPerDay : null
  const stage = Math.max(stageFromPct(minPct), stageFromDays(daysLeft))
  const totalRainMm = forecast.reduce((s, d) => s + d.rainMm, 0)
  return { days, nowPct, endPct: last?.pct ?? nowPct, minPct, daysLeft, stage, totalRainMm }
}