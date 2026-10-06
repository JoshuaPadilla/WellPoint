import { Link, Outlet } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { useLogout } from '../data/mutations'
import { useMe } from '../data/queries'
import { roleLabel } from '../lib/status'
import { Button } from './ui/button'

function NavLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      activeProps={{ className: 'bg-blue-50 text-blue-700 font-medium' }}
    >
      {children}
    </Link>
  )
}

export function AppShell() {
  const me = useMe()
  const logout = useLogout()
  const user = me.data
  const permissions = user?.permissions ?? []

  const canDashboard = permissions.includes('dashboard:read')
  const canCoverage =
    permissions.includes('barangay:read') ||
    permissions.includes('barangay:read:own')
  const canAlerts =
    permissions.includes('alert:read') || permissions.includes('alert:read:own')
  const canReports =
    permissions.includes('report:read') ||
    permissions.includes('report:read:own')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="text-lg font-bold text-blue-700">
            WellPoint
          </Link>
          <nav className="flex items-center gap-1">
            {user && canDashboard && (
              <NavLink to="/dashboard">Dashboard</NavLink>
            )}
            {user && canCoverage && <NavLink to="/coverage">Coverage</NavLink>}
            {user && canAlerts && <NavLink to="/alerts">Alerts</NavLink>}
            {user && canReports && <NavLink to="/reports">Reports</NavLink>}
            {user && <NavLink to="/lookup">Public lookup</NavLink>}
          </nav>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="hidden text-sm text-gray-600 sm:inline">
                  {user.name} · {roleLabel[user.role] ?? user.role}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => logout.mutate()}
                >
                  Sign out
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                onClick={() => (window.location.href = '/login')}
              >
                Sign in
              </Button>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
