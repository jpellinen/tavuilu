import { useState, useEffect } from 'react'

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
  const [state, setState] = useState<AuthState>({ user: null, loading: true, isAnonymous: true })

  useEffect(() => {
    let cancelled = false

    async function initSession() {
      try {
        const res = await fetch('/api/auth/session', { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          if (!cancelled && data?.user) {
            setState({
              user: data.user,
              loading: false,
              isAnonymous: data.user.isAnonymous ?? true,
            })
            return
          }
        }
      } catch {
        // API not available yet — fall through to anonymous
      }

      // No session — try to create an anonymous one
      try {
        const res = await fetch('/api/auth/sign-in/anonymous', {
          method: 'POST',
          credentials: 'include',
        })
        if (res.ok) {
          const data = await res.json()
          if (!cancelled && data?.user) {
            setState({ user: data.user, loading: false, isAnonymous: true })
            return
          }
        }
      } catch {
        // API not available yet
      }

      if (!cancelled) {
        setState({ user: null, loading: false, isAnonymous: true })
      }
    }

    initSession()
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
