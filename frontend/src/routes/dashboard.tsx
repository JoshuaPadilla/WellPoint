import { useState } from 'react'
import { Link, Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import {
  BarChart3, BellRing, Droplets, LayoutGrid, LogOut, MapIcon,
  PanelLeftClose, PanelLeftOpen, Settings, Truck,
} from 'lucide-react'
import { Logo } from '../components/Logo'
import { cn } from '@/lib/utils'
import { getUser, isLoggedIn, logout, refreshProfile } from '@/lib/auth'
import type { User } from '@/lib/auth'
import { dismissError, initWaterStore, setRole, useWaterStore } from '@/lib/water-store'

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
  { to: '/dashboard', label: 'Dashboard', icon: LayoutGrid, exact: true },
  { to: '/dashboard/sources', label: 'Water sources', icon: Droplets },
  { to: '/dashboard/map', label: 'Barangay map', icon: MapIcon },
  { to: '/dashboard/alerts', label: 'Outage alerts', icon: BellRing },
  { to: '/dashboard/deliveries', label: 'Deliveries', icon: Truck },
  { to: '/dashboard/reports', label: 'Reports', icon: BarChart3 },
] as const

const bottom = [
  { to: '/dashboard/settings', label: 'Settings', icon: Settings },
  { to: '/login', label: 'Log out', icon: LogOut, logout: true },
] as const

type Item = (typeof nav)[number] | (typeof bottom)[number]

function NavItem({ item, open }: { item: Item; open: boolean }) {
  const Icon = item.icon
  return (
    <Link
      to={item.to}
      title={item.label}
      aria-label={item.label}
      activeOptions={{ exact: 'exact' in item }}
      onClick={'logout' in item ? () => void logout() : undefined}
      className={cn(
        'flex items-center gap-3 whitespace-nowrap transition',
        open
          ? 'rounded-xl px-3 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/10'
          : 'size-11 shrink-0 justify-center rounded-full text-ink/60 hover:bg-mist',
      )}
      activeProps={{ className: open ? 'bg-white text-ink hover:bg-white' : 'bg-well text-white hover:bg-well' }}
    >
      <Icon className="size-[18px] shrink-0" aria-hidden="true" />
      {open && item.label}
    </Link>
  )
}

// Who is signed in: full card when the sidebar is open, an initial bubble when closed.
function UserBadge({ user, open }: { user: User; open: boolean }) {
  const label = `${user.name} · Brgy. ${user.barangay} · ${ROLE_LABELS[user.role]}`
  if (!open) {
    return (
      <span
        title={label}
        aria-label={label}
        className="grid size-11 place-items-center rounded-full bg-sky text-sm font-extrabold uppercase text-well"
      >
        {user.name.trim().charAt(0) || '?'}
      </span>
    )
  }
  return (
    <div className="mb-2 rounded-xl bg-white/10 px-3 py-2.5 text-sm">
      <p className="truncate font-semibold">{user.name}</p>
      <p className="truncate text-xs text-white/60">Brgy. {user.barangay}</p>
      <span className="mt-1 inline-block rounded-full bg-white/15 px-2 py-0.5 text-xs font-semibold">
        {ROLE_LABELS[user.role]}
      </span>
    </div>
  )
}

function DashboardLayout() {
  const [open, setOpen] = useState(false)
  const Toggle = open ? PanelLeftClose : PanelLeftOpen
  const user = typeof window === 'undefined' ? null : getUser()

  return (
    <div className="min-h-screen bg-mist md:flex md:gap-4 md:p-4">
      {/* Desktop side nav: icon pills when closed, blue panel with labels when open */}
      <aside
        className={cn(
          'hidden shrink-0 flex-col transition-[width] duration-300 md:sticky md:top-4 md:flex md:h-[calc(100vh-2rem)]',
          open ? 'w-60 rounded-3xl bg-deep p-4 text-white' : 'w-[72px] items-center gap-3',
        )}
      >
        <div className={cn('flex', open ? 'items-center justify-between' : 'flex-col items-center gap-3')}>
          {open ? (
            <Logo light />
          ) : (
            <img src="/logo.svg" alt="WellPoint" className="size-12 rounded-2xl bg-white p-1.5 shadow-sm" />
          )}
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
            aria-expanded={open}
            className={cn(
              'grid size-9 place-items-center rounded-full',
              open ? 'text-white/80 hover:bg-white/10' : 'bg-white text-ink/60 shadow-sm hover:bg-sky',
            )}
          >
            <Toggle className="size-[18px]" aria-hidden="true" />
          </button>
        </div>

        <nav
          aria-label="Main"
          className={cn('flex flex-col gap-1', open ? 'mt-6' : 'items-center rounded-full bg-white p-2 shadow-sm')}
        >
          {nav.map((n) => <NavItem key={n.to} item={n} open={open} />)}
        </nav>

        <div className={cn('mt-auto flex flex-col gap-1', !open && 'items-center rounded-full bg-white p-2 shadow-sm')}>
          {user && <UserBadge user={user} open={open} />}
          {bottom.map((n) => <NavItem key={n.to} item={n} open={open} />)}
        </div>
      </aside>

      {/* Phones: icon bar across the top */}
      <nav aria-label="Main" className="flex gap-1 overflow-x-auto bg-deep p-2 md:hidden">
        {[...nav, ...bottom].map((n) => <NavItem key={n.to} item={n} open={false} />)}
      </nav>

      <main className="min-w-0 flex-1 p-4 lg:p-6">
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
