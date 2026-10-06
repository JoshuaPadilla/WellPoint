import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Logo } from './Logo'

const links = [
  { href: '#features', label: 'Features' },
  { href: '#sources', label: 'Water sources' },
  { href: '#how', label: 'How it works' },
]

export function SiteHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-mist/90 backdrop-blur">
      <div className="relative mx-auto flex h-[68px] max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Logo />

        <nav
          aria-label="Main"
          className={`${open ? 'flex' : 'hidden'} absolute left-0 right-0 top-full flex-col border-b border-line bg-mist px-6 py-2 md:static md:flex md:flex-row md:gap-8 md:border-0 md:bg-transparent md:p-0`}
        >
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="py-3 text-sm font-medium hover:text-well md:py-1">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 text-sm font-bold sm:gap-4">
          <Link to="/login" className="px-2 py-2 hover:text-well">
            Log in
          </Link>
          <Link to="/register" className="rounded-lg bg-well px-3 py-2 text-white transition hover:bg-deep sm:px-4">
            Sign up
          </Link>
          <button
            type="button"
            aria-expanded={open}
            aria-label="Toggle menu"
            onClick={() => setOpen(!open)}
            className="rounded-lg border border-line px-2.5 py-2 md:hidden"
          >
            Menu
          </button>
        </div>
      </div>
    </header>
  )
}
