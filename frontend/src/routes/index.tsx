import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useMe } from '../data/queries'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const me = useMe()
  const navigate = useNavigate()
  const user = me.data

  useEffect(() => {
    if (me.isLoading) return
    if (!user) {
      void navigate({ to: '/login' })
      return
    }
    if (user.permissions.includes('dashboard:read')) {
      void navigate({ to: '/dashboard' })
    } else if (
      user.permissions.includes('barangay:read') ||
      user.permissions.includes('barangay:read:own')
    ) {
      void navigate({ to: '/coverage' })
    } else {
      void navigate({ to: '/lookup' })
    }
  }, [me.isLoading, user, navigate])

  return null
}
