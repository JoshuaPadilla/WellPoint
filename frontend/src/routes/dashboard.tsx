import { useState } from 'react'
import { Link, Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  BellRing,
  LogOut,
  MapIcon,
  Megaphone,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  SlidersHorizontal,
  Sparkles,
  Truck,
  Users as UsersIcon,
  X,
} from 'lucide-react'
import { Logo } from '../components/Logo'
import { LoadingScreen } from '../components/LoadingScreen'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { getUser, isLoggedIn, logout, refreshProfile } from '@/lib/auth'
import type { User } from '@/lib/auth'
import type { Role } from '@/lib/water-store'
import {
  dismissError,
  initWaterStore,
  setRole,
  useWaterStore,
} from '@/lib/water-store'

export const Route = createFileRoute('/dashboard')({
  // Send visitors without a session to the login page (skipped during server rendering).
  beforeLoad: async () => {
    if (typeof window === 'undefined') return
    if (!(await isLoggedIn())) throw redirect({ to: '/login' })
    // The role comes from the profiles table, not from a button the user can click.
    const user = (await refreshProfile()) ?? getUser()
    if (user) setRole(user.role)
    initWaterStore() // load water sources + reports + warnings from Supabase + listen for changes
  },
  component: DashboardLayout,
})

const ROLE_LABELS: Record<Role, string> = {
  citizen: 'Resident',
  official: 'Barangay leader',
  lgu: 'LGU',
  drrm: 'DRRM',
}

type NavItem = {
  to: string
  label: string
  icon: LucideIcon
  exact?: boolean
  roles?: Role[]
  logout?: boolean
}

const nav: NavItem[] = [
  { to: '/dashboard/map', label: 'Map', icon: MapIcon },
  { to: '/dashboard/alerts', label: 'Alerts', icon: BellRing },
  {
    to: '/dashboard/reports',
    label: 'Reports',
    icon: BarChart3,
    roles: ['citizen', 'official'],
  },
  {
    to: '/dashboard/add-source',
    label: 'Add source',
    icon: Plus,
    roles: ['official'],
  },
  {
    to: '/dashboard/warnings',
    label: 'Warnings',
    icon: Megaphone,
    roles: ['lgu', 'drrm'],
  },
  {
    to: '/dashboard/insights',
    label: 'Insights',
    icon: Sparkles,
    roles: ['lgu'],
  },
  {
    to: '/dashboard/deliveries',
    label: 'Deliveries',
    icon: Truck,
    roles: ['drrm'],
  },
  { to: '/dashboard/users', label: 'Users', icon: UsersIcon, roles: ['lgu'] },
]

const bottom: NavItem[] = [
  {
    to: '/dashboard/settings',
    label: 'Demo controls',
    icon: SlidersHorizontal,
    roles: ['lgu', 'drrm'],
  },
  { to: '/login', label: 'Log out', icon: LogOut, logout: true },
]

function NavItem({
  item,
  open,
  onNavigate,
}: {
  item: NavItem
  open: boolean
  onNavigate?: () => void
}) {
  const Icon = item.icon
  return (
    <Link
      to={item.to}
      title={item.label}
      aria-label={item.label}
      activeOptions={item.exact ? { exact: true } : undefined}
      onClick={() => {
        onNavigate?.()
        if (item.logout) void logout()
      }}
      className={cn(
        'flex items-center gap-3 whitespace-nowrap transition',
        open
          ? 'rounded-xl px-3 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/10'
          : 'size-11 shrink-0 justify-center rounded-full text-ink/60 hover:bg-mist',
      )}
      activeProps={{
        className: open
          ? 'bg-white text-ink hover:bg-white'
          : 'bg-well text-white hover:bg-well',
      }}
    >
      <Icon className="size-[18px] shrink-0" aria-hidden="true" />
      {open && item.label}
    </Link>
  )
}

// Who is signed in: full card when the sidebar is open, an initial bubble when closed.
function UserBadge({ user, open }: { user: User; open: boolean }) {
  const label = `${user.name} · ${user.barangay ? `Brgy. ${user.barangay}` : 'No barangay'} · ${ROLE_LABELS[user.role]}`
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
      <p className="truncate text-xs text-white/60">
        {user.barangay ? `Brgy. ${user.barangay}` : 'No barangay'}
      </p>
      <span className="mt-1 inline-block rounded-full bg-white/15 px-2 py-0.5 text-xs font-semibold">
        {ROLE_LABELS[user.role]}
      </span>
    </div>
  )
}

function DashboardLayout() {
  const [open, setOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const Toggle = open ? PanelLeftClose : PanelLeftOpen
  const user = typeof window === 'undefined' ? null : getUser()
  const role = user?.role ?? 'citizen'
  const mainNav = nav.filter((n) => !n.roles || n.roles.includes(role))
  const bottomNav = bottom.filter((n) => !n.roles || n.roles.includes(role))

  return (
    <div className="min-h-screen bg-mist md:flex md:gap-4 md:p-4">
      {/* Desktop side nav: icon pills when closed, blue panel with labels when open */}
      <aside
        className={cn(
          'hidden shrink-0 flex-col transition-[width] duration-300 md:sticky md:top-4 md:flex md:h-[calc(100vh-2rem)]',
          open
            ? 'w-60 rounded-3xl bg-deep p-4 text-white'
            : 'w-[72px] items-center gap-3',
        )}
      >
        <div
          className={cn(
            'flex',
            open
              ? 'items-center justify-between'
              : 'flex-col items-center gap-3',
          )}
        >
          {open ? (
            <Logo light />
          ) : (
            <img
              src="/logo.svg"
              alt="WellPoint"
              className="size-12 rounded-2xl bg-white p-1.5 shadow-sm"
            />
          )}
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
            aria-expanded={open}
            className={cn(
              'grid size-9 place-items-center rounded-full',
              open
                ? 'text-white/80 hover:bg-white/10'
                : 'bg-white text-ink/60 shadow-sm hover:bg-sky',
            )}
          >
            <Toggle className="size-[18px]" aria-hidden="true" />
          </button>
        </div>

        <nav
          aria-label="Main"
          className={cn(
            'flex flex-col gap-1',
            open ? 'mt-6' : 'items-center rounded-full bg-white p-2 shadow-sm',
          )}
        >
          {mainNav.map((n) => (
            <NavItem key={n.to} item={n} open={open} />
          ))}
        </nav>

        <div
          className={cn(
            'mt-auto flex flex-col gap-1',
            !open && 'items-center rounded-full bg-white p-2 shadow-sm',
          )}
        >
          {user && <UserBadge user={user} open={open} />}
          {bottomNav.map((n) => (
            <NavItem key={n.to} item={n} open={open} />
          ))}
        </div>
      </aside>

      {/* Phones: top bar with a hamburger that opens a slide-in drawer */}
      <div className="sticky top-0 z-30 flex items-center justify-between bg-deep px-3 py-2 md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          aria-expanded={mobileOpen}
          className="grid size-11 place-items-center rounded-xl text-white hover:bg-white/10"
        >
          <Menu className="size-6" aria-hidden="true" />
        </button>
        <Logo light />
        <span className="size-11" aria-hidden="true" />
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="data-[side=left]:w-80 max-w-[85vw] gap-0 overflow-y-auto bg-deep p-4 text-white"
        >
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="flex items-center justify-between">
            <Logo light />
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="grid size-9 place-items-center rounded-full text-white/80 hover:bg-white/10"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>

          {user && (
            <div className="mt-5">
              <UserBadge user={user} open />
            </div>
          )}

          <nav aria-label="Main" className="mt-5 flex flex-col gap-1">
            {mainNav.map((n) => (
              <NavItem
                key={n.to}
                item={n}
                open
                onNavigate={() => setMobileOpen(false)}
              />
            ))}
          </nav>

          <div className="mt-auto flex flex-col gap-1 border-t border-white/10 pt-4">
            {bottomNav.map((n) => (
              <NavItem
                key={n.to}
                item={n}
                open
                onNavigate={() => setMobileOpen(false)}
              />
            ))}
          </div>
        </SheetContent>
      </Sheet>

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
      <div
        role="alert"
        className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800"
      >
        <p>{error}</p>
        <button
          type="button"
          onClick={dismissError}
          className="font-bold underline"
        >
          Dismiss
        </button>
      </div>
    )
  }
  if (loading)
    return (
      <div className="mb-4 rounded-xl border border-line bg-white/70 py-10">
        <LoadingScreen label="Loading water data…" />
      </div>
    )
  return null
}
