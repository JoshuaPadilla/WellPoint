import { Link, Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { Logo } from '../components/Logo'
import { getUser, isLoggedIn, logout, refreshProfile } from '../lib/auth'
import { dismissError, initWaterStore, setRole, useWaterStore } from '@/lib/WaterStore'

export const Route = createFileRoute('/dashboard')({
  // Send visitors without a session to the login page (skipped during server rendering).
  beforeLoad: async () => {
    if (typeof window === 'undefined') return
    if (!(await isLoggedIn())) throw redirect({ to: '/login' })
    // The role comes from the profiles table, not from a button the user can click.
    const user = (await refreshProfile()) ?? getUser()
    if (user) setRole(user.role)
    initWaterStore() // load water sources from Supabase + listen for changes
  },
  component: DashboardLayout,
})

const ROLE_LABELS = { citizen: 'Citizen', official: 'Barangay official', lgu: 'LGU', drrm: 'DRRM' } as const

const nav = [
  { to: '/dashboard', label: 'Dashboard', exact: true },
  { to: '/dashboard/sources', label: 'Water sources' },
  { to: '/dashboard/alerts', label: 'Outage alerts' },
  { to: '/dashboard/deliveries', label: 'Deliveries' },
  { to: '/dashboard/reports', label: 'Reports' },
     { to: '/dashboard/map', label: 'Barangay map' },
  { to: '/dashboard/settings', label: 'Settings' },
] as const

function DashboardLayout() {
  const user = typeof window === 'undefined' ? null : getUser()
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
        {user && (
          <p className="mt-auto hidden px-3 pt-4 text-sm text-white/80 md:block">
            {user.name}
            <span className="block text-xs text-white/60">Brgy. {user.barangay}</span>
            <span className="mt-1 inline-block rounded-full bg-white/15 px-2 py-0.5 text-xs font-semibold">
              {ROLE_LABELS[user.role]}
            </span>
          </p>
        )}
        <Link
          to="/login"
          onClick={() => void logout()}
          className={`${user ? '' : 'mt-auto '}hidden px-3 py-2 text-sm text-white/70 hover:text-white md:block`}
        >
          Log out
        </Link>
      </aside>
      <main className="p-6 lg:p-10">
        <StoreStatus />
        <Outlet />
      </main>
    </div>
  )
}


// Shows while water sources load from Supabase, and when saving a change fails.
function StoreStatus() {
  const { loading, error } = useWaterStore()
  if (error) {
    return (
      <div role="alert" className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
        <p>{error}</p>
        <button type="button" onClick={dismissError} className="font-bold underline">
          Dismiss
        </button>
      </div>
    )
  }
  if (loading) return <p className="mb-4 text-sm text-ink/60">Loading water sources…</p>
  return null
}
