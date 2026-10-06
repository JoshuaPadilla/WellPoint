import { Link, Outlet, createFileRoute } from '@tanstack/react-router'
import { Logo } from '../components/Logo'

export const Route = createFileRoute('/dashboard')({ component: DashboardLayout })

const nav = [
  { to: '/dashboard', label: 'Dashboard', exact: true },
  { to: '/dashboard/sources', label: 'Water sources' },
  { to: '/dashboard/alerts', label: 'Outage alerts' },
  { to: '/dashboard/deliveries', label: 'Deliveries' },
  { to: '/dashboard/reports', label: 'Reports' },
  { to: '/dashboard/settings', label: 'Settings' },
] as const

function DashboardLayout() {
  return (
    <div className="grid min-h-screen md:grid-cols-[240px_1fr]">
      <aside className="bg-deep p-5 text-white md:flex md:flex-col">
        <Logo light />
        <nav aria-label="Main" className="mt-6 flex gap-1 overflow-x-auto md:flex-col">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: 'exact' in n }}
              className="whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10"
              activeProps={{ className: 'bg-white text-ink hover:bg-white' }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <Link to="/login" className="mt-auto hidden px-3 py-2 text-sm text-white/70 hover:text-white md:block">
          Log out
        </Link>
      </aside>
      <main className="p-6 lg:p-10">
        <Outlet />
      </main>
    </div>
  )
}
