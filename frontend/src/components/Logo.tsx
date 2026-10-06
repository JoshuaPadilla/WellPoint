import { Link } from '@tanstack/react-router'

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link
      to="/"
      className={`inline-flex items-center gap-2 text-xl font-extrabold tracking-tight ${light ? 'text-white' : 'text-ink'}`}
    >
      <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
        <circle cx="13" cy="13" r="11" fill="none" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="13" cy="13" r="4.5" fill="var(--color-signal)" />
      </svg>
      WellPoint
    </Link>
  )
}
