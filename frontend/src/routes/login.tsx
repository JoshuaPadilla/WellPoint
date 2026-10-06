import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { AuthShell, Field, primaryBtn } from '../components/AuthShell'

export const Route = createFileRoute('/login')({ component: Login })

function Login() {
  const navigate = useNavigate()
  return (
    <AuthShell title="Log in" subtitle="Welcome back. Check your area's water status.">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          navigate({ to: '/dashboard' })
        }}
      >
        <Field label="Email" name="email" type="email" autoComplete="email" />
        <Field label="Password" name="password" type="password" autoComplete="current-password" />
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
