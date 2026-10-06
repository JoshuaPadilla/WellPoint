import { useState } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { AuthShell, Field, primaryBtn } from '../components/AuthShell'
import { validateRegister } from '../lib/validate'
import type { Errors } from '../lib/validate'
import { ApiError, register } from '../lib/auth'

export const Route = createFileRoute('/register')({ component: Register })

function Register() {
  const navigate = useNavigate()
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  const [sentTo, setSentTo] = useState('')

  if (sentTo) {
    return (
      <AuthShell title="Check your email" subtitle={`We sent a confirmation link to ${sentTo}.`}>
        <p className="text-sm">Open the link in that email, then come back and log in.</p>
        <Link to="/login" className={`${primaryBtn} mt-6 block text-center`}>
          Go to log in
        </Link>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Create an account" subtitle="Get notified when water service changes in your barangay.">
      <form
        noValidate
        onSubmit={async (e) => {
          e.preventDefault()
          const data = new FormData(e.currentTarget)
          const found = validateRegister(data)
          setErrors(found)
          setFormError('')
          if (Object.keys(found).length > 0) return

          setBusy(true)
          try {
            const user = await register(data)
            if (user) navigate({ to: '/dashboard' })
            else setSentTo(String(data.get('email') ?? '').trim())
          } catch (err) {
            const apiErr = err instanceof ApiError ? err : new ApiError('Something went wrong. Please try again.')
            setErrors(apiErr.fields)
            setFormError(apiErr.message)
          } finally {
            setBusy(false)
          }
        }}
      >
        {formError && (
          <p role="alert" className="mb-4 rounded-lg bg-orange-50 px-3 py-2 text-sm text-orange-700">
            {formError}
          </p>
        )}
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

        <button className={`${primaryBtn} mt-4`} disabled={busy}>
          {busy ? 'Creating account…' : 'Create account'}
        </button>
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
