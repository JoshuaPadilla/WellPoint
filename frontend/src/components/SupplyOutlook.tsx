import { useEffect, useMemo, useState } from 'react'
import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSun, Sun } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { RESERVOIR, STAGES, project } from '@/lib/supply'
import type { DayForecast } from '@/lib/supply'

type Raw = {
  daily: {
    time: string[]
    precipitation_sum: (number | null)[]
    precipitation_probability_max: (number | null)[]
    temperature_2m_max: (number | null)[]
    et0_fao_evapotranspiration: (number | null)[]
    weather_code: (number | null)[]
  }
}

// Open-Meteo is free and needs no key. Daily values for the next 6 days at the reservoir.
const URL =
  `https://api.open-meteo.com/v1/forecast?latitude=${RESERVOIR.lat}&longitude=${RESERVOIR.lng}` +
  '&daily=precipitation_sum,precipitation_probability_max,temperature_2m_max,et0_fao_evapotranspiration,weather_code' +
  '&timezone=Asia%2FManila&forecast_days=6'

function useForecast() {
  const [days, setDays] = useState<DayForecast[] | null>(null)
  const [error, setError] = useState(false)
  const [try_, setTry] = useState(0)

  useEffect(() => {
    const ctrl = new AbortController()
    setError(false)
    fetch(URL, { signal: ctrl.signal })
      .then((r) => (r.ok ? (r.json() as Promise<Raw>) : Promise.reject(new Error(String(r.status)))))
      .then(({ daily: d }) =>
        setDays(
          d.time.map((date, i) => ({
            date,
            rainMm: d.precipitation_sum[i] ?? 0,
            rainChance: d.precipitation_probability_max[i] ?? 0,
            tempMax: d.temperature_2m_max[i] ?? 30,
            et0Mm: d.et0_fao_evapotranspiration[i] ?? 4,
            code: d.weather_code[i] ?? 0,
          })),
        ),
      )
      .catch((e) => {
        if (e.name !== 'AbortError') setError(true)
      })
    return () => ctrl.abort()
  }, [try_])

  return { days, error, retry: () => setTry((n) => n + 1) }
}

// WMO weather codes grouped into a few icons.
function sky(code: number): { Icon: LucideIcon; label: string } {
  if (code === 0) return { Icon: Sun, label: 'Clear' }
  if (code <= 2) return { Icon: CloudSun, label: 'Partly cloudy' }
  if (code === 3) return { Icon: Cloud, label: 'Cloudy' }
  if (code === 45 || code === 48) return { Icon: CloudFog, label: 'Fog' }
  if (code >= 51 && code <= 57) return { Icon: CloudDrizzle, label: 'Drizzle' }
  if (code >= 95) return { Icon: CloudLightning, label: 'Thunderstorm' }
  return { Icon: CloudRain, label: 'Rain' }
}

const dayLabel = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' })
const pct = (n: number) => `${Math.round(n)}%`

export function SupplyOutlook() {
  const { days, error, retry } = useForecast()
  const outlook = useMemo(() => (days ? project(days) : null), [days])
  const stage = outlook ? STAGES[outlook.stage] : null

  return (
    <section aria-label="Water supply outlook" className="rounded-2xl border border-line bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold">Water supply outlook</h2>
          <p className="text-sm text-ink/70">{RESERVOIR.name}, next 6 days of weather</p>
        </div>
        {stage && <span className={cn('rounded-full px-3 py-1 text-sm font-bold', stage.tone)}>{stage.label}</span>}
      </div>

      <div className="mt-4">
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-semibold">Stored now</span>
          <span>{pct((RESERVOIR.storageM3 / RESERVOIR.capacityM3) * 100)} ({RESERVOIR.storageM3.toLocaleString('en')} of {RESERVOIR.capacityM3.toLocaleString('en')} m³)</span>
        </div>
        <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-sky" role="img" aria-label={`Reservoir ${pct((RESERVOIR.storageM3 / RESERVOIR.capacityM3) * 100)} full`}>
          <div className="h-full bg-well" style={{ width: `${(RESERVOIR.storageM3 / RESERVOIR.capacityM3) * 100}%` }} />
        </div>
        <p className="mt-1 text-xs text-ink/60">Demo reading. Replace it with the real gauge reading.</p>
      </div>

      {!days && !error && <p className="mt-5 text-sm text-ink/70">Loading the forecast…</p>}
      {error && (
        <div role="alert" className="mt-5 flex flex-wrap items-center gap-3 text-sm">
          <p>Couldn't load the weather forecast, so the outlook can't be worked out.</p>
          <Button size="sm" variant="outline" onClick={retry}>Try again</Button>
        </div>
      )}

      {days && outlook && stage && (
        <>
          <ol className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {days.map((d, i) => {
              const { Icon, label } = sky(d.code)
              return (
                <li key={d.date} className="rounded-xl bg-mist p-3 text-sm">
                  <p className="font-bold">{dayLabel(d.date)}</p>
                  <Icon className="my-2 size-6 text-well" aria-label={label} />
                  <p>{d.rainMm.toFixed(1)} mm rain</p>
                  <p className="text-xs text-ink/60">{d.rainChance}% chance · {Math.round(d.tempMax)}°C</p>
                  <p className="mt-2 border-t border-line pt-2 text-xs text-ink/70">
                    Reservoir <strong className="text-ink">{pct(outlook.days[i].pct)}</strong>
                  </p>
                </li>
              )
            })}
          </ol>

          <div className="mt-5 space-y-2 text-sm">
            <p>
              Over 6 days the forecast brings <strong>{outlook.totalRainMm.toFixed(0)} mm</strong> of rain. The reservoir goes from{' '}
              <strong>{pct(outlook.nowPct)}</strong> to <strong>{pct(outlook.endPct)}</strong>
              {outlook.minPct < Math.min(outlook.nowPct, outlook.endPct) - 0.5 && <> (lowest point {pct(outlook.minPct)})</>}.{' '}
              {outlook.daysLeft === null
                ? 'It is refilling faster than it is used.'
                : <>If no more rain falls after that, what is left lasts about <strong>{Math.round(outlook.daysLeft)} days</strong>.</>}
            </p>
            <p className="font-semibold">{outlook.stage >= 3 ? 'There is a danger to the water supply.' : outlook.stage === 2 ? 'The supply is tight. Conserve water.' : outlook.stage === 1 ? 'Keep an eye on the supply.' : 'No danger to the supply in the next 6 days.'}</p>
            <ul className="list-disc pl-5">
              {stage.advice.map((a) => <li key={a}>{a}</li>)}
            </ul>
          </div>
          <p className="mt-3 text-xs text-ink/60">
            Estimate from forecast rain, heat, and the demand of {RESERVOIR.servedPeople.toLocaleString('en')} people. Weather data from Open-Meteo. Reservoir figures are demo values.
          </p>
        </>
      )}
    </section>
  )
}