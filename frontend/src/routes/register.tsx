import { useState } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { AuthShell, Field, primaryBtn } from '../components/AuthShell'
import { validateRegister } from '../lib/validate'
import type { Errors } from '../lib/validate'

export const Route = createFileRoute('/register')({ component: Register })

function Register() {
  const navigate = useNavigate()
  const [errors, setErrors] = useState<Errors>({})

  return (
    <AuthShell title="Create an account" subtitle="Get notified when water service changes in your barangay.">
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          const found = validateRegister(new FormData(e.currentTarget))
          setErrors(found)
          if (Object.keys(found).length === 0) navigate({ to: '/dashboard' })
        }}
      >
        <Field label="Full name" name="name" autoComplete="name" error={errors.name} />
        <Field label="Barangay" name="barangay" error={errors.barangay} />
        <Field label="Email" name="email" type="email" autoComplete="email" error={errors.email} />
        <Field label="Password" name="password" type="password" autoComplete="new-password" error={errors.password} />

        <label className="mb-1 flex items-center gap-2 text-sm">
          <input type="checkbox" name="terms" /> I agree to the Terms and Privacy Policy
        </label>
        {errors.terms && (
          <p role="alert" className="mb-2 text-sm text-orange-700">
            {errors.terms}
          </p>
        )}

        <button className={`${primaryBtn} mt-4`}>Create account</button>
      </form>
      <p className="mt-6 text-sm">
        Already registered?{' '}
        <Link to="/login" className="font-bold text-well underline">
          Log in
        </Link>
      </p>
    </AuthShell>
  )
}
