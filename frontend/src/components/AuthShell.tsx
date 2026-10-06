import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { Logo } from './Logo'

const perks = ['Water status for your barangay', 'Alerts when service changes', 'Tanker deliveries tracked']

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <section className="flex flex-col justify-between bg-gradient-to-br from-ink via-deep to-well p-8 text-white lg:p-12">
        <Logo light />
        <div className="my-12 max-w-md">
          <p className="text-3xl font-bold leading-tight lg:text-4xl">
            When the pipes go dry, the barangay should know first.
          </p>
          <ul className="mt-6 grid gap-2 text-white/80">
            {perks.map((p) => (
              <li key={p}>✓ {p}</li>
            ))}
          </ul>
        </div>
        <p className="max-w-sm text-sm text-white/70">Water supply status and emergency delivery for Catbalogan City.</p>
      </section>

      <section className="flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 grid grid-cols-2 rounded-xl bg-sky p-1 text-center text-sm font-bold">
            <Link to="/login" className="rounded-lg py-2" activeProps={{ className: 'bg-white text-ink shadow' }}>
              Log in
            </Link>
            <Link to="/register" className="rounded-lg py-2" activeProps={{ className: 'bg-white text-ink shadow' }}>
              Sign up
            </Link>
          </div>
          <h1 className="text-3xl font-extrabold">{title}</h1>
          <p className="mt-2 text-ink/70">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </section>
    </main>
  )
}

type FieldProps = { label: string; name: string; type?: string; autoComplete?: string; error?: string }

export function Field({ label, name, type = 'text', autoComplete, error }: FieldProps) {
  const [shown, setShown] = useState(false)
  const isPassword = type === 'password'

  return (
    <div className="mb-4">
      <label htmlFor={name} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <input
          id={name}
          name={name}
          type={isPassword && shown ? 'text' : type}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : undefined}
          className={`block w-full rounded-lg border bg-white px-3 py-2.5 text-base ${error ? 'border-orange-700' : 'border-line'}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShown(!shown)}
            aria-label={shown ? 'Hide password' : 'Show password'}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-sm font-bold text-well"
          >
            {shown ? 'Hide' : 'Show'}
          </button>
        )}
      </div>
      {error && (
        <p id={`${name}-error`} role="alert" className="mt-1 text-sm text-orange-700">
          {error}
        </p>
      )}
    </div>
  )
}

export const primaryBtn =
  'w-full rounded-lg bg-well px-4 py-3 font-bold text-white transition hover:bg-deep'