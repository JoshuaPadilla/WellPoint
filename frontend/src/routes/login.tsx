import { useState } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { AuthShell, Field, primaryBtn } from '../components/AuthShell'
import { validateLogin } from '../lib/validate'
import type { Errors } from '../lib/validate'

export const Route = createFileRoute('/login')({ component: Login })

function Login() {
  const navigate = useNavigate()
  const [errors, setErrors] = useState<Errors>({})

  return (
    <AuthShell title="Welcome back" subtitle="Log in to check your area's water status.">
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          const found = validateLogin(new FormData(e.currentTarget))
          setErrors(found)
          if (Object.keys(found).length === 0) navigate({ to: '/dashboard' })
        }}
      >
        <Field label="Email" name="email" type="email" autoComplete="email" error={errors.email} />
        <Field label="Password" name="password" type="password" autoComplete="current-password" error={errors.password} />
        <button className={primaryBtn}>Log in</button>
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
