import { Link, createFileRoute } from '@tanstack/react-router'
import { Features } from '../components/Features'
import { Header } from '../components/Header'
import { Hero } from '../components/Hero'
import { HowItWorks } from '../components/HowItWorks'
import { SiteFooter } from '../components/SiteFooter'
import '../landing.css'

export const Route = createFileRoute('/')({ component: Home })

const sources = [
  { name: 'Masacpasac', note: '20 to 40 L/s', y: 40 },
  { name: 'Caramayon', note: 'Pumped', y: 130 },
  { name: 'Kulador', note: 'Antiao River', y: 220 },
]

const btn = 'inline-flex items-center rounded-lg px-6 py-3 font-bold transition'

function Home() {
  return (
    <div className="wp-landing min-h-screen">
      <Header />

      <main>
        <Hero />
        <Features />

        {/* Water sources diagram — the header's "Water sources" link jumps here */}
        <section id="sources" className="border-y border-line bg-white">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-20 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-extrabold text-ink sm:text-4xl">
                Three sources, <span className="text-well">one city</span>
              </h2>
              <p className="mt-4 max-w-md text-ink/75">
                Each source is monitored, so a failure at one is spotted quickly and the affected barangays are reached
                first.
              </p>
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
          </div>
        </section>

        <HowItWorks />

        {/* Call to action */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="rounded-3xl bg-gradient-to-br from-ink to-well px-6 py-14 text-center text-sky">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">Ready for safer water?</h2>
            <p className="mx-auto mt-3 max-w-md">Create an account and get alerts for your barangay.</p>
            <Link to="/register" className={`${btn} mt-7 bg-foam text-ink hover:bg-white`}>
              Create an account
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
