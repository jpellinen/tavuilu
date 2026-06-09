import { useRef, useEffect } from 'react'
import { authClient } from '../../lib/auth-client'

export interface AuthUser {
  id: string
  email: string | null
  isAnonymous: boolean
}

interface AuthState {
  user: AuthUser | null
  loading: boolean
  isAnonymous: boolean
}

export function useAuth(): AuthState {
  const { data: session, isPending } = authClient.useSession()
  const anonymousTriggered = useRef(false)

  useEffect(() => {
    if (!isPending && !session && !anonymousTriggered.current) {
      anonymousTriggered.current = true
      authClient.signIn.anonymous().catch(() => {})
    }
  }, [isPending, session])

  if (isPending) {
    return { user: null, loading: true, isAnonymous: true }
  }

  if (!session) {
    return { user: null, loading: false, isAnonymous: true }
  }

  const isAnonymous = (session.user as { isAnonymous?: boolean | null }).isAnonymous === true
  const user: AuthUser = {
    id: session.user.id,
    email: session.user.email ?? null,
    isAnonymous,
  }

  return { user, loading: false, isAnonymous }
}
