import { Link } from '@tanstack/react-router'
import { MapPin } from 'lucide-react'
import { initials, useProfile } from '@/lib/profile'

export function ProfileButton() {
  const p = useProfile()
  return (
    <Link
      to="/dashboard/profile"
      aria-label="Your profile"
      className="flex items-center gap-3 rounded-full bg-white py-1.5 pl-4 pr-1.5 shadow-sm hover:bg-sky"
    >
      <span className="hidden text-right text-sm leading-tight sm:block">
        <span className="block font-bold">{p.fullName || 'Set up profile'}</span>
        <span className="flex items-center justify-end gap-1 text-xs text-ink/60">
          <MapPin className="size-3" aria-hidden="true" />
          {p.barangay || 'No barangay yet'}
        </span>
      </span>
      <span className="grid size-10 place-items-center rounded-full bg-well text-sm font-bold text-white">
        {initials(p.fullName)}
      </span>
    </Link>
  )
}