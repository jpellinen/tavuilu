import { useEffect } from 'react'
import { useProgressStore } from '../stores/progressStore'
import { authClient } from '../lib/auth-client'

export function useProgressSync() {
  const setProgress = useProgressStore((s) => s.setProgress)
  const { data: session, isPending } = authClient.useSession()

  useEffect(() => {
    if (isPending || !session) return
    fetch('/api/progress', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setProgress(data))
      .catch(() => {})
  }, [isPending, session, setProgress])
}
