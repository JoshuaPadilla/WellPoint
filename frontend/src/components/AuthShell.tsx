import type { ReactNode } from 'react'
import { Logo } from './Logo'

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <section className="flex flex-col justify-between bg-deep p-8 text-white lg:p-12">
        <Logo light />
        <p className="my-12 max-w-md text-3xl font-bold leading-tight lg:text-4xl">
          When the pipes go dry, the barangay should know first.
        </p>
        <p className="max-w-sm text-sm text-white/70">
          Water supply status and emergency delivery for Catbalogan City.
        </p>
      </section>
      <section className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <h1 className="text-3xl font-extrabold">{title}</h1>
          <p className="mt-2 text-ink/70">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </section>
    </main>
  )
}

export function Field({ label, type = 'text', name, autoComplete }: { label: string; type?: string; name: string; autoComplete?: string }) {
  return (
    <label className="mb-4 block text-sm font-medium">
      {label}
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required
        className="mt-1 block w-full rounded-md border border-line bg-white px-3 py-2.5 text-base"
      />
    </label>
  )
}

export const primaryBtn =
  'w-full rounded-md bg-well px-4 py-3 font-bold text-white hover:bg-deep'
