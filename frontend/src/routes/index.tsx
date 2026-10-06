import { Link, createFileRoute } from '@tanstack/react-router'
import { Logo } from '../components/Logo'

export const Route = createFileRoute('/')({ component: Home })

const sources = [
  { name: 'Masacpasac', note: '20 to 40 L/s', y: 40 },
  { name: 'Caramayon', note: 'Pumped', y: 130 },
  { name: 'Kulador', note: 'Antiao River', y: 220 },
]

function Home() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Logo />
        <nav className="flex items-center gap-3 text-sm font-bold">
          <Link to="/login" className="px-3 py-2 hover:underline">
            Log in
          </Link>
          <Link to="/register" className="rounded-md bg-ink px-4 py-2 text-white hover:bg-deep">
            Sign up
          </Link>
        </nav>
      </header>

      <main className="mx-auto grid max-w-6xl items-center gap-10 px-6 pb-20 pt-10 lg:grid-cols-2">
        <div>
          <h1 className="text-5xl font-extrabold leading-[1.05] tracking-tight lg:text-6xl">
            Know when the water stops before it does.
          </h1>
          <p className="mt-6 max-w-md text-lg text-ink/75">
            WellPoint tracks Catbalogan's three water sources and sends tankers to the barangays that
            need them first when pipes fail.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/register" className="rounded-md bg-well px-6 py-3 font-bold text-white hover:bg-deep">
              Create an account
            </Link>
            <Link to="/login" className="rounded-md border-2 border-ink px-6 py-3 font-bold hover:bg-white">
              Log in
            </Link>
          </div>
        </div>

        <svg viewBox="0 0 480 270" role="img" aria-label="Three water sources flowing into Catbalogan" className="w-full">
          {sources.map((s) => (
            <g key={s.name}>
              <path d={`M150 ${s.y} C 270 ${s.y}, 270 135, 360 135`} fill="none" stroke="var(--color-line)" strokeWidth="6" />
              <path d={`M150 ${s.y} C 270 ${s.y}, 270 135, 360 135`} fill="none" stroke="var(--color-well)" strokeWidth="3" className="flow-line" />
              <text x="0" y={s.y - 2} fontSize="17" fontWeight="700" fill="var(--color-ink)">{s.name}</text>
              <text x="0" y={s.y + 18} fontSize="13" fill="var(--color-ink)" opacity="0.65">{s.note}</text>
            </g>
          ))}
          <circle cx="395" cy="135" r="34" fill="var(--color-deep)" />
          <circle cx="395" cy="135" r="10" fill="var(--color-signal)" />
          <text x="395" y="190" textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--color-ink)">Catbalogan</text>
        </svg>
      </main>
    </div>
  )
}
