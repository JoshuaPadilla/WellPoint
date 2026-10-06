import { Link, createFileRoute } from '@tanstack/react-router'
import { SiteFooter } from '../components/SiteFooter'
import { SiteHeader } from '../components/SiteHeader'

export const Route = createFileRoute('/')({ component: Home })

const stats = [
  { value: '3', label: 'Water sources tracked' },
  { value: 'Live', label: 'Supply status' },
  { value: 'Priority', label: 'Tanker dispatch by need' },
  { value: 'Per barangay', label: 'Outage alerts' },
]

// `icon` is an SVG path drawn on a 24x24 grid.
const features = [
  { title: 'Water sources', text: 'See the status of each source feeding the city.', icon: 'M12 3s-6 7-6 11a6 6 0 0012 0c0-4-6-11-6-11z' },
  { title: 'Outage alerts', text: 'Get notified when service drops in your barangay.', icon: 'M6 16V11a6 6 0 1112 0v5l1.5 2h-15zM10 20a2 2 0 004 0' },
  { title: 'Deliveries', text: 'Follow tankers sent to areas with no supply.', icon: 'M2 7h11v9H2zM13 10h4l4 3v3h-8M6 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM17 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3z' },
  { title: 'Reports', text: 'Review supply history and delivery records.', icon: 'M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h7' },
]

const sources = [
  { name: 'Masacpasac', note: '20 to 40 L/s', y: 40 },
  { name: 'Caramayon', note: 'Pumped', y: 130 },
  { name: 'Kulador', note: 'Antiao River', y: 220 },
]

const steps = [
  { title: 'Sign up with your barangay', text: 'Create an account so alerts match where you live.' },
  { title: 'Get alerts', text: 'We tell you when supply changes or stops.' },
  { title: 'Tankers reach you first', text: 'Barangays that need water most are served first.' },
]

const btn = 'inline-flex items-center rounded-lg px-6 py-3 font-bold transition'

function Home() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="bg-gradient-to-b from-sky via-sky/40 to-mist">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 pb-24 pt-14 lg:grid-cols-2 lg:pt-20">
            <div>
              <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
                Know when the water stops
                <span className="block text-well">before it does.</span>
              </h1>
              <p className="mt-6 max-w-md text-lg text-ink/75">
                WellPoint tracks Catbalogan's three water sources and sends tankers to the barangays that need them first
                when pipes fail.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/register" className={`${btn} bg-well text-white hover:bg-aqua hover:text-ink`}>
                  Create an account
                </Link>
                <a href="#how" className={`${btn} border-2 border-well text-well hover:bg-sky`}>
                  See how it works
                </a>
              </div>
            </div>
            <img
              src="/hero.jpg"
              width={400}
              height={400}
              alt="WellPoint logo: safer water, stronger communities"
              className="float mx-auto w-full max-w-sm rounded-3xl shadow-2xl shadow-well/25 lg:max-w-md"
            />
          </div>
        </section>

        {/* Stats card overlapping the hero */}
        <div className="relative z-10 mx-auto -mt-12 max-w-6xl px-6">
          <dl className="grid gap-5 rounded-2xl border border-line bg-white p-6 shadow-lg shadow-ink/5 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="border-l-4 border-foam pl-4">
                <dt className="sr-only">{s.label}</dt>
                <dd className="text-2xl font-extrabold text-ink">{s.value}</dd>
                <dd className="text-sm text-ink/70">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Features */}
        <section id="features" className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="max-w-lg text-3xl font-extrabold sm:text-4xl">
            Everything about your water supply, <span className="text-well">in one place</span>
          </h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <article key={f.title} className="rounded-2xl border border-line bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-foam">
                <span className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-sky text-well">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <path d={f.icon} />
                  </svg>
                </span>
                <h3 className="text-lg font-bold">{f.title}</h3>
                <p className="mt-1 text-sm text-ink/70">{f.text}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Water sources diagram */}
        <section id="sources" className="border-y border-line bg-white">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-20 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-extrabold sm:text-4xl">
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

        {/* How it works */}
        <section id="how" className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-3xl font-extrabold sm:text-4xl">
            Ready in <span className="text-well">three steps</span>
          </h2>
          <ol className="mt-10 grid gap-5 md:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.title} className="rounded-2xl border border-line bg-white p-6">
                <span className="mb-4 grid h-9 w-9 place-items-center rounded-full bg-ink font-bold text-white">{i + 1}</span>
                <h3 className="text-lg font-bold">{s.title}</h3>
                <p className="mt-1 text-sm text-ink/70">{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Call to action */}
        <section className="mx-auto max-w-6xl px-6 pb-20">
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
