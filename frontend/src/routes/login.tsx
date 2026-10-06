import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { signInWithGoogle, useDevLogin } from '../data/mutations'
import { useMe } from '../data/queries'

export const Route = createFileRoute('/login')({ component: Login })

const DEMO_ACCOUNTS = [
  { email: 'water.officer@wellpoint.demo', label: 'Water Officer' },
  { email: 'drrm.officer@wellpoint.demo', label: 'DRRM Officer' },
  { email: 'barangay.official@wellpoint.demo', label: 'Barangay Official' },
  { email: 'resident@wellpoint.demo', label: 'Resident' },
]

function Login() {
  const me = useMe()
  const navigate = useNavigate()
  const devLogin = useDevLogin()

  useEffect(() => {
    if (me.data) {
      void navigate({ to: '/' })
    }
  }, [me.data, navigate])

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Sign in to WellPoint</CardTitle>
          <p className="text-sm text-gray-500">
            One live picture of who can actually access water.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button className="w-full" onClick={signInWithGoogle}>
            Continue with Google
          </Button>
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs text-gray-500">or try a demo role</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map((account) => (
              <Button
                key={account.email}
                variant="outline"
                size="sm"
                onClick={() => devLogin.mutate(account.email)}
                disabled={devLogin.isPending}
              >
                {account.label}
              </Button>
            ))}
          </div>
          {devLogin.isError && (
            <p className="text-sm text-red-600">
              {devLogin.error instanceof Error
                ? devLogin.error.message
                : 'Sign-in failed.'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
