import { useState } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { AuthShell, Field, primaryBtn } from '../components/AuthShell'
import { validateLogin } from '../lib/validate'
import type { Errors } from '../lib/validate'
import { ApiError, login } from '../lib/auth'

export const Route = createFileRoute('/login')({ component: Login })

function Login() {
  const navigate = useNavigate()
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)

  return (
    <AuthShell title="Welcome back" subtitle="Log in to check your area's water status.">
      <form
        noValidate
        onSubmit={async (e) => {
          e.preventDefault()
          const data = new FormData(e.currentTarget)
          const found = validateLogin(data)
          setErrors(found)
          setFormError('')
          if (Object.keys(found).length > 0) return

          setBusy(true)
          try {
            await login(data)
            navigate({ to: '/dashboard' })
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
        <Field label="Email" name="email" type="email" autoComplete="email" error={errors.email} />
        <Field label="Password" name="password" type="password" autoComplete="current-password" error={errors.password} />
        <button className={primaryBtn} disabled={busy}>
          {busy ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <p className="mt-6 text-sm">
        New to WellPoint?{' '}
        <Link to="/register" className="font-bold text-well underline">
          Create an account
        </Link>
      </p>
    </AuthShell>
  )
}
