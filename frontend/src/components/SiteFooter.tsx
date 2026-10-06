import { Link } from '@tanstack/react-router'
import { Logo } from './Logo'

export function SiteFooter() {
  return (
    <footer className="bg-ink text-white/75">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr]">
        <div>
          <Logo light />
          <p className="mt-3 max-w-xs text-sm">Water access status and early warning for Catbalogan City.</p>
        </div>
        <div>
          <h2 className="mb-3 font-bold text-white">Explore</h2>
          <ul className="grid gap-2 text-sm">
            <li><a href="#features" className="hover:text-foam">Features</a></li>
            <li><a href="#sources" className="hover:text-foam">Water sources</a></li>
            <li><a href="#how" className="hover:text-foam">How it works</a></li>
          </ul>
        </div>
        <div>
          <h2 className="mb-3 font-bold text-white">Account</h2>
          <ul className="grid gap-2 text-sm">
            <li><Link to="/login" className="hover:text-foam">Log in</Link></li>
            <li><Link to="/register" className="hover:text-foam">Sign up</Link></li>
          </ul>
        </div>
      </div>
      <p className="border-t border-white/15 px-6 py-5 text-center text-sm">© 2026 WellPoint. All rights reserved.</p>
    </footer>
  )
}
