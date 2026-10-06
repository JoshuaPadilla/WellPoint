import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { AuthShell, Field, primaryBtn } from '../components/AuthShell'

export const Route = createFileRoute('/register')({ component: Register })

function Register() {
  const navigate = useNavigate()
  return (
    <AuthShell title="Create an account" subtitle="Get notified when water service changes in your barangay.">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          navigate({ to: '/dashboard' })
        }}
      >
        <Field label="Full name" name="name" autoComplete="name" />
        <Field label="Barangay" name="barangay" />
        <Field label="Email" name="email" type="email" autoComplete="email" />
        <Field label="Password" name="password" type="password" autoComplete="new-password" />
        <button className={primaryBtn}>Create account</button>
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
